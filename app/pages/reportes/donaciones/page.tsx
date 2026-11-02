"use client"

import { useMemo } from "react"
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
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import { donacionApi } from "@/lib/api"
import { dia, diaYHora } from "@/lib/documentos/formato"
import type { EstadoDonacion, ReporteDonacion, ReporteDonacionQuery } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"

const ENTREGA: Opcion[] = [
  { valor: "si", etiqueta: "Retiro a domicilio" },
  { valor: "no", etiqueta: "En sucursal" },
]

const MATERIALES: Opcion[] = [
  { valor: "si", etiqueta: "Con materiales registrados" },
  { valor: "no", etiqueta: "Sin materiales registrados" },
]

const nombreDonante = (d: ReporteDonacion) => d.donante?.nombre ?? `Donante #${d.donanteId}`

const transportista = (d: ReporteDonacion) => {
  const empleado = d.retiro?.empleadoTransportista?.empleado
  return empleado ? `${empleado.nombre} ${empleado.apellido}` : ""
}

const listaMateriales = (d: ReporteDonacion) =>
  (d.detalles ?? []).map((m) => {
    const tipo = m.tipoMaterial?.descripcion ?? `Material #${m.tipoMaterialId}`
    return m.cantidadEstimada ? `${tipo} x${m.cantidadEstimada}` : tipo
  })

const columnas: ColumnaReporte<ReporteDonacion>[] = [
  {
    encabezado: "N°",
    celda: (d) => `#${d.id}`,
    exportar: (d) => d.id,
    clase: "p-3 font-mono text-xs text-muted-foreground",
  },
  { encabezado: "Donante", celda: nombreDonante, exportar: nombreDonante, clase: "p-3 font-medium" },
  {
    encabezado: "Estado",
    celda: (d) =>
      d.estadoDonacion?.descripcion ? (
        <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{d.estadoDonacion.descripcion}</span>
      ) : (
        <SinDato />
      ),
    exportar: (d) => d.estadoDonacion?.descripcion ?? "",
  },
  {
    encabezado: "Turno",
    celda: (d) => (d.turno ? diaYHora(d.turno.fechaHora) : <SinDato />),
    exportar: (d) => (d.turno ? diaYHora(d.turno.fechaHora) : ""),
    clase: "p-3 text-xs text-muted-foreground whitespace-nowrap",
  },
  {
    encabezado: "Entrega",
    celda: (d) =>
      d.necesitaRetiro ? (
        <div className="space-y-0.5 text-xs">
          <span className="font-medium text-amber-600">Retiro a domicilio</span>
          <p className="text-muted-foreground">{d.direccionRetiro ? `Otra dirección: ${d.direccionRetiro}` : "Dirección del donante"}</p>
        </div>
      ) : (
        <span className="text-xs font-medium text-green-600">En sucursal</span>
      ),
    exportar: (d) => (d.necesitaRetiro ? `Retiro a domicilio${d.direccionRetiro ? ` (${d.direccionRetiro})` : ""}` : "En sucursal"),
  },
  {
    encabezado: "Materiales",
    celda: (d) => {
      const items = listaMateriales(d)
      if (!items.length) return <SinDato texto="Sin materiales" />
      return (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    },
    exportar: (d) => listaMateriales(d).join(", "),
  },
  {
    encabezado: "Retiro",
    celda: (d) => {
      if (!d.necesitaRetiro) return <SinDato />
      if (!d.retiro) return <SinDato texto="Pendiente de retiro" />
      const { vehiculo, fechaRetiro, fechaInicio, direccion } = d.retiro
      return (
        <div className="space-y-0.5 text-xs">
          <p className="font-medium">{transportista(d) || "Sin transportista"}</p>
          {vehiculo && (
            <p className="font-mono text-muted-foreground">
              {[vehiculo.patente, [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
            </p>
          )}
          {fechaRetiro ? (
            <p className="text-muted-foreground">Retirado: {dia(fechaRetiro)}</p>
          ) : (
            fechaInicio && <p className="text-muted-foreground">Inicio: {dia(fechaInicio)}</p>
          )}
          {direccion && <p className="text-muted-foreground">{direccion}</p>}
        </div>
      )
    },
    exportar: (d) =>
      [transportista(d), d.retiro?.vehiculo?.patente, d.retiro?.fechaRetiro ? `Retirado ${dia(d.retiro.fechaRetiro)}` : ""]
        .filter(Boolean)
        .join(" · "),
  },
]

export default function ReporteDonacionPage() {
  const { donantes } = useDonantes()
  const { estadosDonacion } = useEstadosDonacion()

  const opcionesDonante = useMemo<Opcion[]>(
    () =>
      [...donantes]
        .sort((a: Donante, b: Donante) => a.nombre.localeCompare(b.nombre, "es"))
        .map((d: Donante) => ({ valor: String(d.id), etiqueta: d.nombre })),
    [donantes],
  )
  const opcionesEstado = useMemo<Opcion[]>(
    () => estadosDonacion.map((e: EstadoDonacion) => ({ valor: String(e.id), etiqueta: e.descripcion })),
    [estadosDonacion],
  )

  return (
    <PantallaReporte<ReporteDonacion, ReporteDonacionQuery>
      titulo="Reporte de Donaciones"
      descripcion="Donaciones registradas con su turno, modalidad de entrega, materiales y retiro."
      archivo="reporte-donaciones"
      unidad={["donación", "donaciones"]}
      filtrosBase={{}}
      consultar={donacionApi.getReporte}
      columnas={columnas}
      resumir={(f) => [
        etiquetaDe(opcionesDonante, f.donanteId) && `Donante: ${etiquetaDe(opcionesDonante, f.donanteId)}`,
        etiquetaDe(opcionesEstado, f.estadoDonacionId) && `Estado: ${etiquetaDe(opcionesEstado, f.estadoDonacionId)}`,
        etiquetaDe(ENTREGA, boolComoTexto(f.necesitaRetiro)) && `Entrega: ${etiquetaDe(ENTREGA, boolComoTexto(f.necesitaRetiro))}`,
        etiquetaDe(MATERIALES, boolComoTexto(f.tieneMateriales)),
      ]}
    >
      {(f, cambiar) => (
        <>
          <FiltroOpciones
            etiqueta="Donante"
            todos="Todos los donantes"
            valor={idComoTexto(f.donanteId)}
            opciones={opcionesDonante}
            onCambio={(v) => cambiar({ donanteId: textoComoId(v) })}
          />
          <FiltroOpciones
            etiqueta="Estado de donación"
            todos="Todos los estados"
            valor={idComoTexto(f.estadoDonacionId)}
            opciones={opcionesEstado}
            onCambio={(v) => cambiar({ estadoDonacionId: textoComoId(v) })}
          />
          <FiltroOpciones
            etiqueta="Modalidad de entrega"
            todos="Todas"
            valor={boolComoTexto(f.necesitaRetiro)}
            opciones={ENTREGA}
            onCambio={(v) => cambiar({ necesitaRetiro: textoComoBool(v) })}
          />
          <FiltroOpciones
            etiqueta="Medios de almacenamiento"
            todos="Todas"
            valor={boolComoTexto(f.tieneMateriales)}
            opciones={MATERIALES}
            onCambio={(v) => cambiar({ tieneMateriales: textoComoBool(v) })}
          />
        </>
      )}
    </PantallaReporte>
  )
}
