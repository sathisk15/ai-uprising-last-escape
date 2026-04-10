import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import useGameStore from '../store/gameStore';
import { ZONES } from '../game/zones';

const HOLD_MS = 2800;

export default function ZoneTransition() {
  const zone = useGameStore((s) => s.zone);
  const resumeFromTransition = useGameStore((s) => s.resumeFromTransition);
  const zoneData = ZONES[zone];

  const overlayRef = useRef(null);
  const panelTopRef = useRef(null);
  const panelBotRef = useRef(null);
  const scanRef = useRef(null);
  const labelRef = useRef(null);
  const numberRef = useRef(null);
  const numberGhostR = useRef(null);
  const numberGhostC = useRef(null);
  const nameRef = useRef(null);
  const taglineRef = useRef(null);
  const progressRef = useRef(null);
  const progressLabelRef = useRef(null);
  const streaksRef = useRef(null);

  useEffect(() => {
    const color = zoneData.ambientColor;
    const tl = gsap.timeline();

    // ── 1. Hard flash in (car already gone — banner slams in immediately) ────
    tl.set(overlayRef.current,   { opacity: 1 })
      .set(panelTopRef.current,  { scaleY: 1, transformOrigin: 'top center' })
      .set(panelBotRef.current,  { scaleY: 1, transformOrigin: 'bottom center' })

    // ── 2. Glitch strobe ────────────────────────────────────────────────────
    tl.to(overlayRef.current, { opacity: 0.2, duration: 0.06 })
      .to(overlayRef.current, { opacity: 1, duration: 0.04 })
      .to(overlayRef.current, { opacity: 0.3, duration: 0.05 })
      .to(overlayRef.current, { opacity: 1, duration: 0.04 });

    // ── 3. Horizontal scan line sweeps down ─────────────────────────────────
    tl.fromTo(
      scanRef.current,
      { top: '0%', opacity: 1 },
      { top: '100%', opacity: 0.4, duration: 0.5, ease: 'power1.in' },
      '-=0.1',
    );

    // ── 4. Streak lines blast across ────────────────────────────────────────
    tl.fromTo(
      streaksRef.current?.children ?? [],
      { scaleX: 0, opacity: 0.8, transformOrigin: 'left center' },
      {
        scaleX: 1,
        opacity: 0,
        duration: 0.25,
        stagger: 0.04,
        ease: 'power4.out',
      },
      '-=0.3',
    );

    // ── 5. Zone number slams in with chromatic split ─────────────────────────
    tl.fromTo(
      [numberGhostR.current, numberGhostC.current],
      { scale: 4, opacity: 0 },
      {
        scale: 1,
        opacity: 0.5,
        duration: 0.4,
        ease: 'expo.out',
        stagger: 0.04,
      },
      '-=0.1',
    )
      .fromTo(
        numberRef.current,
        { scale: 4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'expo.out' },
        '<0.04',
      )
      // Ghost layers settle to zero offset
      .to(
        [numberGhostR.current, numberGhostC.current],
        { x: 0, y: 0, opacity: 0, duration: 0.3 },
        '-=0.1',
      );

    // ── 6. Label + name slide in ─────────────────────────────────────────────
    tl.fromTo(
      labelRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' },
      '-=0.25',
    )
      .fromTo(
        nameRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' },
        '-=0.15',
      )
      .fromTo(
        taglineRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3 },
        '-=0.1',
      );

    // ── 7. Panels retract ────────────────────────────────────────────────────
    tl.to(
      [panelTopRef.current, panelBotRef.current],
      { scaleY: 0, duration: 0.4, ease: 'power3.in', stagger: 0.05 },
      '-=0.1',
    );

    // ── 8. Progress bar sweeps in ────────────────────────────────────────────
    tl.fromTo(
      progressRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.7, ease: 'power2.inOut' },
      '-=0.2',
    ).fromTo(
      progressLabelRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      '-=0.3',
    );

    // ── Hold ─────────────────────────────────────────────────────────────────
    tl.to(
      {},
      { duration: Math.max(0.2, HOLD_MS / 1000 - tl.duration() - 0.5) },
    );

    // ── 9. Outro — panels slam back in then flash out ─────────────────────────
    tl.to([nameRef.current, taglineRef.current, labelRef.current], {
      opacity: 0,
      y: -10,
      duration: 0.2,
      stagger: 0.03,
    })
      .to(
        numberRef.current,
        { scale: 0.5, opacity: 0, duration: 0.25, ease: 'power3.in' },
        '-=0.1',
      )
      .fromTo(
        [panelTopRef.current, panelBotRef.current],
        { scaleY: 0 },
        { scaleY: 1, duration: 0.25, ease: 'power3.out', stagger: 0.03 },
      )
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        onComplete: resumeFromTransition,
      });

    return () => tl.kill();
  }, [zone]);

  const taglines = {
    1: 'Signal broadcasting. Keep moving — CORE is scanning.',
    2: 'CORE has your frequency. Drones inbound. Stay on the road.',
    3: 'Final relay. Upload at 66%. Do not stop under any condition.',
  };

  const color = zoneData.ambientColor;

  // Streak positions
  const streaks = [15, 30, 45, 52, 63, 72, 85];

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: 0, background: '#000' }}
    >
      {/* Scanlines texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.025) 3px,rgba(255,255,255,0.025) 4px)',
        }}
      />

      {/* Zone color radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${color}30 0%, transparent 60%)`,
        }}
      />

      {/* Top panel (black slab) */}
      <div
        ref={panelTopRef}
        className="absolute top-0 w-full"
        style={{
          height: '50%',
          background: `linear-gradient(to bottom, #000 80%, ${color}22)`,
          transformOrigin: 'top center',
        }}
      />
      {/* Bottom panel */}
      <div
        ref={panelBotRef}
        className="absolute bottom-0 w-full"
        style={{
          height: '50%',
          background: `linear-gradient(to top, #000 80%, ${color}22)`,
          transformOrigin: 'bottom center',
        }}
      />

      {/* Horizontal scan line */}
      <div
        ref={scanRef}
        className="absolute w-full pointer-events-none"
        style={{
          height: '3px',
          top: '0%',
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          boxShadow: `0 0 20px 4px ${color}88`,
          opacity: 0,
        }}
      />

      {/* Streak lines */}
      <div
        ref={streaksRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {streaks.map((top, i) => (
          <div
            key={i}
            className="absolute w-full"
            style={{
              top: `${top}%`,
              height: '1px',
              background: `linear-gradient(to right, transparent 0%, ${color}cc 40%, transparent 100%)`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        <p
          ref={labelRef}
          className="font-mono tracking-[0.6em] text-xs mb-4 uppercase"
          style={{ color, opacity: 0 }}
        >
          — ROUTING SIGNAL —
        </p>

        {/* Zone number with chromatic ghost layers */}
        <div className="relative mb-2" style={{ lineHeight: 1 }}>
          {/* Red ghost */}
          <div
            ref={numberGhostR}
            className="absolute inset-0 flex items-center justify-center font-mono font-black select-none pointer-events-none"
            style={{
              fontSize: 'clamp(5rem, 18vw, 9rem)',
              color: '#ff2020',
              opacity: 0,
              transform: 'translate(-6px, 4px)',
              filter: 'blur(1px)',
            }}
          >
            {zone}
          </div>
          {/* Cyan ghost */}
          <div
            ref={numberGhostC}
            className="absolute inset-0 flex items-center justify-center font-mono font-black select-none pointer-events-none"
            style={{
              fontSize: 'clamp(5rem, 18vw, 9rem)',
              color: '#00f5ff',
              opacity: 0,
              transform: 'translate(6px, -4px)',
              filter: 'blur(1px)',
            }}
          >
            {zone}
          </div>
          {/* Main number */}
          <div
            ref={numberRef}
            className="font-mono font-black"
            style={{
              fontSize: 'clamp(5rem, 18vw, 9rem)',
              color,
              textShadow: `0 0 60px ${color}cc, 0 0 120px ${color}44`,
              opacity: 0,
            }}
          >
            {zone}
          </div>
        </div>

        <h2
          ref={nameRef}
          className="font-mono tracking-[0.35em] text-white mb-4"
          style={{ fontSize: 'clamp(1rem, 3vw, 1.6rem)', opacity: 0 }}
        >
          {zoneData.name.toUpperCase()}
        </h2>

        <p
          ref={taglineRef}
          className="font-mono text-xs tracking-widest max-w-xs"
          style={{ color: '#888', opacity: 0 }}
        >
          {taglines[zone] ?? ''}
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 w-56">
        <div className="w-full h-px bg-white/10 overflow-hidden">
          <div
            ref={progressRef}
            className="h-full"
            style={{
              background: color,
              boxShadow: `0 0 8px ${color}`,
              transformOrigin: 'left',
            }}
          />
        </div>
        <p
          ref={progressLabelRef}
          className="text-center text-[9px] tracking-widest text-white/30 font-mono mt-2"
          style={{ opacity: 0 }}
        >
          SIGNAL-0 RELAY {zone}/3 ESTABLISHED
        </p>
      </div>

      {/* Corner brackets */}
      <div
        className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2"
        style={{ borderColor: color }}
      />
      <div
        className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2"
        style={{ borderColor: color }}
      />
      <div
        className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2"
        style={{ borderColor: color }}
      />
      <div
        className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2"
        style={{ borderColor: color }}
      />
    </div>
  );
}
