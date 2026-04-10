import React, { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import Road from '../components/environment/Road';
import BuildingPool from '../components/environment/BuildingPool';
import PlayerVehicle from '../components/player/PlayerVehicle';
import GameLoop from './GameLoop';
import ObstaclePool from '../components/obstacles/ObstaclePool';
import DronePool from '../components/enemies/DronePool';
import BulletPool from '../components/combat/BulletPool';
import ExplosionPool from '../components/combat/ExplosionPool';
import DroneProjectilePool from '../components/combat/DroneProjectilePool';
import CollectiblePool from '../components/collectibles/CollectiblePool';
import useGameStore from '../store/gameStore';
import { ZONES } from './zones';
import { shakeSignal } from './shakeSignal';

// Owns the shared hit-cooldown so obstacles AND drones can't double-damage
function EnemySystems() {
  const hitCooldown = useRef(0);
  useFrame((_, delta) => {
    if (hitCooldown.current > 0) hitCooldown.current -= delta;
  });
  return (
    <>
      <ObstaclePool hitCooldown={hitCooldown} />
      <DronePool hitCooldown={hitCooldown} />
      <BulletPool />
      <ExplosionPool />
      <DroneProjectilePool />
    </>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 3, 9);
    camera.lookAt(0, 0.5, -6);
    camera.fov = 65;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// Screen shake — triggered by shakeSignal.pending flag set from takeDamage
const BASE_CAM = { x: 0, y: 3, z: 9 };
const SHAKE_MAG = 0.22;
const SHAKE_DUR = 0.32;

function CameraShake() {
  const { camera } = useThree();
  const shakeTimer = useRef(0);

  useFrame((_, delta) => {
    if (shakeSignal.pending) {
      shakeSignal.pending = false;
      shakeTimer.current = SHAKE_DUR;
    }
    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta;
      const mag = SHAKE_MAG * (shakeTimer.current / SHAKE_DUR);
      camera.position.x = BASE_CAM.x + (Math.random() * 2 - 1) * mag;
      camera.position.y = BASE_CAM.y + (Math.random() * 2 - 1) * mag * 0.5;
      camera.position.z = BASE_CAM.z + (Math.random() * 2 - 1) * mag * 0.3;
    } else {
      camera.position.x = BASE_CAM.x;
      camera.position.y = BASE_CAM.y;
      camera.position.z = BASE_CAM.z;
    }
  });
  return null;
}

// Fly camera forward past the crashed car during death sequence
const FLY_DURATION = 3; // seconds to fly past the wreck
const FLY_Z_END = -7; // how far forward camera travels (passes car at z=2)

function CameraFlyPast() {
  const { camera } = useThree();
  const flyT = useRef(-1); // -1 = inactive
  const prevPhase = useRef('menu');

  useFrame((_, delta) => {
    const { phase, completeGameOver } = useGameStore.getState();

    if (phase === 'dying' && prevPhase.current !== 'dying') {
      flyT.current = 0;
    }
    prevPhase.current = phase;

    if (flyT.current < 0) return;

    flyT.current += delta;
    const t = Math.min(flyT.current / FLY_DURATION, 1);
    // ease-in: slow start then accelerates (mimics gaining speed driving past)
    const ease = t * t;
    const z = BASE_CAM.z + (FLY_Z_END - BASE_CAM.z) * ease;
    camera.position.set(BASE_CAM.x, BASE_CAM.y, z);
    camera.lookAt(0, 0.5, z - 15); // always look ahead

    if (flyT.current >= FLY_DURATION) {
      flyT.current = -1;
      completeGameOver();
    }
  });
  return null;
}

// Updates fog + background when zone changes
function ZoneFog() {
  const { scene } = useThree();
  const zone = useGameStore((s) => s.zone);
  const zoneData = ZONES[zone];

  useEffect(() => {
    if (scene.fog) scene.fog.color.set(zoneData.fogColor);
    scene.background?.set?.(zoneData.bgColor);
  }, [zone, scene, zoneData]);

  return <fog attach="fog" args={[zoneData.fogColor, 30, 110]} />;
}

export default function GameCanvas() {
  const zone = useGameStore((s) => s.zone);
  const zoneData = ZONES[zone];

  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%', background: zoneData.bgColor }}
      gl={{ antialias: true, toneMappingExposure: 0.9 }}
      camera={{ position: [0, 3, 9], fov: 65, near: 0.1, far: 160 }}
    >
      <CameraSetup />
      <CameraShake />
      <CameraFlyPast />
      <ZoneFog />

      {/* ── Lighting ──────────────────────────────────────────────────────── */}
      {/* Ambient — single, moderate */}
      <ambientLight intensity={0.7} color="#ffffff" />

      {/* Single shadow-casting directional — 1024 map is enough */}
      <directionalLight
        castShadow
        position={[5, 14, 8]}
        intensity={1.6}
        color="#ffffff"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
      />
      {/* One fill light — no shadows */}
      <directionalLight position={[0, 5, 12]} intensity={0.7} color="#aaccff" />

      {/* Single zone-tinted point light — just one, no shadow */}
      <pointLight
        position={[0, 1.5, 0]}
        intensity={1.2}
        color={zoneData.ambientColor}
        distance={20}
        decay={2}
      />

      {/* ── Ground plane (extends beyond road for shadow reception) ──────── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, -20]}
        receiveShadow
      >
        <planeGeometry args={[80, 140]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* ── Game systems ──────────────────────────────────────────────────── */}
      <GameLoop />
      <Road />
      <BuildingPool />
      <PlayerVehicle />
      <EnemySystems />
      <CollectiblePool />

      {/* ── Post-processing ───────────────────────────────────────────────── */}
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.35}
          luminanceSmoothing={0.7}
          intensity={0.7}
          blendFunction={BlendFunction.ADD}
        />
      </EffectComposer>
    </Canvas>
  );
}
