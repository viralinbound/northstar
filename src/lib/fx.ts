const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>[]#+*'

/** HUD-style "decode": letters resolve left to right out of random glyphs. */
export function scramble(el: HTMLElement, duration = 900) {
  const final = el.dataset.text ?? el.textContent ?? ''
  el.dataset.text = final
  el.setAttribute('aria-label', final)
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const solved = Math.floor(final.length * t)
    let out = ''
    for (let i = 0; i < final.length; i++) {
      const ch = final[i]
      out += i < solved || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
    }
    el.textContent = out
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** Pointer-follow spotlight (sets --mx/--my) plus an optional gentle 3D tilt. Returns a cleanup. */
export function bindSurface(el: HTMLElement, tilt = false) {
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    if (tilt) el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg)`
  }
  const leave = () => {
    if (tilt) el.style.transform = ''
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', leave)
  return () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', leave)
  }
}
