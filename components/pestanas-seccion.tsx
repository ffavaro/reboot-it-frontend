"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ubicarRuta } from "@/lib/type/menu"
import { useMisPermisos } from "@/hooks/use-permisos"

export function PestanasSeccion() {
  const pathname = usePathname()
  const { permisos } = useMisPermisos()
  const ubicacion = permisos ? ubicarRuta(pathname, permisos) : null

  if (!ubicacion || ubicacion.entrada.destinos.length < 2) return null

  const { entrada, destino: actual } = ubicacion

  return (
    <nav aria-label={entrada.etiqueta} className="mb-2 overflow-x-auto">
      <div role="tablist" className="flex min-w-max gap-1 border-b border-slate-300">
        {entrada.destinos.map((d) => {
          const seleccionada = d.ruta === actual.ruta
          return (
            <Link
              key={d.ruta}
              href={d.ruta}
              role="tab"
              aria-selected={seleccionada}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
                seleccionada
                  ? "border-red-600 font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:border-slate-400 hover:text-foreground",
              )}
            >
              {d.etiqueta}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
