"use client"

import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

// This is sample data.
const data = {
  versions: ["0.0.1"],
  navMain: [
    {
      title: "Gestion de Donantes",
      url: "#",
      items: [
        {
          title: "Donantes",
          url: "#",
        },
        {
          title: "Agenda",
          url: "#",
        },
      ],
    },
    {
      title: "Logistica y Distribucion",
      url: "#",
      items: [
        {
          title: "Vehiculos",
          url: "#",
        },
      ],
    },
    {
      title: "Gestion de Clasificacion",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
    {
      title: "Inventario y almacenamiento",
      url: "#",
      items: [
        {
          title: "Stock Management",
          url: "#",
        },
      ],
    },
    {
      title: "Reportes y Analitica",
      url: "#",
      items: [
        {
          title: "Reports Dashboard",
          url: "#",
        },
      ]
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                render={<CollapsibleTrigger />}
              >
                {item.title}{" "}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={item.isActive}
                          render={<a href={item.url} />}
                        >
                          {item.title}
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
      <SidebarFooter>
          {/* You can add any content here, such as links or copyright information. */}
          <button className="w-full rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent-hover">
            Cerrar Sesión
          </button>

      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
