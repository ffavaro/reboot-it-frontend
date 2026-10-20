"use client"

import * as React from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { MatrizPermisos } from "@/components/matriz-permisos"
import { useMatrizRol, useGuardarMatriz } from "@/hooks/use-permisos"
import { getErrorMessage } from "@/lib/utils/helpers"
import type { PermisoMatriz } from "@/lib/type/permisos"

type Props = {
  rol: { id: number; nombre: string } | null
  // Motivo por el que la matriz solo se puede consultar (rol Admin, rol propio o falta de permiso de edición)
  soloLecturaMotivo?: string | null
  onClose: () => void
}

export function PermisosRolDialog({ rol, soloLecturaMotivo, onClose }: Props) {
  const { matriz, isLoading, mutate } = useMatrizRol(rol?.id ?? null)
  const { guardarMatriz, isLoading: guardando } = useGuardarMatriz()
  // Cambios sin guardar; mientras no haya, se muestra lo guardado
  const [cambios, setCambios] = React.useState<PermisoMatriz[] | null>(null)
  const edicion = cambios ?? matriz?.permisos ?? null

  function cerrar() {
    setCambios(null)
    onClose()
  }

  const soloLectura = !!soloLecturaMotivo
  const hayCambios = !!edicion && !!matriz && JSON.stringify(edicion) !== JSON.stringify(matriz.permisos)

  async function guardar() {
    if (!rol || !edicion) return
    try {
      await guardarMatriz({
        rolId: rol.id,
        permisos: edicion.map(({ pantallaId, ver, crear, editar, baja }) => ({ pantallaId, ver, crear, editar, baja })),
      })
      await mutate()
      toast.success("Permisos actualizados")
      cerrar()
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudieron guardar los permisos"))
    }
  }

  return (
    <Dialog open={!!rol} onOpenChange={(abierto) => { if (!abierto) cerrar() }}>
      <DialogContent className="max-w-5xl gap-0 p-0 sm:max-w-5xl">
        <div className="rounded-t-2xl bg-muted/40 px-6 py-4 pr-12">
          <DialogTitle className="text-lg font-semibold">Permisos del rol {rol?.nombre}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {soloLecturaMotivo ?? "Definí qué puede hacer este rol en cada pantalla. Los cambios rigen desde la próxima consulta de cada usuario."}
          </DialogDescription>
        </div>

        <div className="px-6 py-5">
          {isLoading || !edicion ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Cargando permisos...</p>
          ) : (
            <MatrizPermisos permisos={edicion} onChange={setCambios} readOnly={soloLectura} />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 rounded-b-2xl px-6 py-4">
          {soloLectura ? (
            <Button variant="outline" onClick={cerrar}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={cerrar} disabled={guardando}>Cancelar</Button>
              <Button onClick={guardar} disabled={guardando || !hayCambios}>
                {guardando ? "Guardando..." : "Guardar permisos"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
