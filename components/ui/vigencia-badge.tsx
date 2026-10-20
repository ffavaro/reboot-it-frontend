import { isVigente } from "@/lib/utils/helpers"
import { cn } from "@/lib/utils"

// Indica si una fecha de vencimiento (yyyy-MM-dd) sigue vigente o ya venció
export function VigenciaBadge({ fecha, className }: { fecha: string | null | undefined; className?: string }) {
  if (!fecha) return null
  const vigente = isVigente(fecha)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        vigente
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        className,
      )}
    >
      {vigente ? "Vigente" : "Vencido"}
    </span>
  )
}
