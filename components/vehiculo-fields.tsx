"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { VigenciaBadge } from "@/components/ui/vigencia-badge"
import { TIPOS_COMBUSTIBLE } from "@/lib/type/vehicle"

export const KILOMETRAJE_MAX_DIGITS = 7

export type VehiculoInfoValues = {
  itvVencimiento: string
  kilometraje: string
  tipoCombustible: string
}

type Props = {
  values: VehiculoInfoValues
  errors: Partial<Record<keyof VehiculoInfoValues, string>>
  onChange: (field: keyof VehiculoInfoValues, value: string) => void
}

// Campos de información completa del vehículo: ITV, kilometraje y combustible.
// Se comparten entre el alta de vehículos y el alta rápida desde Empleados transportistas.
export function VehiculoInfoFields({ values, errors, onChange }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de combustible *</label>
          <select
            value={values.tipoCombustible}
            onChange={(e) => onChange("tipoCombustible", e.target.value)}
            className={cn(
              "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
              errors.tipoCombustible ? "border-destructive" : "border-input",
            )}
          >
            <option value="">— Seleccionar —</option>
            {TIPOS_COMBUSTIBLE.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FieldError>{errors.tipoCombustible}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Kilometraje (km) *</label>
          <Input
            value={values.kilometraje}
            onChange={(e) => onChange("kilometraje", e.target.value.replace(/\D/g, "").slice(0, KILOMETRAJE_MAX_DIGITS))}
            placeholder="85000"
            inputMode="numeric"
            className={cn(errors.kilometraje && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.kilometraje}</FieldError>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          Vencimiento de la ITV *
          <VigenciaBadge fecha={values.itvVencimiento} />
        </label>
        <DatePicker
          variant="field"
          value={values.itvVencimiento}
          onChange={(v) => onChange("itvVencimiento", v)}
          placeholder="Seleccionar fecha"
          aria-label="Vencimiento de la ITV"
        />
        <FieldError>{errors.itvVencimiento}</FieldError>
      </div>
    </>
  )
}
