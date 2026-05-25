"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type TableColumn<T> = {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

type DataTableProps<T extends { id: number | string }> = {
  data: T[]
  columns: TableColumn<T>[]
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  emptySearchText?: string
  search?: string
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (id: number | string) => void
  isDeleting?: boolean
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  isLoading,
  loadingText = "Cargando...",
  emptyText = "No hay registros.",
  emptySearchText = "No se encontraron resultados con ese criterio.",
  search,
  onView,
  onEdit,
  onDelete,
  isDeleting,
}: DataTableProps<T>) {
  const [deletingId, setDeletingId] = React.useState<number | string | null>(null)
  const hasActions = !!onView || !!onEdit || !!onDelete
  const colSpan = columns.length + (hasActions ? 1 : 0)

  async function handleConfirmDelete(id: number | string) {
    await onDelete?.(id)
    setDeletingId(null)
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
            {hasActions && (
              <TableHead className="text-right">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-12 text-center text-muted-foreground">
                {loadingText}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-12 text-center text-muted-foreground">
                {search ? emptySearchText : emptyText}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === row.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => handleConfirmDelete(row.id)}
                            disabled={isDeleting}
                          >
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          {onView && (
                            <Button size="xs" variant="ghost" onClick={() => onView(row)}>
                              Ver
                            </Button>
                          )}
                          {onEdit && (
                            <Button size="xs" variant="outline" onClick={() => onEdit(row)}>
                              Editar
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              size="xs"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(row.id)}
                            >
                              Eliminar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
