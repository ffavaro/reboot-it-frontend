"use client"

import { ImagePlus, X } from "lucide-react"
import { toast } from "react-toastify"
import { FOTOS_MAXIMAS, FORMATOS_FOTO, MB_POR_FOTO, problemaConFoto } from "@/lib/utils/text-limit"

export type FotoElegida = { archivo: File; vista: string }

type Props = {
  fotos: FotoElegida[]
  alCambiar: (fotos: FotoElegida[]) => void
}

export function liberarFotos(fotos: FotoElegida[]) {
  fotos.forEach((f) => URL.revokeObjectURL(f.vista))
}

export function FotosMateriales({ fotos, alCambiar }: Props) {
  function sumar(lista: FileList | null) {
    if (!lista) return
    const lugar = FOTOS_MAXIMAS - fotos.length
    const nuevas: FotoElegida[] = []
    for (const archivo of Array.from(lista)) {
      const problema = problemaConFoto(archivo)
      if (problema) {
        toast.error(problema)
        continue
      }
      if (nuevas.length >= lugar) {
        toast.error(`Podés cargar hasta ${FOTOS_MAXIMAS} fotos`, { toastId: "tope-fotos" })
        break
      }
      nuevas.push({ archivo, vista: URL.createObjectURL(archivo) })
    }
    if (nuevas.length) alCambiar([...fotos, ...nuevas])
  }

  function quitar(foto: FotoElegida) {
    URL.revokeObjectURL(foto.vista)
    alCambiar(fotos.filter((f) => f !== foto))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          Fotos de los materiales{" "}
          <span className="font-normal text-muted-foreground">(opcional, hasta {FOTOS_MAXIMAS} · {MB_POR_FOTO} MB c/u)</span>
        </span>
        {fotos.length < FOTOS_MAXIMAS && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted">
            <ImagePlus className="h-3.5 w-3.5" />
            Agregar fotos
            <input
              type="file"
              accept={FORMATOS_FOTO.join(",")}
              multiple
              className="sr-only"
              onChange={(e) => {
                sumar(e.target.files)
                e.target.value = ""
              }}
            />
          </label>
        )}
      </div>

      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((foto) => (
            <div key={foto.vista} className="relative">
              <img src={foto.vista} alt="Foto de los materiales" className="h-20 w-20 rounded-md border object-cover" />
              <button
                type="button"
                onClick={() => quitar(foto)}
                aria-label="Quitar foto"
                className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 shadow ring-1 ring-border hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
