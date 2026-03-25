import React from 'react'

// CORE combat drone — built entirely from Three.js primitives
export default function Drone() {
  return (
    <group>
      {/* Central body */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.22, 0.7]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Top sensor dome */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff0000" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      {/* Arm — front-left */}
      <mesh position={[-0.55, 0, -0.55]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.65, 0.08, 0.08]} />
        <meshStandardMaterial color="#222244" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Rotor hub — front-left */}
      <mesh position={[-0.75, 0.06, -0.75]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
        <meshStandardMaterial color="#111133" metalness={0.6} />
      </mesh>

      {/* Arm — front-right */}
      <mesh position={[0.55, 0, -0.55]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.65, 0.08, 0.08]} />
        <meshStandardMaterial color="#222244" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.75, 0.06, -0.75]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
        <meshStandardMaterial color="#111133" metalness={0.6} />
      </mesh>

      {/* Arm — rear-left */}
      <mesh position={[-0.55, 0, 0.55]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.65, 0.08, 0.08]} />
        <meshStandardMaterial color="#222244" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.75, 0.06, 0.75]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
        <meshStandardMaterial color="#111133" metalness={0.6} />
      </mesh>

      {/* Arm — rear-right */}
      <mesh position={[0.55, 0, 0.55]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.65, 0.08, 0.08]} />
        <meshStandardMaterial color="#222244" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.75, 0.06, 0.75]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
        <meshStandardMaterial color="#111133" metalness={0.6} />
      </mesh>

      {/* Under-glow */}
      <pointLight position={[0, -0.3, 0]} intensity={0.8} color="#ff0000" distance={3} />
    </group>
  )
}
