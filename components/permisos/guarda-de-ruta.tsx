"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock, RotateCw } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useMisPermisos } from "@/hooks/use-permisos"
import { pantallaDeRuta, puedeVerRuta } from "@/lib/type/pantallas"
import { primeraRutaPermitida } from "@/lib/type/menu"

function Aviso({ titulo, texto, children }: { titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center shadow-sm">
      <Lock className="h-8 w-8 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold">{titulo}</h1>
      <p className="text-sm text-muted-foreground">{texto}</p>
      {children}
    </div>
  )
}

export function GuardaDeRuta({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { permisos, cargando, error, recargar } = useMisPermisos()

  if (pantallaDeRuta(pathname) === null) return <>{children}</>

  if (error) {
    return (
      <Aviso titulo="No se pudieron cargar tus permisos" texto="Revisá tu conexión y volvé a intentarlo.">
        <Button variant="outline" onClick={() => recargar()}>
          <RotateCw className="h-4 w-4" />
          Reintentar
        </Button>
      </Aviso>
    )
  }

  if (cargando || !permisos) {
    return <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
  }

  if (!puedeVerRuta(permisos, pathname)) {
    return (
      <Aviso titulo="No tenés acceso a esta pantalla" texto="Si la necesitás, pedile a un administrador que te dé permiso desde Roles y permisos.">
        <Link href={primeraRutaPermitida(permisos)} className={buttonVariants({ variant: "outline" })}>
          Ir a mi inicio
        </Link>
      </Aviso>
    )
  }

  return <>{children}</>
}
