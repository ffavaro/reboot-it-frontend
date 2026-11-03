"use client"

import { useCallback, useState } from "react"
import { toast } from "react-toastify"

function motivo(error: unknown, alternativo: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const { message } = error as { message: unknown }
    if (Array.isArray(message)) return message.join(". ")
    if (typeof message === "string" && message.trim()) return message
  }
  return alternativo
}

export function useDescargaDocumento<D>(
  obtenerDatos: (id: number) => Promise<D>,
  generar: (datos: D) => Promise<void>,
  mensajeError: string,
) {
  const [enCurso, setEnCurso] = useState<number | null>(null)

  const descargar = useCallback(
    async (id: number) => {
      if (enCurso !== null) return
      setEnCurso(id)
      try {
        await generar(await obtenerDatos(id))
      } catch (error) {
        toast.error(motivo(error, mensajeError))
      } finally {
        setEnCurso(null)
      }
    },
    [enCurso, obtenerDatos, generar, mensajeError],
  )

  return { descargar, descargandoId: enCurso }
}
