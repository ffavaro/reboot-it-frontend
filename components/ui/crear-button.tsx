"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { usePermisosPantalla } from "@/components/permisos-pantalla"

/** Botón "Nuevo ...": solo se muestra si el rol puede crear en la pantalla actual. */
// soloPleno: se oculta si el rol solo puede crear sobre lo propio o lo asignado (ej. un transportista no da de alta vehículos)
export function CrearButton({ soloPleno = false, ...props }: React.ComponentProps<typeof Button> & { soloPleno?: boolean }) {
  const permisos = usePermisosPantalla()
  if (!permisos.puede("crear")) return null
  if (soloPleno && permisos.alcance("crear") !== "PLENO") return null
  return <Button {...props} />
}
