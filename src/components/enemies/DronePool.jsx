import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import useGameStore from '../../store/gameStore';
import { LANES, ZONES } from '../../game/zones';
import { aabbXZ, HALF } from '../../game/physics';
import { droneSharedData } from './droneData';
import Drone from './Drone';

const MAX_DRONES = 6;
const SPAWN_Z = -72;
const PARK_Z = -600;
const DESPAWN_Z = 18;
// z threshold at which drone locks on and dives — closer in harder zones
const DIVE_Z = { 1: -18, 2: -13, 3: -8 }

// Hover amplitude and frequency
const HOVER_AMP = 0.18;
const HOVER_FREQ = 2.2;

// Lateral sweep: drone drifts between its spawn lane and adjacent lanes
const SWEEP_SPEED = 1.4; // units/s max lateral speed
const SWEEP_AMP = 1.2; // max X deviation from lane centre

// Dive: aggressive steer speed once locked on
const DIVE_STEER = 6.0; // units/s lateral speed during kamikaze dive

export default function DronePool({ hitCooldown }) {
  const data = useRef(
    Array.from({ length: MAX_DRONES }, (_, i) => ({
      id: i,
      active: false,
      lane: 1,
      x: 0, // current world X (for sweep)
      targetX: 0,
      z: PARK_Z,
      phase: Math.random() * Math.PI * 2, // hover phase offset
      sweepTimer: 0,
      diving: false, // true when locked onto player for kamikaze crash
    })),
  );
  const refs = useRef(Array.from({ length: MAX_DRONES }, () => null));
  const spawnTimer = useRef(5.0);

  // Register slot array so BulletPool can check collisions
  useEffect(() => {
    droneSharedData.slots = data.current;
    return () => {
      droneSharedData.slots = null;
    };
  }, []);

  useFrame((_, delta) => {
    const { phase, speed, zone, distance, playerLane, tutorialFrozen, tutorialSpawn } =
      useGameStore.getState();
    // Drones keep moving during zoneout (dynamic feel), just no new spawns or collisions
    if (phase !== 'playing' && phase !== 'zoneout') return;

    // Handle on-demand tutorial drone spawn — always center lane
    if (tutorialSpawn === 'drone') {
      useGameStore.getState().setTutorialSpawn(null);
      const slot = data.current.find((s) => !s.active);
      if (slot) {
        slot.active = true;
        slot.lane = 1;        // always center during tutorial
        slot.x = LANES[1];
        slot.targetX = LANES[1];
        slot.z = SPAWN_Z;
        slot.phase = Math.random() * Math.PI * 2;
        slot.sweepTimer = 0.5;
        slot.diving = false;
        const ref = refs.current[slot.id];
        if (ref) ref.position.set(LANES[1], 1.6, SPAWN_Z);
      }
    }

    const zoneData = ZONES[zone] ?? ZONES[1];
    const playerX = LANES[playerLane];
    const t = performance.now() / 1000;

    data.current.forEach((slot) => {
      if (!slot.active) return;
      const ref = refs.current[slot.id];
      if (!ref) return;

      // World is frozen during tutorial prompt — pause all drone movement
      if (tutorialFrozen) return;

      // Advance forward (same direction as road)
      slot.z += speed * delta;
      ref.position.z = slot.z;

      // Tutorial zone: lock drone to center — no sweep, no dive
      if (zone === 0) {
        slot.x = LANES[1];
        slot.targetX = LANES[1];
        slot.diving = false;
        ref.position.x = LANES[1];
        ref.position.y = 1.6 + Math.sin(t * HOVER_FREQ + slot.phase) * HOVER_AMP;
      } else {
        // Trigger dive when drone gets close enough — threshold tightens each zone
        const diveZ = DIVE_Z[zone] ?? DIVE_Z[1];
        if (!slot.diving && slot.z > diveZ) {
          slot.diving = true;
          slot.targetX = playerX;
        }

        if (slot.diving) {
          slot.targetX = playerX;
          slot.x += (slot.targetX - slot.x) * Math.min(delta * DIVE_STEER, 1);
          ref.position.y =
            1.6 + Math.sin(t * HOVER_FREQ + slot.phase) * HOVER_AMP * 0.4;
        } else {
          ref.position.y =
            1.6 + Math.sin(t * HOVER_FREQ + slot.phase) * HOVER_AMP;
          slot.sweepTimer -= delta;
          if (slot.sweepTimer <= 0) {
            slot.sweepTimer = 1.0 + Math.random() * 1.2;
            const laneX = LANES[slot.lane];
            slot.targetX = laneX + (Math.random() * 2 - 1) * SWEEP_AMP;
            slot.targetX = Math.max(-3.5, Math.min(3.5, slot.targetX));
          }
          slot.x +=
            (slot.targetX - slot.x) * Math.min(delta * SWEEP_SPEED * 2, 1);
        }
        ref.position.x = slot.x;
      }

      // Despawn
      if (slot.z > DESPAWN_Z) {
        slot.active = false;
        ref.position.z = PARK_Z;
        return;
      }

      // No collisions during zoneout — drones fly freely
      if (phase !== 'zoneout') {
        if (hitCooldown.current > 0) return;
        if (
          aabbXZ(
            slot.x,
            slot.z,
            HALF.drone.x,
            HALF.drone.z,
            playerX,
            2,
            HALF.player.x,
            HALF.player.z,
          )
        ) {
          slot.active = false;
          ref.position.z = PARK_Z;
          useGameStore.getState().takeDamage('drone');
          hitCooldown.current = 1.5;
        }
      }
    });

    // No new spawns during zoneout or near zone end
    if (phase === 'zoneout') return;
    // No random spawns in zone 0 — tutorial spawns drones manually
    if (zone === 0) return;
    const nearEnd = (ZONES[zone]?.distanceThreshold ?? 99999) - distance < 120;
    spawnTimer.current -= delta;
    if (spawnTimer.current <= 0 && !nearEnd) {
      spawnTimer.current = zoneData.droneRate + (Math.random() - 0.5) * 1.0;

      const slot = data.current.find((s) => !s.active);
      if (slot) {
        const laneIdx = Math.floor(Math.random() * 3);
        slot.active = true;
        slot.lane = laneIdx;
        slot.x = LANES[laneIdx];
        slot.targetX = LANES[laneIdx];
        slot.z = SPAWN_Z;
        slot.phase = Math.random() * Math.PI * 2;
        slot.sweepTimer = 0.5;
        slot.diving = false;

        const ref = refs.current[slot.id];
        if (ref) {
          ref.position.set(slot.x, 1.6, SPAWN_Z);
        }
      }
    }
  });

  return (
    <>
      {Array.from({ length: MAX_DRONES }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
            // Also store on the slot so BulletPool can deactivate via groupRef
            if (data.current[i]) data.current[i].groupRef = el;
          }}
          position={[LANES[1], 1.6, PARK_Z]}
        >
          <Drone />
        </group>
      ))}
    </>
  );
}
