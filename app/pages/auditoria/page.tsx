"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DateInput } from "@/components/ui/date-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAccionesAuditoria, useEventosAuditoria } from "@/hooks/use-auditoria"
import { useUsuarios } from "@/hooks/use-users"
import { useUsuarioSesion } from "@/hooks/use-usuario-sesion"
import type { EventoAuditoria, FiltrosAuditoria, ResultadoAuditoria } from "@/lib/type/auditoria"
import type { Usuario } from "@/lib/type/user"

const TAMANOS = [20, 50, 100]
const RESULTADOS: ResultadoAuditoria[] = ["Éxito", "Error"]
const COLUMNAS = ["Fecha y hora", "Usuario", "Rol", "Acción", "Resultado", "Entidad", "Petición", "IP"]

const claseFiltro =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

function fechaHora(iso: string) {
  const f = new Date(iso)
  if (Number.isNaN(f.getTime())) return iso
  const dia = f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
  const hora = f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  return `${dia} ${hora}`
}

function quien(e: EventoAuditoria) {
  if (e.usuario) return { nombre: e.usuario.nombre, detalle: e.usuario.email, anonimo: false }
  return { nombre: "Sin sesión", detalle: e.usuarioIntentado, anonimo: true }
}

function Resultado({ evento }: { evento: EventoAuditoria }) {
  const ok = evento.resultado === "Éxito"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        ok ? "bg-green-100 text-green-800" : evento.resultado === "Error" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800",
      )}
    >
      <span className={cn("size-1.5 rounded-full", ok ? "bg-green-600" : "bg-red-600")} />
      {evento.resultado}
      {evento.codigoHttp ? <span className="tabular-nums opacity-70">{evento.codigoHttp}</span> : null}
    </span>
  )
}

function Mensaje({ children, tono = "neutro" }: { children: React.ReactNode; tono?: "neutro" | "error" }) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMNAS.length} className={cn("py-12 text-center text-sm", tono === "error" ? "text-destructive" : "text-muted-foreground")}>
        {children}
      </TableCell>
    </TableRow>
  )
}

