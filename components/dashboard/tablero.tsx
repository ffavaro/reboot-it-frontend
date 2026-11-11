import { CSSProperties, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Responsive, useContainerWidth, type Layout, type LayoutItem } from 'react-grid-layout'
import { Disposicion, Tarjeta } from "@/lib/type/dashboard";
import { getUser } from "@/lib/auth-utils";
import { Move, LayoutGrid, Undo2, X, Plus, GripVertical } from "lucide-react"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const COLUMNAS = 12;
const FILA_PX = 20;
const ESPACIO: [number, number] = [12, 12];
const LIMITES = { minW: 3, minH: 6, maxH: 30 }
const CORTES = { amplio: 900, angosto: 0 };
const COLS = { amplio: COLUMNAS, angosto: 1 }
const soltando = "soltando";

function leerJSON<T>(clave: string, vacio: T): T {
  if (typeof window === "undefined") return vacio;
  try {
    return (JSON.parse(localStorage.getItem(clave) ?? "null") as T) ?? vacio;
  } catch (error) {
    return vacio;
  }
}

function escribirJSON(clave: string, valor: unknown | null) {
  try {
    if (valor) localStorage.setItem(clave, JSON.stringify(valor))
    else localStorage.removeItem(clave);
  } catch (error) {
    return;
  }
}

function fondoDeColumnas(ancho: number): CSSProperties {
  const [mx] = ESPACIO;
  const col = (ancho - mx * (COLUMNAS - 1)) / COLUMNAS;
  if (col <= 0) return {};
  const tono = "color-mix(in oklab, var(--foreground) 4%, transparent)";
  return {
    backgroundImage: `linear-gradient(to right, ${tono} ${col}px, transparent ${col}px)`,
    backgroundSize: `${col + mx}px 100%`,
    borderRadius: "0.75rem",
  };
}

const claveBase = () => `tablero-reboot-v2:${getUser()?.id ?? "invitado"}`;

const almacen = {
  leer: (): Disposicion => leerJSON<Disposicion>(claveBase(), {}),
  guardar: (d: Disposicion | null) => escribirJSON(claveBase(), d)
}

const almacenOcultas = {
  leer: (): string[] => leerJSON<string[]>(`${claveBase()}:ocultas`, []),
  guardar: (ids: string[] | null) => escribirJSON(`${claveBase()}:ocultas`, ids && ids.length ? ids : null),
}

const nombreDe = (t: Tarjeta) => t.titulo;

export const enFilas = (tarjetas: Tarjeta[]): LayoutItem[] => {
  const resultado: LayoutItem[] = [];
  let x = 0;
  let y = 0;
  let altoFila = 0;
  for (const t of tarjetas) {
    if (x + t.ancho > COLUMNAS) {
      x = 0;
      y += altoFila
      altoFila = 0;
    }
    resultado.push({
      i: t.id, x, y, w: t.ancho, h: t.alto, ...LIMITES,
      minW: Math.min(LIMITES.minW, t.ancho),
      minH: Math.min(LIMITES.minH, t.alto)
    })
    x += t.ancho
    altoFila = Math.max(altoFila, t.alto)
  }
  return resultado
}

export const aplicarGuardado = (base: LayoutItem[], guardado: Disposicion): LayoutItem[] => {
  const conocidos = base.filter((b) => guardado[b.i])
  const piso = conocidos.reduce((max, b) => Math.max(max, guardado[b.i].y + guardado[b.i].h), 0);
  return base.map((b) => (guardado[b.i] ? { ...b, ...guardado[b.i] } : { ...b, y: piso + b.y }))
}

