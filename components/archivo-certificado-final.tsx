"use client"

import { useId } from "react"
import { ExternalLink, FileUp, Paperclip, X } from "lucide-react"

export const TIPOS_ARCHIVO_FINAL = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
export const LIMITE_ARCHIVO_FINAL_MB = 5

export function validarArchivoFinal(archivo: File): string | null {
  if (!TIPOS_ARCHIVO_FINAL.includes(archivo.type)) return "Solo se aceptan imágenes JPG, PNG o WEBP, o un PDF."
  if (archivo.size > LIMITE_ARCHIVO_FINAL_MB * 1024 * 1024) return `El archivo supera los ${LIMITE_ARCHIVO_FINAL_MB} MB.`
  return null
}

export function EnlaceArchivoFinal({ url, compacto = false }: { url: string | null; compacto?: boolean }) {
  if (!url) {
    return compacto
      ? <span className="italic text-muted-foreground">—</span>
      : <p className="text-sm italic text-muted-foreground">Este certificado no tiene archivo adjunto.</p>
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={
        compacto
          ? "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          : "pointer-events-auto inline-flex w-fit items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted"
      }
    >
      <ExternalLink className={compacto ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {compacto ? "Ver archivo" : "Abrir certificado final"}
    </a>
  )
}

interface SelectorArchivoFinalProps {
  archivo: File | null
  error: string | null
  onElegir: (archivo: File | null) => void
}

export function SelectorArchivoFinal({ archivo, error, onElegir }: SelectorArchivoFinalProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      {archivo ? (
        <div className="flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{archivo.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{(archivo.size / 1024 / 1024).toFixed(2)} MB</span>
          <button
            type="button"
            onClick={() => onElegir(null)}
            className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input px-3 py-4 text-sm text-muted-foreground hover:bg-muted/40"
        >
          <FileUp className="h-4 w-4" />
          Elegir foto o PDF (hasta {LIMITE_ARCHIVO_FINAL_MB} MB)
        </label>
      )}
      <input
        id={id}
        type="file"
        className="sr-only"
        accept={TIPOS_ARCHIVO_FINAL.join(",")}
        onChange={(e) => {
          onElegir(e.target.files?.[0] ?? null)
          e.target.value = ""
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
