"use client"

import useSWR from "swr"
import { toast } from "react-toastify"
import { ExternalLink, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { donacionApi } from "@/lib/api/donacion"
import { constanciaRetiroApi } from "@/lib/api/constancia-retiro"
import { certificadoDisposicionApi } from "@/lib/api/certificado-disposicion"
import { descargarConstanciaPdf } from "@/lib/utils/constancia-pdf"
import { descargarCertificadoPdf } from "@/lib/utils/certificado-pdf"
import { formatDate, formatDateTime, formatPeso, getErrorMessage } from "@/lib/utils/helpers"

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      {children}
    </section>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="break-words text-sm font-medium">{children}</p>
    </div>
  )
}

const SIN_DATO = <span className="italic text-muted-foreground">—</span>
const PENDIENTE = (texto: string) => <p className="text-sm italic text-muted-foreground">{texto}</p>

const nombreDe = (p?: { nombre: string; apellido: string } | null) => (p ? `${p.nombre} ${p.apellido}` : null)

/**
 * Trazabilidad de una donación en un solo lugar: datos, materiales, turno, fotos, retiro con su constancia, lote y
 * certificado de disposición. Las constancias y certificados se descargan en PDF desde acá.
 */
export function DetalleDonacionDialog({ donacionId, onClose }: { donacionId: number | null; onClose: () => void }) {
  const { data: d, isLoading, error } = useSWR(donacionId ? ["/donacion/detalle", donacionId] : null, () => donacionApi.detalle(donacionId as number))

  async function descargarConstancia(id: number) {
    try {
      descargarConstanciaPdf(await constanciaRetiroApi.datos(id))
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo descargar la constancia"))
    }
  }

  async function descargarCertificado(id: number) {
    try {
      descargarCertificadoPdf(await certificadoDisposicionApi.datos(id))
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo descargar el certificado"))
    }
  }

  return (
    <Dialog open={donacionId !== null} onOpenChange={(abierto) => { if (!abierto) onClose() }}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-y-auto p-0">
        <div className="rounded-t-2xl bg-muted/40 px-6 py-4 pr-12">
          <DialogTitle className="text-lg font-semibold">Detalle de la donación{donacionId ? ` #${donacionId}` : ""}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Recorrido completo: turno, fotos, retiro, constancia y certificado.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando el detalle…</p>}
          {error && <p className="text-sm text-destructive">No se pudo cargar el detalle de la donación.</p>}
          {d && (
            <>
              <Seccion titulo="Donación">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Dato etiqueta="Estado">{d.estado ?? SIN_DATO}</Dato>
                  <Dato etiqueta="Donante">{d.donante.nombre ?? SIN_DATO}</Dato>
                  <Dato etiqueta="Registrada">{formatDateTime(d.createdAt) ?? SIN_DATO}</Dato>
                  <Dato etiqueta="Entrega">{d.necesitaRetiro ? "Retiro a domicilio" : "En sucursal"}</Dato>
                  <Dato etiqueta="Peso estimado">{d.pesoEstimadoKg != null ? `${formatPeso(d.pesoEstimadoKg)} kg` : SIN_DATO}</Dato>
                  {d.necesitaRetiro && <Dato etiqueta="Dirección de retiro">{d.direccionRetiro ?? SIN_DATO}</Dato>}
                </div>
                {d.descripcion && <Dato etiqueta="Descripción">{d.descripcion}</Dato>}
              </Seccion>

              <Seccion titulo={`Materiales (${d.materiales.length})`}>
                {d.materiales.length === 0 ? PENDIENTE("No se cargaron materiales.") : (
                  <ul className="divide-y rounded-md border">
                    {d.materiales.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="font-medium">{m.tipo ?? "Material"}</span>
                        <span className="text-muted-foreground">
                          {m.cantidad != null ? `${m.cantidad} u.` : ""}{m.condicion ? ` · ${m.condicion}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Seccion>

              <div className="grid gap-4 sm:grid-cols-2">
                <Seccion titulo="Turno">
                  {d.turno ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Dato etiqueta="Fecha y hora">{formatDateTime(d.turno.fechaHora) ?? SIN_DATO}</Dato>
                      <Dato etiqueta="Estado del turno">{d.turno.estado ?? SIN_DATO}</Dato>
                      <Dato etiqueta={d.necesitaRetiro ? "Transportista" : "Recibe"}>
                        {nombreDe(d.necesitaRetiro ? d.turno.transportista : d.turno.empleado) ?? "Sin asignar"}
                      </Dato>
                    </div>
                  ) : PENDIENTE("Sin turno.")}
                </Seccion>

                <Seccion titulo="Retiro y constancia">
                  {!d.necesitaRetiro ? PENDIENTE("La donación se entrega en sucursal: no hay retiro.") : d.retiro ? (
                    <div className="flex flex-col gap-3">
                      <Dato etiqueta="Retiro">{d.retiro.fechaRetiro ? formatDateTime(d.retiro.fechaRetiro) : "Pendiente de retiro"}</Dato>
                      {d.constancia ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Dato etiqueta="Constancia emitida">{formatDate(d.constancia.fechaEmision) ?? SIN_DATO}</Dato>
                          <Button size="sm" variant="outline" className="ml-auto" onClick={() => descargarConstancia(d.constancia!.id)}>
                            <FileDown className="h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </div>
                      ) : PENDIENTE("La constancia se emite al confirmar el retiro.")}
                    </div>
                  ) : PENDIENTE("Todavía no se registró el retiro.")}
                </Seccion>
              </div>

              <Seccion titulo="Lote y certificado de disposición">
                {d.lote ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Dato etiqueta="Lote">#{d.lote.id}{d.lote.pesoBrutoKg != null ? ` · ${formatPeso(d.lote.pesoBrutoKg)} kg` : ""}</Dato>
                    {d.certificado ? (
                      <>
                        <Dato etiqueta="Certificado">{d.certificado.numero ?? `#${d.certificado.id}`}</Dato>
                        <Dato etiqueta="Emitido">{formatDate(d.certificado.fechaEmision) ?? SIN_DATO}</Dato>
                        <Dato etiqueta="Gestor ambiental">{d.certificado.gestor ?? SIN_DATO}</Dato>
                        <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                          <Button size="sm" variant="outline" onClick={() => descargarCertificado(d.certificado!.id)}>
                            <FileDown className="h-3.5 w-3.5" />
                            Certificado PDF
                          </Button>
                          {d.certificado.archivoFinalUrl && (
                            <Button size="sm" variant="outline" render={<a href={d.certificado.archivoFinalUrl} target="_blank" rel="noopener noreferrer" />}>
                              <ExternalLink className="h-3.5 w-3.5" />
                              Certificado de disposición final
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2">{PENDIENTE("El certificado se emite cuando termina la destrucción de los medios con datos.")}</div>
                    )}
                  </div>
                ) : PENDIENTE("Todavía no hay lote.")}
              </Seccion>

              <Seccion titulo={`Fotos (${d.fotos.length})`}>
                {d.fotos.length === 0 ? PENDIENTE("Todavía no hay fotos de los materiales.") : (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {d.fotos.map((f) => (
                      <li key={f.id}>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border hover:opacity-90">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.url} alt="Foto de los materiales" className="h-24 w-full object-cover" loading="lazy" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Seccion>
            </>
          )}
        </div>

        <div className="flex justify-end rounded-b-2xl px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
