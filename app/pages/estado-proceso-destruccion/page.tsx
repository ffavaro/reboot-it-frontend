"use client"

import { ListadoSoloLectura } from "@/components/listado-solo-lectura"
import type { CampoDetalle } from "@/components/listado-solo-lectura"
import type { TableColumn } from "@/components/ui/data-table"
import { Etiqueta } from "@/components/ui/etiqueta"
import { useEstadosProcesoDestruccion } from "@/hooks/use-estado-proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"
import { ESTADO_COLORS_PROCESO_DESTRUCCION } from "@/lib/utils/estados"

const columnas: TableColumn<EstadoProcesoDestruccion>[] = [
  { key: "nombre", header: "Nombre", cell: (e) => <Etiqueta texto={e.nombre} colors={ESTADO_COLORS_PROCESO_DESTRUCCION} /> },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (e) => <span className="text-sm text-muted-foreground">{e.descripcion}</span>,
  },
]

const detalle: CampoDetalle<EstadoProcesoDestruccion>[] = [
  { etiqueta: "Nombre", valor: (e) => <Etiqueta texto={e.nombre} colors={ESTADO_COLORS_PROCESO_DESTRUCCION} /> },
  { etiqueta: "Descripción", valor: (e) => e.descripcion },
]

export default function EstadoProcesoDestruccionPage() {
  const { estados, isLoading } = useEstadosProcesoDestruccion()

  return (
    <ListadoSoloLectura<EstadoProcesoDestruccion>
      titulo="Estados de Proceso de Destrucción"
      descripcion="Estados por los que pasa un proceso de destrucción hasta finalizar."
      aviso="Estos estados los usa el sistema por su nombre exacto, por eso no se pueden crear, editar ni dar de baja."
      filas={estados}
      cargando={isLoading}
      columnas={columnas}
      detalle={detalle}
      textoBusqueda={(e) => `${e.nombre} ${e.descripcion ?? ""}`}
      placeholderBusqueda="Buscar por nombre o descripción..."
      nombreFila={(e) => e.nombre}
      singular="estado"
      plural="estados"
    />
  )
}
