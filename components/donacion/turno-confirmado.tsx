"use client"

import { diaYHoraLargo } from "@/lib/utils/fechas"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export type ResumenTurno = {
  donacionId: number
  turnoId: number | null
  donante: string
  fechaHora: string
  modalidad: string
  direccion: string | null
  pesoKg: number | null
  materiales: { nombre: string; cantidad: string }[]
  fotos: number
}

function Fila({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{nombre}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

export function TurnoConfirmado({ resumen, alCerrar }: { resumen: ResumenTurno | null; alCerrar: () => void }) {
  return (
    <Dialog open={resumen !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        {resumen && (
          <>
            <DialogHeader className="items-center text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <DialogTitle>¡Turno confirmado!</DialogTitle>
              <DialogDescription>
                Donación #{resumen.donacionId}
                {resumen.turnoId ? ` · turno #${resumen.turnoId}` : ""}.
              </DialogDescription>
            </DialogHeader>

            <dl className="divide-y rounded-lg border px-4 text-sm">
              <Fila nombre="Donante">{resumen.donante}</Fila>
              <Fila nombre="Fecha y hora">
                {diaYHoraLargo(resumen.fechaHora)}
              </Fila>
              <Fila nombre="Entrega">{resumen.modalidad}</Fila>
              {resumen.direccion && <Fila nombre="Dirección">{resumen.direccion}</Fila>}
              {resumen.pesoKg != null && <Fila nombre="Peso estimado">{resumen.pesoKg.toLocaleString("es-AR")} kg</Fila>}
              <Fila nombre="Materiales">
                {resumen.materiales.map((m, i) => (
                  <span key={i} className="block">{m.nombre} · {m.cantidad}</span>
                ))}
              </Fila>
              {resumen.fotos > 0 && <Fila nombre="Fotos">{resumen.fotos} adjunta{resumen.fotos !== 1 ? "s" : ""}</Fila>}
            </dl>

            <DialogFooter>
              <Button onClick={alCerrar}>Entendido</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
