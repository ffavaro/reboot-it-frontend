"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
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
import {
  BarChart2, Bookmark, Box, Boxes, CalendarCheck, CalendarDays, Camera, Car,
  Circle, Clock, FileCheck, FileText, HardDrive, Heart,
  LayoutList, Layers, Leaf, List, Package, PackageOpen,
  Server, Shield, Tag, Trash2, Truck, User, UserCog, Users,
} from "lucide-react"
import { getUser } from "@/lib/auth-utils"
import { NavSection, NavItem } from "@/lib/type/sidebar"
import { useCountUp } from "@/hooks/use-count-up"

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
      { title: "Clasificacion", url: "/pages/clasificacion", icon: LayoutList },
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
      { title: "Reportes", url: "#", icon: BarChart2 },
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
      <SidebarHeader className="gap-0">
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {visibleSections.map((item) => (
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
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="ml-auto transition-transform group-data-open/collapsible:rotate-90"
                />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((subItem) => {
                      const active = pathname === subItem.url
                      return (
                        <SidebarMenuItem key={subItem.title} className="relative">
                          {/* Indicador de item activo: barra lateral que crece desde el centro */}
                          <span
                            aria-hidden
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-200 ${
                              active ? "h-5 opacity-100" : "h-0 opacity-0"
                            }`}
                          />
                          <SidebarMenuButton
                            isActive={active}
                            render={<a href={subItem.url} />}
                          >
                            {subItem.icon && (
                              <subItem.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/menu-button:scale-110 group-hover/menu-button:-rotate-3" />
                            )}
                            {subItem.title}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <EcoImpactWidget toneladasKg={8400} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// ── Widget de impacto ambiental ─────────────────────────────────────────────
// Refuerza el propósito de la app (reciclaje) en todas las pantallas, no solo
// en el dashboard. El valor es mock hasta que el back exponga un total real.
function EcoImpactWidget({ toneladasKg }: { toneladasKg: number }) {
  const animatedKg = useCountUp(toneladasKg, 1200)
  const toneladas = animatedKg / 1000

  return (
    <div className="hover-lift rounded-lg bg-sidebar-accent/60 px-3 py-2.5 flex items-center gap-2.5">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary shrink-0">
        <Leaf className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-sidebar-foreground leading-none tabular-nums">
          {toneladas.toFixed(1)} t
        </p>
        <p className="text-[11px] text-sidebar-foreground/60 leading-tight mt-0.5">
          recicladas este año
        </p>
      </div>
    </div>
  )
}
