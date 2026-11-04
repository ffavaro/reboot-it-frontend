"use client"

import { useEffect, useState } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { hojaRutaApi } from "@/lib/api/hoja-ruta"
import { descargarConstanciaPdf } from "@/lib/utils/constancia-pdf"
import { getErrorMessage } from "@/lib/utils/helpers"
import type { DatosConstancia } from "@/lib/type/hoja-ruta"

function fechaYHora(iso: string | null) {
  if (!iso) return "—"
  const texto = new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
  return `${texto} hs`
}

function Fila({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{titulo}</dt>
      <dd className="font-medium">{children}</dd>
    </>
  )
}

export function ConstanciaDialog({ turnoId, onClose }: { turnoId: number | null; onClose: () => void }) {
  const [datos, setDatos] = useState<DatosConstancia | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (turnoId === null) return
    let vigente = true
    hojaRutaApi
      .constancia(turnoId)
      .then((resultado) => {
        if (!vigente) return
        setDatos(resultado)
        setError("")
      })
      .catch((e) => {
        if (!vigente) return
        setDatos(null)
        setError(getErrorMessage(e, "No se pudo cargar la constancia"))
      })
    return () => { vigente = false }
  }, [turnoId])

  const abierto = turnoId !== null
  const cargando = abierto && !datos && !error

  function alCambiar(estaAbierto: boolean) {
    if (estaAbierto) return
    setDatos(null)
    setError("")
    onClose()
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
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
              <Fila titulo="Donante">
                {datos.donante.nombre}{datos.donante.telefono ? ` · ${datos.donante.telefono}` : ""}
              </Fila>
              <Fila titulo="Dirección">{datos.direccion ?? "—"}</Fila>
              <Fila titulo="Fecha del retiro">{fechaYHora(datos.fechaRetiro)}</Fila>
              <Fila titulo="Donación / Turno">N° {datos.donacionId ?? "—"} / N° {datos.turnoId ?? "—"}</Fila>
              <Fila titulo="Transportista">
                {datos.transportista ? `${datos.transportista.nombre} ${datos.transportista.apellido}` : "—"}
              </Fila>
              <Fila titulo="Vehículo">
                {datos.vehiculo ? `${datos.vehiculo.patente} — ${datos.vehiculo.marca} ${datos.vehiculo.modelo}` : "—"}
              </Fila>
              <dt className="text-muted-foreground">Materiales</dt>
              <dd>
                <ul className="space-y-0.5">
                  {datos.materiales.length === 0 && (
                    <li className="italic text-muted-foreground">Sin materiales cargados</li>
                  )}
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
