"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { AccionPermiso, Alcance, PermisoMatriz } from "@/lib/type/permisos"

const ACCIONES: { clave: AccionPermiso; letra: string; titulo: string }[] = [
  { clave: "ver", letra: "V", titulo: "Ver" },
  { clave: "crear", letra: "C", titulo: "Crear" },
  { clave: "editar", letra: "E", titulo: "Editar" },
  { clave: "baja", letra: "B", titulo: "Baja lógica / anulación" },
]

export const OPCIONES_ALCANCE: { valor: Alcance; etiqueta: string; descripcion: string }[] = [
  { valor: "NINGUNO", etiqueta: "—", descripcion: "Sin acceso" },
  { valor: "PLENO", etiqueta: "✔", descripcion: "Acceso pleno" },
  { valor: "PROPIO", etiqueta: "P", descripcion: "Solo lo propio" },
  { valor: "ASIGNADO", etiqueta: "A", descripcion: "Solo lo asignado" },
  { valor: "LIMITADO", etiqueta: "L", descripcion: "Limitado (ver notas)" },
]

const COLOR: Record<Alcance, string> = {
  NINGUNO: "bg-muted/50 text-muted-foreground",
  PLENO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PROPIO: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  ASIGNADO: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  LIMITADO: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
}

type Props = {
  permisos: PermisoMatriz[]
  onChange: (permisos: PermisoMatriz[]) => void
  readOnly?: boolean
}

/** Matriz de permisos de un rol: una fila por pantalla y una columna por acción (V / C / E / B). */
export function MatrizPermisos({ permisos, onChange, readOnly = false }: Props) {
  function cambiar(pantallaId: number, accion: AccionPermiso, valor: Alcance) {
    onChange(permisos.map((p) => (p.pantallaId === pantallaId ? { ...p, [accion]: valor } : p)))
  }

  // Agrupa por sección conservando el orden en que vienen
  const secciones: { nombre: string; filas: PermisoMatriz[] }[] = []
  for (const p of permisos) {
    const ultima = secciones[secciones.length - 1]
    if (ultima && ultima.nombre === p.seccion) ultima.filas.push(p)
    else secciones.push({ nombre: p.seccion, filas: [p] })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {OPCIONES_ALCANCE.map((o) => (
          <span key={o.valor} className="inline-flex items-center gap-1.5">
            <span className={cn("inline-flex size-5 items-center justify-center rounded font-semibold", COLOR[o.valor])}>{o.etiqueta}</span>
            {o.descripcion}
          </span>
        ))}
      </div>

      <div className="max-h-[55vh] overflow-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Pantalla</th>
              {ACCIONES.map((a) => (
                <th key={a.clave} className="w-16 px-1 py-2 text-center font-medium" title={a.titulo}>{a.letra}</th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Notas</th>
            </tr>
          </thead>
          <tbody>
            {secciones.map((s) => (
              <React.Fragment key={s.nombre}>
                <tr className="bg-muted/40">
                  <td colSpan={6} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.nombre}</td>
                </tr>
                {s.filas.map((p) => (
                  <tr key={p.pantallaId} className="border-t">
                    <td className="px-3 py-1.5 font-medium">{p.nombre}</td>
                    {ACCIONES.map((a) => (
                      <td key={a.clave} className="px-1 py-1 text-center">
                        <select
                          value={p[a.clave]}
                          disabled={readOnly}
                          onChange={(e) => cambiar(p.pantallaId, a.clave, e.target.value as Alcance)}
                          aria-label={`${p.nombre}: ${a.titulo}`}
                          className={cn(
                            "h-7 w-14 cursor-pointer appearance-none rounded text-center text-xs font-semibold focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default",
                            COLOR[p[a.clave]],
                          )}
                        >
                          {OPCIONES_ALCANCE.map((o) => (
                            <option key={o.valor} value={o.valor}>{o.etiqueta} {o.descripcion}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                    <td className="max-w-xs px-3 py-1.5 text-muted-foreground" title={p.notas ?? undefined}>
                      <span className="line-clamp-2">{p.notas ?? ""}</span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
