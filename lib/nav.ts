import {
  BarChart2, Briefcase, CalendarDays, Factory, FileBarChart, FileCheck, Heart, History, Layers, Library, Lock, MapPin, Package,
  PackageOpen, Recycle, Route, Shield, Trash2, Truck, User, UserCog, Users, Warehouse,
} from "lucide-react"
import type { NavItem, NavSection, NavTab } from "@/lib/type/sidebar"
import type { AccionPermiso, Permisos } from "@/lib/type/permisos"

// El menú sigue el circuito de una donación (recepción, logística, planta, disposición final) y deja abajo lo que no es
// parte del circuito. Cada opción lleva la clave de su pantalla (tabla pantalla del backend) o una lista de pestañas, cada
// una con la suya: quién puede ver qué sale de los permisos del rol (GET /permisos/mias), no de nombres de rol escritos acá.

// Mis donaciones (Donante) y Donaciones (equipo) son la misma pantalla: quien ve solo lo propio la ve con sus turnos,
// constancias y certificados adentro
const veSoloLoPropio = (p: Permisos | undefined) => p?.donaciones?.ver === "PROPIO"
// La agenda de turnos es del equipo que arma la agenda: el Transportista ve sus turnos desde la hoja de ruta

// Páginas principales que van sueltas, fuera de las secciones del menú
export const navTop: NavItem[] = [
  { title: "Dashboard", url: "/pages/dashboard", clave: "dashboard", icon: BarChart2 },
]

