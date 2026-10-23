"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { NavItem } from "@/lib/type/sidebar"
import { navMain, navTop, puedeVerPantalla } from "@/lib/nav"
import { useMisPermisos } from "@/hooks/use-permisos"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { permisos } = useMisPermisos()

  // El menú muestra solo lo que el rol puede ver según la matriz de permisos
  const canSeeItem = (item: NavItem): boolean => puedeVerPantalla(permisos, item.clave)

  const itemsTop = navTop.filter(canSeeItem)
  const visibleSections = navMain
    .map((section) => ({
      ...section,
      items: section.items.filter(canSeeItem),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <Sidebar {...props}>
      <SidebarContent className="gap-0 bg-slate-900">
        {itemsTop.length > 0 && (
          <SidebarGroup className="pb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {itemsTop.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      className="border-l-2 border-transparent text-white/90 hover:border-red-500/50 hover:bg-white/5 hover:text-white data-[active=true]:border-red-500 data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:font-medium"
                      render={<a href={item.url} />}
                    >
                      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {visibleSections.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen={item.items.some((subItem) => subItem.url === pathname)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                className="group/label text-sm text-white/70 hover:bg-white/5 hover:text-white"
                render={<CollapsibleTrigger />}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4 shrink-0" />}
                {item.title}{" "}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="ml-auto transition-transform group-data-open/collapsible:rotate-90"
                />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          isActive={pathname === subItem.url}
                          className="border-l-2 border-transparent text-white/80 hover:border-red-500/50 hover:bg-white/5 hover:text-white data-[active=true]:border-red-500 data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:font-medium"
                          render={<a href={subItem.url} />}
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
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
