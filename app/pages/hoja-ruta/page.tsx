"use client"

import { useEffect, useState } from "react"
import { getUser } from "@/lib/auth-utils"
import type { TokenPayload } from "@/lib/auth-utils"
import { VistaAdministrativo } from "./vista-administrativo"
import { VistaTransportista } from "./visa-transportista"

export default function HojaRutaPage() {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    setUser(getUser())
    setListo(true)
  }, [])

  if (!listo) return null

  const esTransportista = user?.rol?.nombre?.toLowerCase() === "transportista"
  return esTransportista ? <VistaTransportista /> : <VistaAdministrativo />
}
