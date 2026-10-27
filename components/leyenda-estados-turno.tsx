import { ESTADO_TURNO_SIGNIFICADO, colorAgendaPorDescripcion } from "@/lib/estado-colores"

/** Estado de un turno con el color que tiene en la lista, el calendario y la leyenda. */
export function EstadoTurnoBadge({ descripcion }: { descripcion?: string | null }) {
  if (!descripcion) return <span className="italic text-muted-foreground">—</span>
  const c = colorAgendaPorDescripcion(descripcion)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {descripcion}
    </span>
  )
}

/** Leyenda de los estados posibles de un turno y qué quiere decir cada uno. */
export function LeyendaEstadosTurno() {
  return (
    <details className="group rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-3" open>
      <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
        Leyenda de estados
      </summary>
      <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {ESTADO_TURNO_SIGNIFICADO.map((e) => (
          <li key={e.estado} className="flex items-start gap-2 text-xs">
            <span className="w-36 shrink-0"><EstadoTurnoBadge descripcion={e.estado} /></span>
            <span className="pt-0.5 text-muted-foreground">{e.significado}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
