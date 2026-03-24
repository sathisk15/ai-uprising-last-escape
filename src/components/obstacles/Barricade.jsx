import React from 'react'

export default function Barricade() {
  return (
    <group>
      {/* Bottom block */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[1.6, 0.55, 0.55]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Left mid block */}
      <mesh castShadow position={[-0.45, 0.88, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial color="#484848" roughness={0.9} />
      </mesh>
      {/* Right mid block */}
      <mesh castShadow position={[0.45, 0.88, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial color="#484848" roughness={0.9} />
      </mesh>
      {/* Warning stripe on front face */}
      <mesh position={[0, 0.3, 0.28]}>
        <boxGeometry args={[1.6, 0.12, 0.01]} />
        <meshStandardMaterial color="#ffcc00" emissive="#886600" emissiveIntensity={0.5} />
      </mesh>
      {/* Red warning light on top */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff2200" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}
