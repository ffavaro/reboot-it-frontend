import { cn } from "@/lib/utils"
import { estaVigente } from "@/lib/utils/helpers"

export function EstadoItv({ vencimiento, className }: { vencimiento: string | null | undefined; className?: string }) {
  if (!vencimiento) return null
  const vigente = estaVigente(vencimiento)
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
      {vigente ? "Vigente" : "Vencida"}
    </span>
  )
}