export default function AuditoriaPage() {
  const { usuario } = useUsuarioSesion()
  const esAdmin = usuario?.rol?.nombre?.trim().toLowerCase() === "admin"

  const [filtros, setFiltros] = useState<FiltrosAuditoria>({})
  const [pagina, setPagina] = useState(1)
  const [tamano, setTamano] = useState(TAMANOS[0])

  const { usuarios } = useUsuarios()
  const { acciones } = useAccionesAuditoria(esAdmin)
  const consulta = useMemo(() => (esAdmin ? { ...filtros, page: pagina, limit: tamano } : null), [esAdmin, filtros, pagina, tamano])
  const { pagina: resultado, isLoading, error } = useEventosAuditoria(consulta)

  const opcionesUsuario = useMemo(
    () =>
      usuarios
        .map((u: Usuario & { apellido?: string | null }) => ({
          id: Number(u.id),
          texto: `${[u.nombre, u.apellido].filter(Boolean).join(" ")} · ${u.email}`,
        }))
        .sort((a, b) => a.texto.localeCompare(b.texto, "es")),
    [usuarios],
  )

  const filtrando = Object.values(filtros).some((v) => v !== undefined && v !== "")
  const desdeMayor = !!filtros.fechaDesde && !!filtros.fechaHasta && filtros.fechaDesde > filtros.fechaHasta

  function aplicar(parcial: Partial<FiltrosAuditoria>) {
    setFiltros((f) => ({ ...f, ...parcial }))
    setPagina(1)
  }

  function limpiar() {
    setFiltros({})
    setPagina(1)
  }

  if (!usuario) return null

  if (!esAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 p-16 text-center">
        <ShieldAlert className="size-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Acceso restringido</h1>
        <p className="max-w-sm text-sm text-muted-foreground">La auditoría solo está disponible para el administrador del sistema.</p>
      </div>
    )
  }

  const eventos = resultado?.data ?? []
  const total = resultado?.total ?? 0
  const paginas = Math.max(1, resultado?.totalPages ?? 1)
  const desde = total ? (pagina - 1) * tamano + 1 : 0
  const hasta = Math.min(pagina * tamano, total)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">Quién hizo cada acción en el sistema, cuándo, desde dónde y con qué resultado.</p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Desde
            <DateInput value={filtros.fechaDesde ?? ""} onChange={(v) => aplicar({ fechaDesde: v || undefined })} className="h-9 w-36" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Hasta
            <DateInput value={filtros.fechaHasta ?? ""} onChange={(v) => aplicar({ fechaHasta: v || undefined })} className="h-9 w-36" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Usuario
            <select
              value={filtros.usuarioId ?? ""}
              onChange={(e) => aplicar({ usuarioId: e.target.value ? Number(e.target.value) : undefined })}
              className={cn(claseFiltro, "w-72")}
            >
              <option value="">Todos los usuarios</option>
              {opcionesUsuario.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.texto}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Acción
            <select value={filtros.accion ?? ""} onChange={(e) => aplicar({ accion: e.target.value || undefined })} className={cn(claseFiltro, "w-64")}>
              <option value="">Todas las acciones</option>
              {acciones.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Resultado
            <div role="radiogroup" aria-label="Resultado" className="flex h-9 rounded-lg border border-border p-0.5">
              {[undefined, ...RESULTADOS].map((r) => (
                <button
                  key={r ?? "todos"}
                  type="button"
                  role="radio"
                  aria-checked={filtros.resultado === r}
                  onClick={() => aplicar({ resultado: r })}
                  className={cn(
                    "rounded-md px-3 text-sm transition-colors",
                    filtros.resultado === r ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r ?? "Todos"}
                </button>
              ))}
            </div>
          </div>
          {filtrando && (
            <Button variant="outline" size="sm" className="h-9" onClick={limpiar}>
              <RotateCcw className="size-3.5" />
              Limpiar filtros
            </Button>
          )}
        </div>
        {desdeMayor && <p className="text-xs text-amber-600">La fecha Desde es posterior a la fecha Hasta: no va a haber resultados.</p>}
      </section>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNAS.map((c) => (
                <TableHead key={c}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <Mensaje tono="error">No se pudo cargar la auditoría. Volvé a intentar en unos minutos.</Mensaje>
            ) : isLoading && !eventos.length ? (
              <Mensaje>Cargando registros...</Mensaje>
            ) : !eventos.length ? (
              <Mensaje>{filtrando ? "Ningún registro coincide con los filtros." : "Todavía no hay registros de auditoría."}</Mensaje>
            ) : (
              eventos.map((e) => {
                const persona = quien(e)
                return (
                  <TableRow key={e.id} className={cn(isLoading && "opacity-60")}>
                    <TableCell className="whitespace-nowrap tabular-nums">{fechaHora(e.fechaHora)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn("font-medium", persona.anonimo && "italic text-muted-foreground")}>{persona.nombre}</span>
                        {persona.detalle && <span className="text-xs text-muted-foreground">{persona.detalle}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.rol ?? ""}</TableCell>
                    <TableCell className="font-medium">{e.accion}</TableCell>
                    <TableCell>
                      <Resultado evento={e} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.entidad ? `${e.entidad}${e.entidadId ? ` #${e.entidadId}` : ""}` : ""}
                    </TableCell>
                    <TableCell className="max-w-64 truncate font-mono text-xs text-muted-foreground" title={e.ruta ?? undefined}>
                      {e.metodo ? `${e.metodo} ${e.ruta ?? ""}` : ""}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground" title={e.userAgent ?? undefined}>
                      {e.ip ?? ""}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{total ? `Mostrando ${desde}–${hasta} de ${total}` : "Sin registros"}</span>
            <select
              value={tamano}
              onChange={(e) => {
                setTamano(Number(e.target.value))
                setPagina(1)
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              aria-label="Registros por página"
            >
              {TAMANOS.map((t) => (
                <option key={t} value={t}>
                  {t} por página
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} aria-label="Página anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="tabular-nums">
              Página {pagina} de {paginas}
            </span>
            <Button variant="outline" size="sm" disabled={pagina >= paginas} onClick={() => setPagina((p) => p + 1)} aria-label="Página siguiente">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