export const Tablero = ({ tarjetas }: { tarjetas: Tarjeta[] }) => {
  const { width, containerRef, mounted } = useContainerWidth()
  const [guardado, setGuardado] = useState<Disposicion>(() => almacen.leer())
  const [ocultas, setOcultas] = useState<string[]>(() => almacenOcultas.leer())
  const [organizando, setOrganizando] = useState(false)
  const [angosto, setAngosto] = useState(false)
  const [sobreElTablero, setSobreElTablero] = useState(false);
  const arrastrando = useRef<Tarjeta | null>(null);

  const visibles = useMemo(() => tarjetas.filter((t) => !ocultas.includes(t.id)), [tarjetas, ocultas])
  const disponibles = useMemo(() => tarjetas.filter((t) => ocultas.includes(t.id)), [tarjetas, ocultas])

  const layouts = useMemo(
    () => ({
      amplio: aplicarGuardado(enFilas(tarjetas), guardado),
      angosto: tarjetas.map((t, n) => ({ i: t.id, x: 0, y: n * t.alto, w: 1, h: t.alto })),
    }
    ), [visibles, guardado]
  )

  const editable = organizando && !angosto

  const guardarDisposicion = (d: Disposicion) => {
    almacen.guardar(d);
    setGuardado(d);
  }

  const guardarOcultas = (ids: string[]) => {
    almacenOcultas.guardar(ids);
    setOcultas(ids);
  }

  function volcar(actual: Layout, base: Disposicion): Disposicion {
    const siguiente: Disposicion = { ...base };
    actual.forEach(({ i, x, y, w, h }) => {
      if (i !== soltando) siguiente[i] = { x, y, w, h };
    });
    return siguiente;
  }

  function registrar(actual: Layout) {
    if (!editable) return;
    guardarDisposicion(volcar(actual, guardado));
  }

  function soltar(actual: Layout, item: LayoutItem | undefined) {
    const t = arrastrando.current;
    setSobreElTablero(false)
    arrastrando.current = null;
    if (!editable || !t || !item) return;
    const siguiente = volcar(actual, guardado);
    siguiente[t.id] = { x: item.x, y: item.y, w: item.w, h: item.h };
    guardarDisposicion(siguiente);
    guardarOcultas(ocultas.filter((id) => id !== t.id));
  }

  function agregarAlFinal(t: Tarjeta) {
    const piso = layouts.amplio.reduce((max, l) => Math.max(max, l.y + l.h), 0);
    guardarDisposicion({ ...guardado, [t.id]: { x: 0, y: piso, w: t.ancho, h: t.alto } });
    guardarOcultas(ocultas.filter((id) => id !== t.id));
  }

  function quitar(id: string) {
    const resto = Object.fromEntries(Object.entries(guardado).filter(([clave]) => clave !== id)) as Disposicion;
    guardarDisposicion(resto);
    guardarOcultas([...ocultas, id]);
  }

  function volverAlOriginal() {
    almacen.guardar(null);
    almacenOcultas.guardar(null);
    setGuardado({});
    setOcultas([]);
  }


  return (
    <section aria-labelledby="dash-graficos" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="dash-graficos" className="text-base font-medium text-foreground">Gráficos</h2>
          <p className="text-xs text-muted-foreground">
            {editable
              ? "Sumá gráficos arrastrándolos desde el panel, movelos desde la barra superior y cambiales el tamaño desde la esquina inferior derecha."
              : "Con “Organizar gráficos” podés agregar, quitar, mover y cambiar el tamaño de los gráficos. La disposición queda guardada en este navegador."}
          </p>
        </div>
        {!angosto && (
          <div className="flex gap-2">
            {organizando && (
              <button
                type="button"
                onClick={volverAlOriginal}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Undo2 className="size-3" />
                Disposición original
              </button>
            )}
            <button
              type="button"
              aria-pressed={organizando}
              onClick={() => setOrganizando((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                organizando ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-3.5" />
              {organizando ? "Listo" : "Organizar gráficos"}
            </button>
          </div>
        )}
      </div>

      <aside>
        {editable && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-card/60 px-3 py-2.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              {disponibles.length ? "Arrastrá al tablero:" : "Todas las tarjetas están en el tablero. Quitá alguna con la ✕ para guardarla acá."}
            </span>
            {disponibles.map((t) => (
              <div
                key={t.id}
                draggable
                unselectable="on"
                onDragStart={(e) => {
                  arrastrando.current = t;
                  e.dataTransfer.setData("text/plain", t.id);
                }}
                onDragEnd={() => {
                  arrastrando.current = null;
                  setSobreElTablero(false);
                }}
                className="flex cursor-grab select-none items-center gap-1.5 rounded-full border border-border bg-background py-1 pl-2 pr-1 text-xs shadow-sm transition hover:border-primary/40 active:cursor-grabbing"
              >
                <GripVertical className="size-3.5 text-muted-foreground" aria-hidden />
                {nombreDe(t)}
                <button type="button" onClick={() => agregarAlFinal(t)} aria-label={`Agregar ${nombreDe(t)}`} className="rounded-full p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                  <Plus className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div ref={containerRef}
          className={cn("tablero-reboot", editable && "editando", sobreElTablero && "recibiendo")}
          onDragEnter={() => arrastrando.current && setSobreElTablero(true)}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setSobreElTablero(false);
          }}>
          {mounted && (
            <Responsive
              width={width}
              layouts={layouts}
              breakpoints={CORTES}
              cols={COLS}
              rowHeight={FILA_PX}
              margin={ESPACIO}
              containerPadding={[0, 0]}
              style={editable ? { minHeight: 240, ...fondoDeColumnas(width) } : undefined}
              dragConfig={{ enabled: editable, cancel: ".tablero-accion" }}
              resizeConfig={{ enabled: editable }}
              dropConfig={{ enabled: editable }}
              droppingItem={{ i: soltando, x: 0, y: 0, w: 4, h: 6 }}
              onDropDragOver={() => (arrastrando.current ? { w: arrastrando.current.ancho, h: arrastrando.current.alto } : false)}
              onDrop={soltar}
              onBreakpointChange={(corte) => setAngosto(corte === "angosto")}
              onDragStop={registrar}
              onResizeStop={registrar}
            >
              {visibles.map((t) => (
                <div key={t.id} className="relative">
                  {editable && (
                    <div
                    className="tablero-asa absolute inset-x-0 top-0 z-10 flex h-7 cursor-grab items-center justify-center gap-1 rounded-t-xl bg-primary/10 text-xs text-primary active:cursor-grabbing"
                    title="Arrastrar para mover"
                  >
                    <Move className="size-3.5" aria-hidden />
                    Mover
                  </div>
                  )}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => quitar(t.id)}
                      aria-label={`Quitar ${nombreDe(t)}`}
                      className="tablero-accion absolute -right-2 -top-2 z-20 flex size-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow-md ring-1 ring-foreground/10 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                  <div className={cn("tablero-celda h-full overflow-auto rounded-xl [&>*]:h-full", editable && "pointer-events-none select-none")}>
                    {t.contenido}
                  </div>
                </div>
              ))}
            </Responsive>
          )}
        </div>
      </aside>

      <style>{`
        .tablero-reboot .react-grid-item { transition: transform 200ms ease, width 200ms ease, height 200ms ease; }
        .tablero-reboot.editando .react-grid-item:active,
        .tablero-reboot .react-grid-item.react-draggable-dragging,
        .tablero-reboot .react-grid-item.resizing {
          z-index: 40;
          transition: none;
        }

        .tablero-reboot.editando .tablero-celda {
          outline: 1.5px dashed color-mix(in oklab, var(--primary) 35%, transparent);
          outline-offset: 2px;
        }
        .tablero-reboot.editando .react-grid-item:hover .tablero-celda {
          outline-color: var(--primary);
          box-shadow: 0 6px 18px rgb(0 0 0 / 0.08);
        }
        .tablero-reboot .react-draggable-dragging .tablero-celda {
          outline: 2px solid var(--primary);
          box-shadow: 0 18px 40px rgb(0 0 0 / 0.22);
          opacity: 0.92;
        }
        .tablero-reboot .react-grid-item.react-grid-placeholder {
          z-index: 5;
          pointer-events: none;
          background: color-mix(in oklab, var(--primary) 18%, transparent);
          border: 2px dashed color-mix(in oklab, var(--primary) 60%, transparent);
          border-radius: 0.75rem;
          opacity: 1;
        }
        .tablero-reboot.recibiendo > .react-grid-layout {
          box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--primary) 40%, transparent);
        }
        .tablero-reboot .react-resizable-handle {
          z-index: 20; width: 18px; height: 18px; right: 2px; bottom: 2px;
          background: none; cursor: se-resize;
        }
        .tablero-reboot .react-resizable-handle::after {
          content: ""; position: absolute; right: 4px; bottom: 4px; width: 8px; height: 8px;
          border-right: 2px solid var(--primary); border-bottom: 2px solid var(--primary);
          border-radius: 0 0 3px 0; opacity: .6;
        }
        .tablero-reboot .react-grid-item:hover > .react-resizable-handle::after { opacity: 1; }
      `}</style>
    </section>
  );
};