"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { todayISO } from "@/lib/utils/helpers"
import { enforceMaxLength } from "@/lib/utils/text-limit"

export const DIRECCION_MAX = 100

export type EmpleadoDatosValues = {
  cuitDni: string
  fechaAlta: string
  direccion: string
}

type FieldProps<K extends keyof EmpleadoDatosValues> = {
  value: string
  error?: string
  onChange: (field: K, value: string) => void
}

// CUIT/DNI: solo números positivos (se descarta cualquier otro carácter)
export function CuitDniField({ value, error, onChange }: FieldProps<"cuitDni">) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">CUIT / DNI *</label>
      <Input
        value={value}
        onChange={(e) => onChange("cuitDni", e.target.value.replace(/\D/g, "").slice(0, 11))}
        placeholder="30123456"
        inputMode="numeric"
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      <FieldError>{error}</FieldError>
    </div>
  )
}

export function FechaAltaField({ value, error, onChange }: FieldProps<"fechaAlta">) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Fecha de alta *</label>
      <DatePicker
        variant="field"
        value={value}
        max={todayISO()}
        onChange={(v) => onChange("fechaAlta", v)}
        aria-label="Fecha de alta"
      />
      <FieldError>{error}</FieldError>
    </div>
  )
}

export function DireccionField({ value, error, onChange }: FieldProps<"direccion">) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Dirección *</label>
      <Input
        value={value}
        onChange={(e) => onChange("direccion", enforceMaxLength(e.target.value, DIRECCION_MAX, "La dirección"))}
        placeholder="Av. Corrientes 1234, CABA"
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      <FieldError>{error}</FieldError>
    </div>
  )
}

type Props = {
  values: EmpleadoDatosValues
  errors: Partial<Record<keyof EmpleadoDatosValues, string>>
  onChange: (field: keyof EmpleadoDatosValues, value: string) => void
}

// Los tres campos juntos: se usan en el alta rápida de empleado desde Usuarios.
// El ABM de Empleados los reparte en dos columnas con los componentes individuales.
export function EmpleadoDatosFields({ values, errors, onChange }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <CuitDniField value={values.cuitDni} error={errors.cuitDni} onChange={onChange} />
        <FechaAltaField value={values.fechaAlta} error={errors.fechaAlta} onChange={onChange} />
      </div>
      <DireccionField value={values.direccion} error={errors.direccion} onChange={onChange} />
    </>
  )
}
