export type AccionPermiso = "ver" | "crear" | "editar" | "baja"
export type Alcance = "NINGUNO" | "PLENO" | "PROPIO" | "ASIGNADO" | "LIMITADO"

export type PermisosPantalla = Record<AccionPermiso, Alcance>
// Permisos del usuario por clave de pantalla (ver backend: tabla pantalla)
export type Permisos = Record<string, PermisosPantalla>

export interface PermisoMatriz extends PermisosPantalla {
  pantallaId: number
  clave: string
  nombre: string
  seccion: string
  notas: string | null
}

export interface MatrizRol {
  rol: { id: number; nombre: string }
  permisos: PermisoMatriz[]
}

export interface GuardarPermisosPayload {
  permisos: { pantallaId: number; ver: Alcance; crear: Alcance; editar: Alcance; baja: Alcance }[]
}
