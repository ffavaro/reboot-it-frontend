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
import { getUser } from "@/lib/auth-utils"
import { NavItem } from "@/lib/type/sidebar"
import { navMain } from "@/lib/nav"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  useEffect(() => { setUser(getUser()) }, [])
  const rolNombre = user?.rol?.nombre?.toLowerCase() ?? ""
  const isDonante = rolNombre === "donante"
  const isTransportista = rolNombre === "transportista"

  const canSeeItem = (item: NavItem): boolean => {
    if (isDonante) {
      return item.allowedRoles?.includes("donante") ?? false
    }
    if (isTransportista) {
      return item.allowedRoles?.includes("transportista") ?? false
    }
    return true
  }

  const visibleSections = navMain
    .map((section) => ({
      ...section,
      items: section.items.filter(canSeeItem),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <Sidebar {...props}>
      <SidebarContent className="gap-0 bg-slate-900">
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
