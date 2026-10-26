import { useEffect, useRef, useState } from 'react'

// No matchMedia (jsdom, very old browsers) → skip the tween and show the value immediately.
const prefersReducedMotion = () =>
  typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Displays a formatted value. Plain numbers ("2,436") count up from the previous value;
 * anything else ("08min 30sec") swaps in place. Each change after the first gets a soft
 * brand-coloured flash so live updates are noticeable without being noisy.
 */
export function AnimatedValue({ value, className = '' }: { value: string; className?: string }) {
  const target = parseNumeric(value)
  const [shown, setShown] = useState(() => (target === null || prefersReducedMotion() ? value : format(0)))
  const fromRef = useRef(0)
  const [flashKey, setFlashKey] = useState(0)
  const isFirst = useRef(true)

  useEffect(() => {
    if (!isFirst.current) setFlashKey((k) => k + 1)
    isFirst.current = false

    // Background tabs pause requestAnimationFrame; never leave a half-counted number behind.
    if (target === null || prefersReducedMotion() || document.hidden) {
      setShown(value)
      if (target !== null) fromRef.current = target
      return
    }
    const from = fromRef.current
    const duration = from === 0 ? 700 : 450
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(format(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    // Safety net: land on the final value even if frames stop (tab hidden mid-animation).
    const done = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      setShown(format(target))
      fromRef.current = target
    }, duration + 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(done)
      fromRef.current = target
    }
  }, [value, target])

  return (
    <span key={flashKey} className={`inline-block tabular-nums ${flashKey > 0 ? 'animate-flash' : ''} ${className}`}>
      {shown}
    </span>
  )
}

function parseNumeric(v: string): number | null {
  return /^[\d,]+$/.test(v) ? Number(v.replace(/,/g, '')) : null
}

function format(n: number) {
  return Math.round(n).toLocaleString('en-US')
}
