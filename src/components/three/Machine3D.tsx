import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Machine } from '@/types';

export interface Machine3DProps {
  machine: Machine;
  position: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

const statusColors: Record<string, string> = {
  operational: '#00e676',
  warning: '#ffab00',
  critical: '#ff3d57',
  maintenance: '#00d9ff',
};

function statusGlowColor(status: string): string {
  return statusColors[status] || '#00e676';
}

function useAccent(machine: Machine) {
  const isCritical = machine.status === 'critical';
  const isWarning = machine.status === 'warning';
  return {
    accent: isCritical ? '#ff3d57' : isWarning ? '#ffab00' : '#00d9ff',
    bodyColor: isCritical ? '#2a1018' : isWarning ? '#2a2010' : '#1a2332',
    isCritical,
    isWarning,
  };
}

// ─── Motor ──────────────────────────────────────────────────────────
function MotorModel({ machine }: { machine: Machine }) {
  const fanRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);
  const { accent, bodyColor, isCritical } = useAccent(machine);
  const speed = isCritical ? 0.2 : machine.status === 'warning' ? 1.5 : 5;

  useFrame((_, delta) => {
    if (fanRef.current) fanRef.current.rotation.z += delta * speed;
    if (shaftRef.current) shaftRef.current.rotation.z += delta * speed;
  });

