import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { FactoryFloor } from './FactoryFloor';
import { Machine3D } from './Machine3D';
import type { Machine } from '@/types';

export interface SceneProps {
  machines: Machine[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function machinePosition(index: number): [number, number, number] {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const x = (col - 1) * 5;
  const z = (row - 0.5) * 6;
  return [x, 0, z];
}

function CameraController({ selectedId, machines }: { selectedId: string | null; machines: Machine[] }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (selectedId && controlsRef.current) {
      const idx = machines.findIndex((m) => m.id === selectedId);
      if (idx >= 0) {
        const [x, , z] = machinePosition(idx);
        const target = new THREE.Vector3(x, 1, z);
        controlsRef.current.target.lerp(target, 0.1);
      }
    }
  }, [selectedId, machines]);

  return null;
}

// ─── Volumetric light shafts ────────────────────────────────────────
function LightShaft({ position, color = '#00d9ff' }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.04 + Math.sin(t * 1.5 + position[0]) * 0.02;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <coneGeometry args={[2.5, 5, 16, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// ─── Holographic floor scanner ─────────────────────────────────────
function FloorScanner() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 2) * 0.04;
      ref.current.rotation.z = t * 0.3;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
      <ringGeometry args={[3, 8, 64]} />
      <meshBasicMaterial color="#00d9ff" transparent opacity={0.08} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

// ─── Scene component ────────────────────────────────────────────────
export function Scene({ machines, selectedId, hoveredId, onSelect, onHover }: SceneProps) {
  return (
    <div className="canvas-container">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }}>
        <color attach="background" args={['#0a0e14']} />
        <fog attach="fog" args={['#0a0e14', 14, 32]} />

        <PerspectiveCamera makeDefault position={[0, 7, 16]} fov={48} />

        {/* Ambient + directional lighting */}
        <ambientLight intensity={0.2} color="#1a3a5a" />
        <directionalLight
          position={[8, 12, 6]}
          intensity={0.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={35}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-bias={-0.0005}
        />

        {/* Accent lights for color grading */}
        <pointLight position={[-6, 4, -6]} intensity={0.4} color="#00d9ff" distance={15} />
        <pointLight position={[6, 4, 6]} intensity={0.4} color="#00d9ff" distance={15} />
        <pointLight position={[0, 3, 0]} intensity={0.2} color="#1a3a5a" distance={20} />
        <spotLight position={[0, 6, 0]} angle={0.8} penumbra={1} intensity={0.3} color="#00d9ff" distance={15} />

        {/* Environment for metal reflections */}
        <Environment preset="warehouse" background={false} />

        {/* Factory floor and environment */}
        <FactoryFloor />
        <FloorScanner />

        {/* Volumetric light shafts from ceiling lights */}
        <LightShaft position={[-5, 2.5, -3]} />
        <LightShaft position={[5, 2.5, -3]} />
        <LightShaft position={[-5, 2.5, 3]} />
        <LightShaft position={[5, 2.5, 3]} />

        {/* Machine models */}
        {machines.map((machine, i) => (
          <Machine3D
            key={machine.id}
            machine={machine}
            position={machinePosition(i)}
            isSelected={selectedId === machine.id}
            isHovered={hoveredId === machine.id}
            onSelect={() => onSelect(machine.id)}
            onHover={(hovered) => onHover(hovered ? machine.id : null)}
          />
        ))}

        {/* Contact shadows for grounding machines */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.5}
          scale={30}
          blur={2}
          far={6}
          resolution={512}
          color="#000000"
        />

        <CameraController selectedId={selectedId} machines={machines} />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={28}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 6}
          target={[0, 1, 0]}
          autoRotate={selectedId === null}
          autoRotateSpeed={0.3}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
