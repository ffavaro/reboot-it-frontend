"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useLotes } from "@/hooks/use-lote"
import { useGestoresAmbientales } from "@/hooks/use-gestor-ambiental"
import { useCreateCertificadoDisposicion } from "@/hooks/use-certificado-disposicion"
import { uploadFoto } from "@/lib/api/client"
import { textoDeError } from "@/lib/utils/helpers"
import type { Donacion } from "@/lib/type/donacion"

const ADMITIDOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MB_MAXIMOS = 5

type Props = {
  donacion: Donacion | null
  alCerrar: () => void
  alEmitir: () => void | Promise<void>
}

export function EmitirCertificado(props: Props) {
  if (!props.donacion) return null
  return <FormularioCertificado key={props.donacion.id} {...props} donacion={props.donacion} />
}

function FormularioCertificado({ donacion, alCerrar, alEmitir }: Props & { donacion: Donacion }) {
  const { lotes } = useLotes()
  const { gestores } = useGestoresAmbientales()
  const { createCertificado } = useCreateCertificadoDisposicion()

  const [gestorId, setGestorId] = useState("")
  const [terminos, setTerminos] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errores, setErrores] = useState<{ gestor?: string; archivo?: string }>({})
  const [enviando, setEnviando] = useState(false)

  const lote = lotes.find((l) => l.donacionId === donacion.id)

  function elegirArchivo(elegido: File | undefined) {
    if (!elegido) return
    if (!ADMITIDOS.includes(elegido.type)) {
      setErrores((e) => ({ ...e, archivo: "El archivo debe ser una imagen JPG, PNG o WEBP, o un PDF" }))
      return
    }
    if (elegido.size > MB_MAXIMOS * 1024 * 1024) {
      setErrores((e) => ({ ...e, archivo: `El archivo no puede superar los ${MB_MAXIMOS} MB` }))
      return
    }
    setErrores((e) => ({ ...e, archivo: undefined }))
    setArchivo(elegido)
  }

  async function emitir() {
    const faltan = {
      gestor: gestorId ? undefined : "Elegí el gestor ambiental",
      archivo: archivo ? undefined : "Subí el certificado de disposición final (foto o PDF)",
    }
    setErrores(faltan)
    if (!lote) {
      toast.error("La donación no tiene un lote asociado")
      return
    }
    if (faltan.gestor || faltan.archivo || !archivo) return
    setEnviando(true)
    try {
      const archivoFinalUrl = await uploadFoto(archivo)
      await createCertificado({
        loteId: lote.id,
        gestorAmbientalId: Number(gestorId),
        terminosCondiciones: terminos.trim() || undefined,
        archivoFinalUrl,
      })
      toast.success("Certificado emitido: la donación quedó finalizada")
      await alEmitir()
      alCerrar()
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo emitir el certificado"))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <FormModal
      open
      onOpenChange={(abierto) => !abierto && alCerrar()}
      title="Emitir certificado de disposición"
      description={`Donación #${donacion.id}${donacion.donante?.nombre ? ` de ${donacion.donante.nombre}` : ""}. Al emitirlo, la donación se finaliza.`}
      onSave={emitir}
      isLoading={enviando}
      saveLabel="Emitir certificado"
    >
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Lote</span>
        <span className="font-medium">
          {lote ? `#${lote.id}${lote.pesoBrutoKg != null ? ` · ${Number(lote.pesoBrutoKg).toLocaleString("es-AR")} kg` : ""}` : "Sin lote asociado"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Gestor ambiental *</label>
        <select
          value={gestorId}
          onChange={(e) => {
            setGestorId(e.target.value)
            setErrores((x) => ({ ...x, gestor: undefined }))
          }}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— Seleccionar gestor —</option>
          {gestores.map((g) => (
            <option key={g.id} value={g.id}>{g.razonSocial}</option>
          ))}
        </select>
        <FieldError>{errores.gestor}</FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Términos y condiciones <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          rows={2}
          value={terminos}
          onChange={(e) => setTerminos(e.target.value)}
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Certificado de disposición final * <span className="font-normal text-muted-foreground">(foto o PDF, hasta {MB_MAXIMOS} MB)</span></label>
        <input
          type="file"
          accept={ADMITIDOS.join(",")}
          onChange={(e) => elegirArchivo(e.target.files?.[0])}
          className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1 file:text-xs file:font-medium"
        />
        {archivo && !errores.archivo && <span className="text-xs text-muted-foreground">{archivo.name}</span>}
        <FieldError>{errores.archivo}</FieldError>
      </div>
    </FormModal>
  )
}