export const navMain: NavSection[] = [
  {
    title: "Recepción",
    url: "#",
    icon: Recycle,
    items: [
      { title: "Donaciones", url: "/pages/donacion", clave: "donaciones", icon: Heart, visibleSi: (p) => !veSoloLoPropio(p) },
      {
        title: "Mis donaciones", url: "/pages/donacion", clave: "donaciones", icon: Heart, visibleSi: veSoloLoPropio,
        tabs: [
          { title: "Donaciones", url: "/pages/donacion", clave: "donaciones" },
          { title: "Turnos", url: "/pages/turno", clave: "turnos" },
          { title: "Constancia de retiro", url: "/pages/constancia-retiro", clave: "constancia_retiro" },
          { title: "Certificado de disposición", url: "/pages/certificado-disposicion", clave: "certificado_disposicion" },
        ],
      },
      {
        title: "Agenda de turnos", url: "/pages/agenda", clave: "agenda", icon: CalendarDays, visibleSi: (p) => p?.turnos?.ver === "PLENO",
        tabs: [
          { title: "Calendario", url: "/pages/agenda", clave: "agenda" },
          { title: "Lista", url: "/pages/turno", clave: "turnos" },
        ],
      },
    ],
  },
  {
    title: "Logística",
    url: "#",
    icon: Route,
    items: [
      { title: "Hoja de ruta", url: "/pages/hoja-ruta", clave: "hoja_ruta", icon: MapPin },
      {
        title: "Retiros", url: "/pages/retiro", clave: "retiros", icon: PackageOpen, visibleSi: (p) => !veSoloLoPropio(p),
        tabs: [
          { title: "Retiros", url: "/pages/retiro", clave: "retiros" },
          { title: "Constancias de retiro", url: "/pages/constancia-retiro", clave: "constancia_retiro" },
        ],
      },
      {
        title: "Flota", url: "/pages/vehicles", clave: "vehiculos", icon: Truck,
        tabs: [
          { title: "Vehículos", url: "/pages/vehicles", clave: "vehiculos" },
          { title: "Historial de km", url: "/pages/vehicles/historial-km", clave: "vehiculos" },
        ],
      },
    ],
  },
  {
    title: "Planta",
    url: "#",
    icon: Factory,
    items: [
      { title: "Clasificación", url: "/pages/material", clave: "materiales", icon: Layers },
      { title: "Lotes", url: "/pages/lote", clave: "lotes", icon: Package },
      {
        title: "Depósito", url: "/pages/rack", clave: "racks", icon: Warehouse,
        tabs: [
          { title: "Racks", url: "/pages/rack", clave: "racks" },
          { title: "Pallets", url: "/pages/pallet", clave: "pallets" },
        ],
      },
    ],
  },
  {
    title: "Disposición final",
    url: "#",
    icon: Trash2,
    items: [
      {
        title: "Destrucción segura", url: "/pages/proceso-destruccion", clave: "proceso_destruccion", icon: Trash2,
        tabs: [
          { title: "Procesos de destrucción", url: "/pages/proceso-destruccion", clave: "proceso_destruccion" },
          { title: "Medios de almacenamiento", url: "/pages/medio-almacenamiento", clave: "medio_almacenamiento" },
        ],
      },
      { title: "Certificados", url: "/pages/certificado-disposicion", clave: "certificado_disposicion", icon: FileCheck, visibleSi: (p) => !veSoloLoPropio(p) },
    ],
  },
  {
    title: "Análisis",
    url: "#",
    icon: FileBarChart,
    items: [
      {
        title: "Reportes", url: "/pages/reportes/donaciones", clave: "reporte_donaciones", icon: FileBarChart,
        tabs: [
          { title: "Donaciones", url: "/pages/reportes/donaciones", clave: "reporte_donaciones" },
          { title: "Retiros", url: "/pages/reportes/retiros", clave: "reporte_retiros" },
          { title: "Inventario", url: "/pages/reportes/inventario", clave: "reporte_inventario" },
          { title: "Procesos de destrucción", url: "/pages/reportes/procesos-destruccion", clave: "reporte_procesos_destruccion" },
        ],
      },
    ],
  },
  {
    title: "Administración",
    url: "#",
    icon: Briefcase,
    items: [
      { title: "Donantes", url: "/pages/donante", clave: "donantes", icon: Users },
      {
        // la ficha de transportista se gestiona desde Empleados; el Transportista la ve desde Mi perfil
        title: "Empleados", url: "/pages/employees", clave: "empleados", icon: User, visibleSi: (p) => !!p?.empleados && p.empleados.ver !== "NINGUNO",
        tabs: [
          { title: "Empleados", url: "/pages/employees", clave: "empleados" },
          { title: "Transportistas", url: "/pages/empleado-transportista", clave: "empleado_transportista" },
        ],
      },
      {
        title: "Catálogos", url: "/pages/material/material-type", clave: "tipos_material", icon: Library,
        tabs: [
          { title: "Tipos de material", url: "/pages/material/material-type", clave: "tipos_material" },
          { title: "Condiciones de material", url: "/pages/material/material-condition", clave: "condicion_material" },
          { title: "Tipos", url: "/pages/medio-almacenamiento/types", clave: "tipos" },
          { title: "Marcas", url: "/pages/medio-almacenamiento/brands", clave: "marcas" },
          { title: "Modelos", url: "/pages/medio-almacenamiento/models", clave: "modelos" },
          { title: "Gestoras ambientales", url: "/pages/gestor-ambiental", clave: "gestora_ambiental" },
          { title: "Métodos de destrucción", url: "/pages/metodo-destruccion", clave: "metodos_destruccion" },
        ],
      },
    ],
  },
  {
    title: "Seguridad",
    url: "#",
    icon: Lock,
    items: [
      { title: "Usuarios", url: "/pages/user-management", clave: "usuarios", icon: UserCog },
      { title: "Roles y permisos", url: "/pages/roles", clave: "roles", icon: Shield },
      { title: "Auditoría", url: "/pages/auditoria", clave: "auditoria", icon: History },
    ],
  },
]

// Pantallas que existen pero no figuran en el menú: se llega desde el detalle de otra pantalla o por enlace.
// Registro fotográfico: las fotos se ven en el detalle de la donación y se cargan al confirmar el retiro o al clasificar el turno.
// Estados de turno y de proceso: el circuito busca esos nombres exactos, por eso quedan solo de consulta.
const RUTAS_SIN_MENU: NavTab[] = [
  { title: "Registro fotográfico", url: "/pages/registro-fotografico", clave: "registro_fotografico" },
  { title: "Estado de turno", url: "/pages/estado-turno", clave: "estado_turno" },
  { title: "Estado de proceso de destrucción", url: "/pages/estado-proceso-destruccion", clave: "estado_proceso_destruccion" },
]

// Mi Perfil no figura en el menú (está en el menú de usuario) pero tiene su propia clave de permisos
const RUTA_PERFIL: NavTab = { title: "Mi perfil", url: "/pages/perfil", clave: "mi_perfil" }

// Todas las pantallas conocidas (de opciones simples, de pestañas y las que no están en el menú)
const TODAS_LAS_PANTALLAS: NavTab[] = [
  ...navTop,
  ...navMain.flatMap((s) => s.items.flatMap((i) => i.tabs ?? [i])),
  ...RUTAS_SIN_MENU,
  RUTA_PERFIL,
]

