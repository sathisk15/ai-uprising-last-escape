import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import useGameStore from '../../store/gameStore';

const TILE_LENGTH = 160; // match road tile length so buildings cover the full road
const RECYCLE_Z = 120; // wait until entire tile is fully behind the camera

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
  const tileC = useRef();

  useFrame((_, delta) => {
    const { phase, speed } = useGameStore.getState();
    if (phase !== 'playing' && phase !== 'dying' && phase !== 'zoneout') return;

    const move = speed * delta;

    if (tileA.current) tileA.current.position.z += move;
    if (tileB.current) tileB.current.position.z += move;
    if (tileC.current) tileC.current.position.z += move;

    // Recycle: snapshot z, find baseZ (rearmost), place each recycler sequentially behind it
    const tiles = [tileA.current, tileB.current, tileC.current];
    const zs = tiles.map((t) => t?.position.z ?? 0);
    const baseZ = Math.min(...zs);
    const recyclers = zs
      .map((z, i) => ({ tile: tiles[i], z }))
      .filter((e) => e.z > RECYCLE_Z)
      .sort((a, b) => b.z - a.z);
    recyclers.forEach((entry, i) => {
      entry.tile.position.z = baseZ - TILE_LENGTH * (i + 1);
    });
  });

  return (
    <>
      <CityTile tileRef={tileA} initZ={0} />
      <CityTile tileRef={tileB} initZ={-TILE_LENGTH} />
      <CityTile tileRef={tileC} initZ={-TILE_LENGTH * 2} />
    </>
  );
}
