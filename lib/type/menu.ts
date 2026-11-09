import {
  BarChart2, Briefcase, CalendarDays, Camera, Factory, FileBarChart, FileCheck, Heart, History, Layers, Library, Lock, MapPin,
  Package, PackageOpen, Recycle, Route, Shield, Trash2, Truck, User, UserCog, Users, Warehouse,
} from "lucide-react"
import { pantallaDeRuta, RUTA_SIEMPRE_PERMITIDA } from "@/lib/type/pantallas"
import type { Alcance, PermisosPorClave } from "@/lib/type/permisos"
import type { Destino, EntradaMenu, GrupoMenu, Ubicacion } from "@/lib/type/sidebar"

const SOLO_PROPIOS: Alcance[] = ["PROPIOS"]
const SIN_PROPIOS: Alcance[] = ["TODOS", "EN_PLANTA", "ASIGNADOS"]
const DE_PLANTA: Alcance[] = ["TODOS", "EN_PLANTA"]

const destino = (etiqueta: string, ruta: string, alcances?: Alcance[]): Destino => ({ etiqueta, ruta, alcances })

const simple = (etiqueta: string, ruta: string, icono: EntradaMenu["icono"], alcances?: Alcance[]): EntradaMenu => ({
  etiqueta,
  icono,
  alcances,
  destinos: [destino(etiqueta, ruta)],
})

export const ACCESOS_DIRECTOS: EntradaMenu[] = [
  simple("Dashboard", "/pages/dashboard", BarChart2),
]

export const GRUPOS_MENU: GrupoMenu[] = [
  {
    etiqueta: "Recepción",
    icono: Recycle,
    entradas: [
      simple("Donaciones", "/pages/donacion", Heart, SIN_PROPIOS),
      {
        etiqueta: "Mis donaciones",
        icono: Heart,
        alcances: SOLO_PROPIOS,
        destinos: [
          destino("Donaciones", "/pages/donacion"),
          destino("Turnos", "/pages/turno"),
          destino("Constancia de retiro", "/pages/constancia-retiro"),
          destino("Certificado de disposición", "/pages/certificado-disposicion"),
        ],
      },
      {
        etiqueta: "Agenda de turnos",
        icono: CalendarDays,
        alcances: SIN_PROPIOS,
        destinos: [
          destino("Lista", "/pages/turno"),
          destino("Calendario", "/pages/agenda", DE_PLANTA),
        ],
      },
    ],
  },
  {
    etiqueta: "Logística",
    icono: Route,
    entradas: [
      simple("Hoja de ruta", "/pages/hoja-ruta", MapPin),
      {
        etiqueta: "Retiros",
        icono: PackageOpen,
        destinos: [
          destino("Retiros", "/pages/retiro"),
          destino("Constancias de retiro", "/pages/constancia-retiro", SIN_PROPIOS),
        ],
      },
      {
        etiqueta: "Flota",
        icono: Truck,
        destinos: [destino("Vehículos", "/pages/vehicles")],
      },
    ],
  },
  {
    etiqueta: "Planta",
    icono: Factory,
    entradas: [
      simple("Clasificación", "/pages/material", Layers),
       simple("Lotes", "/pages/lote", Package),
      simple("Registro fotográfico", "/pages/registro-fotografico", Camera),
      {
        etiqueta: "Depósito",
        icono: Warehouse,
        destinos: [destino("Racks", "/pages/rack"), destino("Pallets", "/pages/pallet")],
      },
    ],
  },
  {
    etiqueta: "Disposición final",
    icono: Trash2,
    entradas: [
      {
        etiqueta: "Destrucción segura",
        icono: Trash2,
        destinos: [
          destino("Procesos de destrucción", "/pages/proceso-destruccion"),
          destino("Medios de almacenamiento", "/pages/medio-almacenamiento"),
        ],
      },
      simple("Certificados", "/pages/certificado-disposicion", FileCheck, SIN_PROPIOS),
    ],
  },
  {
    etiqueta: "Análisis",
    icono: FileBarChart,
    entradas: [
      {
        etiqueta: "Reportes",
        icono: FileBarChart,
        alcances: DE_PLANTA,
        destinos: [
          destino("Donaciones", "/pages/reportes/donaciones"),
          destino("Retiros", "/pages/reportes/retiros"),
          destino("Inventario", "/pages/reportes/inventario"),
          destino("Procesos de destrucción", "/pages/reportes/procesos-destruccion"),
        ],
      },
    ],
  },
  {
    etiqueta: "Administración",
    icono: Briefcase,
    entradas: [
      simple("Donantes", "/pages/donante", Users),
      {
        etiqueta: "Empleados",
        icono: User,
        destinos: [
          destino("Empleados", "/pages/employees"),
          destino("Transportistas", "/pages/empleado-transportista"),
        ],
      },
      {
        etiqueta: "Catálogos",
        icono: Library,
        destinos: [
          destino("Tipos de material", "/pages/material/material-type"),
          destino("Condiciones de material", "/pages/material/material-condition"),
          destino("Tipos", "/pages/medio-almacenamiento/types"),
          destino("Marcas", "/pages/medio-almacenamiento/brands"),
          destino("Modelos", "/pages/medio-almacenamiento/models"),
          destino("Gestoras ambientales", "/pages/gestor-ambiental"),
          destino("Métodos de destrucción", "/pages/metodo-destruccion"),
        ],
      },
    ],
  },
  {
    etiqueta: "Seguridad",
    icono: Lock,
    entradas: [
      simple("Usuarios", "/pages/user-management", UserCog),
      simple("Roles y permisos", "/pages/roles", Shield),
      simple("Auditoría", "/pages/auditoria", History),
    ],
  },
]

