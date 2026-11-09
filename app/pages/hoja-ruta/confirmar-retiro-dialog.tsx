"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useConfirmarRetiro } from "@/hooks/use-hoja-ruta"
import { useCreateRegistroFotografico } from "@/hooks/use-registro-fotografico"
import { uploadFoto } from "@/lib/api/client"
import { textoDeError } from "@/lib/utils/helpers"
import type { ParadaHojaRuta, ResultadoRetiro } from "@/lib/type/hoja-ruta"

const TIPOS_FOTO = /^image\/(jpeg|png|webp)$/
const MAX_BYTES = 5 * 1024 * 1024

export function ConfirmarRetiroDialog({
  parada, onClose, onConfirmado,
}: {
  parada: ParadaHojaRuta | null
  onClose: () => void
  onConfirmado: (resultado: ResultadoRetiro) => void
}) {
  const { confirmarRetiro, isLoading } = useConfirmarRetiro()
  const { createRegistro } = useCreateRegistroFotografico()
  const [foto, setFoto] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [subiendo, setSubiendo] = useState(false)

  function cerrar() {
    setFoto(null)
    setError("")
    onClose()
  }

  function elegirFoto(archivo: File | undefined) {
    if (!archivo) return
    if (!TIPOS_FOTO.test(archivo.type)) {
      setError("La foto debe ser una imagen JPG, PNG o WEBP")
      return
    }
    if (archivo.size > MAX_BYTES) {
      setError("La foto no puede superar los 5 MB")
      return
    }
    setError("")
    setFoto(archivo)
  }

  async function confirmar() {
    if (!parada) return
    setError("")
    try {
      if (foto) {
        setSubiendo(true)
        const urlImagen = await uploadFoto(foto)
        await createRegistro({ turnoId: parada.turnoId, urlImagen })
      }
      const resultado = await confirmarRetiro(parada.turnoId)
      toast.success(
        resultado.hojaFinalizada
          ? "Retiro confirmado. Era el último turno: la hoja de ruta quedó finalizada"
          : "Retiro confirmado. Se generó la constancia de retiro",
      )
      setFoto(null)
      onConfirmado(resultado)
    } catch (e) {
      setError(textoDeError(e, "No se pudo confirmar el retiro"))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <FormModal
      open={!!parada}
      onOpenChange={(abierto) => { if (!abierto) cerrar() }}
      title="Confirmar retiro"
      description="Al confirmar se genera la constancia de retiro de este turno."
      onSave={confirmar}
      isLoading={isLoading || subiendo}
      saveLabel="Confirmar retiro"
    >
      {parada && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <p className="font-medium">{parada.donante}</p>
          <p className="text-muted-foreground">{parada.direccion || "Sin dirección cargada"}</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Foto de los materiales{" "}
          <span className="font-normal text-muted-foreground">(obligatoria si el donante no cargó ninguna)</span>
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => elegirFoto(e.target.files?.[0])}
          className="cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium"
        />
        {foto && <p className="text-xs text-muted-foreground">Seleccionada: {foto.name}</p>}
        <FieldError>{error}</FieldError>
      </div>
    </FormModal>
  )
}