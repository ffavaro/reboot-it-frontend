"use client"

import * as React from "react"
import { claveDeRuta, puede } from "@/lib/nav"
import type { AccionPermiso, Alcance, Permisos } from "@/lib/type/permisos"

type Ctx = {
  clave: string | null
  puede: (accion: AccionPermiso) => boolean
  alcance: (accion: AccionPermiso) => Alcance
}

// Sin proveedor (fuera del layout de pantallas) no se restringe nada: el backend igual valida cada acción.
const PermisosPantallaContext = React.createContext<Ctx>({ clave: null, puede: () => true, alcance: () => "PLENO" })

/** Deja a las pantallas saber qué puede hacer el usuario sobre la pantalla actual (crear, editar, dar de baja). */
export function PermisosPantallaProvider({
  permisos, pathname, children,
}: { permisos: Permisos | undefined; pathname: string; children: React.ReactNode }) {
  const value = React.useMemo<Ctx>(() => {
    const clave = claveDeRuta(pathname)
    return {
      clave,
      puede: (accion) => puede(permisos, clave, accion),
      alcance: (accion) => (clave && permisos?.[clave]?.[accion]) || "NINGUNO",
    }
  }, [permisos, pathname])
  return <PermisosPantallaContext.Provider value={value}>{children}</PermisosPantallaContext.Provider>
}

export const usePermisosPantalla = () => React.useContext(PermisosPantallaContext)
