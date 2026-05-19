import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import useGameStore from '../../store/gameStore';
import { MODEL_CITY_NIGHT_GLB } from '../../game/publicModelUrls';

const TILE_LENGTH = 160;
const RECYCLE_Z = 120;

function setupCityTile(model) {
  model.traverse((child) => {
    if (child.isLight) {
      child.intensity = Math.min(child.intensity, 2);
    }
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

useGLTF.preload(MODEL_CITY_NIGHT_GLB);

export default function BuildingPool() {
  const tileA = useRef();
  const tileB = useRef();
  const tileC = useRef();

  const { scene } = useGLTF(MODEL_CITY_NIGHT_GLB);
  const models = useMemo(() => {
    const a = scene.clone(true);
    const b = scene.clone(true);
    const c = scene.clone(true);
    setupCityTile(a);
    setupCityTile(b);
    setupCityTile(c);
    return [a, b, c];
  }, [scene]);

  useFrame((_, delta) => {
    const { phase, speed, tutorialFrozen } = useGameStore.getState();
    if (phase !== 'playing' && phase !== 'dying' && phase !== 'zoneout') return;
    if (tutorialFrozen) return;

    const move = speed * delta;

    if (tileA.current) tileA.current.position.z += move;
    if (tileB.current) tileB.current.position.z += move;
    if (tileC.current) tileC.current.position.z += move;

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

  const scale = [10, 10, 10];
  const rotation = [0, Math.PI / 2, 0];

  return (
    <>
      <group ref={tileA} position={[0, 0, 0]}>
        <primitive object={models[0]} scale={scale} rotation={rotation} position={[0, 0, 0]} />
      </group>
      <group ref={tileB} position={[0, 0, -TILE_LENGTH]}>
        <primitive object={models[1]} scale={scale} rotation={rotation} position={[0, 0, 0]} />
      </group>
      <group ref={tileC} position={[0, 0, -TILE_LENGTH * 2]}>
        <primitive object={models[2]} scale={scale} rotation={rotation} position={[0, 0, 0]} />
      </group>
    </>
  );
}
