"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { navTop, itemActivo, itemVisible, puedeVerPantalla, seccionesVisibles, urlDeItem } from "@/lib/nav"
import { useMisPermisos } from "@/hooks/use-permisos"

const BOTON_ITEM = "border-l-2 border-transparent text-white/90 hover:border-red-500/50 hover:bg-white/5 hover:text-white data-[active=true]:border-red-500 data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:font-medium"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { permisos } = useMisPermisos()
  const { state, isMobile } = useSidebar()
  // Con el menú cerrado (en escritorio) quedan solo los iconos
  const soloIconos = state === "collapsed" && !isMobile

  // El menú muestra solo lo que el rol puede ver según la matriz de permisos
  const itemsTop = navTop.filter((i) => puedeVerPantalla(permisos, i.clave))
  const visibleSections = seccionesVisibles(permisos)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent className="gap-0 bg-slate-900">
        {itemsTop.length > 0 && (
          <SidebarGroup className="pb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {itemsTop.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className={BOTON_ITEM}
                      render={<a href={item.url} />}
                    >
                      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {soloIconos ? (
          // Menú cerrado: un icono por menú principal; al hacerle clic se abre la lista de sus opciones
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSections.map((section) => (
                  <SidebarMenuItem key={section.title}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuButton
                            tooltip={section.title}
                            isActive={section.items.some((i) => itemActivo(i, pathname))}
                            className={BOTON_ITEM}
                          />
                        }
                      >
                        {section.icon && <section.icon className="h-4 w-4 shrink-0" />}
                        <span>{section.title}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" sideOffset={12} className="min-w-60">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
                          {section.items.map((subItem) => (
                            <DropdownMenuItem
                              key={subItem.title}
                              className={itemActivo(subItem, pathname) ? "bg-accent font-medium" : undefined}
                              render={<a href={urlDeItem(subItem, permisos)} />}
                            >
                              {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
                              {subItem.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          visibleSections.map((section) => (
            <Collapsible
              key={section.title}
              title={section.title}
              defaultOpen={section.items.some((i) => itemActivo(i, pathname))}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  className="group/label text-sm text-white/70 hover:bg-white/5 hover:text-white"
                  render={<CollapsibleTrigger />}
                >
                  {section.icon && <section.icon className="mr-2 h-4 w-4 shrink-0" />}
                  {section.title}{" "}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto transition-transform group-data-open/collapsible:rotate-90"
                  />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.filter((i) => itemVisible(i, permisos)).map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton
                            isActive={itemActivo(subItem, pathname)}
                            className="border-l-2 border-transparent text-white/80 hover:border-red-500/50 hover:bg-white/5 hover:text-white data-[active=true]:border-red-500 data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:font-medium"
                            render={<a href={urlDeItem(subItem, permisos)} />}
                          >
                            {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
                            {subItem.title}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
