"use client"

import type { ReactNode } from "react"
import { Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTrazabilidadDonacion } from "@/hooks/use-donacion"
import { useDescargaDocumento } from "@/hooks/use-descarga-documento"
import { certificadoDisposicionApi, constanciaRetiroApi } from "@/lib/api"
import { descargarCertificadoDisposicion } from "@/lib/documentos/certificado-disposicion"
import { descargarConstanciaRetiro } from "@/lib/documentos/constancia-retiro"
import type { PersonaDetalle } from "@/lib/type/donacion"
import { dia, diaYHora } from "@/lib/utils/fechas"

const nada = <span className="italic text-muted-foreground">—</span>

const fecha = (iso: string | null | undefined, conHora = false) =>
  iso ? (conHora ? diaYHora(iso) : dia(iso)) : null

const persona = (p: PersonaDetalle | null) => (p ? `${p.nombre} ${p.apellido}` : null)

const kg = (valor: number | string | null) => (valor == null || valor === "" ? null : `${Number(valor).toLocaleString("es-AR")} kg`)

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      {children}
    </section>
  )
}

function Campo({ nombre, valor }: { nombre: string; valor: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{nombre}</dt>
      <dd className="break-words text-sm font-medium">{valor ?? nada}</dd>
    </div>
  )
}

const Aviso = ({ children }: { children: ReactNode }) => <p className="text-sm italic text-muted-foreground">{children}</p>

export function TrazabilidadDonacion({ donacionId, alCerrar }: { donacionId: number | null; alCerrar: () => void }) {
  const { trazabilidad: t, isLoading, error } = useTrazabilidadDonacion(donacionId)
  const constancia = useDescargaDocumento(constanciaRetiroApi.getDatosDocumento, descargarConstanciaRetiro, "No se pudo generar el PDF de la constancia")
  const certificado = useDescargaDocumento(
    certificadoDisposicionApi.getDatosDocumento,
    descargarCertificadoDisposicion,
    "No se pudo generar el PDF del certificado",
  )

  return (
    <Dialog open={donacionId !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Donación #{donacionId}</DialogTitle>
          <DialogDescription>Todo el recorrido de la donación: turno, retiro, lote y certificado.</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive">No se pudo cargar el detalle de la donación.</p>
        ) : isLoading || !t ? (
          <p className="text-sm text-muted-foreground">Cargando el detalle…</p>
        ) : (
          <div className="flex flex-col gap-3">
            <Bloque titulo="Donación">
              <dl className="grid grid-cols-2 gap-3">
                <Campo nombre="Donante" valor={t.donante.nombre ?? t.donante.razonSocial} />
                <Campo nombre="Estado" valor={t.estado} />
                <Campo nombre="Registrada" valor={fecha(t.createdAt, true)} />
                <Campo nombre="Entrega" valor={t.necesitaRetiro ? "Retiro a domicilio" : "En la sucursal"} />
                {t.necesitaRetiro && <Campo nombre="Dirección de retiro" valor={t.direccionRetiro} />}
                {t.necesitaRetiro && <Campo nombre="Peso estimado" valor={kg(t.pesoEstimadoKg)} />}
              </dl>
              {t.descripcion && <p className="text-sm text-muted-foreground">{t.descripcion}</p>}
            </Bloque>

            <Bloque titulo={`Materiales (${t.materiales.length})`}>
              {t.materiales.length === 0 ? (
                <Aviso>Sin materiales cargados.</Aviso>
              ) : (
                <ul className="divide-y text-sm">
                  {t.materiales.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="font-medium">{m.tipo ?? "Material"}</span>
                      <span className="text-muted-foreground">
                        {m.cantidad != null ? `${m.cantidad} u.` : "—"} · {m.condicion ?? "Sin condición"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            <Bloque titulo="Turno">
              {t.turno ? (
                <dl className="grid grid-cols-2 gap-3">
                  <Campo nombre="Fecha y hora" valor={fecha(t.turno.fechaHora, true)} />
                  <Campo nombre="Estado" valor={t.turno.estado} />
                  <Campo nombre={t.necesitaRetiro ? "Transportista" : "Lo recibe"} valor={persona(t.necesitaRetiro ? t.turno.transportista : t.turno.empleado)} />
                </dl>
              ) : (
                <Aviso>La donación no tiene turno.</Aviso>
              )}
            </Bloque>

            {t.fotos.length > 0 && (
              <Bloque titulo={`Fotos (${t.fotos.length})`}>
                <div className="flex flex-wrap gap-2">
                  {t.fotos.map((f) => (
                    <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" title="Ver foto completa">
                      <img src={f.url} alt="Foto de la donación" className="h-20 w-20 rounded-md border object-cover" />
                    </a>
                  ))}
                </div>
              </Bloque>
            )}

            {t.necesitaRetiro && (
              <Bloque titulo="Retiro">
                {t.retiro ? (
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <dl className="grid grid-cols-2 gap-3">
                      <Campo nombre="Retirado" valor={fecha(t.retiro.fechaRetiro, true) ?? "Pendiente"} />
                      <Campo nombre="Constancia" valor={t.constancia ? `Emitida el ${fecha(t.constancia.fechaEmision)}` : "Sin emitir"} />
                    </dl>
                    {t.constancia && (
                      <Button size="sm" variant="outline" disabled={constancia.descargandoId !== null} onClick={() => constancia.descargar(t.constancia!.id)}>
                        <Download className="h-3.5 w-3.5" />
                        Constancia PDF
                      </Button>
                    )}
                  </div>
                ) : (
                  <Aviso>Todavía no se asignó el retiro.</Aviso>
                )}
              </Bloque>
            )}

            <Bloque titulo="Lote y certificado">
              {t.lote ? (
                <div className="flex flex-col gap-3">
                  <dl className="grid grid-cols-2 gap-3">
                    <Campo nombre="Lote" valor={`#${t.lote.id}`} />
                    <Campo nombre="Peso bruto" valor={kg(t.lote.pesoBrutoKg) ?? "Sin pesar"} />
                    <Campo nombre="Certificado" valor={t.certificado ? `${t.certificado.numero ?? `#${t.certificado.id}`} · ${fecha(t.certificado.fechaEmision) ?? ""}` : "Sin emitir"} />
                    {t.certificado && <Campo nombre="Gestor ambiental" valor={t.certificado.gestor} />}
                  </dl>
                  {t.certificado && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={certificado.descargandoId !== null} onClick={() => certificado.descargar(t.certificado!.id)}>
                        <Download className="h-3.5 w-3.5" />
                        Certificado PDF
                      </Button>
                      {t.certificado.archivoFinalUrl && (
                        <a
                          href={t.certificado.archivoFinalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-muted"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Disposición final
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Aviso>La donación todavía no tiene lote.</Aviso>
              )}
            </Bloque>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
