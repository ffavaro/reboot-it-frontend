"use client"

import { useMemo, useSyncExternalStore } from "react"
import { getToken, getUser, type TokenPayload } from "@/lib/auth-utils"

const sinCambios = () => () => {}
const sinTokenEnServidor = () => null

export function useUsuarioSesion(): { usuario: TokenPayload | null; esDonante: boolean } {
  const token = useSyncExternalStore(sinCambios, getToken, sinTokenEnServidor)
  return useMemo(() => {
    const usuario = token ? getUser() : null
    return { usuario, esDonante: usuario?.rol?.nombre?.trim().toLowerCase() === "donante" }
  }, [token])
}
