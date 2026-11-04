import { cn } from "@/lib/utils"

// gris = Pendiente, amarillo = En proceso, verde = Finalizada
const STYLES: Record<string, string> = {
  "Pendiente": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "En proceso": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Finalizada": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export function EstadoHojaBadge({ estado, className }: { estado: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[estado] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {estado}
    </span>
  )
}
