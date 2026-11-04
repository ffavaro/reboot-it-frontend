"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useGenerarHojaRuta } from "@/hooks/use-hoja-ruta"
import { formatFechaISO, getErrorMessage } from "@/lib/utils/helpers"
import { urlWhatsApp } from "@/lib/utils/hoja-ruta"
import type { HojaIniciadaPendiente, HojaRutaDia } from "@/lib/type/hoja-ruta"

const plural = (n: number, palabra: string) => `${n} ${palabra}${n !== 1 ? "s" : ""}`

export function GenerarHojaButton({
  hoja, onGenerada,
}: {
  hoja: HojaRutaDia
  onGenerada: () => void | Promise<unknown>
}) {
  const { generarHojaRuta } = useGenerarHojaRuta()
  const [generando, setGenerando] = useState(false)
  const [iniciadas, setIniciadas] = useState<HojaIniciadaPendiente[] | null>(null)

  async function generarYCompartir(confirmar = false) {
    const ventana = window.open("about:blank", "_blank")
    setGenerando(true)
    try {
      const generada = await generarHojaRuta({
        empleadoTransportistaId: hoja.empleadoTransportistaId,
        fecha: hoja.fecha,
        confirmar,
      })
      await onGenerada()
      setIniciadas(null)
      const url = urlWhatsApp(generada)
      if (ventana) {
        ventana.opener = null
        ventana.location.href = url
      } else {
        window.open(url, "_blank", "noopener,noreferrer")
      }
      toast.success("Hoja de ruta generada")
    } catch (error) {
      ventana?.close()
      const e = error as { code?: string; hojas?: HojaIniciadaPendiente[] }
      if (e?.code === "HOJA_INICIADA_PENDIENTE") setIniciadas(e.hojas ?? [])
      else toast.error(getErrorMessage(error, "No se pudo generar la hoja de ruta"))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Button
        disabled={generando || hoja.paradas.length === 0 || !hoja.vehiculo}
        onClick={() => generarYCompartir()}
      >
        <Send className="h-4 w-4" />
        {generando ? "Generando..." : "Generar y compartir hoja de ruta"}
      </Button>

      <Dialog open={!!iniciadas} onOpenChange={(abierto) => { if (!abierto) setIniciadas(null) }}>
        <DialogContent className="max-w-md gap-0 p-0">
          <div className="rounded-t-2xl bg-amber-50 px-6 py-4 pr-12 dark:bg-amber-900/20">
            <DialogTitle className="text-lg font-semibold">El transportista tiene otra hoja de ruta iniciada</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Todavía tiene turnos pendientes de retiro.
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-3 px-6 py-5 text-sm">
            <ul className="flex flex-col gap-1">
              {iniciadas?.map((o) => (
                <li key={o.id} className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="font-medium">Hoja del {formatFechaISO(o.fecha)}</span>
                  <span className="text-muted-foreground">
                    {plural(o.pendientes, "turno")} {o.pendientes !== 1 ? "pendientes" : "pendiente"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              ¿Querés generar igual la hoja de ruta del {formatFechaISO(hoja.fecha)}?
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 rounded-b-2xl px-6 py-4">
            <Button variant="outline" onClick={() => setIniciadas(null)}>Cancelar</Button>
            <Button onClick={() => generarYCompartir(true)}>Generar igual</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}