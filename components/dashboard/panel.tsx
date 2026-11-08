import { PanelProps } from "@/lib/type/dashboard";
import { cn } from "@/lib/utils"

export function Panel({ titulo, bajada, vacio, acciones, className, children }: PanelProps) {
  return (
    <article className={cn("flex h-full min-w-0 flex-col rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/5", className)}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">{titulo}</h3>
          {bajada && <p className="mt-0.5 text-xs text-muted-foreground">{bajada}</p>}
        </div>
        {acciones}
      </header>
      {vacio ? (
        <div className="flex min-h-[120px] flex-1 items-center justify-center px-6 text-center text-xs text-muted-foreground">{vacio}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </article>
  )
}

export function Leyenda({ items, className }: { items: { nombre: string; color: string; forma?: "cuadro" | "linea" | "suave" }[]; className?: string }) {
  return (
    <ul className={cn("mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <li key={i.nombre} className="flex items-center gap-1.5">
          {i.forma === "linea" ? (
            <span className="inline-block h-0.5 w-3" style={{ background: i.color }} />
          ) : (
            <span className={cn("inline-block size-3 rounded-sm", i.forma === "suave" && "opacity-50")} style={{ background: i.color }} />
          )}
          {i.nombre}
        </li>
      ))}
    </ul>
  )
}

export const textoLeyenda = (valor: string) => <span className="text-foreground">{valor}</span>
