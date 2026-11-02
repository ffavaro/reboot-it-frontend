import {
  BarChart2, Briefcase, CalendarDays, Factory, FileBarChart, FileCheck, Heart, Layers, Library, Lock, MapPin,
  Package, PackageOpen, Recycle, Route, Shield, Trash2, Truck, User, UserCog, Users, Warehouse,
} from "lucide-react"
import type { TokenPayload } from "@/lib/auth-utils"
import type { Destino, EntradaMenu, GrupoMenu, Perfil, Ubicacion } from "@/lib/type/sidebar"

const EQUIPO: Perfil[] = ["equipo"]
const SOLO_DONANTE: Perfil[] = ["donante"]
const CON_TRANSPORTISTA: Perfil[] = ["equipo", "transportista"]

const destino = (etiqueta: string, ruta: string, perfiles?: Perfil[]): Destino => ({ etiqueta, ruta, perfiles })

const simple = (etiqueta: string, ruta: string, icono: EntradaMenu["icono"], perfiles?: Perfil[]): EntradaMenu => ({
  etiqueta,
  icono,
  perfiles,
  destinos: [destino(etiqueta, ruta)],
})

export const ACCESOS_DIRECTOS: EntradaMenu[] = [
  simple("Dashboard", "/pages/dashboard", BarChart2, EQUIPO),
]

export const GRUPOS_MENU: GrupoMenu[] = [
  {
    etiqueta: "Recepción",
    icono: Recycle,
    entradas: [
      simple("Donaciones", "/pages/donacion", Heart, EQUIPO),
      {
        etiqueta: "Mis donaciones",
        icono: Heart,
        perfiles: SOLO_DONANTE,
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
        perfiles: CON_TRANSPORTISTA,
        destinos: [
          destino("Lista", "/pages/turno", CON_TRANSPORTISTA),
          destino("Calendario", "/pages/agenda", EQUIPO),
        ],
      },
    ],
  },
  {
    etiqueta: "Logística",
    icono: Route,
    entradas: [
      simple("Hoja de ruta", "/pages/hoja-ruta", MapPin, CON_TRANSPORTISTA),
      {
        etiqueta: "Retiros",
        icono: PackageOpen,
        perfiles: CON_TRANSPORTISTA,
        destinos: [
          destino("Retiros", "/pages/retiro", CON_TRANSPORTISTA),
          destino("Constancias de retiro", "/pages/constancia-retiro", EQUIPO),
        ],
      },
      {
        etiqueta: "Flota",
        icono: Truck,
        perfiles: CON_TRANSPORTISTA,
        destinos: [destino("Vehículos", "/pages/vehicles", CON_TRANSPORTISTA)],
      },
    ],
  },
  {
    etiqueta: "Planta",
    icono: Factory,
    entradas: [
      simple("Clasificación", "/pages/material", Layers),
      simple("Lotes", "/pages/lote", Package),
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
      simple("Certificados", "/pages/certificado-disposicion", FileCheck, EQUIPO),
    ],
  },
  {
    etiqueta: "Análisis",
    icono: FileBarChart,
    entradas: [
      {
        etiqueta: "Reportes",
        icono: FileBarChart,
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
    ],
  },
]

export function perfilDeUsuario(usuario: TokenPayload | null): Perfil {
  const rol = usuario?.rol?.nombre?.trim().toLowerCase()
  if (rol === "donante" || rol === "transportista") return rol
  return "equipo"
}

const habilitado = (perfiles: Perfil[] | undefined, perfil: Perfil) =>
  perfiles ? perfiles.includes(perfil) : perfil === "equipo"

function recortarEntrada(entrada: EntradaMenu, perfil: Perfil): EntradaMenu | null {
  if (!habilitado(entrada.perfiles, perfil)) return null
  const destinos = entrada.destinos.filter((d) => habilitado(d.perfiles ?? entrada.perfiles, perfil))
  return destinos.length ? { ...entrada, destinos } : null
}

const recortarLista = (entradas: EntradaMenu[], perfil: Perfil) =>
  entradas.flatMap((e) => recortarEntrada(e, perfil) ?? [])

export function accesosParaPerfil(perfil: Perfil): EntradaMenu[] {
  return recortarLista(ACCESOS_DIRECTOS, perfil)
}

export function gruposParaPerfil(perfil: Perfil): GrupoMenu[] {
  return GRUPOS_MENU.reduce<GrupoMenu[]>((acc, grupo) => {
    const entradas = recortarLista(grupo.entradas, perfil)
    return entradas.length ? [...acc, { ...grupo, entradas }] : acc
  }, [])
}

const corresponde = (pathname: string, ruta: string) =>
  pathname === ruta || pathname.startsWith(`${ruta}/`)

export function ubicarRuta(pathname: string, perfil: Perfil): Ubicacion | null {
  const entradas = [...accesosParaPerfil(perfil), ...gruposParaPerfil(perfil).flatMap((g) => g.entradas)]
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
