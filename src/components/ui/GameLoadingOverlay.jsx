/** Full-screen boot loader — shown until Suspense resolves (GLTF + canvas ready). */
export default function GameLoadingOverlay() {
  const C = '#00f5ff'
  const b = `1.5px solid ${C}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060d]"
      aria-busy
      aria-label="Loading game"
    >
      {/* faint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(${C}22 1px, transparent 1px),
            linear-gradient(90deg, ${C}22 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* horizontal scan sweep */}
      <div className="game-load-scan-line pointer-events-none absolute left-0 right-0 h-[2px]" />

      <div className="relative h-28 w-28">
        {/* outer ring */}
        <div
          className="game-load-ring absolute inset-0 rounded-full border border-[#00f5ff]/25"
          style={{ boxShadow: `0 0 24px ${C}22, inset 0 0 12px ${C}11` }}
        />

        {/* inner counter-rotating ring */}
        <div
          className="game-load-ring-reverse absolute inset-3 rounded-full border border-dashed border-[#00f5ff]/40"
        />

        {/* corner reticle — matches in-game cursor */}
        <div className="game-load-pulse absolute inset-5">
          <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTop: b, borderLeft: b }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderTop: b, borderRight: b }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderBottom: b, borderLeft: b }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottom: b, borderRight: b }} />
          <div
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: C, boxShadow: `0 0 10px ${C}` }}
          />
        </div>
      </div>
    </div>
  )
}
