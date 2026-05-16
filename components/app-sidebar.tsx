"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

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
          url: "/pages/donante",
        },
        {
          title: "Agenda",
          url: "#",
        },
        {
          title: "Lotes",
          url: "/pages/lote",
        },
        {
          title: "Certificado de disposicion",
          url: "/pages/certificado-disposicion",
        },
        {
          title: "Clasificacion",
          url: "/pages/clasificacion",
        },
        {
          title: "Constancia de retiro",
          url: "/pages/constancia-retiro",
        },
        {
          title: "Registro fotográfico",
          url: "/pages/registro-fotografico",
        },
      ],
    },
    {
      title: "Logistica y Distribucion",
      url: "#",
      items: [
       {
          title: "Vehiculos",
          url: "/pages/vehicles",
        },
        {
          title: "Retiros",
          url: "/pages/retiro",
        },
      ],
    },
    {
      title: "Gestion de Clasificacion",
      url: "#",
      items: [
        {
          title: "Materiales",
          url: "/pages/material",
        },
      ],
    },
    {
      title: "Inventario y almacenamiento",
      url: "#",
      items: [
       {
          title: "Medio de Almacenamiento",
          url: "/pages/medio-almacenamiento",
        },
        {
          title: "Tipos",
          url: "/pages/medio-almacenamiento/types",
        },
        {
          title: "Marcas",
          url: "/pages/medio-almacenamiento/brands",
        },
        {
          title: "Modelos",
          url: "/pages/medio-almacenamiento/models",
        },
        {
          title: "Racks",
          url: "/pages/rack",
        },
        {
          title: "Proceso de destrucción",
          url: "/pages/proceso-destruccion",
        },
        {
          title: "Pallets",
          url: "/pages/pallet",
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
    {
      title: "Configuracion",
      url: "#",
      items: [
        {
          title: "Condicion de Material",
          url: "/pages/material/material-condition",
        },
        {
          title: "Empleados",
          url: "/pages/employees",
        },
        {
          title:"Estado de turno",
          url: "/pages/estado-turno",
        },
        {
          title: "Empleado Transportista",
          url: "/pages/empleado-transportista",
        },
        {
          title: "Gestora Ambiental",
          url: "/pages/gestor-ambiental",
        },
        {
          title: "Roles",
          url: "/pages/roles",
        },
        {
          title: "Tipos de Material",
          url: "/pages/material/material-type",
        },
        {
          title: "Usuarios",
          url: "/pages/user-management",
        }, 
      ]
    }
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile()
  const pathname = usePathname()

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
            defaultOpen={item.items.some((subItem) => subItem.url === pathname)}
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
                          isActive={pathname === item.url}
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
