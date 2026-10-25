/**
 * Nombres de los registros de catálogo que el frontend compara por texto.
 * Tienen que coincidir con lo que hay cargado en la base (los mismos que usa el backend en
 * src/common/constants/estados.ts). Si un nombre cambia en la base, se cambia acá.
 */

// estado_turno.descripcion
export const ESTADO_TURNO = {
  PENDIENTE: "Pendiente",
  RETIRO_CONFIRMADO: "Retiro confirmado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  REPROGRAMADO: "Reprogramado",
  SIN_ASIGNAR: "Sin asignar",
  ASIGNADO: "Asignado",
  EN_CLASIFICACION: "En Clasificacion",
} as const

// estado_donacion.descripcion
export const ESTADO_DONACION = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
  PENDIENTE_CERTIFICADO: "Pendiente de emision certificado",
} as const

// condicion_material.condicion
export const CONDICION_MATERIAL = {
  REUTILIZABLE: "Reutilizable",
  RECICLABLE: "Reciclable",
  DESECHO: "Desecho",
  // Condición de un material recién cargado, todavía sin clasificar
  A_DEFINIR: "A definir",
} as const

const minusculas = (s?: string | null) => (s ?? "").toLowerCase().trim()

export const esCondicion = (nombre: string | null | undefined, condicion: string) =>
  minusculas(nombre) === minusculas(condicion)

// Un material sin condición, o con "A definir", todavía no fue clasificado.
// ("pendiente" se mantiene por compatibilidad con bases viejas, donde se llamaba "Pendiente de Clasificar".)
export const esCondicionSinClasificar = (nombre?: string | null) => {
  const n = minusculas(nombre)
  return !n || n.includes(minusculas(CONDICION_MATERIAL.A_DEFINIR)) || n.includes("pendiente")
}

// Un turno queda listo para el botón "Clasificar" cuando el retiro a domicilio confirmó la
// recepción, o cuando el turno de sucursal ya fue asignado a un técnico/administrativo.
export const puedeClasificarTurno = (t: {
  estadoTurno?: { descripcion?: string | null } | null
  necesitaRetiro: boolean
  empleadoId: number | null
}) => {
  const estado = minusculas(t.estadoTurno?.descripcion)
  if (t.necesitaRetiro) return estado === minusculas(ESTADO_TURNO.RETIRO_CONFIRMADO)
  return estado === minusculas(ESTADO_TURNO.ASIGNADO) && !!t.empleadoId
}
