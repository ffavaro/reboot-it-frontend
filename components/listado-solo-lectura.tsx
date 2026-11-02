"use client"

import { useMemo, useState } from "react"
import { Info } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"

export interface CampoDetalle<T> {
  etiqueta: string
  valor: (fila: T) => React.ReactNode
}

interface ListadoSoloLecturaProps<T extends { id: number | string }> {
  titulo: string
  descripcion: string
  aviso: string
  filas: T[]
  cargando: boolean
  columnas: TableColumn<T>[]
  detalle: CampoDetalle<T>[]
  textoBusqueda: (fila: T) => string
  placeholderBusqueda: string
  nombreFila: (fila: T) => string
  singular: string
  plural: string
}

export function ListadoSoloLectura<T extends { id: number | string }>({
  titulo,
  descripcion,
  aviso,
  filas,
  cargando,
  columnas,
  detalle,
  textoBusqueda,
  placeholderBusqueda,
  nombreFila,
  singular,
  plural,
}: ListadoSoloLecturaProps<T>) {
  const [busqueda, setBusqueda] = useState("")
  const [seleccionada, setSeleccionada] = useState<T | null>(null)

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return filas
    return filas.filter((f) => textoBusqueda(f).toLowerCase().includes(termino))
  }, [filas, busqueda, textoBusqueda])

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </header>

      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{aviso}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder={placeholderBusqueda}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {visibles.length} {visibles.length === 1 ? singular : plural}
        </span>
      </div>

      <DataTable
        data={visibles}
        columns={columnas}
        isLoading={cargando}
        loadingText={`Cargando ${plural}...`}
        emptyText={`No hay ${plural} registrados.`}
        emptySearchText={`Ningún ${singular} coincide con la búsqueda.`}
        search={busqueda}
        onView={setSeleccionada}
      />

      <FormModal
        open={seleccionada !== null}
        onOpenChange={(abierto) => !abierto && setSeleccionada(null)}
        title={seleccionada ? nombreFila(seleccionada) : ""}
        description="Solo consulta"
        readOnly
      >
        {seleccionada && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm">
            {detalle.map((campo) => (
              <div key={campo.etiqueta} className="contents">
                <dt className="font-medium text-muted-foreground">{campo.etiqueta}</dt>
                <dd>{campo.valor(seleccionada)}</dd>
              </div>
            ))}
          </dl>
        )}
      </FormModal>
    </div>
  )
}
