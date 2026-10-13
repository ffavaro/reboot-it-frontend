import { useEffect, useRef, useState } from "react"

/**
 * Anima un número desde 0 (o desde el valor anterior) hasta `value`.
 * Pensado para KPIs: "512" no aparece de golpe, sube en ~800ms con easing.
 *
 * @param value   Valor numérico final a mostrar.
 * @param duration Duración de la animación en ms (default 800).
 */
export function useCountUp(value: number, duration = 800) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(0)

  useEffect(() => {
    // Si el valor no es un número válido (ej. todavía cargando), no animamos.
    if (!Number.isFinite(value)) return

    fromRef.current = display
    startRef.current = null
    let rafId: number

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      const current = fromRef.current + (value - fromRef.current) * eased
      setDisplay(current)
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        setDisplay(value)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return display
}
