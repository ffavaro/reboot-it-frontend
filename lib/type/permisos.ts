export const ACCIONES = ["ver", "crear", "editar", "baja"] as const
export type Accion = (typeof ACCIONES)[number]

export const ALCANCES = ["TODOS", "EN_PLANTA", "ASIGNADOS", "PROPIOS"] as const
export type Alcance = (typeof ALCANCES)[number]

export const NOMBRE_ACCION: Record<Accion, string> = { ver: "Ver", crear: "Crear", editar: "Editar", baja: "Baja" }

export const NOMBRE_ALCANCE: Record<Alcance, string> = {
  TODOS: "Todos",
  EN_PLANTA: "En planta",
  ASIGNADOS: "Asignados",
  PROPIOS: "Propios",
}

export type PermisoPantalla = Record<Accion, boolean> & { alcance: Alcance }

export type PermisosPorClave = Record<string, PermisoPantalla>

export interface FilaMatriz extends PermisoPantalla {
  pantallaId: number
  clave: string
  nombre: string
  seccion: string
}

export interface MatrizRol {
  rol: { id: number; nombre: string; codigo: string | null; esSistema: boolean }
  permisos: FilaMatriz[]
}

export type PermisoAGuardar = PermisoPantalla & { pantallaId: number }
