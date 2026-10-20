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

type CuitDniFieldProps = FieldProps<"cuitDni"> & { requerido?: boolean }

// CUIT/DNI: solo números positivos (se descarta cualquier otro carácter)
export function CuitDniField({ value, error, onChange, requerido = true }: CuitDniFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">CUIT / DNI{requerido ? " *" : ""}</label>
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
