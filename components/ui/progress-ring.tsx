"use client"

import { useCountUp } from "@/hooks/use-count-up"

interface ProgressRingProps {
  /** Valor de 0 a 100 */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  /** Color del trazo de progreso. Por defecto usa el primary del tema. */
  color?: string
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  color = "var(--chart-2)",
}: ProgressRingProps) {
  const animated = useCountUp(value, 900)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
    </div>
  )
}
