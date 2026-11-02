"use client"

import { useMemo } from "react"
import { PantallaReporte, SinDato, type ColumnaReporte } from "@/components/reportes/pantalla-reporte"
import { FiltroOpciones, etiquetaDe, idComoTexto, textoComoId, type Opcion } from "@/components/reportes/filtro-opciones"
import { useEstadosProcesoDestruccion } from "@/hooks/use-estado-proceso-destruccion"
import { useMetodosDestruccion } from "@/hooks/use-metodo-destruccion"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { procesoDestruccionApi } from "@/lib/api"
import { dia } from "@/lib/documentos/formato"
import type { ProcesoDestruccion, ReporteProcesoDestruccionQuery } from "@/lib/type/proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"
import type { Empleado } from "@/lib/type/user"

const TONO_ESTADO: Record<string, string> = {
  iniciado: "bg-blue-100 text-blue-700",
  pendiente: "bg-yellow-100 text-yellow-700",
  finalizado: "bg-green-100 text-green-700",
}

const responsable = (p: ProcesoDestruccion) => (p.empleado ? `${p.empleado.nombre} ${p.empleado.apellido}` : "")
const material = (p: ProcesoDestruccion) => p.medioAlmacenamiento?.material

const columnas: ColumnaReporte<ProcesoDestruccion>[] = [
  { encabezado: "N°", celda: (p) => `#${p.id}`, exportar: (p) => p.id, clase: "p-3 font-mono text-xs text-muted-foreground" },
  {
    encabezado: "Medio de almacenamiento",
    celda: (p) => (
      <div className="text-xs text-muted-foreground">
        <span className="font-mono">#{p.medioAlmacenamientoId}</span>
        {material(p)?.descripcion && <p className="mt-0.5 max-w-40 truncate">{material(p)?.descripcion}</p>}
      </div>
    ),
    exportar: (p) => `#${p.medioAlmacenamientoId}${material(p)?.descripcion ? ` ${material(p)?.descripcion}` : ""}`,
  },
  {
    encabezado: "Tipo de material",
    celda: (p) => material(p)?.tipoMaterial?.nombre ?? <SinDato />,
    exportar: (p) => material(p)?.tipoMaterial?.nombre ?? "",
  },
  {
    encabezado: "Método",
    celda: (p) => p.metodoDestruccion?.nombre ?? <SinDato texto="Sin método" />,
    exportar: (p) => p.metodoDestruccion?.nombre ?? "Sin método",
  },
  {
    encabezado: "Estado",
    celda: (p) =>
      p.estado ? (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONO_ESTADO[p.estado.nombre.toLowerCase()] ?? "bg-muted text-foreground"}`}
        >
          {p.estado.nombre}
        </span>
      ) : (
        <SinDato />
      ),
    exportar: (p) => p.estado?.nombre ?? "",
  },
  {
    encabezado: "Empleado responsable",
    celda: (p) => responsable(p) || <SinDato texto="Sin asignar" />,
    exportar: (p) => responsable(p) || "Sin asignar",
  },
  {
    encabezado: "Fecha",
    celda: (p) => (p.fecha ? dia(p.fecha) : <SinDato />),
    exportar: (p) => (p.fecha ? dia(p.fecha) : ""),
    clase: "p-3 text-xs text-muted-foreground whitespace-nowrap",
  },
]

export default function ReporteProcesoDestruccionPage() {
  const { estados } = useEstadosProcesoDestruccion()
  const { metodos } = useMetodosDestruccion()
  const { empleados } = useEmpleadosFull()

  const opcionesEstado = useMemo<Opcion[]>(
    () => estados.map((e: EstadoProcesoDestruccion) => ({ valor: String(e.id), etiqueta: e.nombre })),
    [estados],
  )
  const opcionesMetodo = useMemo<Opcion[]>(
    () => metodos.map((m: MetodoDestruccion) => ({ valor: String(m.id), etiqueta: m.nombre })),
    [metodos],
  )
  const opcionesEmpleado = useMemo<Opcion[]>(
    () => empleados.map((e: Empleado) => ({ valor: String(e.id), etiqueta: `${e.nombre} ${e.apellido}` })),
    [empleados],
  )

  return (
    <PantallaReporte<ProcesoDestruccion, ReporteProcesoDestruccionQuery>
      titulo="Reporte de Procesos de Destrucción"
      descripcion="Procesos de destrucción de medios de almacenamiento con su método, estado y responsable."
      archivo="reporte-procesos-destruccion"
      unidad={["proceso", "procesos"]}
      filtrosBase={{}}
      consultar={procesoDestruccionApi.getReporte}
      columnas={columnas}
      resumir={(f) => [
        etiquetaDe(opcionesEstado, f.estadoId) && `Estado: ${etiquetaDe(opcionesEstado, f.estadoId)}`,
        etiquetaDe(opcionesMetodo, f.metodoDestruccionId) && `Método: ${etiquetaDe(opcionesMetodo, f.metodoDestruccionId)}`,
        etiquetaDe(opcionesEmpleado, f.empleadoId) && `Empleado: ${etiquetaDe(opcionesEmpleado, f.empleadoId)}`,
      ]}
    >
      {(f, cambiar) => (
        <>
          <FiltroOpciones
            etiqueta="Estado del proceso"
            todos="Todos los estados"
            valor={idComoTexto(f.estadoId)}
            opciones={opcionesEstado}
            onCambio={(v) => cambiar({ estadoId: textoComoId(v) })}
          />
          <FiltroOpciones
            etiqueta="Método de destrucción"
            todos="Todos los métodos"
            valor={idComoTexto(f.metodoDestruccionId)}
            opciones={opcionesMetodo}
            onCambio={(v) => cambiar({ metodoDestruccionId: textoComoId(v) })}
          />
          <FiltroOpciones
            etiqueta="Empleado responsable"
            todos="Todos los empleados"
            valor={idComoTexto(f.empleadoId)}
            opciones={opcionesEmpleado}
            onCambio={(v) => cambiar({ empleadoId: textoComoId(v) })}
          />
        </>
      )}
    </PantallaReporte>
  )
}
