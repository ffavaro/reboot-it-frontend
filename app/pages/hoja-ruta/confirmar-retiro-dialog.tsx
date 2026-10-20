"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useConfirmarRetiro } from "@/hooks/use-hoja-ruta"
import { useCreateRegistroFotografico } from "@/hooks/use-registro-fotografico"
import { uploadFoto } from "@/lib/api/client"
import { getErrorMessage } from "@/lib/utils/helpers"
import type { ConfirmarRetiroResultado, ParadaHojaRuta } from "@/lib/type/hoja-ruta"

/**
 * Confirma el retiro de un turno de la hoja de ruta. Los materiales necesitan al menos una foto: si el donante
 * ya cargó alguna alcanza, y si no se puede sumar una acá mismo.
 */
export function ConfirmarRetiroDialog({
  parada, onClose, onConfirmado,
}: {
  parada: ParadaHojaRuta | null
  onClose: () => void
  onConfirmado: (resultado: ConfirmarRetiroResultado) => void
}) {
  const { confirmarRetiro, isLoading } = useConfirmarRetiro()
  const { createRegistro } = useCreateRegistroFotografico()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [subiendo, setSubiendo] = useState(false)

  function cerrar() {
    setArchivo(null)
    setError("")
    onClose()
  }

  function elegir(file: File | undefined) {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("La foto debe ser una imagen JPG, PNG o WEBP")
    if (file.size > 5 * 1024 * 1024) return setError("La foto no puede superar los 5 MB")
    setError("")
    setArchivo(file)
  }

  async function confirmar() {
    if (!parada) return
    setError("")
    try {
      if (archivo) {
        setSubiendo(true)
        const url = await uploadFoto(archivo)
        await createRegistro({ turnoId: parada.turnoId, urlImagen: url })
      }
      const resultado = await confirmarRetiro(parada.turnoId)
      toast.success(resultado.hojaFinalizada ? "Retiro confirmado. Era el último turno: la hoja de ruta quedó finalizada" : "Retiro confirmado. Se generó la constancia de retiro")
      setArchivo(null)
      onConfirmado(resultado)
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo confirmar el retiro"))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <FormModal
      open={!!parada}
      onOpenChange={(v) => { if (!v) cerrar() }}
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
          Foto de los materiales <span className="font-normal text-muted-foreground">(obligatoria si el donante no cargó ninguna)</span>
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => elegir(e.target.files?.[0])}
          className="text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium cursor-pointer"
        />
        {archivo && <p className="text-xs text-muted-foreground">Seleccionada: {archivo.name}</p>}
        <FieldError>{error}</FieldError>
      </div>
    </FormModal>
  )
}
