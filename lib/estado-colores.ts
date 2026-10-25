/**
 * Paletas de color (clases Tailwind) para badges de "estado" que se repetían,
 * redefinidas de forma independiente, en varias pantallas. Centralizadas acá
 * junto con los helpers de búsqueda para no tener una copia del mapa por página.
 */

export type ColorMap = Record<string, string>

// Búsqueda exacta por clave (ej. "Iniciado", "Pendiente", "Finalizado")
export function colorPorEstado(mapa: ColorMap, clave: string | null | undefined, porDefecto: string): string {
  if (!clave) return porDefecto
  return mapa[clave] ?? porDefecto
}

// Búsqueda case-insensitive (ej. "pendiente", "en proceso")
export function colorPorEstadoInsensible(mapa: ColorMap, clave: string | null | undefined, porDefecto: string): string {
  if (!clave) return porDefecto
  return mapa[clave.toLowerCase()] ?? porDefecto
}

// donacion.estadoDonacion.descripcion
export const ESTADO_DONACION_COLORS: ColorMap = {
  pendiente: "bg-yellow-100 text-yellow-800",
  "en proceso": "bg-blue-100 text-blue-800",
  completada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
}

// estado_turno.descripcion
export const ESTADO_TURNO_COLORS: ColorMap = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

// estado_proceso_destruccion.nombre, para badges de la UI (tono 800)
export const ESTADO_PROCESO_DESTRUCCION_COLORS: ColorMap = {
  Iniciado: "bg-blue-100 text-blue-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
  Finalizado: "bg-green-100 text-green-800",
}

// Misma paleta, tono 700, usada en los reportes imprimibles
export const ESTADO_PROCESO_DESTRUCCION_COLORS_REPORTE: ColorMap = {
  Iniciado: "bg-blue-100 text-blue-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
  Finalizado: "bg-green-100 text-green-700",
}

// rol.nombre, gestión de usuarios
export const ROL_COLORS: ColorMap = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  supervisor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  tecnico: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  operador: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

// condicion_material.condicion (estado físico del material)
export const CONDICION_FISICA_COLORS: ColorMap = {
  funcional: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  reparable: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  obsoleto: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  irreparable: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

// Estado de un lote (En proceso / Clasificado / Desechado), dashboard
export const ESTADO_LOTE_COLORS: ColorMap = {
  "En proceso": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Clasificado: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Desechado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

// resultado de un registro de auditoría
export const RESULTADO_AUDITORIA_COLORS: ColorMap = {
  Éxito: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

// Estado de un turno en la agenda semanal: fondo, texto, punto y borde
export type EstadoAgendaColor = { bg: string; text: string; dot: string; borde: string }

export const AGENDA_ESTADO_COLORS: Record<string, EstadoAgendaColor> = {
  pendiente: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500", borde: "border-blue-400" },
  confirmado: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500", borde: "border-green-400" },
  "en curso": { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", borde: "border-orange-400" },
  completado: { bg: "bg-teal-100", text: "text-teal-800", dot: "bg-teal-500", borde: "border-teal-400" },
  cancelado: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400", borde: "border-gray-300" },
}

export const AGENDA_ESTADO_COLOR_DEFAULT: EstadoAgendaColor = {
  bg: "bg-indigo-100",
  text: "text-indigo-800",
  dot: "bg-indigo-500",
  borde: "border-indigo-400",
}

// Busca por coincidencia parcial (ej. "en curso" dentro de "Turno en curso")
export function colorAgendaPorDescripcion(descripcion?: string | null): EstadoAgendaColor {
  if (!descripcion) return AGENDA_ESTADO_COLOR_DEFAULT
  const key = Object.keys(AGENDA_ESTADO_COLORS).find((k) => descripcion.toLowerCase().includes(k))
  return key ? AGENDA_ESTADO_COLORS[key] : AGENDA_ESTADO_COLOR_DEFAULT
}
