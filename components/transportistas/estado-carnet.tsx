import { cn } from "@/lib/utils"
import type { EmpleadoTransportista, SituacionCarnet } from "@/lib/type/empleado-transportista"
import { estaVigente } from "@/lib/utils/helpers"
import { dia } from "@/lib/utils/fechas"

const ESTILOS: Record<SituacionCarnet, string> = {
  "sin-carnet": "bg-muted text-muted-foreground",
  vencido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  vigente: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

export function situacionCarnet(ficha: Pick<EmpleadoTransportista, "carnetUrl" | "carnetVencimiento">): SituacionCarnet {
  if (!ficha.carnetUrl || !ficha.carnetVencimiento) return "sin-carnet"
  return estaVigente(ficha.carnetVencimiento) ? "vigente" : "vencido"
}

export function textoCarnet(ficha: Pick<EmpleadoTransportista, "carnetUrl" | "carnetVencimiento">): string {
  const situacion = situacionCarnet(ficha)
  if (situacion === "sin-carnet") return "Sin carnet cargado"
  const fecha = dia(ficha.carnetVencimiento)
  return situacion === "vigente" ? `Carnet vigente (vence ${fecha})` : `Carnet vencido (venció ${fecha})`
}


const CLASE_BASE = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"

export function EstadoCarnet({
  ficha,
  className,
}: {
  ficha: Pick<EmpleadoTransportista, "carnetUrl" | "carnetVencimiento">
  className?: string
}) {
  return <span className={cn(CLASE_BASE, ESTILOS[situacionCarnet(ficha)], className)}>{textoCarnet(ficha)}</span>
}

export function VigenciaCarnet({ vencimiento }: { vencimiento: string }) {
  if (!vencimiento) return null
  const vigente = estaVigente(vencimiento)
  return (
    <span className={cn(CLASE_BASE, ESTILOS[vigente ? "vigente" : "vencido"])}>{vigente ? "Vigente" : "Vencido"}</span>
  )
}
