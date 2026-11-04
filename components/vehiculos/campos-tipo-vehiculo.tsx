"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/ui/field"
import { enforceMaxLength } from "@/lib/utils/text-limit"
import { enforceDecimalInput } from "@/lib/utils/number-limit"
import { pesoLegible } from "@/lib/utils/helpers"
import type { CreateTipoVehiculoPayload, TipoVehiculo } from "@/lib/type/vehicle"

export type FormTipo = { descripcion: string; pesoMinimo: string; pesoMaximo: string }
export type ErroresTipo = Partial<Record<keyof FormTipo, string>>

export const TIPO_VACIO: FormTipo = { descripcion: "", pesoMinimo: "", pesoMaximo: "" }

const LARGO_DESCRIPCION = 35
const DIGITOS: Record<"pesoMinimo" | "pesoMaximo", number> = { pesoMinimo: 4, pesoMaximo: 4 }
const PESO_MINIMO_POR_DEFECTO = 1
const NOMBRE_PESO: Record<"pesoMinimo" | "pesoMaximo", string> = { pesoMinimo: "El peso mínimo", pesoMaximo: "El peso máximo" }

export const tipoAFormulario = (t: TipoVehiculo): FormTipo => ({
  descripcion: t.descripcion,
  pesoMinimo: pesoLegible(t.pesoMinimo),
  pesoMaximo: pesoLegible(t.pesoMaximo),
})

const minimoEfectivo = (f: FormTipo) => (f.pesoMinimo === "" ? PESO_MINIMO_POR_DEFECTO : Number(f.pesoMinimo))

export const tipoAPayload = (f: FormTipo): CreateTipoVehiculoPayload => ({
  descripcion: f.descripcion.trim(),
  pesoMinimo: minimoEfectivo(f),
  pesoMaximo: Number(f.pesoMaximo),
})

function revisarPeso(texto: string, digitos: number): string | undefined {
  if (texto === "") return undefined
  const valor = Number(texto)
  if (Number.isNaN(valor) || valor <= 0) return "Debe ser mayor a 0"
  if (texto.replace(/\D/g, "").length > digitos) return `No puede superar los ${digitos} dígitos`
  return undefined
}

export function revisarTipo(f: FormTipo): ErroresTipo {
  const errores: ErroresTipo = {}
  if (!f.descripcion.trim()) errores.descripcion = "Ingresá la descripción"
  else if (f.descripcion.length > LARGO_DESCRIPCION) errores.descripcion = `Máximo ${LARGO_DESCRIPCION} caracteres`

  const minimo = revisarPeso(f.pesoMinimo, DIGITOS.pesoMinimo)
  const maximo = f.pesoMaximo === "" ? "Ingresá el peso máximo" : revisarPeso(f.pesoMaximo, DIGITOS.pesoMaximo)
  if (minimo) errores.pesoMinimo = minimo
  if (maximo) errores.pesoMaximo = maximo
  if (!minimo && !maximo && minimoEfectivo(f) > Number(f.pesoMaximo)) {
    errores.pesoMaximo = "Tiene que ser mayor o igual al peso mínimo"
  }
  return errores
}

type Props = {
  form: FormTipo
  errores: ErroresTipo
  cambiar: (campo: keyof FormTipo, valor: string) => void
}

const conError = (error?: string) => cn(error && "border-destructive focus-visible:ring-destructive")

export function CamposTipoVehiculo({ form, errores, cambiar }: Props) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Descripción *</label>
        <Input
          value={form.descripcion}
          onChange={(e) => cambiar("descripcion", enforceMaxLength(e.target.value, LARGO_DESCRIPCION, "La descripción"))}
          placeholder="Ej: Camión, Camioneta, Auto..."
          className={conError(errores.descripcion)}
        />
        <FieldError>{errores.descripcion}</FieldError>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(["pesoMinimo", "pesoMaximo"] as const).map((campo) => (
          <div key={campo} className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              {campo === "pesoMinimo" ? (
                <>
                  Peso mínimo (kg) <span className="font-normal text-muted-foreground">(por defecto {PESO_MINIMO_POR_DEFECTO})</span>
                </>
              ) : (
                "Peso máximo (kg) *"
              )}
            </label>
            <Input
              inputMode="decimal"
              placeholder={campo === "pesoMinimo" ? String(PESO_MINIMO_POR_DEFECTO) : "Ej: 900"}
              value={form[campo]}
              onChange={(e) => cambiar(campo, enforceDecimalInput(e.target.value, DIGITOS[campo], NOMBRE_PESO[campo]))}
              className={conError(errores[campo])}
            />
            <FieldError>{errores[campo]}</FieldError>
          </div>
        ))}
      </div>
    </>
  )
}
