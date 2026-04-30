import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import useGameStore from '../store/gameStore';
import { ZONES } from '../game/zones';

const HOLD_MS = 2800;

export default function ZoneTransition() {
  const zone = useGameStore((s) => s.zone);
  const resumeFromTransition = useGameStore((s) => s.resumeFromTransition);
  const zoneData = ZONES[zone];

  const overlayRef      = useRef(null);
  const panelTopRef     = useRef(null);
  const panelBotRef     = useRef(null);
  const scanRef         = useRef(null);
  const labelRef        = useRef(null);
  const numberRef       = useRef(null);
  const numberGhostR    = useRef(null);
  const numberGhostC    = useRef(null);
  const nameRef         = useRef(null);
  const taglineRef      = useRef(null);
  const progressRef     = useRef(null);
  const progressLabelRef= useRef(null);
  const streaksRef      = useRef(null);
  const infoRef         = useRef(null);
  const dotRefs         = useRef([null, null, null]);

  useEffect(() => {
    const color = zoneData.ambientColor;
    const tl = gsap.timeline();

    tl.set(overlayRef.current,  { opacity: 1 })
      .set(panelTopRef.current, { scaleY: 1, transformOrigin: 'top center' })
      .set(panelBotRef.current, { scaleY: 1, transformOrigin: 'bottom center' })

    // Glitch strobe
    tl.to(overlayRef.current, { opacity: 0.2, duration: 0.06 })
      .to(overlayRef.current, { opacity: 1,   duration: 0.04 })
      .to(overlayRef.current, { opacity: 0.3, duration: 0.05 })
      .to(overlayRef.current, { opacity: 1,   duration: 0.04 });

    // Scan line
    tl.fromTo(scanRef.current,
      { top: '0%', opacity: 1 },
      { top: '100%', opacity: 0.4, duration: 0.5, ease: 'power1.in' }, '-=0.1'
    );

    // Streak lines
    tl.fromTo(streaksRef.current?.children ?? [],
      { scaleX: 0, opacity: 0.8, transformOrigin: 'left center' },
      { scaleX: 1, opacity: 0, duration: 0.25, stagger: 0.04, ease: 'power4.out' }, '-=0.3'
    );

    // Zone number chromatic split
    tl.fromTo([numberGhostR.current, numberGhostC.current],
      { scale: 4, opacity: 0 },
      { scale: 1, opacity: 0.5, duration: 0.4, ease: 'expo.out', stagger: 0.04 }, '-=0.1'
    )
    .fromTo(numberRef.current,
      { scale: 4, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'expo.out' }, '<0.04'
    )
    .to([numberGhostR.current, numberGhostC.current],
      { x: 0, y: 0, opacity: 0, duration: 0.3 }, '-=0.1'
    );

    // Label + name + tagline
    tl.fromTo(labelRef.current,
      { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, '-=0.25'
    )
    .fromTo(nameRef.current,
      { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }, '-=0.15'
    )
    .fromTo(taglineRef.current,
      { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.1'
    );

    // Info row (speed + threat)
    tl.fromTo(infoRef.current,
      { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.1'
    );

    // Zone progress dots
    tl.fromTo(dotRefs.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.2, stagger: 0.1, ease: 'back.out(2)' }, '-=0.2'
    );

    // Panels retract
    tl.to([panelTopRef.current, panelBotRef.current],
      { scaleY: 0, duration: 0.4, ease: 'power3.in', stagger: 0.05 }, '-=0.1'
    );

    // Progress bar
    tl.fromTo(progressRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, '-=0.2'
    )
    .fromTo(progressLabelRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.3'
    );

    // Hold
    tl.to({}, { duration: Math.max(0.2, HOLD_MS / 1000 - tl.duration() - 0.5) });

    // Outro
    tl.to([nameRef.current, taglineRef.current, labelRef.current, infoRef.current],
      { opacity: 0, y: -10, duration: 0.2, stagger: 0.03 }
    )
    .to(numberRef.current, { scale: 0.5, opacity: 0, duration: 0.25, ease: 'power3.in' }, '-=0.1')
    .fromTo([panelTopRef.current, panelBotRef.current],
      { scaleY: 0 }, { scaleY: 1, duration: 0.25, ease: 'power3.out', stagger: 0.03 }
    )
    .to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: resumeFromTransition });

    return () => tl.kill();
  }, [zone]);

  const color = zoneData.ambientColor;
  const streaks = [12, 25, 38, 50, 60, 72, 85];

  const taglines = {
    1: 'Signal broadcasting. Keep moving — CORE is scanning.',
    2: 'CORE has your frequency. Drones inbound. Stay on the road.',
    3: 'Final relay. Upload at 66%. Do not stop under any condition.',
  };

  const zoneInfo = {
    1: { speed: '22 u/s', threat: 'LOW',    threatColor: '#00ff88' },
    2: { speed: '33 u/s', threat: 'MEDIUM', threatColor: '#ffaa00' },
    3: { speed: '44 u/s', threat: 'CRITICAL', threatColor: '#ff2020' },
  };

  const info = zoneInfo[zone];

  return (
    <div ref={overlayRef} className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: 0, background: '#000' }}>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.025) 3px,rgba(255,255,255,0.025) 4px)' }}
      />

      {/* Zone color grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize:'52px 52px' }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${color}28 0%, transparent 60%)` }}
      />

      {/* Top panel */}
      <div ref={panelTopRef} className="absolute top-0 w-full"
        style={{ height:'50%', background:`linear-gradient(to bottom, #000 80%, ${color}18)`, transformOrigin:'top center' }}
      />
      {/* Bottom panel */}
      <div ref={panelBotRef} className="absolute bottom-0 w-full"
        style={{ height:'50%', background:`linear-gradient(to top, #000 80%, ${color}18)`, transformOrigin:'bottom center' }}
      />

      {/* Scan line */}
      <div ref={scanRef} className="absolute w-full pointer-events-none"
        style={{ height:'3px', top:'0%', background:`linear-gradient(to right, transparent, ${color}, transparent)`, boxShadow:`0 0 20px 4px ${color}88`, opacity:0 }}
      />

      {/* Streak lines */}
      <div ref={streaksRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {streaks.map((top, i) => (
          <div key={i} className="absolute w-full"
            style={{ top:`${top}%`, height:'1px', background:`linear-gradient(to right, transparent 0%, ${color}cc 40%, transparent 100%)`, opacity:0 }}
          />
        ))}
      </div>

      {/* Corner brackets */}
      {['top-4 left-4 border-t border-l', 'top-4 right-4 border-t border-r',
        'bottom-4 left-4 border-b border-l', 'bottom-4 right-4 border-b border-r'].map((cls, i) => (
        <div key={i} className={`absolute w-7 h-7 ${cls}`} style={{ borderColor: color }} />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">

        <p ref={labelRef} className="font-mono font-bold tracking-[0.6em] text-base mb-4 uppercase"
          style={{ color, opacity:0 }}>
          — ROUTING SIGNAL —
        </p>

        {/* Zone number with chromatic ghosts */}
        <div className="relative mb-2" style={{ lineHeight: 1 }}>
          <div ref={numberGhostR} className="absolute inset-0 flex items-center justify-center font-mono font-black select-none pointer-events-none"
            style={{ fontSize:'clamp(5rem,18vw,9rem)', color:'#ff2020', opacity:0, transform:'translate(-6px,4px)', filter:'blur(1px)' }}>
            {zone}
          </div>
          <div ref={numberGhostC} className="absolute inset-0 flex items-center justify-center font-mono font-black select-none pointer-events-none"
            style={{ fontSize:'clamp(5rem,18vw,9rem)', color:'#00f5ff', opacity:0, transform:'translate(6px,-4px)', filter:'blur(1px)' }}>
            {zone}
          </div>
          <div ref={numberRef} className="font-mono font-black"
            style={{ fontSize:'clamp(5rem,18vw,9rem)', color, textShadow:`0 0 60px ${color}cc, 0 0 120px ${color}44`, opacity:0 }}>
            {zone}
          </div>
        </div>

        <h2 ref={nameRef} className="font-mono font-black tracking-[0.4em] text-white mb-3"
          style={{ fontSize:'clamp(1.2rem,4vw,2rem)', opacity:0 }}>
          {zoneData.name.toUpperCase()}
        </h2>

        <p ref={taglineRef} className="font-mono text-base font-medium tracking-widest max-w-xs mb-5"
          style={{ color:'#aaa', opacity:0 }}>
          {taglines[zone] ?? ''}
        </p>

        {/* Speed + Threat info pills */}
        <div ref={infoRef} className="flex gap-3 mb-2" style={{ opacity:0 }}>
          <div className="flex items-center gap-2 px-3 py-1.5 border rounded-sm"
            style={{ borderColor: color + '30', background: color + '08' }}>
            <span className="font-mono text-sm font-bold tracking-widest text-[#888]">SPEED</span>
            <span className="font-mono text-base font-black" style={{ color }}>{info.speed}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 border rounded-sm"
            style={{ borderColor: info.threatColor + '30', background: info.threatColor + '08' }}>
            <span className="font-mono text-sm font-bold tracking-widest text-[#888]">THREAT</span>
            <span className="font-mono text-base font-black" style={{ color: info.threatColor }}>{info.threat}</span>
          </div>
        </div>

        {/* Zone progress dots */}
        <div className="flex gap-2 items-center">
          {[1, 2, 3].map((z, i) => (
            <div key={z} ref={el => dotRefs.current[i] = el}
              className="rounded-full transition-all duration-300"
              style={{
                width:  z === zone ? '20px' : '7px',
                height: '7px',
                backgroundColor: z < zone ? '#2a2a2a' : z === zone ? color : '#111',
                boxShadow: z === zone ? `0 0 8px ${color}` : 'none',
                opacity: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 w-64">
        <div className="w-full h-px bg-white/10 overflow-hidden">
          <div ref={progressRef} className="h-full"
            style={{ background: color, boxShadow:`0 0 8px ${color}`, transformOrigin:'left' }}
          />
        </div>
        <p ref={progressLabelRef} className="text-center text-sm font-bold tracking-widest text-white/60 font-mono mt-2"
          style={{ opacity:0 }}>
          SIGNAL-0 RELAY {zone}/3 ESTABLISHED
        </p>
      </div>
    </div>
  );
}
