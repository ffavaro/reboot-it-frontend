"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TableColumn } from "@/components/ui/data-table"

/**
 * Valor de una celda que filtra la grilla al hacerle clic (y lo saca al volver a hacerle clic).
 * Se usa en lugar de un filtro aparte: tocás la palabra y la grilla se acota.
 */
export function FiltroCelda({ activo, onClick, titulo, children }: { activo: boolean; onClick: () => void; titulo?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={titulo ?? (activo ? "Quitar este filtro" : "Filtrar por este valor")}
      aria-pressed={activo}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        "max-w-full rounded-md text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        activo && "bg-primary/10 ring-1 ring-primary/60",
      )}
    >
      {children}
    </button>
  )
}

export interface FiltroActivo {
  etiqueta: string
  valor: string
  quitar: () => void
}

/** Fichas con los filtros aplicados; cada una se puede quitar y hay un botón para limpiarlas todas. */
export function FiltrosActivos({ filtros, onLimpiar }: { filtros: FiltroActivo[]; onLimpiar: () => void }) {
  if (filtros.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      <span className="text-xs text-muted-foreground">Filtrando por:</span>
      {filtros.map((f) => (
        <button
          key={f.etiqueta}
          type="button"
          onClick={f.quitar}
          title="Quitar este filtro"
          className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-primary/20"
        >
          {f.etiqueta}: {f.valor}
          <X className="size-3" aria-hidden />
        </button>
      ))}
      {filtros.length > 1 && (
        <button type="button" onClick={onLimpiar} className="px-1 text-xs text-muted-foreground hover:text-foreground">
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  )
}

export interface ReglaFiltroColumna<T> {
  // ¿esta fila tiene el valor filtrado en esta columna?
  activo: (fila: T) => boolean
  // clic en el valor: activa el filtro (o lo quita si ya estaba)
  alternar: (fila: T) => void
}

/** Convierte en "filtrables" las columnas indicadas: el valor de cada celda pasa a filtrar al hacerle clic. */
export function columnasFiltrables<T>(columnas: TableColumn<T>[], reglas: Record<string, ReglaFiltroColumna<T>>): TableColumn<T>[] {
  return columnas.map((col) => {
    const regla = reglas[col.key]
    if (!regla) return col
    return {
      ...col,
      cell: (fila: T) => (
        <FiltroCelda activo={regla.activo(fila)} onClick={() => regla.alternar(fila)}>
          {col.cell(fila)}
        </FiltroCelda>
      ),
    }
  })
}
