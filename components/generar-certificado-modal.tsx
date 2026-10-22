"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { FormModal } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { useLotes } from "@/hooks/use-lote"
import { useGestoresAmbientales } from "@/hooks/use-gestor-ambiental"
import { useCreateCertificadoDisposicion } from "@/hooks/use-certificado-disposicion"
import { uploadFoto } from "@/lib/api/client"
import { getErrorMessage } from "@/lib/utils/helpers"
import type { Donacion } from "@/lib/type/donacion"
import type { Lote } from "@/lib/type/lote"
import type { GestorAmbiental } from "@/lib/type/gestor-ambiental"

const SELECT = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

/**
 * Certificado de disposición de una donación (se abre desde la grilla de Donaciones). Emitirlo finaliza la donación.
 * El lote es el de la donación; el N° y la fecha de emisión los genera el sistema.
 */
export function GenerarCertificadoModal({
  donacion, onClose, onGenerado,
}: {
  donacion: Donacion | null
  onClose: () => void
  onGenerado: () => void | Promise<void>
}) {
  const { lotes } = useLotes()
  const { gestores } = useGestoresAmbientales()
  const { createCertificado, isLoading } = useCreateCertificadoDisposicion()
  const [gestorId, setGestorId] = useState("")
  const [terminos, setTerminos] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoError, setArchivoError] = useState("")
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    if (donacion) { setGestorId(""); setTerminos(""); setArchivo(null); setArchivoError("") }
  }, [donacion])

  const lote = donacion ? lotes.find((l: Lote) => l.donacionId === donacion.id) : undefined

  function elegirArchivo(file: File | undefined) {
    if (!file) return
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) {
      setArchivoError("El archivo debe ser una imagen JPG, PNG o WEBP, o un PDF")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setArchivoError("El archivo no puede superar los 5 MB")
      return
    }
    setArchivoError("")
    setArchivo(file)
  }

  async function guardar() {
    if (!lote) { toast.error("La donación no tiene un lote asociado"); return }
    if (!gestorId) { toast.error("Seleccioná el gestor ambiental"); return }
    if (!archivo) { setArchivoError("Subí el certificado de disposición final (foto o PDF)"); return }
    try {
      setSubiendo(true)
      const archivoFinalUrl = await uploadFoto(archivo)
      await createCertificado({
        loteId: lote.id,
        gestorAmbientalId: Number(gestorId),
        terminosCondiciones: terminos.trim() || undefined,
        archivoFinalUrl,
      })
      toast.success("Certificado generado: la donación quedó finalizada")
      await onGenerado()
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo generar el certificado"))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <FormModal
      open={!!donacion}
      onOpenChange={(abierto) => { if (!abierto) onClose() }}
      title="Certificado de disposición"
      description={donacion ? `Se emite el certificado de la donación #${donacion.id} y se finaliza la donación.` : undefined}
      onSave={guardar}
      isLoading={isLoading || subiendo}
      saveDisabled={!lote || !gestorId || !archivo}
      saveLabel="Generar certificado"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote</label>
          <Input
            value={lote ? `Lote #${lote.id}${lote.pesoBrutoKg ? ` — ${lote.pesoBrutoKg} kg` : ""}` : "Sin lote asociado"}
            readOnly
            className="bg-muted cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Gestor ambiental *</label>
          <select value={gestorId} onChange={(e) => setGestorId(e.target.value)} className={SELECT}>
            <option value="">Seleccionar gestor...</option>
            {gestores.map((g: GestorAmbiental) => (
              <option key={g.id} value={String(g.id)}>
                {g.razonSocial}{g.cuit ? ` — ${g.cuit}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium">
            Certificado de disposición final * <span className="text-muted-foreground font-normal">(foto o PDF, hasta 5 MB)</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => elegirArchivo(e.target.files?.[0])}
            className="text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium cursor-pointer"
          />
          {archivo && <p className="text-xs text-muted-foreground">Seleccionado: {archivo.name}</p>}
          {archivoError && <p className="text-xs text-destructive">{archivoError}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium">
            Términos COD <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={terminos}
            onChange={(e) => setTerminos(e.target.value)}
            placeholder="Ej: Material procesado conforme normativa vigente"
            maxLength={500}
          />
        </div>
      </div>
    </FormModal>
  )
}
