export type ResultadoAuditoria = "Éxito" | "Error"

export interface EventoAuditoria {
  id: number
  usuarioId: number | null
  fechaHora: string
  accion: string
  resultado: ResultadoAuditoria | string
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

export interface FiltrosAuditoria {
  fechaDesde?: string
  fechaHasta?: string
  usuarioId?: number
  accion?: string
  resultado?: ResultadoAuditoria
}

export interface ConsultaAuditoria extends FiltrosAuditoria {
  page: number
  limit: number
}

export interface PaginaAuditoria {
  data: EventoAuditoria[]
  total: number
  page: number
  limit: number
  totalPages: number
}
