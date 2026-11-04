"use client"

import { getUser } from "@/lib/auth-utils"
import { ROLES_CON_VISTA_GLOBAL } from "@/lib/utils/hoja-ruta"
import { VistaAdministrativo } from "./vista-administrativo"
import { VistaTransportista } from "./vista-transportista"

export default function HojaRutaPage() {
  const rol = getUser()?.rol?.nombre?.toLowerCase() ?? ""
  return ROLES_CON_VISTA_GLOBAL.includes(rol) ? <VistaAdministrativo /> : <VistaTransportista />
}

