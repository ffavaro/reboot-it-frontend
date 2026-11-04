"use client"

import { useMemo } from "react"
import { PantallaReporte, SinDato, type ColumnaReporte } from "@/components/reportes/pantalla-reporte"
import { FiltroOpciones, etiquetaDe, idComoTexto, textoComoId, type Opcion } from "@/components/reportes/filtro-opciones"
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { retiroApi } from "@/lib/api"
import { dia, diaYHora } from "@/lib/documentos/formato"
import type { ReporteRetiro, ReporteRetiroQuery } from "@/lib/type/retiro"
import type { EstadoDonacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"

const nombreTransportista = (t?: { id: number; empleado?: { nombre: string; apellido: string } | null } | null) =>
  t?.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}` : ""

const donante = (r: ReporteRetiro) => r.donacion?.donante?.nombre ?? `Donante #${r.donacion?.donanteId ?? ""}`
const vehiculo = (r: ReporteRetiro) =>
  r.vehiculo ? [r.vehiculo.patente, r.vehiculo.marca, r.vehiculo.modelo].filter(Boolean).join(" ") : ""

const columnas: ColumnaReporte<ReporteRetiro>[] = [
  { encabezado: "N°", celda: (r) => `#${r.id}`, exportar: (r) => r.id, clase: "p-3 font-mono text-xs text-muted-foreground" },
  { encabezado: "Donante", celda: donante, exportar: donante, clase: "p-3 font-medium" },
  {
    encabezado: "Donación",
    celda: (r) => (
      <div className="font-mono text-xs text-muted-foreground">
        #{r.donacionId}
        {r.donacion?.descripcion && <p className="mt-0.5 max-w-35 truncate font-sans">{r.donacion.descripcion}</p>}
      </div>
    ),
    exportar: (r) => `#${r.donacionId}${r.donacion?.descripcion ? ` ${r.donacion.descripcion}` : ""}`,
  },
  {
    encabezado: "Estado donación",
    celda: (r) =>
      r.donacion?.estadoDonacion?.descripcion ? (
        <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{r.donacion.estadoDonacion.descripcion}</span>
      ) : (
        <SinDato />
      ),
    exportar: (r) => r.donacion?.estadoDonacion?.descripcion ?? "",
  },
  {
    encabezado: "Transportista",
    celda: (r) => nombreTransportista(r.empleadoTransportista) || <SinDato />,
    exportar: (r) => nombreTransportista(r.empleadoTransportista),
    clase: "p-3 text-xs font-medium",
  },
  {
    encabezado: "Vehículo",
    celda: (r) =>
      r.vehiculo ? (
        <div className="text-xs">
          <span className="font-mono font-medium">{r.vehiculo.patente}</span>
          <p className="text-muted-foreground">{[r.vehiculo.marca, r.vehiculo.modelo].filter(Boolean).join(" ")}</p>
        </div>
      ) : (
        <SinDato />
      ),
    exportar: vehiculo,
  },
  {
    encabezado: "Dirección",
    celda: (r) => r.direccion ?? <SinDato />,
    exportar: (r) => r.direccion ?? "",
    clase: "p-3 text-xs text-muted-foreground max-w-40",
  },
  {
    encabezado: "Fecha inicio",
    celda: (r) => (r.fechaInicio ? diaYHora(r.fechaInicio) : <SinDato />),
    exportar: (r) => (r.fechaInicio ? diaYHora(r.fechaInicio) : ""),
    clase: "p-3 text-xs text-muted-foreground whitespace-nowrap",
  },
  {
    encabezado: "Fecha retiro",
    celda: (r) =>
      r.fechaRetiro ? (
        <span className="font-medium text-green-600">{dia(r.fechaRetiro)}</span>
      ) : (
        <span className="italic text-amber-600">Pendiente</span>
      ),
    exportar: (r) => (r.fechaRetiro ? dia(r.fechaRetiro) : "Pendiente"),
    clase: "p-3 text-xs whitespace-nowrap",
  },
]

export default function ReporteRetirosPage() {
  const { donantes } = useDonantes()
  const { estadosDonacion } = useEstadosDonacion()
  const { transportistas } = useEmpleadosTransportistas()

  const opcionesDonante = useMemo<Opcion[]>(
    () => donantes.map((d: Donante) => ({ valor: String(d.id), etiqueta: d.nombre })),
    [donantes],
  )
  const opcionesTransportista = useMemo<Opcion[]>(
    () =>
      transportistas.map((t: EmpleadoTransportista) => ({
        valor: String(t.id),
        etiqueta: nombreTransportista(t) || `#${t.id}`,
      })),
    [transportistas],
  )
  const opcionesEstado = useMemo<Opcion[]>(
    () => estadosDonacion.map((e: EstadoDonacion) => ({ valor: String(e.id), etiqueta: e.descripcion })),
    [estadosDonacion],
  )

  return (
    <PantallaReporte<ReporteRetiro, ReporteRetiroQuery>
      titulo="Reporte de Retiros a Domicilio"
      descripcion="Retiros realizados a domicilio: quién los hizo, con qué vehículo y para qué donante."
      archivo="reporte-retiros"
      unidad={["retiro", "retiros"]}
      filtrosBase={{}}
      consultar={retiroApi.getReporte}
      columnas={columnas}
      resumir={(f) => [
        etiquetaDe(opcionesDonante, f.donanteId) && `Donante: ${etiquetaDe(opcionesDonante, f.donanteId)}`,
        etiquetaDe(opcionesTransportista, f.empleadoTransportistaId) &&
          `Transportista: ${etiquetaDe(opcionesTransportista, f.empleadoTransportistaId)}`,
        etiquetaDe(opcionesEstado, f.estadoDonacionId) && `Estado: ${etiquetaDe(opcionesEstado, f.estadoDonacionId)}`,
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
            etiqueta="Transportista"
            todos="Todos los transportistas"
            valor={idComoTexto(f.empleadoTransportistaId)}
            opciones={opcionesTransportista}
            onCambio={(v) => cambiar({ empleadoTransportistaId: textoComoId(v) })}
          />
          <FiltroOpciones
            etiqueta="Estado de la donación"
            todos="Todos los estados"
            valor={idComoTexto(f.estadoDonacionId)}
            opciones={opcionesEstado}
            onCambio={(v) => cambiar({ estadoDonacionId: textoComoId(v) })}
          />
        </>
      )}
    </PantallaReporte>
  )
}
