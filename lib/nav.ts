import {
  BarChart2, Bookmark, Box, Boxes, CalendarCheck, CalendarDays, Camera, Car, Circle, Clock, FileBarChart, FileCheck, FileText, HardDrive, Heart, Recycle, History, LayoutList, Layers, Leaf, List, ListChecks, MapPin, Package, PackageOpen, Route, Server, Settings, Shield, Tag, Trash2, Truck, User, UserCog, Users, Warehouse,
} from "lucide-react"
import type { NavItem, NavSection } from "@/lib/type/sidebar"
import type { AccionPermiso, Permisos } from "@/lib/type/permisos"

// Cada ítem del menú lleva la clave de su pantalla (tabla pantalla del backend). Quién puede ver cada una
// sale de los permisos del rol (GET /permisos/mias), no de nombres de rol escritos acá.

// Páginas principales que van sueltas, fuera de las secciones del menú
export const navTop: NavItem[] = [
  { title: "Dashboard", url: "/pages/dashboard", clave: "dashboard", icon: BarChart2 },
]

export const navMain: NavSection[] = [
  {
    title: "Gestion de Donantes",
    url: "#",
    icon: Recycle,
    items: [
      { title: "Donaciones", url: "/pages/donacion", clave: "donaciones", icon: Heart },
      { title: "Turnos", url: "/pages/turno", clave: "turnos", icon: Clock },
      { title: "Constancia de retiro", url: "/pages/constancia-retiro", clave: "constancia_retiro", icon: FileText },
      { title: "Certificado de disposicion", url: "/pages/certificado-disposicion", clave: "certificado_disposicion", icon: FileCheck },
      { title: "Agenda", url: "/pages/agenda", clave: "agenda", icon: CalendarDays },
      { title: "Registro fotográfico", url: "/pages/registro-fotografico", clave: "registro_fotografico", icon: Camera },
    ],
  },
  {
    title: "Logistica y Distribucion",
    url: "#",
    icon: Route,
    items: [
      { title: "Vehiculos", url: "/pages/vehicles", clave: "vehiculos", icon: Truck },
      { title: "Retiros", url: "/pages/retiro", clave: "retiros", icon: PackageOpen },
      { title: "Hoja de ruta", url: "/pages/hoja-ruta", clave: "hoja_ruta", icon: MapPin },
      { title: "Empleado Transportista", url: "/pages/empleado-transportista", clave: "empleado_transportista", icon: Car },
    ],
  },
  {
    title: "Gestion de Clasificacion",
    url: "#",
    icon: ListChecks,
    items: [
      { title: "Materiales", url: "/pages/material", clave: "materiales", icon: Layers },
      { title: "Condicion de Material", url: "/pages/material/material-condition", clave: "condicion_material", icon: Circle },
      { title: "Tipos de Material", url: "/pages/material/material-type", clave: "tipos_material", icon: Tag },
      { title: "Proceso de destrucción", url: "/pages/proceso-destruccion", clave: "proceso_destruccion", icon: Trash2 },
    ],
  },
  {
    title: "Inventario y almacenamiento",
    url: "#",
    icon: Warehouse,
    items: [
      { title: "Medio de Almacenamiento", url: "/pages/medio-almacenamiento", clave: "medio_almacenamiento", icon: HardDrive },
      { title: "Tipos", url: "/pages/medio-almacenamiento/types", clave: "tipos", icon: List },
      { title: "Marcas", url: "/pages/medio-almacenamiento/brands", clave: "marcas", icon: Bookmark },
      { title: "Modelos", url: "/pages/medio-almacenamiento/models", clave: "modelos", icon: Box },
      { title: "Racks", url: "/pages/rack", clave: "racks", icon: Server },
      { title: "Pallets", url: "/pages/pallet", clave: "pallets", icon: Boxes },
      { title: "Lotes", url: "/pages/lote", clave: "lotes", icon: Package },
    ],
  },
  {
    title: "Reportes y Analitica",
    url: "#",
    icon: FileBarChart,
    items: [
      { title: "Reporte de Donaciones", url: "/pages/reportes/donaciones", clave: "reporte_donaciones", icon: BarChart2 },
      { title: "Reporte de Retiros", url: "/pages/reportes/retiros", clave: "reporte_retiros", icon: BarChart2 },
      { title: "Reporte de Inventario", url: "/pages/reportes/inventario", clave: "reporte_inventario", icon: BarChart2 },
      { title: "Reporte de Procesos de Destrucción", url: "/pages/reportes/procesos-destruccion", clave: "reporte_procesos_destruccion", icon: BarChart2 },
    ],
  },
  {
    title: "Configuracion",
    url: "#",
    icon: Settings,
    items: [
      { title: "Auditoría", url: "/pages/auditoria", clave: "auditoria", icon: History },
      { title: "Donantes", url: "/pages/donante", clave: "donantes", icon: Users },
      { title: "Empleados", url: "/pages/employees", clave: "empleados", icon: User },
      { title: "Estado de turno", url: "/pages/estado-turno", clave: "estado_turno", icon: CalendarCheck },
      { title: "Estado de proceso de destrucción", url: "/pages/estado-proceso-destruccion", clave: "estado_proceso_destruccion", icon: Layers },
      { title: "Gestora Ambiental", url: "/pages/gestor-ambiental", clave: "gestora_ambiental", icon: Leaf },
      { title: "Metodos de destrucción", url: "/pages/metodo-destruccion", clave: "metodos_destruccion", icon: LayoutList },
      { title: "Roles", url: "/pages/roles", clave: "roles", icon: Shield },
      { title: "Usuarios", url: "/pages/user-management", clave: "usuarios", icon: UserCog },
    ],
  },
]

