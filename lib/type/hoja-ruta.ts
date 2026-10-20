// Las transiciones solo van hacia adelante: Pendiente -> En proceso -> Finalizada
export const ESTADOS_HOJA_RUTA = ["Pendiente", "En proceso", "Finalizada"] as const
export type EstadoHojaRuta = (typeof ESTADOS_HOJA_RUTA)[number]

export interface ParadaHojaRuta {
  turnoId: number
  orden: number
  donante: string
  direccion: string
  sinDireccion: boolean
  fechaHora: string
  estadoTurno: string
}

// Un punto del recorrido tal como se envía a Google Maps: origen, paradas intermedias y destino
export interface PuntoRecorrido {
  rol: "origen" | "parada" | "destino"
  etiqueta: string
  direccion: string
  donante: string | null
}

export interface HojaRutaInfo {
  id: number
  estado: EstadoHojaRuta
  fechaInicio: string | null
  fechaFin: string | null
  kmInicial: number | null
  kmFinal: number | null
  kmReales: number | null
}

export interface HojaRutaDia {
  empleadoTransportistaId: number
  transportista: { nombre: string; apellido: string; cuitDni: string | null } | null
  vehiculo: { id: number; patente: string; marca: string; modelo: string; kilometraje: number | null } | null
  fecha: string
  estado: EstadoHojaRuta
  paradas: ParadaHojaRuta[]
  cantidadPedidos: number
  kmEstimados: number | null
  mapsUrl: string | null
  // URL del mapa embebido (iframe) con la ruta
  embedUrl: string | null
  recorrido: PuntoRecorrido[]
  // Base configurada en el backend (HOJA_RUTA_ORIGEN): desde donde sale y a donde vuelve la ruta
  origen: string | null
  rutaOptimizada: boolean
  advertencia?: string
  hojaRuta: HojaRutaInfo | null
}

export interface HojaRutaHistorico {
  id: number
  fecha: string
  empleadoTransportistaId: number
  transportista: string
  vehiculo: { id: number; patente: string; marca: string; modelo: string } | null
  cantidadPedidos: number
  kmEstimados: number | null
  kmInicial: number | null
  kmFinal: number | null
  kmReales: number | null
  fechaInicio: string | null
  fechaFin: string | null
  estado: EstadoHojaRuta
}

export interface HojaRutaDiaQuery {
  // Rango de fechas; sin ninguna, el backend devuelve la hoja de hoy
  fechaDesde?: string
  fechaHasta?: string
  empleadoTransportistaId?: number
  estado?: EstadoHojaRuta
}

export interface HojaRutaHistoricoQuery {
  fechaDesde?: string
  fechaHasta?: string
  empleadoTransportistaId?: number
  vehiculoId?: number
}
