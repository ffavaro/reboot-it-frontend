"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SelectorDonantesProps } from "@/lib/type/dashboard"


export function SelectorDonantes({ opciones, elegidos, onCambio }: SelectorDonantesProps) {
  const [texto, setTexto] = useState("")
  const conjunto = useMemo(() => new Set(elegidos), [elegidos])
  const ordenadas = useMemo(() => [...opciones].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")), [opciones])
  const filtradas = useMemo(() => {
    const q = texto.trim().toLowerCase()
    return q ? ordenadas.filter((o) => o.nombre.toLowerCase().includes(q)) : ordenadas
  }, [ordenadas, texto])

  const resumen =
    elegidos.length === 0
      ? "Todos los donantes"
      : elegidos.length === 1
        ? (opciones.find((o) => o.id === elegidos[0])?.nombre ?? "1 donante")
        : `${elegidos.length} donantes`

  const alternar = (id: number) => onCambio(conjunto.has(id) ? elegidos.filter((e) => e !== id) : [...elegidos, id])

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Filtrar por donantes"
            className={cn(
              "inline-flex h-8 max-w-56 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors",
              elegidos.length ? "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "border-border text-muted-foreground hover:bg-muted",
            )}
          />
        }
      >
        <span className="truncate">{resumen}</span>
        <ChevronDown className="size-3.5 shrink-0" />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-72 p-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar donante…"
          className="mb-2 h-8 w-full rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <ul role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto">
          {filtradas.length === 0 && <li className="px-2 py-3 text-center text-xs text-muted-foreground">Sin coincidencias</li>}
          {filtradas.map((o) => {
            const activo = conjunto.has(o.id)
            return (
              <li key={o.id} role="option" aria-selected={activo}>
                <button
                  type="button"
                  onClick={() => alternar(o.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border", activo ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                    {activo && <Check className="size-3" />}
                  </span>
                  <span className="truncate">{o.nombre}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {elegidos.length > 0 && (
          <button
            type="button"
            onClick={() => onCambio([])}
            className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-border py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <X className="size-3" />
            Quitar selección
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
