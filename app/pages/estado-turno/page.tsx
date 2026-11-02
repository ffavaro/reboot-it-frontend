"use client"

import { ListadoSoloLectura } from "@/components/listado-solo-lectura"
import type { CampoDetalle } from "@/components/listado-solo-lectura"
import type { TableColumn } from "@/components/ui/data-table"
import { useEstadosTurno } from "@/hooks/use-estado-turno"
import type { EstadoTurno } from "@/lib/type/estado-turno"

const TONOS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

function Etiqueta({ texto }: { texto: string }) {
  const tono = TONOS[texto.trim().toLowerCase()] ?? "bg-muted text-muted-foreground"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tono}`}>{texto}</span>
}

const columnas: TableColumn<EstadoTurno>[] = [
  { key: "descripcion", header: "Descripción", cell: (e) => <Etiqueta texto={e.descripcion} /> },
]

const detalle: CampoDetalle<EstadoTurno>[] = [
  { etiqueta: "Descripción", valor: (e) => <Etiqueta texto={e.descripcion} /> },
]

export default function EstadoTurnoPage() {
  const { estadosTurno, isLoading } = useEstadosTurno()

  return (
    <ListadoSoloLectura<EstadoTurno>
      titulo="Estados de Turno"
      descripcion="Estados por los que pasa un turno a lo largo del circuito."
      aviso="Estos estados los usa el sistema por su nombre exacto, por eso no se pueden crear, editar ni dar de baja."
      filas={estadosTurno}
      cargando={isLoading}
      columnas={columnas}
      detalle={detalle}
      textoBusqueda={(e) => e.descripcion}
      placeholderBusqueda="Buscar por descripción..."
      nombreFila={(e) => e.descripcion}
      singular="estado"
      plural="estados"
    />
  )
}
