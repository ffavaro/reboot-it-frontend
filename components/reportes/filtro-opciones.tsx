"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface Opcion {
  valor: string
  etiqueta: string
}

interface FiltroOpcionesProps {
  etiqueta: string
  todos: string
  valor: string
  opciones: Opcion[]
  onCambio: (valor: string) => void
}

export function FiltroOpciones({ etiqueta, todos, valor, opciones, onCambio }: FiltroOpcionesProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{etiqueta}</span>
      <Select value={valor} onValueChange={(v) => onCambio(v ?? "")}
        items={[
          { value: "", label: todos },
          ...opciones.map((o) => ({ value: o.valor, label: o.etiqueta })),
        ]}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={todos} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{todos}</SelectItem>
          {opciones.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export const idComoTexto = (id: number | undefined) => (id ? String(id) : "")
export const textoComoId = (valor: string) => (valor ? Number(valor) : undefined)
export const boolComoTexto = (b: boolean | undefined) => (b === undefined ? "" : b ? "si" : "no")
export const textoComoBool = (valor: string) => (valor === "" ? undefined : valor === "si")

export function etiquetaDe(opciones: Opcion[], valor: string | number | undefined) {
  if (valor === undefined || valor === "") return null
  return opciones.find((o) => o.valor === String(valor))?.etiqueta ?? null
}