const coincide = (pathname: string, url: string) => pathname === url || pathname.startsWith(url + "/")

/** Clave de la pantalla a la que pertenece una ruta (la coincidencia más específica), o null si no es una pantalla conocida. */
export function claveDeRuta(pathname: string): string | null {
  const candidatos = TODAS_LAS_PANTALLAS.filter((i) => coincide(pathname, i.url))
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

// ── Opciones del menú según los permisos ────────────────────────────────────

/** Pestañas de la opción que el rol puede ver (una opción simple cuenta como una sola pantalla). */
export function pestanasVisibles(item: NavItem, permisos: Permisos | undefined): NavTab[] {
  const pestanas: NavTab[] = item.tabs ?? [item]
  return pestanas.filter((t) => puedeVerPantalla(permisos, t.clave))
}

/** La opción se muestra si cumple su condición extra y el rol ve al menos una de sus pantallas. */
export function itemVisible(item: NavItem, permisos: Permisos | undefined): boolean {
  if (item.visibleSi && !item.visibleSi(permisos)) return false
  return pestanasVisibles(item, permisos).length > 0
}

/** Ruta a la que lleva la opción: su primera pantalla permitida. */
export function urlDeItem(item: NavItem, permisos: Permisos | undefined): string {
  return pestanasVisibles(item, permisos)[0]?.url ?? item.url
}

// Largo de la ruta más específica del menú que coincide con la actual (por ejemplo, /pages/medio-almacenamiento/brands es de
// Catálogos y no de /pages/medio-almacenamiento, que es de Destrucción segura)
function largoMejorCoincidencia(pathname: string): number {
  const pantallas: NavTab[] = [...navTop, ...navMain.flatMap((s) => s.items.flatMap((i) => i.tabs ?? [i]))]
  return pantallas.reduce((max, t) => (coincide(pathname, t.url) && t.url.length > max ? t.url.length : max), 0)
}

/** ¿Está parado en alguna de las pantallas de la opción? (solo cuenta la coincidencia más específica) */
export function itemActivo(item: NavItem, pathname: string): boolean {
  const mejor = largoMejorCoincidencia(pathname)
  return mejor > 0 && (item.tabs ?? [item]).some((t) => coincide(pathname, t.url) && t.url.length === mejor)
}

/** Menús principales con solo las opciones que el rol ve (los vacíos desaparecen). */
export function seccionesVisibles(permisos: Permisos | undefined): NavSection[] {
  return navMain
    .map((s) => ({ ...s, items: s.items.filter((i) => itemVisible(i, permisos)) }))
    .filter((s) => s.items.length > 0)
}

/**
 * Pestañas para mostrar sobre la pantalla actual: las de la opción del menú que la contiene (si tiene más de una visible)
 * y la pestaña activa (la ruta más específica).
 */
export function pestanasDeRuta(pathname: string, permisos: Permisos | undefined): { tabs: NavTab[]; activa: string } | null {
  for (const seccion of navMain) {
    for (const item of seccion.items) {
      if (!item.tabs || !itemVisible(item, permisos) || !itemActivo(item, pathname)) continue
      const tabs = pestanasVisibles(item, permisos)
      if (tabs.length < 2) return null
      const candidatas = tabs.filter((t) => coincide(pathname, t.url))
      const activa = candidatas.length ? candidatas.reduce((a, b) => (b.url.length > a.url.length ? b : a)).url : ""
      return activa ? { tabs, activa } : null
    }
  }
  return null
}

// Pantalla de inicio: la primera que el usuario pueda ver, en este orden de preferencia. El dashboard solo es el inicio de
// quien lo ve completo (Admin y Administrativo); el Técnico arranca en Clasificación, el Transportista en su hoja de ruta
// y el Donante en Mis donaciones.
const PREFERENCIA_INICIO = ["dashboard", "hoja_ruta", "materiales", "donaciones", "usuarios"]

export function homeDePermisos(permisos: Permisos | undefined): string {
  if (permisos) {
    const porClave = new Map<string, string>(TODAS_LAS_PANTALLAS.map((i) => [i.clave, i.url]))
    for (const clave of PREFERENCIA_INICIO) {
      if (clave === "dashboard" ? permisos.dashboard?.ver === "PLENO" : puedeVerPantalla(permisos, clave)) return porClave.get(clave) as string
    }
    const primero = TODAS_LAS_PANTALLAS.find((i) => puedeVerPantalla(permisos, i.clave))
    if (primero) return primero.url
  }
  return RUTA_PERFIL.url
}
