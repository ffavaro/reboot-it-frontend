"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Eye, FileDown, Pencil, Trash2 } from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { InboxIcon, SearchRemoveIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { usePermisosPantalla } from "@/components/permisos-pantalla"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export type TableColumn<T> = {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
  // Valor por el que se ordena la columna; si no se indica se toma el texto que muestra la celda
  sortValue?: (row: T) => string | number | null | undefined
  // false desactiva el ordenamiento de la columna (por defecto se puede ordenar)
  sortable?: boolean
}

// Texto visible de un nodo de React, para poder ordenar columnas cuyas celdas son componentes
function textoDeNodo(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textoDeNodo).join(" ")
  if (React.isValidElement(node)) return textoDeNodo((node.props as { children?: React.ReactNode }).children)
  return ""
}

function claveOrden(valor: string | number | null | undefined): string | number {
  if (valor === null || valor === undefined) return ""
  if (typeof valor === "number") return valor
  const texto = valor.trim()
  const fecha = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/)
  if (fecha) return `${fecha[3]}${fecha[2]}${fecha[1]}${fecha[4]}`
  return texto
}

function compararValores(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" })
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
  // Textos del botón de baja (por defecto "Eliminar"); sirven para acciones como "Desactivar"
  deleteTexts?: { accion: string; pregunta: string; detalle: string; enCurso: string }
  // Permiten ocultar editar o dar de baja en filas puntuales (por ejemplo, un registro ya desactivado)
  showEdit?: (row: T) => boolean
  showDelete?: (row: T) => boolean
  onDownload?: (row: T) => void
  isDeleting?: boolean
  pageSizeOptions?: number[]
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

const TEXTOS_ELIMINAR = { accion: "Eliminar", pregunta: "¿Eliminar este registro?", detalle: "Esta acción no se puede deshacer.", enCurso: "Eliminando..." }

function DeleteButton({
  onConfirm,
  isDeleting,
  texts = TEXTOS_ELIMINAR,
}: {
  onConfirm: () => void
  isDeleting?: boolean
  texts?: typeof TEXTOS_ELIMINAR
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            aria-label={texts.accion}
            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-64">
        <p className="text-sm font-medium">{texts.pregunta}</p>
        <p className="mt-1 text-xs text-muted-foreground">{texts.detalle}</p>
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
            {isDeleting ? texts.enCurso : texts.accion}
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
  onEdit: onEditProp,
  onDelete: onDeleteProp,
  deleteTexts,
  showEdit,
  showDelete,
  onDownload,
  isDeleting,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTableProps<T>) {
  // Editar y dar de baja solo se ofrecen si el rol tiene ese permiso sobre la pantalla
  const permisos = usePermisosPantalla()
  const onEdit = permisos.puede("editar") ? onEditProp : undefined
  const onDelete = permisos.puede("baja") ? onDeleteProp : undefined
  const hasActions = !!onView || !!onEdit || !!onDelete || !!onDownload
  const colSpan = columns.length + (hasActions ? 1 : 0)

  const [pageSize, setPageSize] = React.useState(pageSizeOptions[0] ?? 10)
  const [page, setPage] = React.useState(1)

  const [orden, setOrden] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(null)

  function alternarOrden(key: string) {
    setOrden((actual) => {
      if (!actual || actual.key !== key) return { key, dir: "asc" }
      return actual.dir === "asc" ? { key, dir: "desc" } : null
    })
    setPage(1)
  }

  const datosOrdenados = React.useMemo(() => {
    const col = orden ? columns.find((c) => c.key === orden.key) : undefined
    if (!orden || !col) return data
    const valor = (row: T) => claveOrden(col.sortValue ? col.sortValue(row) : textoDeNodo(col.cell(row)))
    const factor = orden.dir === "asc" ? 1 : -1
    return data
      .map((row, i) => ({ row, i, v: valor(row) }))
      .sort((x, y) => {
        // Los vacíos van siempre al final
        if (x.v === "" && y.v !== "") return 1
        if (y.v === "" && x.v !== "") return -1
        return factor * compararValores(x.v, y.v) || x.i - y.i
      })
      .map((x) => x.row)
  }, [data, columns, orden])

  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Si cambia la búsqueda o el resultado filtrado deja de tener tantas páginas, volvemos a una válida
  React.useEffect(() => { setPage(1) }, [search])
  React.useEffect(() => { setPage((p) => Math.min(p, totalPages)) }, [totalPages])

  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pagedData = datosOrdenados.slice(startIndex, startIndex + pageSize)
  const rangeStart = totalItems === 0 ? 0 : startIndex + 1
  const rangeEnd = Math.min(startIndex + pageSize, totalItems)

  return (
    <TooltipProvider>
      <div className="rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.headerClassName}>
                  {col.sortable === false || !col.header ? (
                    col.header
                  ) : (
                    <button
                      type="button"
                      onClick={() => alternarOrden(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      title="Ordenar por esta columna"
                    >
                      {col.header}
                      {orden?.key === col.key ? (
                        orden.dir === "asc" ? <ArrowUp className="h-3 w-3" aria-label="Orden ascendente" /> : <ArrowDown className="h-3 w-3" aria-label="Orden descendente" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />
                      )}
                    </button>
                  )}
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
              pagedData.map((row) => (
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
                        {onEdit && (showEdit ? showEdit(row) : true) && (
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
                        {onDelete && (showDelete ? showDelete(row) : true) && (
                          <DeleteButton
                            onConfirm={() => onDelete(row.id)}
                            isDeleting={isDeleting}
                            texts={deleteTexts}
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

        {!isLoading && totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrando {rangeStart}–{rangeEnd} de {totalItems}</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => { setPageSize(Number(val)); setPage(1) }}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size} por página</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
