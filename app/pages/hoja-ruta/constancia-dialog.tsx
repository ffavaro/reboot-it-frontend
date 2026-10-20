"use client"

import { useEffect, useState } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { hojaRutaApi } from "@/lib/api/hoja-ruta"
import { descargarConstanciaPdf } from "@/lib/utils/constancia-pdf"
import { getErrorMessage } from "@/lib/utils/helpers"
import type { ConstanciaRetiroDatos } from "@/lib/type/hoja-ruta"

function fechaHora(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " hs"
}

/** Muestra la constancia de retiro de un turno y permite descargarla en PDF. */
export function ConstanciaDialog({ turnoId, onClose }: { turnoId: number | null; onClose: () => void }) {
  const [datos, setDatos] = useState<ConstanciaRetiroDatos | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (turnoId === null) return
    let activo = true
    hojaRutaApi.constancia(turnoId)
      .then((d) => { if (activo) { setDatos(d); setError("") } })
      .catch((e) => { if (activo) { setDatos(null); setError(getErrorMessage(e, "No se pudo cargar la constancia")) } })
    return () => { activo = false }
  }, [turnoId])

  const abierto = turnoId !== null
  const cargando = abierto && !datos && !error

  return (
    <Dialog open={abierto} onOpenChange={(v) => { if (!v) { setDatos(null); setError(""); onClose() } }}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <div className="rounded-t-2xl bg-muted/40 px-6 py-4 pr-12">
          <DialogTitle className="text-lg font-semibold">
            Constancia de retiro{datos ? ` N° ${String(datos.constanciaId).padStart(6, "0")}` : ""}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Se genera automáticamente al confirmar el retiro.
          </DialogDescription>
        </div>

        <div className="px-6 py-5 text-sm">
          {cargando && <p className="py-6 text-center text-muted-foreground">Cargando constancia...</p>}
          {error && <p className="py-6 text-center text-destructive">{error}</p>}
          {datos && (
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2.5">
              <dt className="text-muted-foreground">Donante</dt>
              <dd className="font-medium">{datos.donante.nombre}{datos.donante.telefono ? ` · ${datos.donante.telefono}` : ""}</dd>
              <dt className="text-muted-foreground">Dirección</dt>
              <dd className="font-medium">{datos.direccion ?? "—"}</dd>
              <dt className="text-muted-foreground">Fecha del retiro</dt>
              <dd className="font-medium">{fechaHora(datos.fechaRetiro)}</dd>
              <dt className="text-muted-foreground">Donación / Turno</dt>
              <dd className="font-medium">N° {datos.donacionId ?? "—"} / N° {datos.turnoId ?? "—"}</dd>
              <dt className="text-muted-foreground">Transportista</dt>
              <dd className="font-medium">{datos.transportista ? `${datos.transportista.nombre} ${datos.transportista.apellido}` : "—"}</dd>
              <dt className="text-muted-foreground">Vehículo</dt>
              <dd className="font-medium">{datos.vehiculo ? `${datos.vehiculo.patente} — ${datos.vehiculo.marca} ${datos.vehiculo.modelo}` : "—"}</dd>
              <dt className="text-muted-foreground">Materiales</dt>
              <dd>
                <ul className="space-y-0.5">
                  {datos.materiales.length === 0 && <li className="italic text-muted-foreground">Sin materiales cargados</li>}
                  {datos.materiales.map((m, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="font-medium">{m.tipo}</span>
                      <span className="tabular-nums text-muted-foreground">{m.cantidad ?? "—"} u.</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 rounded-b-2xl px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button disabled={!datos} onClick={() => datos && descargarConstanciaPdf(datos)}>
            <FileDown className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
