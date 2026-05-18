import React, { useEffect, useRef, useMemo } from 'react';
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
import CollectiblePool from '../components/collectibles/CollectiblePool';
import useGameStore from '../store/gameStore';
import { ZONES } from './zones';
import { shakeSignal } from './shakeSignal';
import { isCheapGraphicsPipeline } from './graphicsQuality';

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

const FLY_DURATION = 3;
const FLY_Z_END = -7;

function CameraFlyPast() {
  const { camera } = useThree();
  const flyT = useRef(-1);
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
    const ease = t * t;
    const z = BASE_CAM.z + (FLY_Z_END - BASE_CAM.z) * ease;
    camera.position.set(BASE_CAM.x, BASE_CAM.y, z);
    camera.lookAt(0, 0.5, z - 15);

    if (flyT.current >= FLY_DURATION) {
      flyT.current = -1;
      completeGameOver();
    }
  });
  return null;
}

const BASE_FOV = 65;
const BOOST_FOV = 82;

function BoostCameraFX() {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const { speedBoostActive } = useGameStore.getState();
    const target = speedBoostActive ? BOOST_FOV : BASE_FOV;
    const rate = speedBoostActive ? 10 : 4;
    camera.fov += (target - camera.fov) * Math.min(delta * rate, 1);
    camera.updateProjectionMatrix();
  });
  return null;
}

const STREAK_COUNT_FULL = 22;
const STREAK_COUNT_REDUCED = 8;

function makeStreakDatum() {
  return {
    ref: null,
    x: (Math.random() - 0.5) * 7,
    y: Math.random() * 2.4 - 0.4,
    z: Math.random() * 16 - 14,
    len: 2.2 + Math.random() * 2.4,
    isOrange: Math.random() < 0.3,
  };
}

function BoostStreaks({ reduced }) {
  const streakCount = reduced ? STREAK_COUNT_REDUCED : STREAK_COUNT_FULL;
  const streakData = useMemo(
    () => Array.from({ length: streakCount }, () => makeStreakDatum()),
    [streakCount],
  );

  useFrame((_, delta) => {
    const { speedBoostActive } = useGameStore.getState();
    for (const s of streakData) {
      if (!s.ref) continue;
      s.ref.visible = speedBoostActive;
      if (!speedBoostActive) continue;
      s.z += 20 * delta;
      if (s.z > 8) {
        s.z = -14 + Math.random() * 3;
        s.x = (Math.random() - 0.5) * 7;
        s.y = Math.random() * 2.4 - 0.4;
      }
      s.ref.position.z = s.z;
    }
  });

  return (
    <>
      {streakData.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => { s.ref = el; }}
          visible={false}
          position={[s.x, s.y, s.z]}
        >
          <boxGeometry args={[0.014, 0.014, s.len]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={s.isOrange ? '#ff9933' : '#ffffff'}
            emissiveIntensity={5}
            toneMapped={false}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

/** Safari URL bar / fullscreen: schedule a redraw after layout settles */
function InvalidateOnViewportChange() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => invalidate());
    };
    window.addEventListener('resize', bump, { passive: true });
    const vv = window.visualViewport;
    vv?.addEventListener('resize', bump, { passive: true });
    vv?.addEventListener('scroll', bump, { passive: true });
    document.addEventListener('fullscreenchange', bump);
    bump();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', bump);
      vv?.removeEventListener('resize', bump);
      vv?.removeEventListener('scroll', bump);
      document.removeEventListener('fullscreenchange', bump);
    };
  }, [invalidate]);

  return null;
}

function ZoneFog({ reduced }) {
  const { scene } = useThree();
  const zone = useGameStore((s) => s.zone);
  const zoneData = ZONES[zone] ?? ZONES[1];

  const fogNear = reduced ? 55 : 80;
  const fogFar = reduced ? 145 : 200;

  useEffect(() => {
    if (scene.fog) scene.fog.color.set(zoneData.fogColor);
    scene.background?.set?.(zoneData.bgColor);
  }, [zone, scene, zoneData]);

  return <fog attach="fog" args={[zoneData.fogColor, fogNear, fogFar]} />;
}

export default function GameCanvas() {
  const zone = useGameStore((s) => s.zone);
  const zoneData = ZONES[zone] ?? ZONES[1];
  const cheapPipeline = useMemo(() => isCheapGraphicsPipeline(), []);

  const maxDpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio || 1, cheapPipeline ? 1 : 2)
    : cheapPipeline ? 1 : 2;

  return (
    <Canvas
      frameloop="always"
      shadows={!cheapPipeline}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '40vh',
        display: 'block',
        touchAction: 'none',
        background: zoneData.bgColor,
      }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
      dpr={[1, maxDpr]}
      gl={{
        antialias: !cheapPipeline,
        alpha: false,
        stencil: false,
        toneMappingExposure: cheapPipeline ? 1.08 : 0.9,
        powerPreference: cheapPipeline ? 'default' : 'high-performance',
      }}
      camera={{ position: [0, 3, 9], fov: 65, near: 0.1, far: cheapPipeline ? 230 : 280 }}
      onCreated={(state) => {
        requestAnimationFrame(() => state.invalidate());
      }}
    >
      <InvalidateOnViewportChange />
      <CameraSetup />
      <CameraShake />
      <CameraFlyPast />
      <BoostCameraFX />
      <BoostStreaks reduced={cheapPipeline} />
      <ZoneFog reduced={cheapPipeline} />

      <ambientLight intensity={cheapPipeline ? 1.42 : 1.2} color="#ffffff" />

      <directionalLight
        castShadow={!cheapPipeline}
        position={[5, 14, 8]}
        intensity={cheapPipeline ? 2.85 : 2.2}
        color="#ffffff"
        shadow-mapSize={cheapPipeline ? [512, 512] : [1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[0, 5, 12]} intensity={1.1} color="#aaccff" />

      <pointLight
        position={[0, 4, -20]}
        intensity={1.2}
        color={zoneData.ambientColor}
        distance={30}
        decay={2}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, -20]}
        receiveShadow={!cheapPipeline}
      >
        <planeGeometry args={[80, 140]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.95} metalness={0.05} />
      </mesh>

      <GameLoop />
      <Road reducedGfx={cheapPipeline} />
      <BuildingPool reducedGfx={cheapPipeline} />
      <PlayerVehicle reducedGfx={cheapPipeline} />
      <EnemySystems />
      <CollectiblePool />

      {!cheapPipeline && (
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.75}
            luminanceSmoothing={0.4}
            intensity={0.6}
            blendFunction={BlendFunction.ADD}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
