import React from 'react'

export default function EnergyWall() {
  return (
    <group>
      {/* Glowing energy plane */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.2, 2.0, 0.08]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#0088cc"
          emissiveIntensity={2.0}
          transparent
          opacity={0.78}
          toneMapped={false}
        />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.3, 0.12, 0.18]} />
        <meshStandardMaterial color="#003355" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Top frame */}
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[2.3, 0.12, 0.18]} />
        <meshStandardMaterial color="#003355" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Glow point light */}
      <pointLight position={[0, 1.1, 0.5]} intensity={2} color="#00ccff" distance={6} />
    </group>
  )
}
