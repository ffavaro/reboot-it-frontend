"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useTurnos,
  useCreateTurno,
  useUpdateTurno,
  useDeleteTurno,
} from "@/hooks/use-turno"
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosTurno } from "@/hooks/use-estado-turno"
import type { Turno } from "@/lib/type/turno"
import type { Donante } from "@/lib/type/donante"
import type { EstadoTurno } from "@/lib/type/estado-turno"
import { getUser } from "@/lib/auth-utils"
import type { TokenPayload } from "@/lib/auth-utils"

const EMPTY_FORM = { donanteId: "", estadoTurnoId: "", fechaHora: "", descripcion: "" }

function formatDateTime(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function TurnoPage() {
  const { turnos, isLoading, mutate } = useTurnos()
  const { donantes } = useDonantes()
  const { estadosTurno } = useEstadosTurno()
  const { createTurno, isLoading: isCreating } = useCreateTurno()
  const { updateTurno, isLoading: isUpdating } = useUpdateTurno()
  const { deleteTurno, isLoading: isDeleting } = useDeleteTurno()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Turno | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [user, setUser] = useState<TokenPayload | null>(null)

  useEffect(() => { setUser(getUser()) }, [])

  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const myDonante = isDonante
    ? donantes.find((d: Donante) => d.usuarioId === user?.id) ?? null
    : null

  const visibleTurnos = isDonante
    ? turnos.filter((t: Turno) => t.donanteId === myDonante?.id)
    : turnos

  const columns: TableColumn<Turno>[] = [
    ...(!isDonante
      ? [{
          key: "donante",
          header: "Donante",
          cell: (t: Turno) =>
            t.donante?.nombre ?? (
              <span className="italic text-muted-foreground">#{t.donanteId}</span>
            ),
        }]
      : []),
    {
      key: "estado",
      header: "Estado",
      cell: (t) =>
        t.estadoTurno?.descripcion ? (
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
            {t.estadoTurno.descripcion}
          </span>
        ) : (
          <span className="italic text-muted-foreground">—</span>
        ),
    },
    {
      key: "fechaHora",
      header: "Fecha y hora",
      cell: (t) => (
        <span className="text-muted-foreground">
          {formatDateTime(t.fechaHora) ?? <span className="italic">—</span>}
        </span>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      className: "max-w-[220px] truncate",
      cell: (t) => (
        <span className="text-muted-foreground">
          {t.descripcion ?? <span className="italic">—</span>}
        </span>
      ),
    },
  ]

  const filtered = visibleTurnos.filter((t: Turno) => {
    const q = search.toLowerCase()
    const donante = t.donante?.nombre?.toLowerCase() ?? ""
    const estado = t.estadoTurno?.descripcion?.toLowerCase() ?? ""
    return (
      donante.includes(q) ||
      estado.includes(q) ||
      (t.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(t: Turno) {
    setIsViewing(false)
    setEditing(t)
    setForm({
      donanteId: String(t.donanteId),
      estadoTurnoId: String(t.estadoTurnoId),
      fechaHora: t.fechaHora ? t.fechaHora.slice(0, 16) : "",
      descripcion: t.descripcion ?? "",
    })
    setModalOpen(true)
  }

  function openView(t: Turno) {
    setIsViewing(true)
    setEditing(t)
    setForm({
      donanteId: String(t.donanteId),
      estadoTurnoId: String(t.estadoTurnoId),
      fechaHora: t.fechaHora ? t.fechaHora.slice(0, 16) : "",
      descripcion: t.descripcion ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.donanteId || !form.estadoTurnoId || !form.fechaHora) {
      toast.error("Donante, estado y fecha/hora son obligatorios")
      return
    }
    try {
      const payload = {
        donanteId: Number(form.donanteId),
        estadoTurnoId: Number(form.estadoTurnoId),
        fechaHora: form.fechaHora,
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateTurno({ id: editing.id, ...payload })
        toast.success("Turno actualizado")
      } else {
        await createTurno(payload)
        toast.success("Turno creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el turno")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteTurno(Number(id))
      await mutate()
      toast.success("Turno desactivado")
    } catch {
      toast.error("Error al eliminar el turno")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los turnos asignados a donantes.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por donante, estado o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} turno{filtered.length !== 1 ? "s" : ""}
        </span>
        {!isDonante && (
          <Button className="ml-auto" onClick={openCreate}>
            + Nuevo turno
          </Button>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando turnos..."
        emptyText="No hay turnos registrados."
        emptySearchText="No se encontraron turnos con ese criterio."
        search={search}
        onView={openView}
        onEdit={isDonante ? undefined : openEdit}
        onDelete={isDonante ? undefined : handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver turno" : editing ? "Editar turno" : "Nuevo turno"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del turno." : "Registrá un nuevo turno para un donante."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear turno"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Donante</label>
          <select
            value={form.donanteId}
            onChange={(e) => setForm((f) => ({ ...f, donanteId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar donante...</option>
            {donantes.map((d: Donante) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Estado</label>
          <select
            value={form.estadoTurnoId}
            onChange={(e) => setForm((f) => ({ ...f, estadoTurnoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar estado...</option>
            {estadosTurno.map((e: EstadoTurno) => (
              <option key={e.id} value={e.id}>{e.descripcion}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fecha y hora</label>
          <Input
            type="datetime-local"
            value={form.fechaHora}
            onChange={(e) => setForm((f) => ({ ...f, fechaHora: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            placeholder="Observaciones del turno..."
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  )
}
