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
import {
  BarChart2, Bookmark, Box, Boxes, CalendarCheck, CalendarDays, Camera, Car,
  Circle, Clock, FileCheck, FileText, HardDrive, Heart,
  LayoutList, Layers, Leaf, List, Package, PackageOpen,
  Server, Shield, Tag, Trash2, Truck, User, UserCog, Users,
} from "lucide-react"
import { getUser } from "@/lib/auth-utils"
import { NavSection, NavItem } from "@/lib/type/sidebar"

// Si allowedRoles está definido, solo esos roles pueden verlo.
// Si no está definido, es visible para todos los roles.
const DONANTE = ["donante"]
const TRANSPORTISTA = ["transportista"]

const navMain: NavSection[] = [
  {
    title: "Gestion de Donantes",
    url: "#",
    items: [
      { title: "Agenda", url: "/pages/agenda", icon: CalendarDays },
      { title: "Certificado de disposicion", url: "/pages/certificado-disposicion", allowedRoles: DONANTE, icon: FileCheck },
      { title: "Constancia de retiro", url: "/pages/constancia-retiro", allowedRoles: DONANTE, icon: FileText },
      { title: "Donaciones", url: "/pages/donacion", allowedRoles: DONANTE, icon: Heart },
      { title: "Registro fotográfico", url: "/pages/registro-fotografico", icon: Camera },
      { title: "Turnos", url: "/pages/turno", allowedRoles: [...DONANTE, ...TRANSPORTISTA], icon: Clock },
    ],
  },
  {
    title: "Logistica y Distribucion",
    url: "#",
    items: [
      { title: "Vehiculos", url: "/pages/vehicles", allowedRoles: TRANSPORTISTA, icon: Truck },
      { title: "Retiros", url: "/pages/retiro", allowedRoles: TRANSPORTISTA, icon: PackageOpen },
      { title: "Empleado Transportista", url: "/pages/empleado-transportista", icon: Car },
    ],
  },
  {
    title: "Gestion de Clasificacion",
    url: "#",
    items: [
      { title: "Materiales", url: "/pages/material", icon: Layers },
      { title: "Condicion de Material", url: "/pages/material/material-condition", icon: Circle },
      { title: "Tipos de Material", url: "/pages/material/material-type", icon: Tag },
      { title: "Proceso de destrucción", url: "/pages/proceso-destruccion", icon: Trash2 },
    ],
  },
  {
    title: "Inventario y almacenamiento",
    url: "#",
    items: [
      { title: "Medio de Almacenamiento", url: "/pages/medio-almacenamiento", icon: HardDrive },
      { title: "Tipos", url: "/pages/medio-almacenamiento/types", icon: List },
      { title: "Marcas", url: "/pages/medio-almacenamiento/brands", icon: Bookmark },
      { title: "Modelos", url: "/pages/medio-almacenamiento/models", icon: Box },
      { title: "Racks", url: "/pages/rack", icon: Server },
      { title: "Pallets", url: "/pages/pallet", icon: Boxes },
      { title: "Lotes", url: "/pages/lote", icon: Package },
    ],
  },
  {
    title: "Reportes y Analitica",
    url: "#",
    items: [
      { title: "Reporte de Donaciones", url: "/pages/reportes/donaciones", icon: BarChart2 },
      { title: "Reporte de Retiros", url: "/pages/reportes/retiros", icon: BarChart2 },
      { title: "Reporte de Inventario", url: "/pages/reportes/inventario", icon: BarChart2 },
      { title: "Reporte de Procesos de Destrucción", url: "/pages/reportes/procesos-destruccion", icon: BarChart2 },
    ],
  },
  {
    title: "Configuracion",
    url: "#",
    items: [
      { title: "Donantes", url: "/pages/donante", icon: Users },
      { title: "Empleados", url: "/pages/employees", icon: User },
      { title: "Estado de turno", url: "/pages/estado-turno", icon: CalendarCheck },
      { title: "Estado de proceso de destrucción", url: "/pages/estado-proceso-destruccion", icon: Layers },
      { title: "Gestora Ambiental", url: "/pages/gestor-ambiental", icon: Leaf },
      { title: "Metodos de destrucción", url: "/pages/metodo-destruccion", icon: LayoutList },
      { title: "Roles", url: "/pages/roles", icon: Shield },
      { title: "Usuarios", url: "/pages/user-management", icon: UserCog },
    ],
  }
]

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
      <SidebarContent className="gap-0 bg-slate-950">
        {visibleSections.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen={item.items.some((subItem) => subItem.url === pathname)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                className="group/label text-sm text-white hover:bg-red-500 hover:text-white"
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
                          className="text-white hover:bg-red-500 hover:text-white data-[active=true]:bg-red-500 data-[active=true]:text-white"
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
