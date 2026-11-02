"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { accesosParaPerfil, gruposParaPerfil, rutaInicial, ubicarRuta } from "@/lib/type/menu"
import { usePerfil } from "@/hooks/use-auth"
import type { EntradaMenu, GrupoMenu } from "@/lib/type/sidebar"

const estiloOpcion = cn(
  "border-l-2 border-transparent text-white/80",
  "hover:border-red-500/50 hover:bg-white/5 hover:text-white",
  "data-[active=true]:border-red-500 data-[active=true]:bg-white/5 data-[active=true]:font-medium data-[active=true]:text-white",
)

function OpcionMenu({ entrada, activa }: { entrada: EntradaMenu; activa: boolean }) {
  const Icono = entrada.icono
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={activa}
        tooltip={entrada.etiqueta}
        className={estiloOpcion}
        render={<Link href={rutaInicial(entrada)} />}
      >
        <Icono className="h-4 w-4 shrink-0" />
        <span>{entrada.etiqueta}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function GrupoDesplegable({ grupo, activa }: { grupo: GrupoMenu; activa: string | null }) {
  const Icono = grupo.icono
  const contieneActiva = grupo.entradas.some((e) => e.etiqueta === activa)
  return (
    <Collapsible defaultOpen={contieneActiva} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          className="text-sm text-white/70 hover:bg-white/5 hover:text-white"
          render={<CollapsibleTrigger />}
        >
          <Icono className="mr-2 h-4 w-4 shrink-0" />
          {grupo.etiqueta}
          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-open/collapsible:rotate-90" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {grupo.entradas.map((entrada) => (
                <OpcionMenu key={entrada.etiqueta} entrada={entrada} activa={entrada.etiqueta === activa} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function GrupoCompacto({ grupo, activa }: { grupo: GrupoMenu; activa: string | null }) {
  const Icono = grupo.icono
  return (
    <SidebarMenuItem>
      <Popover>
        <PopoverTrigger
          render={
            <SidebarMenuButton
              isActive={grupo.entradas.some((e) => e.etiqueta === activa)}
              aria-label={grupo.etiqueta}
              title={grupo.etiqueta}
              className={estiloOpcion}
            />
          }
        >
          <Icono className="h-4 w-4 shrink-0" />
          <span>{grupo.etiqueta}</span>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={12} className="w-60 p-2">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {grupo.etiqueta}
          </p>
          <ul className="flex flex-col gap-0.5">
            {grupo.entradas.map((entrada) => {
              const IconoEntrada = entrada.icono
              const actual = entrada.etiqueta === activa
              return (
                <li key={entrada.etiqueta}>
                  <Link
                    href={rutaInicial(entrada)}
                    aria-current={actual ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                      actual && "bg-accent font-medium",
                    )}
                  >
                    <IconoEntrada className="h-4 w-4 shrink-0" />
                    {entrada.etiqueta}
                  </Link>
                </li>
              )
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  )
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const perfil = usePerfil()
  const { state, isMobile } = useSidebar()

  const accesos = perfil ? accesosParaPerfil(perfil) : []
  const grupos = perfil ? gruposParaPerfil(perfil) : []
  const activa = perfil ? ubicarRuta(pathname, perfil)?.entrada.etiqueta ?? null : null
  const compacto = state === "collapsed" && !isMobile

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent className="gap-0 bg-slate-900">
        {accesos.length > 0 && (
          <SidebarGroup className="pb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {accesos.map((entrada) => (
                  <OpcionMenu key={entrada.etiqueta} entrada={entrada} activa={entrada.etiqueta === activa} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {compacto ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupos.map((grupo) => (
                  <GrupoCompacto key={grupo.etiqueta} grupo={grupo} activa={activa} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          grupos.map((grupo) => <GrupoDesplegable key={grupo.etiqueta} grupo={grupo} activa={activa} />)
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
