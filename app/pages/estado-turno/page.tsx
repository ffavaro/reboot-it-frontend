"use client"

import { ListadoSoloLectura } from "@/components/listado-solo-lectura"
import type { CampoDetalle } from "@/components/listado-solo-lectura"
import type { TableColumn } from "@/components/ui/data-table"
import { Etiqueta } from "@/components/ui/etiqueta"
import { useEstadosTurno } from "@/hooks/use-estado-turno"
import type { EstadoTurno } from "@/lib/type/estado-turno"
import { ESTADOS_COLORS_TURNO } from "@/lib/utils/estados"

const columnas: TableColumn<EstadoTurno>[] = [
  { key: "descripcion", header: "Descripción", cell: (e) => <Etiqueta texto={e.descripcion} colors={ESTADOS_COLORS_TURNO} /> },
]

const detalle: CampoDetalle<EstadoTurno>[] = [
  { etiqueta: "Descripción", valor: (e) => <Etiqueta texto={e.descripcion} colors={ESTADOS_COLORS_TURNO} /> },
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
