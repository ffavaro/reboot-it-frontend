"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/ui/field"
import { kmLegible, soloDigitosKm } from "@/lib/utils/helpers"

type Props = {
  valor: string
  error?: string
  registrado?: number | null
  alCambiar: (valor: string) => void
}

export function CampoKilometraje({ valor, error, registrado, alCambiar }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">Kilometraje actual (km) *</label>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="85000"
        value={valor}
        onChange={(e) => alCambiar(soloDigitosKm(e.target.value))}
        className={cn("tabular-nums", error && "border-destructive focus-visible:ring-destructive")}
      />
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        registrado != null && (
          <p className="text-xs text-muted-foreground">
            Registrado: {kmLegible(registrado)}. Al finalizar cada hoja de ruta se actualiza solo.
          </p>
        )
      )}
    </div>
  )
}
