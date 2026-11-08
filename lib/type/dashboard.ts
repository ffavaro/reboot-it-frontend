import { EstadoLote, FilaLote } from "@/hooks/use-tablero-operativo"
import { LayoutItem } from "react-grid-layout"
import { ExportColumn } from "../utils/export"
import { COLOR } from "@/components/dashboard/estilo"
import { diaCorto, RangoFechas } from "../utils/formato"

export interface FiltroTablero {
  fechaDesde: string
  fechaHasta: string
  donanteIds: number[]
}

export interface DiasPorEtapa {
  espera: number
  clasificacion: number
  destruccionPallet: number
  certificacion: number
}

export interface Pendientes {
  turnosSinAsignarManana: number | null
  lotesPorClasificar: number
  procesosAbiertos: number
  donacionesParaCertificar: number | null
}

export interface SerieCiclo {
  meses: (DiasPorEtapa & { mes: string; donaciones: number; total: number })[]
  promedio: DiasPorEtapa
  donaciones: number
}

export interface GraficosCircuito {
  cicloPorEtapa: SerieCiclo | null
  destinoPorTipo: { tipo: string; reutilizable: number; reciclable: number; desecho: number; total: number }[]
  demandaTurnos: { dia: number; hora: number; cantidad: number }[]
  mapaDonantes: { id: number; nombre: string; tipo: string; donaciones: number; kg: number; pctReutilizable: number | null }[]
  kgPorMesYTipo: { mes: string; tipo: string; kg: number }[]
  destruccionPorMetodoYMedio: { metodo: string; medio: string; cantidad: number }[]
  eficienciaRutas: { id: number; fecha: string; paradas: number; km: number; transportista: string }[]
}

export interface ResumenCircuito {
  completo: boolean
  desde: string
  hasta: string
  pendiente: Pendientes
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
  graficos: GraficosCircuito
}

export interface UsoDeVehiculo {
  id: number
  patente: string
  marca: string
  modelo: string
  kmTotales: number
  cantidadRecorridos: number
}

export interface FiltroUsoVehiculos {
  fechaDesde: string
  fechaHasta: string
  limit?: number
}
//React grid-layout
export interface Tarjeta {
  id: string
  ancho: number
  alto: number
  contenido: React.ReactNode
}

export type Ubicacion = Pick<LayoutItem, "x" | "y" | "w" | "h">
export type Disposicion = Record<string, Ubicacion>

export interface Opcion {
  id: number
  nombre: string
}

export interface SelectorDonantesProps {
  opciones: Opcion[]
  elegidos: number[]
  onCambio: (ids: number[]) => void
}

export interface Contador {
  clave: string
  etiqueta: string
  motivo: string
  valor: number
  ruta: string
}

export interface PanelProps {
  titulo: string
  bajada?: React.ReactNode
  vacio?: string | false
  acciones?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export interface Porcion {
  nombre: string
  valor: number
  color: string
}

export const ESTADOS: { nombre: EstadoLote; color: string; clase: string }[] = [
  { nombre: "En proceso", color: COLOR.naranja, clase: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { nombre: "Clasificado", color: COLOR.verde, clase: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { nombre: "Desechado", color: COLOR.rojo, clase: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
]

export const LIMITE_TABLA = 25

export const COLUMNAS_ARCHIVO: ExportColumn<FilaLote>[] = [
  { header: "Fecha de ingreso", accessor: (f) => diaCorto(f.fechaIso) },
  { header: "Lote", accessor: (f) => f.codigo },
  { header: "Donante", accessor: (f) => f.donante },
  { header: "Peso (kg)", accessor: (f) => f.pesoKg },
  { header: "Estado", accessor: (f) => f.estado },
]

export  interface MovimientosProps {
  filas: FilaLote[]
  periodo: RangoFechas
  cargando: boolean
}