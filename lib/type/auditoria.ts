export interface RegistroAuditoria {
  id: number
  usuarioId: number | null
  fechaHora: string
  accion: string
  resultado: "Éxito" | "Error" | string
  ip: string | null
  usuarioIntentado: string | null
  rol: string | null
  metodo: string | null
  ruta: string | null
  entidad: string | null
  entidadId: number | null
  codigoHttp: number | null
  userAgent: string | null
  usuario?: { id: number; nombre: string; email: string } | null
}

export interface AuditoriaQuery {
  usuarioId?: number
  fechaDesde?: string
  fechaHasta?: string
  accion?: string
  resultado?: "Éxito" | "Error"
  page?: number
  limit?: number
}

export interface AuditoriaPagina {
  data: RegistroAuditoria[]
  total: number
  page: number
  limit: number
  totalPages: number
}