// ── Acceso según los permisos del usuario ───────────────────────────────────
const TODOS_LOS_ITEMS: NavItem[] = [...navTop, ...navMain.flatMap((s) => s.items)]

// Mi Perfil no figura en el menú (está en el menú de usuario) pero tiene su propia clave de permisos
const RUTA_PERFIL = { url: "/pages/perfil", clave: "mi_perfil" }

const coincide = (pathname: string, url: string) => pathname === url || pathname.startsWith(url + "/")

/** Clave de la pantalla a la que pertenece una ruta (la coincidencia más específica), o null si no es una pantalla conocida. */
export function claveDeRuta(pathname: string): string | null {
  const candidatos = [...TODOS_LOS_ITEMS, RUTA_PERFIL].filter((i) => coincide(pathname, i.url))
  if (candidatos.length === 0) return null
  return candidatos.reduce((a, b) => (b.url.length > a.url.length ? b : a)).clave
}

/** ¿El usuario tiene este permiso sobre la pantalla? (cualquier alcance distinto de NINGUNO) */
export function puede(permisos: Permisos | undefined, clave: string | null, accion: AccionPermiso): boolean {
  if (!permisos || !clave) return false
  const p = permisos[clave]
  return !!p && p[accion] !== "NINGUNO"
}

// Pantallas que todavía muestran datos de todos: se abren solo con alcance pleno o limitado. Para quien ve únicamente
// lo propio (P) o lo asignado (A) quedan ocultas hasta que esas reglas por registro estén aplicadas en la pantalla.
const SOLO_ALCANCE_AMPLIO = new Set(["dashboard"])

/** ¿Puede ver la pantalla? Es la regla del menú y del acceso por ruta. */
export function puedeVerPantalla(permisos: Permisos | undefined, clave: string | null): boolean {
  if (!puede(permisos, clave, "ver")) return false
  if (clave && SOLO_ALCANCE_AMPLIO.has(clave)) {
    const alcance = permisos?.[clave]?.ver
    return alcance === "PLENO" || alcance === "LIMITADO"
  }
  return true
}

export function puedeAccederARuta(pathname: string, permisos: Permisos | undefined): boolean {
  return puedeVerPantalla(permisos, claveDeRuta(pathname))
}

// Pantalla de inicio: la primera que el usuario pueda ver, en este orden de preferencia
const PREFERENCIA_INICIO = ["dashboard", "hoja_ruta", "donaciones", "agenda", "usuarios"]

export function homeDePermisos(permisos: Permisos | undefined): string {
  if (permisos) {
    const porClave = new Map<string, string>([...TODOS_LOS_ITEMS, RUTA_PERFIL].map((i) => [i.clave, i.url]))
    for (const clave of PREFERENCIA_INICIO) {
      if (puedeVerPantalla(permisos, clave)) return porClave.get(clave) as string
    }
    const primero = TODOS_LOS_ITEMS.find((i) => puedeVerPantalla(permisos, i.clave))
    if (primero) return primero.url
  }
  return RUTA_PERFIL.url
}
