/**
 * Lighter WebGL path on phones/tablets — Bloom + shadow maps stall or blank weaker GPUs.
 * Cached for the tab lifetime.
 */
let _cheapPipelineCached

export function isCheapGraphicsPipeline() {
  if (typeof window === 'undefined') return false
  if (_cheapPipelineCached !== undefined) return _cheapPipelineCached

  const ua = /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|webOS/i.test(
    navigator.userAgent || ''
  )
  const iPadMasquerade =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  let prefersCheap = !!(ua || iPadMasquerade)

  try {
    const touchCapable = navigator.maxTouchPoints > 0
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null
    if (mq && touchCapable && !prefersCheap) {
      const fine = mq('(pointer: fine)').matches
      const hover = mq('(hover: hover)').matches
      const coarse = mq('(pointer: coarse)').matches
      const hoverNone = mq('(hover: none)').matches
      if (coarse || hoverNone || !(fine && hover)) prefersCheap = true
    }
  } catch {
    /* keep UA result */
  }

  _cheapPipelineCached = prefersCheap
  return _cheapPipelineCached
}
