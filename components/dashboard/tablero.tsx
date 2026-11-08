import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Responsive, useContainerWidth, type Layout, type LayoutItem} from 'react-grid-layout'
import { Disposicion, Tarjeta } from "@/lib/type/dashboard";
import { getUser } from "@/lib/auth-utils";
import { Move, LayoutGrid, Undo2 } from "lucide-react"

const COLUMNAS = 12;
const FILA_PX = 20;
const ESPACIO: [number, number] = [12, 12];
const LIMITES = { minW: 3, minH:6, maxH:30}
const CORTES = { amplio: 900, angosto:0};
const COLS = { amplio: COLUMNAS, angosto : 1}

const almacen = {
    clave: () =>`tablero-reboot:${getUser()?.id ?? "invitado"}`,
    leer(): Disposicion {
        if (typeof window ==='undefined') return {}
        try {
            return JSON.parse(localStorage.getItem(this.clave()) ?? "{}") as Disposicion
        } catch (error) {
            return {}
        }
    },
    guardar (d:Disposicion | null) {
        try {
            if (d) localStorage.setItem(this.clave(), JSON.stringify(d))
            else localStorage.removeItem(this.clave())
        } catch (error) {
            return
        }
    }
}

export const enFilas = (tarjetas: Tarjeta[]): LayoutItem[] => {
    const resultado : LayoutItem[] = [];
    let x =0;
    let y =0;
    let altoFila =0 ;
    for (const t of tarjetas) {
        if (x + t.ancho > COLUMNAS) {
            x = 0;
            y += altoFila
            altoFila = 0;
        }
        resultado.push({i: t.id, x, y, w: t.ancho, h: t.alto, ...LIMITES})
        x += t.ancho
        altoFila = Math.max(altoFila, t.alto)
    }
    return resultado
}

export const aplicarGuardado = (base: LayoutItem[], guardado: Disposicion): LayoutItem[] => {
    const conocidos = base.filter((b)=> guardado[b.i])
    const piso = conocidos.reduce((max, b) => Math.max(max, guardado[b.i].y + guardado[b.i].h), 0);
    return base.map((b) => (guardado[b.i] ? {...b, ...guardado[b.i]} : {...b, y:piso + b.y}))
}

export const Tablero = ({ tarjetas}: { tarjetas: Tarjeta[]}) => {
   const { width, containerRef, mounted } = useContainerWidth()
  const [guardado, setGuardado] = useState<Disposicion>(() => almacen.leer())
  const [organizando, setOrganizando] = useState(false)
  const [angosto, setAngosto] = useState(false)

  const layouts = useMemo(
    ()=> ({
        amplio: aplicarGuardado(enFilas(tarjetas), guardado),
        angosto: tarjetas.map((t,n) => ({i:t.id, x:0, y: n* t.alto, w: 1, h: t.alto})),
    }
    ), [tarjetas, guardado]
  )
  
  const editable = organizando && !angosto

  function registrar (actual:Layout){
    if(!editable) return
    const siguiente: Disposicion = {...guardado}
     actual.forEach(({ i, x, y, w, h }) => {
      siguiente[i] = { x, y, w, h }
    })
    almacen.guardar(siguiente)
    setGuardado(siguiente)
  }

  
  function volverAlOriginal() {
    almacen.guardar(null)
    setGuardado({})
  }

  return (
    <section aria-labelledby="dash-graficos" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="dash-graficos" className="text-base font-medium text-foreground">Gráficos</h2>
          <p className="text-xs text-muted-foreground">
            {editable
              ? "Arrastrá cada gráfico desde la barra superior y cambiale el tamaño desde la esquina inferior derecha."
              : "Con “Organizar gráficos” podés moverlos y cambiarles el tamaño. La disposición queda guardada en este navegador."}
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

      <div ref={containerRef} className="tablero-reboot">
        {mounted && (
          <Responsive
            width={width}
            layouts={layouts}
            breakpoints={CORTES}
            cols={COLS}
            rowHeight={FILA_PX}
            margin={ESPACIO}
            containerPadding={[0, 0]}
            dragConfig={{ enabled: editable, handle: ".tablero-asa" }}
            resizeConfig={{ enabled: editable }}
            onBreakpointChange={(corte) => setAngosto(corte === "angosto")}
            onDragStop={registrar}
            onResizeStop={registrar}
          >
            {tarjetas.map((t) => (
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
                <div className={cn("h-full overflow-auto rounded-xl [&>*]:h-full", editable && "pointer-events-none select-none pt-7 ring-2 ring-primary/30")}>
                  {t.contenido}
                </div>
              </div>
            ))}
          </Responsive>
        )}
      </div>

      <style>{`
        .tablero-reboot .react-grid-item.react-grid-placeholder {
          background: color-mix(in oklab, var(--primary) 22%, transparent);
          border-radius: 0.75rem;
          opacity: 1;
        }
        .tablero-reboot .react-grid-item.react-draggable-dragging {
          z-index: 30;
          box-shadow: 0 12px 28px rgb(0 0 0 / 0.18);
        }
      `}</style>
    </section>
  )
}