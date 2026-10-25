"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Check, Copy, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { donantesApi } from "@/lib/api/donantes"
import { getErrorMessage } from "@/lib/utils/helpers"

/**
 * "Restablecer contraseña" en la edición de un donante: genera una contraseña temporal para su usuario, la muestra una sola
 * vez para dársela al donante y le avisa por email del cambio (si tiene un email válido). La anterior deja de servir.
 */
export function RestablecerContrasenaDonante({ donanteId, nombre }: { donanteId: number; nombre: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<{ password: string; email: string | null; avisoEnviado: boolean } | null>(null)
  const [copiada, setCopiada] = useState(false)

  async function restablecer() {
    setCargando(true)
    try {
      setResultado(await donantesApi.restablecerContrasena(donanteId))
      setConfirmando(false)
      setCopiada(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo restablecer la contraseña"))
    } finally {
      setCargando(false)
    }
  }

  async function copiar() {
    if (!resultado) return
    try {
      await navigator.clipboard.writeText(resultado.password)
      setCopiada(true)
    } catch {
      toast.error("No se pudo copiar: seleccioná la contraseña y copiala a mano")
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setConfirmando(true)}>
        <KeyRound className="h-4 w-4" />
        Restablecer contraseña
      </Button>

      <Dialog open={confirmando} onOpenChange={(abierto) => { if (!abierto && !cargando) setConfirmando(false) }}>
        <DialogContent className="max-w-md gap-0 p-0">
          <div className="rounded-t-2xl bg-muted/40 px-6 py-4 pr-12">
            <DialogTitle className="text-lg font-semibold">Restablecer contraseña</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Se genera una contraseña temporal para {nombre}.
            </DialogDescription>
          </div>
          <p className="px-6 py-5 text-sm text-muted-foreground">
            La contraseña actual deja de servir. Vas a ver la nueva una sola vez para dársela al donante, que después puede cambiarla desde
            “¿Olvidaste la contraseña?”.
          </p>
          <div className="flex items-center justify-end gap-2 rounded-b-2xl px-6 py-4">
            <Button variant="outline" onClick={() => setConfirmando(false)} disabled={cargando}>Cancelar</Button>
            <Button onClick={restablecer} disabled={cargando}>{cargando ? "Generando..." : "Generar contraseña"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resultado} onOpenChange={(abierto) => { if (!abierto) setResultado(null) }}>
        <DialogContent className="max-w-md gap-0 p-0">
          <div className="rounded-t-2xl bg-muted/40 px-6 py-4 pr-12">
            <DialogTitle className="text-lg font-semibold">Contraseña temporal</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">Anotala ahora: no se vuelve a mostrar.</DialogDescription>
          </div>
          <div className="flex flex-col gap-3 px-6 py-5">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
              <code className="flex-1 select-all font-mono text-lg tracking-wider" aria-label="Contraseña temporal">{resultado?.password}</code>
              <Button size="sm" variant="outline" onClick={copiar}>
                {copiada ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiada ? "Copiada" : "Copiar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground" role="status">
              {resultado?.avisoEnviado
                ? `Le avisamos del cambio a ${resultado.email}.`
                : resultado?.email
                ? `No pudimos enviar el aviso a ${resultado.email}.`
                : "El donante no tiene un email cargado: avisale vos."}
            </p>
          </div>
          <div className="flex justify-end rounded-b-2xl px-6 py-4">
            <Button onClick={() => setResultado(null)}>Listo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
