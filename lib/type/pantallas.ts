import type { PermisosPorClave } from "./permisos";


const PANTALLA_POR_RUTA: [string, string][] = [
  ["/pages/dashboard", "dashboard"],
  ["/pages/donacion", "donaciones"],
  ["/pages/turno", "turnos"],
  ["/pages/agenda", "turnos"],
  ["/pages/estado-turno", "estado_turno"],
  ["/pages/hoja-ruta", "hoja_ruta"],
  ["/pages/retiro", "retiros"],
  ["/pages/constancia-retiro", "constancia_retiro"],
  ["/pages/vehicles", "vehiculos"],
  ["/pages/material", "materiales"],
  ["/pages/material/material-type", "tipos_material"],
  ["/pages/material/material-condition", "condicion_material"],
  ["/pages/registro-fotografico", "registro_fotografico"],
  ["/pages/lote", "lotes"],
  ["/pages/rack", "racks"],
  ["/pages/pallet", "pallets"],
  ["/pages/proceso-destruccion", "proceso_destruccion"],
  ["/pages/estado-proceso-destruccion", "estado_proceso_destruccion"],
  ["/pages/medio-almacenamiento", "medio_almacenamiento"],
  ["/pages/medio-almacenamiento/types", "tipos"],
  ["/pages/medio-almacenamiento/brands", "marcas"],
  ["/pages/medio-almacenamiento/models", "modelos"],
  ["/pages/certificado-disposicion", "certificado_disposicion"],
  ["/pages/reportes/donaciones", "donaciones"],
  ["/pages/reportes/retiros", "retiros"],
  ["/pages/reportes/inventario", "materiales"],
  ["/pages/reportes/procesos-destruccion", "proceso_destruccion"],
  ["/pages/donante", "donantes"],
  ["/pages/employees", "empleados"],
  ["/pages/empleado-transportista", "empleado_transportista"],
  ["/pages/gestor-ambiental", "gestora_ambiental"],
  ["/pages/metodo-destruccion", "metodos_destruccion"],
  ["/pages/user-management", "usuarios"],
  ["/pages/roles", "roles"],
  ["/pages/auditoria", "auditoria"],
]

const corresponde = (ruta: string, base: string) => ruta === base || ruta.startsWith(`${base}/`)

export function pantallaDeRuta(ruta: string): string | null {
  let elegida: [string, string] | null = null
  for (const par of PANTALLA_POR_RUTA) {
    if (corresponde(ruta, par[0]) && (!elegida || par[0].length > elegida[0].length)) elegida = par
  }
  return elegida?.[1] ?? null
}

export const RUTA_SIEMPRE_PERMITIDA = "/pages/perfil"

export function puedeVerRuta(permisos: PermisosPorClave, ruta: string): boolean {
  const clave = pantallaDeRuta(ruta)
  return clave === null || permisos[clave]?.ver === true
}
