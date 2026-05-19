import React, { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'
import { END_CREDITS_SECTIONS } from '../game/endCreditsData'

/** Scroll approx speed (pixels / second); higher = faster roll */
const SCROLL_SPEED_PX = 48

const LINE_CLASS =
  'mb-4 font-mono text-xs font-semibold tracking-wider text-[#aab] md:text-sm break-words'
const LINK_CLASS =
  `${LINE_CLASS} inline-block border-b border-[#00f5ff]/40 text-[#00f5ff] underline decoration-[#00f5ff]/50 underline-offset-4 transition-colors hover:text-white hover:decoration-white`

/** @param {{ line: string | { text: string, url?: string } }} p */
function CreditLine({ line }) {
  if (typeof line === 'string') {
    return (
      <p className={LINE_CLASS} style={{ lineHeight: 1.65 }}>
        {line}
      </p>
    )
  }
  if (line.url) {
    return (
      <p className="mb-4" style={{ lineHeight: 1.65 }}>
        <a href={line.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {line.text}
        </a>
      </p>
    )
  }
  return (
    <p className={LINE_CLASS} style={{ lineHeight: 1.65 }}>
      {line.text}
    </p>
  )
}

export default function EndCredits() {
  const goToMenu = useGameStore((s) => s.goToMenu)
  const wrapRef = useRef(null)
  const blockRef = useRef(null)
  const tweenRef = useRef(null)
  /** false = scrolling; true = landed on end card — show CONTINUE */
  const [atEndCard, setAtEndCard] = useState(false)

  const teardown = useCallback(() => {
    if (tweenRef.current) {
      tweenRef.current.kill()
      tweenRef.current = null
    }
    gsap.killTweensOf(blockRef.current)
  }, [])

  const exitCredits = useCallback(() => {
    teardown()
    goToMenu()
  }, [goToMenu, teardown])

  useLayoutEffect(() => {
    const block = blockRef.current
    const wrap = wrapRef.current
    if (!block || !wrap) return

    const innerH = block.offsetHeight
    const vh = window.innerHeight
    const startY = vh + 48
    const endY = -innerH - 80
    const travel = Math.max(vh + innerH, 420)
    const duration = Math.max(18, travel / SCROLL_SPEED_PX)

    gsap.set(block, { y: startY })

    tweenRef.current = gsap.to(block, {
      y: endY,
      duration,
      ease: 'none',
      onComplete: () => {
        tweenRef.current = null
        setAtEndCard(true)
      },
    })

    return () => teardown()
  }, [teardown])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        exitCredits()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitCredits])

  return (
    <div
      ref={wrapRef}
      className="relative flex h-full w-full min-h-0 flex-col overflow-hidden bg-[#030308]"
      role="presentation"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(#00f5ff 1px, transparent 1px), linear-gradient(90deg, #00f5ff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="pointer-events-none absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(0,245,255,0.04) 4px,rgba(0,245,255,0.04) 5px)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,255,0.08)_0%,transparent_65%)]" />

      <div className="pointer-events-none absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-20 md:left-8">
        <p className="font-mono text-[10px] font-bold tracking-[0.5em] text-[#00f5ff]/50">OPERATOR LOG ▸ END CREDITS</p>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
        <div
          ref={blockRef}
          className="absolute left-1/2 w-[min(96vw,28rem)] -translate-x-1/2 text-center px-6"
          style={{ willChange: 'transform' }}
        >
          <div className="mb-28 font-mono text-[10px] font-bold tracking-[0.55em] text-[#00f5ff]/90">
            ▼ TRANSMISSION FOLLOWING BLACKOUT PROTOCOL ▼
          </div>

          {END_CREDITS_SECTIONS.map((sec, idx) => (
            <section key={`${idx}-${sec.headline}`} className="mb-24">
              {sec.headline && (
                <h2 className="mb-8 font-mono text-base font-black tracking-[0.35em] text-[#00f5ff] md:text-lg">
                  {sec.headline}
                </h2>
              )}
              {sec.lines.map((line, i) => (
                <CreditLine key={`${idx}-${i}`} line={line} />
              ))}
            </section>
          ))}
        </div>
      </div>

      {/* Skip / Continue */}
      {!atEndCard ? (
        <button
          type="button"
          data-game-ui-touch
          onClick={exitCredits}
          className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 max-w-[min(92vw,20rem)] -translate-x-1/2 px-8 py-3 font-mono text-[11px] font-bold tracking-[0.35em]
                     text-[#888] underline decoration-[#333] underline-offset-4 hover:text-[#00f5ff] md:text-xs"
          style={{ touchAction: 'manipulation' }}
        >
          SKIP
        </button>
      ) : (
        <button
          type="button"
          data-game-ui-touch
          onClick={exitCredits}
          className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 max-w-[min(92vw,22rem)] -translate-x-1/2 border-2 px-10 py-4 font-mono text-sm font-bold tracking-[0.28em]
                     text-[#00f5ff] transition-all hover:bg-[#00f5ff] hover:text-black active:scale-[0.98] md:text-base"
          style={{
            touchAction: 'manipulation',
            borderColor: '#00f5ffaa',
            boxShadow: '0 0 24px rgba(0,245,255,0.25)',
          }}
        >
          CONTINUE → MENU
        </button>
      )}
    </div>
  )
}
