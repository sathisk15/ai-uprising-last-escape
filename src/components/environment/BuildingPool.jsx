import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import useGameStore from '../../store/gameStore';

const TILE_LENGTH = 120; // must match visual Z-depth of model at current scale
const RECYCLE_Z = 80;   // wait until entire tile is fully behind the camera

function CityTile({ tileRef, initZ }) {
  const { scene } = useGLTF('/models/city_night.glb');
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    model.traverse((child) => {
      // Keep the model's own lights — night city needs them for window/street glow
      if (child.isLight) {
        child.intensity = Math.min(child.intensity, 2);
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [model]);

  return (
    <group ref={tileRef} position={[0, 0, initZ]}>
      <primitive
        object={model}
        scale={[5, 5, 5]}
        rotation={[0, Math.PI / 2, 0]}
        position={[0, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload('/models/city_night.glb');

export default function BuildingPool() {
  const tileA = useRef();
  const tileB = useRef();

  useFrame((_, delta) => {
    const { phase, speed } = useGameStore.getState();
    if (phase !== 'playing' && phase !== 'dying' && phase !== 'zoneout') return;

    const move = speed * delta;

    if (tileA.current) tileA.current.position.z += move;
    if (tileB.current) tileB.current.position.z += move;

    // Read both positions BEFORE modifying either — prevents cascade glitch
    const az = tileA.current?.position.z ?? 0;
    const bz = tileB.current?.position.z ?? 0;
    if (tileA.current && az > RECYCLE_Z)
      tileA.current.position.z = bz - TILE_LENGTH;
    if (tileB.current && bz > RECYCLE_Z)
      tileB.current.position.z = az - TILE_LENGTH;
  });

  return (
    <>
      <CityTile tileRef={tileA} initZ={0} />
      <CityTile tileRef={tileB} initZ={-TILE_LENGTH} />
    </>
  );
}
