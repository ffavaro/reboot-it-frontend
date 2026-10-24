"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { pestanasDeRuta } from "@/lib/nav"
import type { Permisos } from "@/lib/type/permisos"

/**
 * Pestañas de las opciones del menú que reúnen varias pantallas (Agenda de turnos, Flota, Reportes, Catálogos, etc.).
 * Cada pestaña enlaza la pantalla que ya existe y se muestra solo si el rol puede verla. Se pone sobre el contenido,
 * así las pantallas no tienen que saber de qué opción forman parte.
 */
export function BarraPestanas({ pathname, permisos }: { pathname: string; permisos: Permisos | undefined }) {
  const grupo = pestanasDeRuta(pathname, permisos)
  if (!grupo) return null
  return (
    <nav aria-label="Secciones" className="px-6 pt-4">
      <ul className="flex flex-wrap gap-1 border-b border-border">
        {grupo.tabs.map((t) => {
          const activa = t.url === grupo.activa
          return (
            <li key={t.url}>
              <Link
                href={t.url}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center border-b-2 px-3 py-2 text-sm transition-colors",
                  activa
                    ? "border-red-600 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {t.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
