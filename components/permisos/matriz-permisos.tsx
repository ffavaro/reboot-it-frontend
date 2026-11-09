"use client"

import { Fragment, useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useGuardarMatriz, useMatrizDeRol, usePuede } from "@/hooks/use-permisos"
import { getUser } from "@/lib/auth-utils"
import { ACCIONES, ALCANCES, NOMBRE_ACCION, NOMBRE_ALCANCE } from "@/lib/type/permisos"
import type { Accion, Alcance, FilaMatriz, MatrizRol } from "@/lib/type/permisos"
import type { Rol } from "@/lib/type/user"
import { textoDeError } from "@/lib/utils/helpers"

type Props = { rol: Rol | null; alCerrar: () => void }


export function MatrizPermisos({ rol, alCerrar }: Props) {
  return (
    <Dialog open={rol !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent className="max-w-4xl">
        {rol && <ContenidoMatriz key={rol.id} rol={rol} alCerrar={alCerrar} />}
      </DialogContent>
    </Dialog>
  )
}

function ContenidoMatriz({ rol, alCerrar }: { rol: Rol; alCerrar: () => void }) {
  const { matriz, cargando, error } = useMatrizDeRol(Number(rol.id))

  return (
    <>
      <DialogHeader>
        <DialogTitle>Permisos de {rol.nombre}</DialogTitle>
        <DialogDescription>Qué pantallas puede usar este rol, qué puede hacer en cada una y sobre qué registros.</DialogDescription>
      </DialogHeader>
      {error ? (
        <p className="text-sm text-destructive">{textoDeError(error, "No se pudo cargar la matriz de permisos.")}</p>
      ) : cargando || !matriz ? (
        <p className="text-sm text-muted-foreground">Cargando permisos…</p>
      ) : (
        <Editor matriz={matriz} alCerrar={alCerrar} />
      )}
    </>
  )
}

function Editor({ matriz, alCerrar }: { matriz: MatrizRol; alCerrar: () => void }) {
  const [filas, setFilas] = useState<FilaMatriz[]>(matriz.permisos)
  const { guardar, guardando } = useGuardarMatriz()
  const puedeEditarRoles = usePuede("editar")

  const esAdmin = matriz.rol.codigo === "ADMIN"
  const esPropio = getUser()?.rolId === matriz.rol.id
  const soloLectura = esAdmin || esPropio || !puedeEditarRoles
  const motivo = esAdmin
    ? "Los permisos del rol Admin no se pueden modificar."
    : esPropio
      ? "No podés modificar los permisos de tu propio rol."
      : !puedeEditarRoles
        ? "Tu rol puede ver los permisos, pero no modificarlos."
        : null

  const secciones = filas.reduce<Map<string, FilaMatriz[]>>((acc, f) => acc.set(f.seccion, [...(acc.get(f.seccion) ?? []), f]), new Map())

  const cambiar = (pantallaId: number, cambios: Partial<Record<Accion, boolean>> & { alcance?: Alcance }) => {
    setFilas((actuales) =>
      actuales.map((f) => {
        if (f.pantallaId !== pantallaId) return f
        const nueva = { ...f, ...cambios }
        if (cambios.ver === false) return { ...nueva, crear: false, editar: false, baja: false }
        if (cambios.crear || cambios.editar || cambios.baja) return { ...nueva, ver: true }
        return nueva
      }),
    )
  }

  const guardarCambios = async() => {
    try {
      await guardar({
        rolId: matriz.rol.id,
        permisos: filas.map(({ pantallaId, ver, crear, editar, baja, alcance }) => ({ pantallaId, ver, crear, editar, baja, alcance })),
      })
      toast.success(`Permisos de ${matriz.rol.nombre} guardados. Se aplican en hasta 30 segundos.`)
      alCerrar()
    } catch (e) {
      toast.error(textoDeError(e, "No se pudieron guardar los permisos"))
    }
  }

  return (
    <>
      {motivo && <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{motivo}</p>}
      <div className="max-h-[60vh] overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Pantalla</th>
              {ACCIONES.map((a) => (
                <th key={a} className="w-16 px-2 py-2 text-center font-medium">{NOMBRE_ACCION[a]}</th>
              ))}
              <th className="w-36 px-3 py-2 font-medium">Alcance</th>
            </tr>
          </thead>
          <tbody>
            {[...secciones].map(([seccion, lista]) => (
              <Fragment key={seccion}>
                <tr className="bg-muted/40">
                  <td colSpan={ACCIONES.length + 2} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{seccion}</td>
                </tr>
                {lista.map((f) => (
                  <tr key={f.pantallaId} className="border-t">
                    <td className="px-3 py-1.5">{f.nombre}</td>
                    {ACCIONES.map((a) => (
                      <td key={a} className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={f[a]}
                          disabled={soloLectura}
                          onChange={(e) => cambiar(f.pantallaId, { [a]: e.target.checked })}
                          aria-label={`${NOMBRE_ACCION[a]} en ${f.nombre}`}
                          className="h-4 w-4 accent-primary"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-1.5">
                      <select
                        value={f.alcance}
                        disabled={soloLectura || !f.ver}
                        onChange={(e) => cambiar(f.pantallaId, { alcance: e.target.value as Alcance })}
                        aria-label={`Alcance en ${f.nombre}`}
                        className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs disabled:opacity-50"
                      >
                        {ALCANCES.map((al) => (
                          <option key={al} value={al}>{NOMBRE_ALCANCE[al]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={alCerrar}>{soloLectura ? "Cerrar" : "Cancelar"}</Button>
        {!soloLectura && (
          <Button onClick={guardarCambios} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar permisos"}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
