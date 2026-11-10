"use client"

import { useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { DateInput } from "@/components/ui/date-input"
import { FieldError } from "@/components/ui/field"
import { VigenciaCarnet } from "./estado-carnet"
import { CampoCarnetProps,  CARNET_MAX_MB, CARNET_TIPOS, CARNET_MAX_BYTES } from "@/lib/type/empleado-transportista"

export function problemaFotoCarnet(file: File): string | null {
  if (!CARNET_TIPOS.includes(file.type)) return "Solo se permiten imágenes JPG, PNG o WEBP"
  if (file.size > CARNET_MAX_BYTES) return `La imagen no puede superar los ${CARNET_MAX_MB} MB`
  return null
}

export function CampoCarnet({
  vencimiento,
  onVencimiento,
  errorVencimiento,
  fotoActual,
  archivo,
  onArchivo,
  errorFoto,
  onErrorFoto,
  soloLectura,
}: CampoCarnetProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const vistaPrevia = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo])

  useEffect(() => {
    if (!archivo && inputRef.current) inputRef.current.value = ""
  }, [archivo])

  useEffect(() => {
    if (!vistaPrevia) return
    return () => URL.revokeObjectURL(vistaPrevia)
  }, [vistaPrevia])

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const elegido = e.target.files?.[0] ?? null
    if (!elegido) {
      onArchivo(null)
      onErrorFoto("")
      return
    }
    const problema = problemaFotoCarnet(elegido)
    if (problema) e.target.value = ""
    onErrorFoto(problema ?? "")
    onArchivo(problema ? null : elegido)
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <p className="text-sm font-semibold">Carnet de conducir</p>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          Vencimiento del carnet *
          <VigenciaCarnet vencimiento={vencimiento} />
        </label>
        <DateInput
          value={vencimiento}
          onChange={onVencimiento}
          aria-label="Vencimiento del carnet de conducir"
          className={cn(errorVencimiento && "border-destructive")}
        />
        <FieldError>{errorVencimiento}</FieldError>
      </div>

      {fotoActual && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Foto del carnet actual</p>
          <a href={fotoActual} target="_blank" rel="noopener noreferrer" className="pointer-events-auto w-fit">
            <img
              src={fotoActual}
              alt="Carnet de conducir"
              className="h-32 w-auto rounded-md border border-border object-contain transition-opacity hover:opacity-80"
            />
          </a>
        </div>
      )}

      {!soloLectura && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            {fotoActual ? "Reemplazar foto del carnet" : "Foto del carnet *"}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (JPG, PNG o WEBP, máx. {CARNET_MAX_MB} MB{fotoActual ? ", opcional" : ""})
            </span>
          </label>
          <input
            ref={inputRef}
            type="file"
            accept={CARNET_TIPOS.join(",")}
            onChange={elegirArchivo}
            aria-label="Foto del carnet de conducir"
            className="cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium"
          />
          {vistaPrevia && (
            <img
              src={vistaPrevia}
              alt="Vista previa del carnet"
              className="h-32 w-auto rounded-md border border-border object-contain"
            />
          )}
          <FieldError>{errorFoto}</FieldError>
        </div>
      )}
    </div>
  )
}
