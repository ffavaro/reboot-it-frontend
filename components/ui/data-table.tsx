"use client"

import * as React from "react"
import { Eye, FileDown, Pencil, Trash2 } from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { InboxIcon, SearchRemoveIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

function DeleteButton({
  onConfirm,
  isDeleting,
}: {
  onConfirm: () => void
  isDeleting?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            aria-label="Eliminar"
            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-64">
        <p className="text-sm font-medium">¿Eliminar este registro?</p>
        <p className="mt-1 text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={async () => {
              await onConfirm()
              setOpen(false)
            }}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
  const hasActions = !!onView || !!onEdit || !!onDelete || !!onDownload
  const colSpan = columns.length + (hasActions ? 1 : 0)

  return (
    <TooltipProvider>
      <div className="rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
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
                <TableCell colSpan={colSpan} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <HugeiconsIcon
                      icon={search ? SearchRemoveIcon : InboxIcon}
                      strokeWidth={1.5}
                      className="size-8 text-muted-foreground/40"
                    />
                    <span className="text-sm">{search ? emptySearchText : emptyText}</span>
                  </div>
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
                        {onView && (
                          <ActionBtn
                            label="Ver"
                            icon={<Eye className="h-3.5 w-3.5" />}
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                            onClick={() => onView(row)}
                          />
                        )}
                        {onEdit && (
                          <ActionBtn
                            label="Editar"
                            variant="outline"
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
                            onClick={() => onEdit(row)}
                          />
                        )}
                        {onDownload && (
                          <ActionBtn
                            label="Descargar PDF"
                            variant="outline"
                            icon={<FileDown className="h-3.5 w-3.5" />}
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                            onClick={() => onDownload(row)}
                          />
                        )}
                        {onDelete && (
                          <DeleteButton
                            onConfirm={() => onDelete(row.id)}
                            isDeleting={isDeleting}
                          />
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
