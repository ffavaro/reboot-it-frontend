"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { VersionSwitcher } from "@/components/version-switcher"
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
import { getUser, clearSession } from "@/lib/auth-utils"
import { NavSection, NavItem } from "@/lib/type/sidebar"

// Si allowedRoles está definido, solo esos roles pueden verlo.
// Si no está definido, es visible para todos los roles.
const DONANTE = ["donante"]

const navMain: NavSection[] = [
  {
    title: "Gestion de Donantes",
    url: "#",
    items: [
      { title: "Donantes", url: "/pages/donante" },
      { title: "Donaciones", url: "/pages/donacion", allowedRoles: DONANTE },
      { title: "Turnos", url: "/pages/turno", allowedRoles: DONANTE },
      { title: "Lotes", url: "/pages/lote" },
      { title: "Certificado de disposicion", url: "/pages/certificado-disposicion", allowedRoles: DONANTE },
      { title: "Clasificacion", url: "/pages/clasificacion" },
      { title: "Constancia de retiro", url: "/pages/constancia-retiro", allowedRoles: DONANTE },
      { title: "Registro fotográfico", url: "/pages/registro-fotografico" },
    ],
  },
  {
    title: "Logistica y Distribucion",
    url: "#",
    items: [
      { title: "Vehiculos", url: "/pages/vehicles" },
      { title: "Retiros", url: "/pages/retiro" },
    ],
  },
  {
    title: "Gestion de Clasificacion",
    url: "#",
    items: [
      { title: "Materiales", url: "/pages/material" },
    ],
  },
  {
    title: "Inventario y almacenamiento",
    url: "#",
    items: [
      { title: "Medio de Almacenamiento", url: "/pages/medio-almacenamiento" },
      { title: "Tipos", url: "/pages/medio-almacenamiento/types" },
      { title: "Marcas", url: "/pages/medio-almacenamiento/brands" },
      { title: "Modelos", url: "/pages/medio-almacenamiento/models" },
      { title: "Racks", url: "/pages/rack" },
      { title: "Proceso de destrucción", url: "/pages/proceso-destruccion" },
      { title: "Pallets", url: "/pages/pallet" },
    ],
  },
  {
    title: "Reportes y Analitica",
    url: "#",
    items: [
      { title: "Reports Dashboard", url: "#" },
    ],
  },
  {
    title: "Configuracion",
    url: "#",
    items: [
      { title: "Condicion de Material", url: "/pages/material/material-condition" },
      { title: "Empleados", url: "/pages/employees" },
      { title: "Estado de turno", url: "/pages/estado-turno" },
      { title: "Empleado Transportista", url: "/pages/empleado-transportista" },
      { title: "Gestora Ambiental", url: "/pages/gestor-ambiental" },
      { title: "Roles", url: "/pages/roles" },
      { title: "Tipos de Material", url: "/pages/material/material-type" },
      { title: "Usuarios", url: "/pages/user-management" },
    ],
  },
  {
    title: "Mi Cuenta",
    url: "#",
    allowedRoles: DONANTE,
    items: [
      { title: "Mi Perfil", url: "/pages/perfil", allowedRoles: DONANTE },
    ],
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  useEffect(() => { setUser(getUser()) }, [])
  const rolNombre = user?.rol?.nombre?.toLowerCase() ?? ""
  const isDonante = rolNombre === "donante"

  function canSeeItem(item: NavItem): boolean {
    if (isDonante) {
      // donante: solo ve los items explícitamente marcados para él
      return item.allowedRoles?.includes("donante") ?? false
    }
    // cualquier otro rol: ve todo
    return true
  }

  const visibleSections = navMain
    .map((section) => ({
      ...section,
      items: section.items.filter(canSeeItem),
    }))
    .filter((section) => section.items.length > 0)

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={["0.0.1"]}
          defaultVersion="0.0.1"
        />
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
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          isActive={pathname === subItem.url}
                          render={<a href={subItem.url} />}
                        >
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
      <SidebarFooter>
        {user && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border mb-1">
            <p className="font-medium text-foreground truncate">{user.nombre}</p>
            <p className="truncate">{user.rol?.nombre ?? ""}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent-hover"
        >
          Cerrar Sesión
        </button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
