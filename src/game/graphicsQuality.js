/**
 * Touch / phone heuristic — used for layout quirks (e.g. skip programmatic fullscreen).
 * Does not change render quality; mobile uses the same graphics as desktop.
 */
let _mobileLikeCached

export function isMobileLikeDevice() {
  if (typeof window === 'undefined') return false
  if (_mobileLikeCached !== undefined) return _mobileLikeCached

  const ua = /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|webOS/i.test(
    navigator.userAgent || ''
  )
  const iPadMasquerade =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  let mobileLike = !!(ua || iPadMasquerade)

  try {
    const touchCapable = navigator.maxTouchPoints > 0
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null
    if (mq && touchCapable && !mobileLike) {
      const fine = mq('(pointer: fine)').matches
      const hover = mq('(hover: hover)').matches
      const coarse = mq('(pointer: coarse)').matches
      const hoverNone = mq('(hover: none)').matches
      if (coarse || hoverNone || !(fine && hover)) mobileLike = true
    }
  } catch {
    /* keep UA result */
  }

  _mobileLikeCached = mobileLike
  return _mobileLikeCached
}