function visible(permisos: PermisosPorClave, ruta: string, alcances: Alcance[] | undefined): boolean {
  const clave = pantallaDeRuta(ruta)
  if (clave === null) return true
  const permiso = permisos[clave]
  return !!permiso?.ver && (!alcances || alcances.includes(permiso.alcance))
}

function recortarEntrada(entrada: EntradaMenu, permisos: PermisosPorClave): EntradaMenu | null {
  const destinos = entrada.destinos.filter((d) => visible(permisos, d.ruta, d.alcances ?? entrada.alcances))
  return destinos.length ? { ...entrada, destinos } : null
}

const recortarLista = (entradas: EntradaMenu[], permisos: PermisosPorClave) =>
  entradas.flatMap((e) => recortarEntrada(e, permisos) ?? [])

export function accesosVisibles(permisos: PermisosPorClave): EntradaMenu[] {
  return recortarLista(ACCESOS_DIRECTOS, permisos)
}

export function gruposVisibles(permisos: PermisosPorClave): GrupoMenu[] {
  return GRUPOS_MENU.reduce<GrupoMenu[]>((acc, grupo) => {
    const entradas = recortarLista(grupo.entradas, permisos)
    return entradas.length ? [...acc, { ...grupo, entradas }] : acc
  }, [])
}

const corresponde = (pathname: string, ruta: string) =>
  pathname === ruta || pathname.startsWith(`${ruta}/`)

export function ubicarRuta(pathname: string, permisos: PermisosPorClave): Ubicacion | null {
  const entradas = [...accesosVisibles(permisos), ...gruposVisibles(permisos).flatMap((g) => g.entradas)]
  let mejor: Ubicacion | null = null
  for (const entrada of entradas) {
    for (const d of entrada.destinos) {
      if (!corresponde(pathname, d.ruta)) continue
      if (!mejor || d.ruta.length > mejor.destino.ruta.length) mejor = { entrada, destino: d }
    }
  }
  return mejor
}

export const rutaInicial = (entrada: EntradaMenu) => entrada.destinos[0].ruta

export function primeraRutaPermitida(permisos: PermisosPorClave): string {
  const primera = [...accesosVisibles(permisos), ...gruposVisibles(permisos).flatMap((g) => g.entradas)][0]
  return primera ? rutaInicial(primera) : RUTA_SIEMPRE_PERMITIDA
}
