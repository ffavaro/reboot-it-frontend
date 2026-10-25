"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useGenerarHojaRuta } from "@/hooks/use-hoja-ruta"
import { formatFechaISO, getErrorMessage } from "@/lib/utils/helpers"
import type { HojaIniciadaPendiente, HojaRutaDia } from "@/lib/type/hoja-ruta"
import { buildWhatsAppUrl } from "./hoja-ruta-card"

/**
 * "Generar y compartir hoja de ruta" (lo usa el Administrativo): genera la hoja de esa fecha, que queda En proceso
 * para el transportista, y abre WhatsApp con el detalle. Si el transportista ya tiene otra hoja iniciada con turnos
 * pendientes, avisa y pide confirmación.
 */
export function GenerarHojaButton({ hoja, onGenerada }: { hoja: HojaRutaDia; onGenerada: () => void | Promise<unknown> }) {
  const { generarHojaRuta } = useGenerarHojaRuta()
  const [generando, setGenerando] = useState(false)
  const [alerta, setAlerta] = useState<HojaIniciadaPendiente[] | null>(null)

  // La pestaña de WhatsApp se abre en el gesto del usuario (si no, el navegador bloquea el popup) y se redirige
  // cuando la hoja ya está generada.
  async function generarYCompartir(confirmar = false) {
    const win = window.open("about:blank", "_blank")
    setGenerando(true)
    try {
      const generada = await generarHojaRuta({ empleadoTransportistaId: hoja.empleadoTransportistaId, fecha: hoja.fecha, confirmar })
      await onGenerada()
      setAlerta(null)
      const url = buildWhatsAppUrl(generada)
      if (win) {
        win.opener = null
        win.location.href = url
      } else {
        window.open(url, "_blank", "noopener,noreferrer")
      }
      toast.success("Hoja de ruta generada")
    } catch (error) {
      win?.close()
      const e = error as { code?: string; hojas?: HojaIniciadaPendiente[] }
      if (e?.code === "HOJA_INICIADA_PENDIENTE") setAlerta(e.hojas ?? [])
      else toast.error(getErrorMessage(error, "No se pudo generar la hoja de ruta"))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Button disabled={generando || hoja.paradas.length === 0 || !hoja.vehiculo} onClick={() => generarYCompartir()}>
        <Send className="h-4 w-4" />
        {generando ? "Generando..." : "Generar y compartir hoja de ruta"}
      </Button>

      {/* Aviso: ya hay otra hoja iniciada con turnos pendientes de retiro */}
      <Dialog open={!!alerta} onOpenChange={(v) => { if (!v) setAlerta(null) }}>
        <DialogContent className="max-w-md gap-0 p-0">
          <div className="rounded-t-2xl bg-amber-50 px-6 py-4 pr-12 dark:bg-amber-900/20">
            <DialogTitle className="text-lg font-semibold">El transportista tiene otra hoja de ruta iniciada</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Todavía tiene turnos pendientes de retiro.
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-3 px-6 py-5 text-sm">
            <ul className="flex flex-col gap-1">
              {alerta?.map((o) => (
                <li key={o.id} className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="font-medium">Hoja del {formatFechaISO(o.fecha)}</span>
                  <span className="text-muted-foreground">{o.pendientes} turno{o.pendientes !== 1 ? "s" : ""} pendiente{o.pendientes !== 1 ? "s" : ""}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              ¿Querés generar igual la hoja de ruta del {formatFechaISO(hoja.fecha)}?
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 rounded-b-2xl px-6 py-4">
            <Button variant="outline" onClick={() => setAlerta(null)}>Cancelar</Button>
            <Button onClick={() => generarYCompartir(true)}>Generar igual</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
