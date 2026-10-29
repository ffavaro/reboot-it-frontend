"use client"

import { useMemo, useState } from "react"
import { Responsive, useContainerWidth, type Layout, type LayoutItem } from "react-grid-layout"
import { GripVertical, LayoutGrid, RotateCcw } from "lucide-react"
import "react-grid-layout/css/styles.css"
import { getUser } from "@/lib/auth-utils"

export interface ItemGrilla {
  id: string
  // tamaño inicial: ancho en columnas (de 12) y alto en filas
  w: number
  h: number
  nodo: React.ReactNode
}

type Posicion = { x: number; y: number; w: number; h: number }
type Guardado = Record<string, Posicion>

const COLUMNAS = 12
const ALTO_FILA = 20
const MARGEN: [number, number] = [12, 12]
const MIN_W = 3
const MIN_H = 6
const MAX_H = 30
// Por debajo de este ancho los gráficos van en una sola columna y no se reacomodan
const BREAKPOINTS = { lg: 900, sm: 0 }
const COLS = { lg: COLUMNAS, sm: 1 }

// La disposición es de cada usuario y se guarda en este navegador
const claveGuardado = () => `dashboard-graficos-v2:${getUser()?.id ?? "anonimo"}`

function leerGuardado(): Guardado {
  try {
    const crudo = localStorage.getItem(claveGuardado())
    return crudo ? (JSON.parse(crudo) as Guardado) : {}
  } catch {
    return {}
  }
}

function escribirGuardado(g: Guardado | null) {
  try {
    if (g === null) localStorage.removeItem(claveGuardado())
    else localStorage.setItem(claveGuardado(), JSON.stringify(g))
  } catch { /* sin almacenamiento: la disposición dura mientras la página esté abierta */ }
}

// Disposición inicial: los gráficos se acomodan de izquierda a derecha, en el orden recibido
function disposicionInicial(items: ItemGrilla[]): LayoutItem[] {
  let x = 0, y = 0, altoFila = 0
  return items.map((it) => {
    if (x + it.w > COLUMNAS) { x = 0; y += altoFila; altoFila = 0 }
    const pos = { i: it.id, x, y, w: it.w, h: it.h, minW: MIN_W, minH: MIN_H, maxH: MAX_H }
    x += it.w
    altoFila = Math.max(altoFila, it.h)
    return pos
  })
}

function disposicionUsuario(items: ItemGrilla[], guardado: Guardado): LayoutItem[] {
  const base = disposicionInicial(items)
  const conGuardado = base.map((b) => (guardado[b.i] ? { ...b, ...guardado[b.i] } : b))
  // Los gráficos que no estaban guardados (nuevos para este usuario) van al final
  const fin = Math.max(0, ...conGuardado.filter((b) => guardado[b.i]).map((b) => b.y + b.h))
  return conGuardado.map((b) => (guardado[b.i] ? b : { ...b, y: fin + b.y }))
}

const disposicionColumna = (items: ItemGrilla[]): LayoutItem[] =>
  items.map((it, n) => ({ i: it.id, x: 0, y: n * 10, w: 1, h: it.h }))

/**
 * Los gráficos del dashboard en una grilla: cada usuario puede moverlos y cambiarles el tamaño con
 * "Organizar gráficos", y la disposición queda guardada para su próxima visita.
 */
export function GrillaGraficos({ items }: { items: ItemGrilla[] }) {
  const { width, containerRef, mounted } = useContainerWidth()
  const [editando, setEditando] = useState(false)
  const [guardado, setGuardado] = useState<Guardado>(() => (typeof window === "undefined" ? {} : leerGuardado()))
  const [columnaUnica, setColumnaUnica] = useState(false)

  const layouts = useMemo(
    () => ({ lg: disposicionUsuario(items, guardado), sm: disposicionColumna(items) }),
    [items, guardado],
  )

  // Solo se guarda cuando el usuario suelta un gráfico o termina de cambiarle el tamaño
  function alSoltar(actual: Layout) {
    if (!editando || columnaUnica) return
    const siguiente = { ...guardado }
    for (const l of actual) siguiente[l.i] = { x: l.x, y: l.y, w: l.w, h: l.h }
    escribirGuardado(siguiente)
    setGuardado(siguiente)
  }

  function restablecer() {
    escribirGuardado(null)
    setGuardado({})
  }

  const puedeOrganizar = !columnaUnica
  const organizando = editando && puedeOrganizar

  return (
    <section aria-labelledby="titulo-graficos" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="titulo-graficos" className="text-base font-medium text-foreground">Gráficos</h2>
          <p className="text-xs text-muted-foreground">
            {organizando
              ? "Arrastrá cada gráfico para moverlo y tirá de la esquina inferior derecha para cambiar su tamaño."
              : "Acomodalos como te quede más cómodo con “Organizar gráficos”; la disposición queda guardada para tu usuario."}
          </p>
        </div>
        {puedeOrganizar && (
          <div className="flex gap-2">
            {editando && (
              <button
                type="button"
                onClick={restablecer}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                Disposición original
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              aria-pressed={editando}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                editando
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              {editando ? "Listo" : "Organizar gráficos"}
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef}>
        {mounted && (
          <Responsive
            width={width}
            layouts={layouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ALTO_FILA}
            margin={MARGEN}
            containerPadding={[0, 0]}
            dragConfig={{ enabled: organizando, handle: ".asa-grafico" }}
            resizeConfig={{ enabled: organizando }}
            onBreakpointChange={(bp) => setColumnaUnica(bp === "sm")}
            onDragStop={alSoltar}
            onResizeStop={alSoltar}
          >
            {items.map((it) => (
              <div key={it.id} className="relative">
                {organizando && (
                  <div className="asa-grafico absolute inset-x-0 top-0 z-10 flex h-7 cursor-grab items-center justify-center rounded-t-xl bg-primary/10 text-primary active:cursor-grabbing" title="Arrastrar para mover">
                    <GripVertical className="size-4 rotate-90" aria-hidden />
                  </div>
                )}
                {/* Mientras se organiza, el gráfico no recibe clics: así no estorban los tooltips ni los filtros */}
                <div className={`h-full overflow-auto rounded-xl [&>*]:h-full ${organizando ? "pointer-events-none select-none pt-7 ring-2 ring-primary/30" : ""}`}>
                  {it.nodo}
                </div>
              </div>
            ))}
          </Responsive>
        )}
      </div>

      {/* El hueco que muestra dónde va a quedar el gráfico al soltarlo */}
      <style>{`
        .react-grid-item.react-grid-placeholder {
          background: color-mix(in oklab, var(--primary) 25%, transparent);
          border-radius: 0.75rem;
          opacity: 1;
        }
        .react-grid-item.react-draggable-dragging { z-index: 30; box-shadow: 0 10px 30px rgb(0 0 0 / 0.18); cursor: grabbing; }
      `}</style>
    </section>
  )
}
