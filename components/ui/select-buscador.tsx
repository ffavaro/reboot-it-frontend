"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type OpcionBuscador = { value: string; label: string; detalle?: string }

/**
 * Selector de formulario con buscador, para listas largas (por ejemplo, los donantes). Se ve como un campo más del
 * formulario: se escribe para filtrar y se elige una sola opción.
 */
export function SelectBuscador({
  opciones, value, onChange, placeholder = "Seleccionar...", placeholderBusqueda = "Buscar…", disabled, className, ...props
}: {
  opciones: OpcionBuscador[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  placeholderBusqueda?: string
  disabled?: boolean
  className?: string
  "aria-label"?: string
}) {
  const [abierto, setAbierto] = React.useState(false)
  const [consulta, setConsulta] = React.useState("")
  const elegida = opciones.find((o) => o.value === value)

  const filtradas = React.useMemo(() => {
    const q = consulta.trim().toLowerCase()
    return q ? opciones.filter((o) => `${o.label} ${o.detalle ?? ""}`.toLowerCase().includes(q)) : opciones
  }, [opciones, consulta])

  return (
    <Popover open={abierto} onOpenChange={(siguiente) => { if (!disabled) { setAbierto(siguiente); if (!siguiente) setConsulta("") } }}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            aria-label={props["aria-label"]}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              !elegida && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span className="truncate">{elegida ? elegida.label : placeholder}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-[var(--anchor-width)] min-w-64 p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder={placeholderBusqueda}
            className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto" role="listbox">
          {filtradas.length === 0 ? (
            <li className="px-2 py-3 text-center text-xs text-muted-foreground">Sin resultados</li>
          ) : (
            filtradas.map((o) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setAbierto(false); setConsulta("") }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <Check className={cn("size-3.5 shrink-0", o.value === value ? "opacity-100" : "opacity-0")} aria-hidden />
                  <span className="truncate">{o.label}</span>
                  {o.detalle && <span className="ml-auto shrink-0 truncate text-xs text-muted-foreground">{o.detalle}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
