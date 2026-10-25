import { cn } from "@/lib/utils"

// Pill genérica para mostrar un estado/condición con un color Tailwind ya resuelto.
// El color se calcula aparte (ver lib/estado-colores.ts) para no acoplar este componente a ningún dominio.
export function EstadoBadge({
  texto,
  colorClass,
  className,
  capitalize,
}: {
  texto: string
  colorClass: string
  className?: string
  capitalize?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        capitalize && "capitalize",
        colorClass,
        className,
      )}
    >
      {texto}
    </span>
  )
}
