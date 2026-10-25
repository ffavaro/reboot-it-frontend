// Respuesta de GET /dashboard/resumen: indicadores de trabajo y de tiempos, y datos de los gráficos que cruzan tres o más variables

export interface DashboardQuery {
  fechaDesde: string
  fechaHasta: string
  donanteIds?: number[]
}

export interface EtapasCiclo {
  espera: number
  clasificacion: number
  destruccionPallet: number
  certificacion: number
}

export interface DashboardResumen {
  // false para quien ve solo lo de planta (Técnico)
  completo: boolean
  desde: string
  hasta: string
  pendiente: {
    turnosSinAsignarManana: number | null
    lotesPorClasificar: number
    procesosAbiertos: number
    donacionesParaCertificar: number | null
  }
  ciclo: { promedio: number; min: number; max: number; donaciones: number } | null
  reutilizacion: {
    reutilizable: number
    reciclable: number
    desecho: number
    total: number
    pctReutilizable: number | null
    pctDesecho: number | null
  }
  kgProcesados: number
  medios: { finalizados: number; total: number }
  donantes: { recurrentes: number; total: number } | null
  kmPorRetiro: { km: number; retiros: number; valor: number | null } | null
  retiroDomicilio: { conRetiro: number; total: number } | null
  graficos: {
    cicloPorEtapa: { meses: (EtapasCiclo & { mes: string; donaciones: number; total: number })[]; promedio: EtapasCiclo; donaciones: number } | null
    destinoPorTipo: { tipo: string; reutilizable: number; reciclable: number; desecho: number; total: number }[]
    demandaTurnos: { dia: number; hora: number; cantidad: number }[]
    mapaDonantes: { id: number; nombre: string; tipo: string; donaciones: number; kg: number; pctReutilizable: number | null }[]
    kgPorMesYTipo: { mes: string; tipo: string; kg: number }[]
    destruccionPorMetodoYMedio: { metodo: string; medio: string; cantidad: number }[]
    eficienciaRutas: { id: number; fecha: string; paradas: number; km: number; transportista: string }[]
  }
}
