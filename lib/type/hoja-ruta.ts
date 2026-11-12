import type { DatosConstanciaRetiro } from "./constancia-retiro"

export const ESTADOS_HOJA_RUTA = ["Pendiente", "En proceso", "Finalizada"];
export type EstadoHojaRuta = (typeof ESTADOS_HOJA_RUTA)[number]

export interface MapaRutaDatos {
  polyline: string
   puntos: { lat: number; lng: number }[]
}

export interface ParadaHojaRuta {
  turnoId: number
  orden: number
  donante: string
  direccion: string
  sinDireccion: boolean
  fechaHora: string
  estadoTurno: string
  retirado: boolean
  constanciaId: number | null
}

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
  kmEstimado: number | null
}

export interface HojaRutaDia {
  empleadoTransportistaId: number
  transportista: { nombre: string; apellido: string } | null
  vehiculo: { id: number; patente: string; marca: string; modelo: string; kilometraje: number | null } | null
  fecha: string
  estado: EstadoHojaRuta
  paradas: ParadaHojaRuta[]
  cantidadPedidos: number
  kmEstimados: number | null
  duracionMinutos: number | null
  mapsUrl: string | null
  embedUrl: string | null
  mapa: { polyline: string; puntos: { lat: number; lng: number }[] } | null
  recorrido: PuntoRecorrido[]
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

export interface GenerarHojaRutaPayload {
  empleadoTransportistaId: number
  fecha?: string
  confirmar?: boolean
}

export interface HojaIniciadaPendiente {
  id: number
  fecha: string
  pendientes: number
}

export interface ResultadoRetiro {
  turnoId: number
  constanciaId: number | null
  hojaFinalizada: boolean
}

export type DatosConstancia = DatosConstanciaRetiro
