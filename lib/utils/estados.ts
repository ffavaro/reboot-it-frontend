export const ESTADO_DONACION_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  "en proceso": "bg-blue-100 text-blue-800",
  completada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
}

 export const ESTADO_COLORS_PROCESO_DESTRUCCION: Record<string, string> = {
  Iniciado: "bg-blue-100 text-blue-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
  Finalizado: "bg-green-100 text-green-800",
  Defecto : "bg-gray-100 text-gray-800"
}

export const ESTADOS_COLORS_TURNO: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  "Sin asignar": "bg-slate-200 text-slate-700",
  Asignado: "bg-blue-100 text-blue-800",
  "Retiro confirmado": "bg-indigo-100 text-indigo-800",
  "En clasificacion": "bg-violet-100 text-violet-800",
  Finalizado: "bg-green-100 text-green-800",
  Reprogramado: "bg-orange-100 text-orange-800",
  Cancelado: "bg-red-100 text-red-800",
}
export const CONDICION_MATERIAL:Record<string, string> = {
  Reutilizable: "bg-yellow-100",
  Reciclable: "bg-green-100",
  Desecho: "bg-red-100",
  "Pendiente de Clasificar": "bg-orange-100"
}

export const ESTADO_HOJA_RUTA: Record<string, string> = {
  "Pendiente": "bg-yellow-100",
  "En proceso": "bg-amber-100",
  "Finalizada": "bg-green-100",
}

export const ROLES: Record<string, string> = {
  Admin: "bg-red-100",
  Administrativo: "bg-blue-100",
  Transportista: "bg-green-100",
  Tecnico: "bg-orange-100",
  Donante: "bg-yellow-100",
}