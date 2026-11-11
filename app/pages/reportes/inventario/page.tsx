"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { PantallaReporte, SinDato, type ColumnaReporte } from "@/components/reportes/pantalla-reporte"
import {
  FiltroOpciones,
  boolComoTexto,
  etiquetaDe,
  idComoTexto,
  textoComoBool,
  textoComoId,
  type Opcion,
} from "@/components/reportes/filtro-opciones"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { materialApi } from "@/lib/api"
import { dia } from "@/lib/utils/fechas"
import type { ReporteInventario, ReporteInventarioQuery } from "@/lib/type/material"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"
import { ESTADO_COLORS_PROCESO_DESTRUCCION } from "@/lib/utils/estados"

const DESTRUCCION: Opcion[] = [
  { valor: "si", etiqueta: "Con proceso de destrucción" },
  { valor: "no", etiqueta: "Sin proceso de destrucción" },
]

const proceso = (m: ReporteInventario) => m.medioAlmacenamiento?.procesoDestruccion ?? null

function destruccionTexto(m: ReporteInventario) {
  if (!m.medioAlmacenamiento) return "No requiere destrucción"
  const p = proceso(m)
  if (!p) return "Requiere destrucción · sin proceso aún"
  return ["Requiere destrucción", p.estado?.nombre, p.metodoDestruccion?.nombre, p.fecha ? dia(p.fecha) : null]
    .filter(Boolean)
    .join(" · ")
}

const columnas: ColumnaReporte<ReporteInventario>[] = [
  { encabezado: "N° Material", celda: (m) => `#${m.id}`, exportar: (m) => m.id, clase: "p-3 font-mono text-xs text-muted-foreground" },
  {
    encabezado: "Lote / Donación",
    celda: (m) =>
      m.lote ? (
        <div className="text-xs">
          <p>
            <span className="text-muted-foreground">Lote </span>
            <span className="font-mono font-medium">#{m.lote.id}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Donación </span>
            <span className="font-mono">#{m.lote.donacionId}</span>
          </p>
          {m.lote.pesoBrutoKg && <p className="text-muted-foreground">{m.lote.pesoBrutoKg} kg</p>}
        </div>
      ) : (
        <SinDato texto="Sin lote" />
      ),
    exportar: (m) => (m.lote ? `Lote #${m.lote.id} · Donación #${m.lote.donacionId}` : "Sin lote"),
  },
  {
    encabezado: "Tipo",
    celda: (m) => m.tipoMaterial?.nombre ?? <SinDato />,
    exportar: (m) => m.tipoMaterial?.nombre ?? "",
    clase: "p-3 text-xs font-medium",
  },
  {
    encabezado: "Condición",
    celda: (m) =>
      m.condicionMaterial ? (
        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {m.condicionMaterial.condicion}
        </span>
      ) : (
        <SinDato />
      ),
    exportar: (m) => m.condicionMaterial?.condicion ?? "",
  },
  {
    encabezado: "Descripción",
    celda: (m) => m.descripcion ?? <SinDato />,
    exportar: (m) => m.descripcion ?? "",
    clase: "p-3 text-xs text-muted-foreground max-w-40",
  },
  {
    encabezado: "Proceso de destrucción",
    celda: (m) => {
      if (!m.medioAlmacenamiento) return <span className="text-xs font-medium text-green-600">No requiere destrucción</span>
      const p = proceso(m)
      return (
        <div className="space-y-0.5 text-xs">
          <p className="font-medium text-amber-600">Requiere destrucción</p>
          {!p && <SinDato texto="Sin proceso aún" />}
          {p?.estado && (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_COLORS_PROCESO_DESTRUCCION[p.estado.nombre.toLowerCase()] ?? "bg-muted text-foreground"}`}
            >
              {p.estado.nombre}
            </span>
          )}
          {p?.metodoDestruccion && <p className="text-muted-foreground">{p.metodoDestruccion.nombre}</p>}
          {p?.fecha && <p className="text-muted-foreground">{dia(p.fecha)}</p>}
        </div>
      )
    },
    exportar: destruccionTexto,
  },
]

export default function ReporteInventarioPage() {
  const { tipoMateriales } = useTipoMateriales()
  const { condiciones } = useCondicionesMaterial()

  const opcionesTipo = useMemo<Opcion[]>(
    () => tipoMateriales.map((t: TipoMaterial) => ({ valor: String(t.id), etiqueta: t.nombre })),
    [tipoMateriales],
  )
  const opcionesCondicion = useMemo<Opcion[]>(
    () => condiciones.map((c: CondicionMaterial) => ({ valor: String(c.id), etiqueta: c.condicion })),
    [condiciones],
  )

  return (
    <PantallaReporte<ReporteInventario, ReporteInventarioQuery>
      titulo="Reporte de Inventario"
      descripcion="Materiales registrados con su lote, condición y estado de destrucción."
      archivo="reporte-inventario"
      unidad={["material", "materiales"]}
      filtrosBase={{}}
      consultar={materialApi.getReporte}
      columnas={columnas}
      resumir={(f) => [
        etiquetaDe(opcionesTipo, f.tipoMaterialId) && `Tipo: ${etiquetaDe(opcionesTipo, f.tipoMaterialId)}`,
        etiquetaDe(opcionesCondicion, f.condicionMaterialId) && `Condición: ${etiquetaDe(opcionesCondicion, f.condicionMaterialId)}`,
        f.loteId ? `Lote #${f.loteId}` : null,
        etiquetaDe(DESTRUCCION, boolComoTexto(f.tieneDestruccion)),
      ]}
    >
      {(f, cambiar) => (
        <>
          <FiltroOpciones
            etiqueta="Tipo de material"
            todos="Todos los tipos"
            valor={idComoTexto(f.tipoMaterialId)}
            opciones={opcionesTipo}
            onCambio={(v) => cambiar({ tipoMaterialId: textoComoId(v) })}
          />
          <FiltroOpciones
            etiqueta="Condición del material"
            todos="Todas las condiciones"
            valor={idComoTexto(f.condicionMaterialId)}
            opciones={opcionesCondicion}
            onCambio={(v) => cambiar({ condicionMaterialId: textoComoId(v) })}
          />
          <FiltroOpciones
            etiqueta="Proceso de destrucción"
            todos="Todos"
            valor={boolComoTexto(f.tieneDestruccion)}
            opciones={DESTRUCCION}
            onCambio={(v) => cambiar({ tieneDestruccion: textoComoBool(v) })}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Lote <span className="font-normal text-muted-foreground">(número)</span>
            </span>
            <Input
              type="number"
              min={1}
              placeholder="Ej: 5"
              value={f.loteId ?? ""}
              onChange={(e) => cambiar({ loteId: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </>
      )}
    </PantallaReporte>
  )
}
