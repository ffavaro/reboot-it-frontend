"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type MultiSelectOption = { value: number; label: string }

type MultiSelectProps = {
  options: MultiSelectOption[]
  value: number[]
  onChange: (value: number[]) => void
  // Texto cuando no hay nada elegido (equivale a "todos")
  placeholder?: string
  // Nombre en plural para el resumen: "3 donantes"
  pluralLabel?: string
  searchPlaceholder?: string
  // Selección única: elegir una opción reemplaza a la anterior y cierra la lista
  single?: boolean
  className?: string
  "aria-label"?: string
}

// Selector múltiple con buscador, pensado para listas largas (cientos de donantes).
export function MultiSelect({
  options, value, onChange, placeholder = "Todos", pluralLabel = "seleccionados",
  searchPlaceholder = "Buscar…", single = false, className, ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const seleccion = React.useMemo(() => new Set(value), [value])
  const filtradas = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options
  }, [options, query])

  function alternar(v: number) {
    if (single) {
      onChange(seleccion.has(v) ? [] : [v])
      setOpen(false)
      setQuery("")
      return
    }
    onChange(seleccion.has(v) ? value.filter(x => x !== v) : [...value, v])
  }

  const resumen = value.length === 0
    ? placeholder
    : value.length === 1
      ? (options.find(o => o.value === value[0])?.label ?? `1 ${pluralLabel.replace(/s$/, "")}`)
      : `${value.length} ${pluralLabel}`

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery("") }}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={props["aria-label"]}
            className={cn(
              "inline-flex items-center gap-1.5 max-w-[220px] text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring",
              value.length > 0 && "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300",
              className,
            )}
          />
        }
      >
        <span className="truncate">{resumen}</span>
        <ChevronDown className="size-3.5 shrink-0" />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-72 p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <ul className="max-h-60 overflow-y-auto" role="listbox" aria-multiselectable={!single}>
          {filtradas.length === 0 ? (
            <li className="px-2 py-3 text-center text-xs text-muted-foreground">Sin resultados</li>
          ) : filtradas.map(o => {
            const marcado = seleccion.has(o.value)
            return (
              <li key={o.value} role="option" aria-selected={marcado}>
                <button
                  type="button"
                  onClick={() => alternar(o.value)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <span className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    marcado ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}>
                    {marcado && <Check className="size-3" />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
          <span className="text-muted-foreground">
            {value.length === 0 ? "Todos incluidos" : `${value.length} ${pluralLabel}`}
          </span>
          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-primary hover:underline">
              Limpiar
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
