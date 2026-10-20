import {
  BarChart2, Bookmark, Box, Boxes, CalendarCheck, CalendarDays, Camera, Car, Circle, Clock, FileCheck, FileText, HardDrive, Heart, History, LayoutList, Layers, Leaf, List, MapPin, Package, PackageOpen, Server, Shield, Tag, Trash2, Truck, User, UserCog, Users,
} from "lucide-react"
import type { NavItem, NavSection } from "@/lib/type/sidebar"

// Si allowedRoles está definido, solo esos roles pueden verlo.
// Si no está definido, es visible para todos los roles.
export const DONANTE = ["donante"]
export const TRANSPORTISTA = ["transportista"]

// Páginas principales que van sueltas, fuera de las secciones del menú (solo staff)
export const navTop: NavItem[] = [
  { title: "Dashboard", url: "/pages/dashboard", icon: BarChart2 },
]

export const navMain: NavSection[] = [
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
      { title: "Hoja de ruta", url: "/pages/hoja-ruta", allowedRoles: TRANSPORTISTA, icon: MapPin },
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
      { title: "Auditoría", url: "/pages/auditoria", soloAdmin: true, icon: History },
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

// ── Acceso por rol ──────────────────────────────────────────────────────────
// Misma regla que aplica el menú: DONANTE y TRANSPORTISTA solo ven los ítems que los incluyen en
// allowedRoles; cualquier otro rol (Admin, Administrativo, Reciclado, Técnico, Dirección) ve todo.
export type GrupoRol = "donante" | "transportista" | "staff"

// Marcas diacríticas combinantes (U+0300 a U+036F) que deja normalize("NFD") al separar las tildes
const TILDES = new RegExp("[" + String.fromCharCode(0x300) + "-" + String.fromCharCode(0x36f) + "]", "g")
const sinTildes = (s: string) => s.normalize("NFD").replace(TILDES, "").toLowerCase().trim()

export function grupoDeRol(nombre?: string | null): GrupoRol | null {
  if (!nombre) return null
  const rol = sinTildes(nombre)
  return rol === "donante" || rol === "transportista" ? rol : "staff"
}

// Pantalla de inicio de cada grupo (tiene que ser una ruta que el propio grupo pueda ver)
const HOME_POR_GRUPO: Record<GrupoRol, string> = {
  donante: "/pages/donacion",
  transportista: "/pages/hoja-ruta",
  staff: "/pages/dashboard",
}
export const homeDeRol = (nombre?: string | null) => HOME_POR_GRUPO[grupoDeRol(nombre) ?? "staff"]

// Rutas que no figuran en el menú pero puede abrir cualquier usuario autenticado (Mi Perfil)
const RUTAS_PARA_TODOS = ["/pages/perfil"]

const coincide = (pathname: string, url: string) => pathname === url || pathname.startsWith(url + "/")

export const esAdmin = (nombre?: string | null) => !!nombre && sinTildes(nombre) === "admin"

export function puedeAccederARuta(pathname: string, rolNombre?: string | null): boolean {
  const grupo = grupoDeRol(rolNombre)
  if (!grupo) return false
  // las pantallas exclusivas del Admin no las abre ningún otro rol, aunque sea staff
  const soloAdmin = navMain.some((section) => section.items.some((item) => item.soloAdmin && coincide(pathname, item.url)))
  if (soloAdmin && !esAdmin(rolNombre)) return false
  if (grupo === "staff") return true
  if (RUTAS_PARA_TODOS.some((r) => coincide(pathname, r))) return true
  // el resto se rige por el menú: tiene que existir un ítem que contenga la ruta y permita el rol
  return navMain.some((section) =>
    section.items.some((item) => coincide(pathname, item.url) && !!item.allowedRoles?.includes(grupo)),
  )
}