  return (
    <group>
      {/* Base mounting plate */}
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[1.6, 0.1, 1.2]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Motor housing (cylindrical body) */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 1.4, 32]} />
        <meshStandardMaterial color={bodyColor} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 12 }, (_, i) => i).map((i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[0, 0.8 + Math.cos(angle) * 0.46, Math.sin(angle) * 0.46]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[1.3, 0.02, 0.06]} />
            <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
          </mesh>
        );
      })}

      {/* Drive shaft (rotating) */}
      <mesh ref={shaftRef} castShadow position={[0.85, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
        <meshStandardMaterial color="#6a7a8a" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* Shaft coupling */}
      <mesh castShadow position={[0.7, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.12, 16]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Fan cover (rear) */}
      <mesh castShadow position={[-0.8, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
        <meshStandardMaterial color="#1a2332" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Fan blades (rotating) */}
      <group ref={fanRef} position={[-0.85, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} castShadow position={[0, Math.cos(angle) * 0.25, Math.sin(angle) * 0.25]} rotation={[angle, 0, 0]}>
              <boxGeometry args={[0.02, 0.25, 0.06]} />
              <meshStandardMaterial color="#3a4a5a" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        })}
      </group>

      {/* Terminal box */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Cable from terminal box */}
      <mesh position={[0, 1.5, 0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#1a2030" metalness={0.3} roughness={0.8} />
      </mesh>

      {/* Status light */}
      <mesh position={[0.5, 1.35, 0.22]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* Feet */}
      {[[-0.65, -0.45], [0.65, -0.45], [-0.65, 0.45], [0.65, 0.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} castShadow>
          <boxGeometry args={[0.15, 0.16, 0.15]} />
          <meshStandardMaterial color="#1a2332" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Pump ──────────────────────────────────────────────────────────
function PumpModel({ machine }: { machine: Machine }) {
  const impellerRef = useRef<THREE.Mesh>(null);
  const { accent, bodyColor, isCritical } = useAccent(machine);
  const speed = isCritical ? 0.3 : machine.status === 'warning' ? 2 : 6;

  useFrame((_, delta) => {
    if (impellerRef.current) impellerRef.current.rotation.y += delta * speed;
  });

  return (
    <group>
      {/* Base plate */}
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[1.8, 0.1, 1.3]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Pump casing (volute) */}
      <mesh castShadow receiveShadow position={[0.3, 0.7, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.7, 24]} />
        <meshStandardMaterial color={bodyColor} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Volute spiral detail */}
      <mesh castShadow position={[0.3, 0.7, 0.36]}>
        <torusGeometry args={[0.4, 0.05, 8, 24]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Impeller (rotating, visible through front) */}
      <mesh ref={impellerRef} castShadow position={[0.3, 0.7, 0.15]}>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 16]} />
        <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Impeller blades */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[0.3 + Math.cos(angle) * 0.2, 0.7, 0.15]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.25, 0.08, 0.02]} />
            <meshStandardMaterial color="#4a5a6a" metalness={0.9} roughness={0.15} />
          </mesh>
        );
      })}

      {/* Inlet pipe (top) */}
      <mesh castShadow position={[0.3, 1.25, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Flange on inlet */}
      <mesh castShadow position={[0.3, 1.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Outlet pipe (side) */}
      <mesh castShadow position={[0.95, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Flange on outlet */}
      <mesh castShadow position={[1.15, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Drive shaft connecting to motor */}
      <mesh castShadow position={[-0.2, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 12]} />
        <meshStandardMaterial color="#6a7a8a" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* Bearing housing */}
      <mesh castShadow position={[-0.35, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Control/gauge */}
      <mesh castShadow position={[-0.5, 1.0, 0.3]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
        <meshStandardMaterial color="#1a2332" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.5, 1.08, 0.3]}>
        <circleGeometry args={[0.07, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* Status light */}
      <mesh position={[0.7, 1.1, 0.35]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* Feet */}
      {[[-0.75, -0.5], [0.75, -0.5], [-0.75, 0.5], [0.75, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} castShadow>
          <boxGeometry args={[0.15, 0.16, 0.15]} />
          <meshStandardMaterial color="#1a2332" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Compressor ────────────────────────────────────────────────────
function CompressorModel({ machine }: { machine: Machine }) {
  const flywheelRef = useRef<THREE.Mesh>(null);
  const pistonRef = useRef<THREE.Group>(null);
  const { accent, bodyColor, isCritical } = useAccent(machine);
  const speed = isCritical ? 0.3 : machine.status === 'warning' ? 1.5 : 4;

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    if (flywheelRef.current) flywheelRef.current.rotation.z = t;
    if (pistonRef.current) {
      pistonRef.current.position.y = 1.3 + Math.sin(t) * 0.15;
    }
  });

  return (
    <group>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1.8, 0.3, 1.2]} />
        <meshStandardMaterial color={bodyColor} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Air tank (horizontal cylinder) */}
      <mesh castShadow receiveShadow position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 1.6, 24]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Tank end caps */}
      <mesh castShadow position={[-0.8, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0.8, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Pressure gauge */}
      <mesh position={[0, 0.95, 0.28]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshStandardMaterial color="#1a2332" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.98, 0.3]}>
        <circleGeometry args={[0.06, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* Pump cylinder */}
      <mesh castShadow position={[0.5, 1.2, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.5, 16]} />
        <meshStandardMaterial color={bodyColor} metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Cylinder head */}
      <mesh castShadow position={[0.5, 1.5, 0]}>
        <boxGeometry args={[0.35, 0.15, 0.35]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Cooling fins on cylinder */}
      {[1.05, 1.15, 1.25, 1.35].map((y, i) => (
        <mesh key={i} castShadow position={[0.5, y, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* Piston rod (animated) */}
      <group ref={pistonRef} position={[0.5, 1.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
          <meshStandardMaterial color="#6a7a8a" metalness={0.95} roughness={0.08} />
        </mesh>
      </group>

      {/* Flywheel (rotating) */}
      <mesh ref={flywheelRef} castShadow position={[-0.5, 0.65, 0.35]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Flywheel spokes */}
      <group position={[-0.5, 0.65, 0.38]}>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2;
          return (
            <mesh key={i} castShadow rotation={[angle, 0, 0]}>
              <boxGeometry args={[0.02, 0.25, 0.03]} />
              <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
            </mesh>
          );
        })}
      </group>

      {/* Connecting rod from flywheel to piston */}
      <mesh castShadow position={[-0.1, 0.9, 0.35]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.8, 0.05, 0.05]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Air intake filter */}
      <mesh castShadow position={[0.5, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.5} roughness={0.7} />
      </mesh>

      {/* Outlet valve pipe */}
      <mesh castShadow position={[-0.5, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Status light */}
      <mesh position={[0.75, 0.4, 0.6]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* Feet */}
      {[[-0.75, -0.45], [0.75, -0.45], [-0.75, 0.45], [0.75, 0.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} castShadow>
          <boxGeometry args={[0.15, 0.16, 0.15]} />
          <meshStandardMaterial color="#1a2332" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Conveyor ──────────────────────────────────────────────────────
function ConveyorModel({ machine }: { machine: Machine }) {
  const beltRef = useRef<THREE.Group>(null);
  const rollersRef = useRef<THREE.Group>(null);
  const { accent, bodyColor, isCritical } = useAccent(machine);
  const speed = isCritical ? 0.5 : machine.status === 'warning' ? 1.5 : 3;

  const rollerPositions = useMemo(() => {
    const arr: number[] = [];
    for (let i = -0.9; i <= 0.9; i += 0.15) arr.push(i);
    return arr;
  }, []);

  const beltSegments = useMemo(() => {
    const arr: { x: number; z: number }[] = [];
    for (let x = -0.85; x <= 0.85; x += 0.12) {
      arr.push({ x, z: 0.25 });
      arr.push({ x, z: -0.25 });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (rollersRef.current) {
      rollersRef.current.children.forEach((child) => {
        child.rotation.x = t * speed * 3;
      });
    }
    if (beltRef.current) {
      beltRef.current.children.forEach((child, i) => {
        const offset = (t * speed * 0.5 + i * 0.1) % 0.12;
        child.position.x = -0.85 + ((i * 0.12 + offset) % 1.7);
      });
    }
  });

  return (
    <group>
      {/* Support legs */}
      {[[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.4, z]}>
          <boxGeometry args={[0.1, 0.8, 0.1]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Frame */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[2.0, 0.15, 0.7]} />
        <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Rollers (rotating) */}
      <group ref={rollersRef}>
        {rollerPositions.map((x, i) => (
          <mesh key={i} castShadow position={[x, 0.85, 0.25]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
            <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
        {rollerPositions.map((x, i) => (
          <mesh key={`r2-${i}`} castShadow position={[x, 0.85, -0.25]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
            <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* Belt segments (moving) */}
      <group ref={beltRef}>
        {beltSegments.map((seg, i) => (
          <mesh key={i} position={[seg.x, 0.85, seg.z]}>
            <boxGeometry args={[0.08, 0.02, 0.35]} />
            <meshStandardMaterial color="#1a2030" metalness={0.3} roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Motor housing */}
      <mesh castShadow position={[1.0, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.5]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.8, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 12]} />
        <meshStandardMaterial color="#6a7a8a" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* Control panel */}
      <mesh castShadow position={[-1.0, 1.0, 0]}>
        <boxGeometry args={[0.25, 0.4, 0.25]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[-1.0, 1.0, 0.14]}>
        <planeGeometry args={[0.18, 0.25]} />
        <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={isCritical ? 1.2 : 0.6} toneMapped={false} />
      </mesh>

      {/* Status light */}
      <mesh position={[1.15, 1.0, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* Safety guard rails */}
      {[-0.35, 0.35].map((z, i) => (
        <mesh key={i} position={[0, 1.05, z]}>
          <boxGeometry args={[2.0, 0.06, 0.03]} />
          <meshStandardMaterial color="#ffab00" emissive="#ffab00" emissiveIntensity={0.3} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Generator ──────────────────────────────────────────────────────
function GeneratorModel({ machine }: { machine: Machine }) {
  const rotorRef = useRef<THREE.Group>(null);
  const { accent, bodyColor, isCritical } = useAccent(machine);
  const speed = isCritical ? 0.2 : machine.status === 'warning' ? 1.5 : 4;

  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.z += delta * speed;
  });

  return (
    <group>
      {/* Base skid */}
      <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[2.2, 0.1, 1.3]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Alternator housing (large cylinder) */}
      <mesh castShadow receiveShadow position={[0.3, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 32]} />
        <meshStandardMaterial color={bodyColor} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Alternator cooling fins */}
      {Array.from({ length: 10 }, (_, i) => i).map((i) => {
        const angle = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[0.3, 0.8 + Math.cos(angle) * 0.41, Math.sin(angle) * 0.41]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.9, 0.02, 0.05]} />
            <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
          </mesh>
        );
      })}

      {/* Engine block */}
      <mesh castShadow receiveShadow position={[-0.7, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 16]} />
        <meshStandardMaterial color="#1a2332" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Engine cooling fins */}
      {Array.from({ length: 8 }, (_, i) => i).map((i) => {
        const y = -0.6 + i * 0.15;
        return (
          <mesh key={i} castShadow position={[-0.7, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.37, 0.37, 0.03, 16]} />
            <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
          </mesh>
        );
      })}

      {/* Exhaust pipe */}
      <mesh castShadow position={[-1.0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 12]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Exhaust muffler */}
      <mesh castShadow position={[-1.2, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 12]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Fuel tank */}
      <mesh castShadow position={[-0.7, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.5]} />
        <meshStandardMaterial color="#1a2030" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Rotor coupling (rotating) */}
      <group ref={rotorRef} position={[-0.2, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
          <meshStandardMaterial color="#6a7a8a" metalness={0.95} roughness={0.08} />
        </mesh>
      </group>

      {/* Control panel */}
      <mesh castShadow position={[0.9, 1.0, 0.3]}>
        <boxGeometry args={[0.3, 0.4, 0.15]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.9, 1.0, 0.38]}>
        <planeGeometry args={[0.22, 0.3]} />
        <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={isCritical ? 1.2 : 0.6} toneMapped={false} />
      </mesh>

      {/* Voltage gauge */}
      <mesh position={[0.9, 1.15, 0.38]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>

      {/* Status light */}
      <mesh position={[0.9, 0.6, 0.38]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* Output cable */}
      <mesh position={[0.9, 0.5, 0.2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#1a2030" metalness={0.3} roughness={0.8} />
      </mesh>

      {/* Skid feet */}
      {[[-0.95, -0.5], [0.95, -0.5], [-0.95, 0.5], [0.95, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <meshStandardMaterial color="#1a2332" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Machine type router ───────────────────────────────────────────
function MachineModel({ machine }: { machine: Machine }) {
  const type = machine.type.toLowerCase();
  if (type.includes('motor')) return <MotorModel machine={machine} />;
  if (type.includes('pump')) return <PumpModel machine={machine} />;
  if (type.includes('compress')) return <CompressorModel machine={machine} />;
  if (type.includes('conveyor')) return <ConveyorModel machine={machine} />;
  if (type.includes('generator')) return <GeneratorModel machine={machine} />;
  return <MotorModel machine={machine} />;
}

// ─── Status ring ────────────────────────────────────────────────────
function StatusRing({ status, isHovered, isSelected }: { status: string; isHovered: boolean; isSelected: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const color = statusGlowColor(status);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z = t * 0.5;
    if (pulseRef.current) {
      const scale = 1 + Math.sin(t * 2) * 0.05;
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 0.02, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 64]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : isHovered ? 0.4 : 0.25} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.05, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {status === 'critical' && (
        <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.55, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

// ─── Floating label ─────────────────────────────────────────────────
function FloatingLabel({ machine, isHovered, isSelected }: { machine: Machine; isHovered: boolean; isSelected: boolean }) {
  const labelRef = useRef<THREE.Group>(null);
  const color = statusGlowColor(machine.status);

  useFrame((state) => {
    if (labelRef.current) {
      labelRef.current.position.y = 3.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      labelRef.current.lookAt(state.camera.position);
    }
  });

  const showLabel = isHovered || isSelected || machine.status === 'critical';
  if (!showLabel) return null;

  return (
    <group ref={labelRef} position={[0, 3.5, 0]}>
      <mesh>
        <planeGeometry args={[1.6, 0.5]} />
        <meshBasicMaterial color="#0a0e14" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[-0.75, 0, 0.02]}>
        <planeGeometry args={[0.04, 0.5]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0.75, 0, 0.02]}>
        <planeGeometry args={[0.04, 0.5]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Holographic data beam ─────────────────────────────────────────
function DataBeam({ machine, isSelected }: { machine: Machine; isSelected: boolean }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const color = statusGlowColor(machine.status);

  useFrame((state) => {
    if (beamRef.current) {
      const t = state.clock.elapsedTime;
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (isSelected ? 0.25 : 0.12) + Math.sin(t * 3) * 0.05;
    }
  });

  return (
    <mesh ref={beamRef} position={[0, 1.5, 0]}>
      <cylinderGeometry args={[0.5, 0.02, 3.0, 16, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

// ─── Main Machine3D component ──────────────────────────────────────
export function Machine3D({ machine, position, isSelected, isHovered, onSelect, onHover }: Machine3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const color = statusGlowColor(machine.status);

  useFrame((state) => {
    if (groupRef.current) {
      if (isHovered || isSelected) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      } else {
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          position[1],
          0.1,
        );
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.cursor = 'grab';
      }}
    >
      <MachineModel machine={machine} />
      <StatusRing status={machine.status} isHovered={isHovered} isSelected={isSelected} />
      <FloatingLabel machine={machine} isHovered={isHovered} isSelected={isSelected} />
      <DataBeam machine={machine} isSelected={isSelected} />

      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.8, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.04} wireframe />
        </mesh>
      )}
    </group>
  );
}
