"use client"

import { cn } from "@/lib/utils"
import { FieldError } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { COMBUSTIBLES } from "@/lib/type/vehicle"
import { problemaKm } from "@/lib/utils/helpers"
import { CampoKilometraje } from "./campo-kilometraje"
import { EstadoItv } from "./estado-itv"

export type DatosTecnicos = { tipoCombustible: string; kilometraje: string; itvVencimiento: string }
export type ErroresTecnicos = Partial<Record<keyof DatosTecnicos, string>>

export const TECNICOS_VACIOS: DatosTecnicos = { tipoCombustible: "", kilometraje: "", itvVencimiento: "" }

export function revisarTecnicos(datos: DatosTecnicos, kmRegistrado: number | null = null): ErroresTecnicos {
  const errores: ErroresTecnicos = {}
  if (!datos.tipoCombustible) errores.tipoCombustible = "Seleccioná el tipo de combustible"
  const km = problemaKm(datos.kilometraje, kmRegistrado)
  if (km) errores.kilometraje = km
  if (!datos.itvVencimiento) errores.itvVencimiento = "Ingresá el vencimiento de la ITV"
  return errores
}

type Props = {
  valores: DatosTecnicos
  errores: ErroresTecnicos
  kmRegistrado?: number | null
  cambiar: (campo: keyof DatosTecnicos, valor: string) => void
}

export function CamposTecnicos({ valores, errores, kmRegistrado, cambiar }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de combustible *</label>
          <select
            value={valores.tipoCombustible}
            onChange={(e) => cambiar("tipoCombustible", e.target.value)}
            className={cn(
              "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
              errores.tipoCombustible ? "border-destructive" : "border-input",
            )}
          >
            <option value="">— Seleccionar —</option>
            {COMBUSTIBLES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FieldError>{errores.tipoCombustible}</FieldError>
        </div>

        <CampoKilometraje
          valor={valores.kilometraje}
          error={errores.kilometraje}
          registrado={kmRegistrado}
          alCambiar={(valor) => cambiar("kilometraje", valor)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          Vencimiento de la ITV *
          <EstadoItv vencimiento={valores.itvVencimiento} />
        </label>
        <DatePicker
          variant="field"
          value={valores.itvVencimiento}
          onChange={(valor) => cambiar("itvVencimiento", valor)}
          aria-label="Vencimiento de la ITV"
          error={!!errores.itvVencimiento}
        />
        <FieldError>{errores.itvVencimiento}</FieldError>
      </div>
    </>
  )
}
