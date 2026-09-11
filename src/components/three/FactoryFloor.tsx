import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Animated grid floor ───────────────────────────────────────────
function FloorGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material;
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }
  });

  return (
    <gridHelper ref={gridRef} args={[40, 40, '#00d9ff', '#0a1a2a']} position={[0, 0, 0]} />
  );
}

// ─── Floor with industrial tile pattern ────────────────────────────
function IndustrialFloor() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.4} roughness={0.8} />
      </mesh>

      {/* Safety zone stripes around machine areas */}
      {[
        [-5, -3], [0, -3], [5, -3],
        [-5, 3], [0, 3], [5, 3],
      ].map(([x, z], i) => (
        <group key={`zone-${i}`} position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Yellow caution border */}
          <mesh>
            <ringGeometry args={[2.0, 2.1, 32]} />
            <meshStandardMaterial color="#ffab00" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <ringGeometry args={[2.3, 2.35, 32]} />
            <meshStandardMaterial color="#ffab00" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Pillar with details ────────────────────────────────────────────
function Pillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main column */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#1a2332" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, -2.4, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Top plate */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Warning stripe */}
      <mesh position={[0, 1.5, 0.21]}>
        <boxGeometry args={[0.42, 0.15, 0.01]} />
        <meshStandardMaterial color="#ffab00" emissive="#ffab00" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.5, -0.21]}>
        <boxGeometry args={[0.42, 0.15, 0.01]} />
        <meshStandardMaterial color="#ffab00" emissive="#ffab00" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Ceiling light with housing ────────────────────────────────────
function CeilingLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 2.0 + Math.sin(state.clock.elapsedTime * 3 + position[0]) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Light housing */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.15, 0.5]} />
        <meshStandardMaterial color="#1a2332" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Light tube */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[1.4, 0.04, 0.3]} />
        <meshStandardMaterial color="#00d9ff" emissive="#00d9ff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* Light glow plane */}
      <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshBasicMaterial color="#00d9ff" transparent opacity={0.15} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} color="#00d9ff" intensity={2} distance={10} decay={2} position={[0, -0.5, 0]} />
    </group>
  );
}

// ─── Scanning sweep line ────────────────────────────────────────────
function ScanLine() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.position.z = ((t * 2) % 20) - 10;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 - Math.abs(((t * 2) % 20) - 10) * 0.04;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[40, 0.5]} />
      <meshBasicMaterial color="#00d9ff" transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

// ─── Floating ambient particles ────────────────────────────────────
function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = Math.random() * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={300} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00d9ff" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// ─── Wall-mounted pipes ─────────────────────────────────────────────
function WallPipes() {
  const pipePositions = useMemo(() => {
    const arr: { y: number; z: number }[] = [];
    for (let i = 0; i < 4; i++) {
      arr.push({ y: 1.5 + i * 0.5, z: -9.95 });
    }
    return arr;
  }, []);

  return (
    <group>
      {pipePositions.map((p, i) => (
        <mesh key={i} position={[0, p.y, p.z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 18, 12]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Storage crates ─────────────────────────────────────────────────
function Crate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color="#3a2a1a" metalness={0.1} roughness={0.9} />
      </mesh>
      {/* Crate lid */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <boxGeometry args={[0.62, 0.06, 0.62]} />
        <meshStandardMaterial color="#2a1a0a" metalness={0.1} roughness={0.9} />
      </mesh>
      {/* Metal corners */}
      {[[-0.28, -0.22], [0.28, -0.22], [-0.28, 0.22], [0.28, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.06, 0.5, 0.06]} />
          <meshStandardMaterial color="#4a5a6a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Tool cabinet ──────────────────────────────────────────────────
function ToolCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.2, 0.5]} />
        <meshStandardMaterial color="#1a2332" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Drawers */}
      {[0.15, 0.45, 0.75, 1.05].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0.26]}>
            <boxGeometry args={[0.7, 0.22, 0.02]} />
            <meshStandardMaterial color="#0a0e14" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Drawer handle */}
          <mesh position={[0, y, 0.28]}>
            <boxGeometry args={[0.3, 0.03, 0.04]} />
            <meshStandardMaterial color="#4a5a6a" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}
      {/* Wheels */}
      {[[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.55, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Cable tray on wall ─────────────────────────────────────────────
function CableTray({ position, length = 6 }: { position: [number, number, number]; length?: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[length, 0.08, 0.15]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Cables inside */}
      {[-0.04, 0, 0.04].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[length - 0.1, 0.02, 0.08]} />
          <meshStandardMaterial color={i === 0 ? '#ff3d57' : i === 1 ? '#00d9ff' : '#00e676'} metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Warning sign ──────────────────────────────────────────────────
function WarningSign({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh castShadow position={[0, -1, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2, 8]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Sign plate */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.02]} />
        <meshStandardMaterial color="#ffab00" emissive="#ffab00" emissiveIntensity={0.4} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Triangle on sign */}
      <mesh position={[0, 0.1, 0.015]}>
        <circleGeometry args={[0.1, 3]} />
        <meshStandardMaterial color="#0a0e14" />
      </mesh>
    </group>
  );
}

// ─── Main FactoryFloor export ───────────────────────────────────────
export function FactoryFloor() {
  const pillars: [number, number, number][] = [
    [-8, 2.5, -8], [8, 2.5, -8], [-8, 2.5, 8], [8, 2.5, 8],
    [-8, 2.5, 0], [8, 2.5, 0], [0, 2.5, -8], [0, 2.5, 8],
  ];

  const lights: [number, number, number][] = [
    [-5, 4.8, -3], [5, 4.8, -3], [-5, 4.8, 3], [5, 4.8, 3],
  ];

  return (
    <group>
      <IndustrialFloor />
      <FloorGrid />
      <ScanLine />
      <AmbientParticles />
      <WallPipes />

      {pillars.map((pos, i) => (
        <Pillar key={`pillar-${i}`} position={pos} />
      ))}
      {lights.map((pos, i) => (
        <CeilingLight key={`light-${i}`} position={pos} />
      ))}

      {/* Storage crates in corners */}
      <Crate position={[-9, 0.25, -8]} />
      <Crate position={[-9, 0.25, -7.3]} />
      <Crate position={[-9, 0.75, -7.6]} />

      {/* Tool cabinet */}
      <ToolCabinet position={[9, 0.6, -7]} />

      {/* Cable trays on walls */}
      <CableTray position={[0, 3.5, -9.9]} length={12} />
      <CableTray position={[-9.9, 3.5, 0]} length={12} />

      {/* Warning signs */}
      <WarningSign position={[-3, 1.1, -9.5]} />
      <WarningSign position={[3, 1.1, 9.5]} />

      {/* Back wall */}
      <mesh position={[0, 2.5, -10]} receiveShadow>
        <boxGeometry args={[20, 5, 0.1]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.3} roughness={0.85} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.1, 5, 20]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.3} roughness={0.85} />
      </mesh>
      <mesh position={[10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.1, 5, 20]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.3} roughness={0.85} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#080a10" metalness={0.2} roughness={0.9} />
      </mesh>
    </group>
  );
}
