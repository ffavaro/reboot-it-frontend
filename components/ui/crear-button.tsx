"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { usePermisosPantalla } from "@/components/permisos-pantalla"

/** Botón "Nuevo ...": solo se muestra si el rol puede crear en la pantalla actual. */
export function CrearButton(props: React.ComponentProps<typeof Button>) {
  const permisos = usePermisosPantalla()
  if (!permisos.puede("crear")) return null
  return <Button {...props} />
}
