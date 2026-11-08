"use client"

import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Leyenda, Panel } from "@/components/dashboard/panel"
import { ALTO_EJE_X, CAJA_TOOLTIP, COLOR, CURSOR_BARRA, GRILLA, MARCAS, tituloX, tituloY } from "../estilo"
import { entero, porcentaje } from "@/lib/utils/formato"
import type { TableroOperativo } from "@/hooks/use-tablero-operativo"
import { Porcion, Tarjeta } from "@/lib/type/dashboard"

function Dona({ porciones, unidad, centro }: { porciones: Porcion[]; unidad: string; centro?: boolean }) {
  const total = porciones.reduce((s, p) => s + p.valor, 0)
  return (
    <>
      <div className="relative min-h-[130px] flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={130}>
          <PieChart>
            <Pie data={porciones} dataKey="valor" nameKey="nombre" innerRadius="62%" outerRadius="92%" paddingAngle={3}>
              {porciones.map((p) => (
                <Cell key={p.nombre} fill={p.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${entero(Number(v ?? 0))} ${unidad}`]} contentStyle={CAJA_TOOLTIP} />
          </PieChart>
        </ResponsiveContainer>
        {centro && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-medium leading-none">{entero(total)}</span>
            <span className="mt-1 text-xs text-muted-foreground">{unidad}</span>
          </div>
        )}
      </div>
      <ul className="mt-2 flex flex-col gap-1.5 text-xs">
        {porciones.map((p) => (
          <li key={p.nombre} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="size-3 shrink-0 rounded-sm" style={{ background: p.color }} />
              <span className="truncate">{p.nombre}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {entero(p.valor)} <span className="font-medium text-foreground">({porcentaje(p.valor, total)})</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

export function tarjetasOperativas(datos: TableroOperativo, periodo: string, filtrandoDonantes: boolean): Tarjeta[] {
  const sufijo = filtrandoDonantes ? " para los donantes elegidos" : ""
  const { destino, recepcion, evolucion } = datos

  return [
    {
      id: "destino-materiales",
      ancho: 4,
      alto: 11,
      contenido: (
        <Panel titulo="Destino de los materiales" bajada={`Materiales clasificados · ${periodo}`} vacio={!destino.total && `No hay materiales clasificados en el período${sufijo}.`}>
          <Dona
            centro
            unidad="materiales"
            porciones={[
              { nombre: "Reacondicionamiento / donación social", valor: destino.reutilizable, color: COLOR.verde },
              { nombre: "Stock de componentes", valor: destino.reciclable, color: COLOR.azul },
              { nombre: "Disposición final / scrap", valor: destino.desecho, color: COLOR.rojo },
            ]}
          />
        </Panel>
      ),
    },
    {
      id: "ingreso-procesamiento",
      ancho: 4,
      alto: 10,
      contenido: (
        <Panel titulo="Ingreso vs. procesamiento" bajada={`Donaciones que entran contra materiales que clasifica el laboratorio · ${periodo}`}>
          <Leyenda items={[{ nombre: "Ingresados", color: COLOR.azul }, { nombre: "Clasificados", color: COLOR.verde }]} />
          <ResponsiveContainer width="100%" height="100%" minHeight={150}>
            <BarChart data={evolucion} barCategoryGap="30%" barGap={4}>
              <CartesianGrid vertical={false} {...GRILLA} />
              <XAxis dataKey="tramo" height={ALTO_EJE_X} tick={MARCAS} tickLine={false} axisLine={false} label={tituloX("Período")} />
              <YAxis width={48} tick={MARCAS} tickLine={false} axisLine={false} allowDecimals={false} label={tituloY("Cantidad")} />
              <Tooltip contentStyle={CAJA_TOOLTIP} cursor={CURSOR_BARRA} />
              <Bar dataKey="ingresados" name="Ingresados" fill={COLOR.azul} radius={[4, 4, 0, 0]} />
              <Bar dataKey="clasificados" name="Clasificados" fill={COLOR.verde} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      ),
    },
    {
      id: "modalidad-recepcion",
      ancho: 4,
      alto: 11,
      contenido: (
        <Panel
          titulo="Modalidad de recepción"
          bajada={`Entregas en sucursal contra retiros a domicilio · ${periodo}`}
          vacio={!(recepcion.sucursal + recepcion.domicilio) && `No hay donaciones en el período${sufijo}.`}
        >
          <Dona
            unidad="donaciones"
            porciones={[
              { nombre: "Entregado en sucursal", valor: recepcion.sucursal, color: COLOR.azul },
              { nombre: "Retirado a domicilio", valor: recepcion.domicilio, color: COLOR.naranja },
            ]}
          />
        </Panel>
      ),
    },
    {
      id: "evolucion-combinada",
      ancho: 6,
      alto: 10,
      contenido: (
        <Panel titulo="Donaciones, clasificación y peso ingresado" bajada={periodo}>
          <Leyenda
            items={[
              { nombre: "Donaciones", color: COLOR.azul },
              { nombre: "Clasificados", color: COLOR.rojo, forma: "linea" },
              { nombre: "Peso ingresado (kg)", color: COLOR.verde, forma: "suave" },
            ]}
          />
          <ResponsiveContainer width="100%" height="100%" minHeight={150}>
            <ComposedChart data={evolucion} barCategoryGap="30%">
              <CartesianGrid vertical={false} {...GRILLA} />
              <XAxis dataKey="tramo" height={ALTO_EJE_X} tick={MARCAS} tickLine={false} axisLine={false} label={tituloX("Período")} />
              <YAxis yAxisId="cantidad" width={48} tick={MARCAS} tickLine={false} axisLine={false} allowDecimals={false} label={tituloY("Cantidad")} />
              <YAxis yAxisId="peso" orientation="right" width={52} tick={MARCAS} tickLine={false} axisLine={false} label={tituloY("Peso (kg)", true)} />
              <Tooltip contentStyle={CAJA_TOOLTIP} cursor={CURSOR_BARRA} />
              <Area yAxisId="peso" type="monotone" dataKey="pesoKg" name="Peso ingresado (kg)" fill={COLOR.verde} stroke={COLOR.verde} fillOpacity={0.18} />
              <Bar yAxisId="cantidad" dataKey="ingresados" name="Donaciones" fill={COLOR.azul} radius={[4, 4, 0, 0]} />
              <Line yAxisId="cantidad" type="monotone" dataKey="clasificados" name="Clasificados" stroke={COLOR.rojo} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      ),
    },
  ]
}
