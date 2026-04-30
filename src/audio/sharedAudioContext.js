// Single shared Web Audio context for all procedural audio (BGM + SFX).
// Must be resumed from a user-gesture code path (ProceduralBGM.play does this).
let _ctx = null

export function getSharedCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  return _ctx
}

export function resumeSharedCtx() {
  if (_ctx && _ctx.state === 'suspended') _ctx.resume()
}
