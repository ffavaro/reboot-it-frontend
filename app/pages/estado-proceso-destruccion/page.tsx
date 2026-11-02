"use client"

import { ListadoSoloLectura } from "@/components/listado-solo-lectura"
import type { CampoDetalle } from "@/components/listado-solo-lectura"
import type { TableColumn } from "@/components/ui/data-table"
import { useEstadosProcesoDestruccion } from "@/hooks/use-estado-proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"

const TONOS: Record<string, string> = {
  iniciado: "bg-blue-100 text-blue-800",
  pendiente: "bg-yellow-100 text-yellow-800",
  finalizado: "bg-green-100 text-green-800",
}

function Etiqueta({ texto }: { texto: string }) {
  const tono = TONOS[texto.trim().toLowerCase()] ?? "bg-gray-100 text-gray-800"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tono}`}>{texto}</span>
}

const SinDato = () => <span className="italic text-muted-foreground">—</span>

const columnas: TableColumn<EstadoProcesoDestruccion>[] = [
  { key: "nombre", header: "Nombre", cell: (e) => <Etiqueta texto={e.nombre} /> },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (e) => (e.descripcion ? <span className="text-sm text-muted-foreground">{e.descripcion}</span> : <SinDato />),
  },
]

const detalle: CampoDetalle<EstadoProcesoDestruccion>[] = [
  { etiqueta: "Nombre", valor: (e) => <Etiqueta texto={e.nombre} /> },
  { etiqueta: "Descripción", valor: (e) => e.descripcion || <SinDato /> },
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
