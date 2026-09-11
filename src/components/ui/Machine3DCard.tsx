import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Machine3D } from '@/components/three/Machine3D';
import type { Machine } from '@/types';

export function Machine3DCard({ machine }: { machine: Machine }) {
  return (
    <div className="h-48 rounded-xl overflow-hidden bg-bg border border-border">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#0a0e14']} />
        <PerspectiveCamera makeDefault position={[0, 2.5, 5]} fov={45} />
        <ambientLight intensity={0.3} color="#1a3a5a" />
        <directionalLight position={[3, 6, 3]} intensity={0.5} castShadow />
        <pointLight position={[-3, 3, -3]} intensity={0.3} color="#00d9ff" />
        <pointLight position={[3, 3, 3]} intensity={0.3} color="#00d9ff" />

        <Machine3D
          machine={machine}
          position={[0, 0, 0]}
          isSelected={false}
          isHovered={false}
          onSelect={() => {}}
          onHover={() => {}}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={6} blur={2} far={3} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={1.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0.8, 0]}
        />
      </Canvas>
    </div>
  );
}
