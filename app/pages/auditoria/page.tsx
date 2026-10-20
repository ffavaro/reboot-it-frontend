"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect } from "@/components/ui/multi-select"
import { SearchInput } from "@/components/ui/search-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuditoria } from "@/hooks/use-auditoria"
import { useUsuarios } from "@/hooks/use-users"
import { formatDateTime } from "@/lib/utils/helpers"
import { cn } from "@/lib/utils"
import type { AuditoriaQuery, RegistroAuditoria } from "@/lib/type/auditoria"

const POR_PAGINA = 20
const RESULTADOS = ["Éxito", "Error"] as const

function nombreUsuario(r: RegistroAuditoria) {
  if (r.usuario) return { principal: r.usuario.nombre, secundario: r.usuario.email }
  if (r.usuarioIntentado) return { principal: "Sin sesión", secundario: r.usuarioIntentado }
  return { principal: "Sin sesión", secundario: null }
}

export default function AuditoriaPage() {
  const { usuarios } = useUsuarios()
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [usuarioIds, setUsuarioIds] = useState<number[]>([])
  const [resultado, setResultado] = useState<"" | (typeof RESULTADOS)[number]>("")
  const [accion, setAccion] = useState("")
  const [page, setPage] = useState(1)

  const params: AuditoriaQuery = useMemo(() => ({
    page,
    limit: POR_PAGINA,
    ...(desde ? { fechaDesde: desde } : {}),
    ...(hasta ? { fechaHasta: hasta } : {}),
    ...(usuarioIds.length ? { usuarioId: usuarioIds[0] } : {}),
    ...(resultado ? { resultado } : {}),
    ...(accion.trim() ? { accion: accion.trim() } : {}),
  }), [page, desde, hasta, usuarioIds, resultado, accion])

  const { pagina, isLoading, error } = useAuditoria(params)

  const opcionesUsuarios = useMemo(
    () => usuarios.map((u) => ({
      value: Number(u.id),
      label: `${u.nombre}${u.apellido ? ` ${u.apellido}` : ""} — ${u.email}`,
    })),
    [usuarios],
  )

  const hayFiltros = !!desde || !!hasta || usuarioIds.length > 0 || !!resultado || !!accion

  // Cualquier cambio de filtro vuelve a la primera página
  function filtrar<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1) }
  }

  function restablecer() {
    setDesde("")
    setHasta("")
    setUsuarioIds([])
    setResultado("")
    setAccion("")
    setPage(1)
  }

  const registros = pagina?.data ?? []
  const total = pagina?.total ?? 0
  const totalPages = pagina?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Registro de las acciones realizadas en el sistema: quién, cuándo y con qué resultado.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-3">
        <div className="flex items-center gap-0.5 rounded-lg border border-border px-1 py-0.5">
          <DatePicker
            value={desde}
            onChange={filtrar(setDesde)}
            max={hasta || undefined}
            placeholder="Desde"
            clearable
            aria-label="Fecha desde"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <DatePicker
            value={hasta}
            onChange={filtrar(setHasta)}
            min={desde || undefined}
            placeholder="Hasta"
            clearable
            aria-label="Fecha hasta"
          />
        </div>

        <MultiSelect
          single
          options={opcionesUsuarios}
          value={usuarioIds}
          onChange={filtrar(setUsuarioIds)}
          placeholder="Todos los usuarios"
          pluralLabel="usuarios"
          searchPlaceholder="Buscar usuario por nombre o email…"
          className="max-w-[280px]"
          aria-label="Filtrar por usuario"
        />

        <select
          value={resultado}
          onChange={(e) => filtrar(setResultado)(e.target.value as "" | (typeof RESULTADOS)[number])}
          className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filtrar por resultado"
        >
          <option value="">Todos los resultados</option>
          {RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <SearchInput
          placeholder="Buscar en la acción…"
          value={accion}
          onChange={(e) => filtrar(setAccion)(e.target.value)}
          className="w-52"
        />

        {hayFiltros && (
          <button
            onClick={restablecer}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Restablecer
          </button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {isLoading ? "Cargando..." : `${total} registro${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Petición</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-destructive">
                  No se pudo cargar la auditoría. Verificá que tengas permisos de administrador.
                </TableCell>
              </TableRow>
            ) : isLoading && registros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Cargando registros...
                </TableCell>
              </TableRow>
            ) : registros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  {hayFiltros ? "No hay registros con esos filtros." : "Todavía no hay registros de auditoría."}
                </TableCell>
              </TableRow>
            ) : registros.map((r) => {
              const u = nombreUsuario(r)
              const ok = r.resultado === "Éxito"
              return (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(r.fechaHora)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn("font-medium", !r.usuario && "italic text-muted-foreground")}>{u.principal}</span>
                      {u.secundario && <span className="text-xs text-muted-foreground">{u.secundario}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.rol ?? "—"}</TableCell>
                  <TableCell className="font-medium">{r.accion}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ok
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                    )}>
                      {r.resultado}{r.codigoHttp ? ` · ${r.codigoHttp}` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.entidad ? `${r.entidad}${r.entidadId ? ` #${r.entidadId}` : ""}` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.metodo ? `${r.metodo} ${r.ruta ?? ""}` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.ip ?? "—"}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            Página {pagina?.page ?? page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
