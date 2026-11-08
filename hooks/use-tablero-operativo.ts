import { useMemo } from "react"
import { useLotes } from "@/hooks/use-lote"
import { useDonantes } from "@/hooks/use-donantes"
import { useDonacionReporte } from "@/hooks/use-donacion"
import { useMateriales, useMaterialReporte } from "@/hooks/use-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import {
  type Periodo,
  type RangoFechas,
  clasificarMateriales,
  getBucketKey,
  getBucketKeyCustom,
  getBucketOrder,
  getBucketOrderCustom,
  pctChange,
} from "@/lib/utils/formato"
import { sinClasificar } from "@/lib/utils/formato"
import type { Lote } from "@/lib/type/lote"

export type EstadoLote = "En proceso" | "Clasificado" | "Desechado"

export interface FilaLote {
  loteId: number
  codigo: string
  donanteId: number | null
  donante: string
  fechaIso: string
  pesoKg: number
  estado: EstadoLote
}

interface Parametros {
  rango: RangoFechas
  anterior: RangoFechas
  preset: Periodo | null
  donanteIds: number[]
}

const redondear = (n: number) => Math.round(n * 10) / 10

export function useTableroOperativo({ rango, anterior, preset, donanteIds }: Parametros) {
  const { lotes, isLoading: l1 } = useLotes()
  const { donantes, isLoading: l2 } = useDonantes()
  const { condiciones, isLoading: l3 } = useCondicionesMaterial()
  const { materiales: todos, isLoading: l4 } = useMateriales()

  const unDonante = donanteIds.length === 1 ? { donanteId: donanteIds[0] } : {}
  const { donaciones: donacionesAhora, isLoading: l5 } = useDonacionReporte({ fechaDesde: rango.fechaDesde, fechaHasta: rango.fechaHasta, ...unDonante })
  const { donaciones: donacionesAntes, isLoading: l6 } = useDonacionReporte({ fechaDesde: anterior.fechaDesde, fechaHasta: anterior.fechaHasta, ...unDonante })
  const { materiales: materialesAhora, isLoading: l7 } = useMaterialReporte({ fechaDesde: rango.fechaDesde, fechaHasta: rango.fechaHasta })
  const { materiales: materialesAntes, isLoading: l8 } = useMaterialReporte({ fechaDesde: anterior.fechaDesde, fechaHasta: anterior.fechaHasta })

  const cargando = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8

  return useMemo(() => {
    const elegidos = new Set(donanteIds)
    const incluye = (id: number | null | undefined) => !elegidos.size || (id != null && elegidos.has(id))
    const condicion = new Map(condiciones.map((c) => [c.id, c.condicion]))
    const donantePorLote = new Map(lotes.filter((l: Lote) => l.donacion).map((l: Lote) => [l.id, l.donacion!.donanteId]))
    const nombreDonante = new Map(donantes.map((d) => [d.id, d.nombre]))
    const delDonante = <T extends { loteId: number | null }>(lista: T[]) =>
      elegidos.size ? lista.filter((m) => incluye(donantePorLote.get(m.loteId ?? -1))) : lista

    const donaciones = donacionesAhora.filter((d) => incluye(d.donanteId))
    const donacionesPrevias = donacionesAntes.filter((d) => incluye(d.donanteId))
    const materiales = delDonante(materialesAhora)
    const materialesPrevios = delDonante(materialesAntes)

    const destino = clasificarMateriales(materiales, condicion)
    const destinoPrevio = clasificarMateriales(materialesPrevios, condicion)
    const clasificados = destino.reutilizable + destino.reciclable + destino.desecho
    const clasificadosPrevios = destinoPrevio.reutilizable + destinoPrevio.reciclable + destinoPrevio.desecho
    const recuperacion = clasificados ? Math.round(((destino.reutilizable + destino.reciclable) / clasificados) * 100) : null
    const recuperacionPrevia = clasificadosPrevios ? Math.round(((destinoPrevio.reutilizable + destinoPrevio.reciclable) / clasificadosPrevios) * 100) : null

    const lotesDelPeriodo = lotes.filter((l: Lote) => {
      const dia = l.createdAt?.slice(0, 10)
      return incluye(l.donacion?.donanteId) && !!dia && dia >= rango.fechaDesde && dia <= rango.fechaHasta
    })
    const pesoIngresado = lotesDelPeriodo.reduce((s, l) => s + Number(l.pesoBrutoKg ?? 0), 0)

    const tramo = (iso: string) => (preset ? getBucketKey(iso, preset) : getBucketKeyCustom(iso, rango.fechaDesde, rango.fechaHasta))
    const tramos = preset ? getBucketOrder(preset, rango) : getBucketOrderCustom(rango.fechaDesde, rango.fechaHasta)
    const contar = (claves: string[]) => claves.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map<string, number>())
    const ingresos = contar(donaciones.map((d) => tramo(d.createdAt)))
    const clasificacion = contar(materiales.filter((m) => !sinClasificar(condicion.get(m.condicionMaterialId ?? -1))).map((m) => tramo(m.createdAt)))
    const pesos = lotesDelPeriodo.reduce(
      (m, l) => (l.createdAt ? m.set(tramo(l.createdAt), (m.get(tramo(l.createdAt)) ?? 0) + Number(l.pesoBrutoKg ?? 0)) : m),
      new Map<string, number>(),
    )
    const evolucion = tramos.map((t) => ({
      tramo: t,
      ingresados: ingresos.get(t) ?? 0,
      clasificados: clasificacion.get(t) ?? 0,
      pesoKg: redondear(pesos.get(t) ?? 0),
    }))

    const retiradas = donaciones.filter((d) => d.necesitaRetiro).length

    const materialesPorLote = todos.reduce(
      (m, mat) => m.set(mat.loteId ?? -1, [...(m.get(mat.loteId ?? -1) ?? []), mat]),
      new Map<number, typeof todos>(),
    )
    const estadoDe = (loteId: number): EstadoLote => {
      const condiciones = (materialesPorLote.get(loteId) ?? []).map((m) => (condicion.get(m.condicionMaterialId ?? -1) ?? "").toLowerCase())
      if (condiciones.length && condiciones.every((c) => c.includes("desecho"))) return "Desechado"
      if (condiciones.length && condiciones.every((c) => !sinClasificar(c))) return "Clasificado"
      return "En proceso"
    }
    const filasLotes: FilaLote[] = lotes
      .filter((l: Lote) => incluye(l.donacion?.donanteId))
      .map((l: Lote) => ({
        loteId: l.id,
        codigo: `LOT-${String(l.id).padStart(4, "0")}`,
        donanteId: l.donacion?.donanteId ?? null,
        donante: nombreDonante.get(l.donacion?.donanteId ?? -1) ?? "—",
        fechaIso: (l.createdAt ?? "").slice(0, 10),
        pesoKg: Number(l.pesoBrutoKg ?? 0),
        estado: estadoDe(l.id),
      }))
      .sort((a, b) => b.fechaIso.localeCompare(a.fechaIso) || b.loteId - a.loteId)

    const variacionDonaciones = pctChange(donaciones.length, donacionesPrevias.length)

    return {
      cargando,
      donantes,
      kpis: {
        donaciones: donaciones.length,
        variacionDonaciones,
        recuperacion,
        variacionRecuperacion: recuperacion !== null && recuperacionPrevia !== null ? recuperacion - recuperacionPrevia : null,
        raeeKg: clasificados ? Math.round(pesoIngresado * (destino.desecho / clasificados)) : 0,
      },
      destino: { ...destino, total: clasificados },
      recepcion: { sucursal: donaciones.length - retiradas, domicilio: retiradas },
      evolucion,
      filasLotes,
    }
  }, [cargando, donanteIds, condiciones, lotes, donantes, donacionesAhora, donacionesAntes, materialesAhora, materialesAntes, todos, rango, preset])
}

export type TableroOperativo = ReturnType<typeof useTableroOperativo>
