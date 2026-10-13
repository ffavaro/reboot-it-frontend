"use client"

import * as React from "react"
import { Check, Eye, FileDown, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  onDownload?: (row: T) => void
  isDeleting?: boolean
}

function ActionBtn({
  label,
  onClick,
  icon,
  variant = "ghost",
  className,
  disabled,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
  variant?: "ghost" | "outline" | "destructive"
  className?: string
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={variant}
            className={`h-7 w-7 p-0 ${className ?? ""}`}
            onClick={onClick}
            disabled={disabled}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
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
  onDownload,
  isDeleting,
}: DataTableProps<T>) {
  const [deletingId, setDeletingId] = React.useState<number | string | null>(null)
  const hasActions = !!onView || !!onEdit || !!onDelete || !!onDownload
  const colSpan = columns.length + (hasActions ? 1 : 0)

  async function handleConfirmDelete(id: number | string) {
    await onDelete?.(id)
    setDeletingId(null)
  }

  return (
    <TooltipProvider>
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
                      <div className="flex items-center justify-end gap-1">
                        {deletingId === row.id ? (
                          <>
                            <span className="text-xs text-muted-foreground mr-1">¿Eliminar?</span>
                            <ActionBtn
                              label="Confirmar"
                              variant="destructive"
                              icon={<Check className="h-3.5 w-3.5" />}
                              onClick={() => handleConfirmDelete(row.id)}
                              disabled={isDeleting}
                            />
                            <ActionBtn
                              label="Cancelar"
                              icon={<X className="h-3.5 w-3.5" />}
                              onClick={() => setDeletingId(null)}
                            />
                          </>
                        ) : (
                          <>
                            {onView && (
                              <ActionBtn
                                label="Ver"
                                icon={<Eye className="h-3.5 w-3.5" />}
                                onClick={() => onView(row)}
                              />
                            )}
                            {onEdit && (
                              <ActionBtn
                                label="Editar"
                                variant="outline"
                                icon={<Pencil className="h-3.5 w-3.5" />}
                                onClick={() => onEdit(row)}
                              />
                            )}
                            {onDownload && (
                              <ActionBtn
                                label="Descargar PDF"
                                variant="outline"
                                icon={<FileDown className="h-3.5 w-3.5" />}
                                onClick={() => onDownload(row)}
                              />
                            )}
                            {onDelete && (
                              <ActionBtn
                                label="Eliminar"
                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingId(row.id)}
                              />
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
    </TooltipProvider>
  )
}
