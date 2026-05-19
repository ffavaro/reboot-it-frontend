"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormModal } from "@/components/ui/form-modal"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import {
  useConstanciasRetiro,
  useCreateConstanciaRetiro,
  useUpdateConstanciaRetiro,
  useDeleteConstanciaRetiro,
} from "@/hooks/use-constancia-retiro"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useDonantes } from "@/hooks/use-donantes"
import { useDonaciones } from "@/hooks/use-donacion"
import { useRetiros } from "@/hooks/use-retiro"
import { getUser } from "@/lib/auth-utils"
import { formatDate } from "@/lib/utils/helpers"
import type { ConstanciaRetiro } from "@/lib/type/constancia-retiro"
import type { Empleado } from "@/lib/type/user"
import type { Donante } from "@/lib/type/donante"
import type { Donacion } from "@/lib/type/donacion"
import type { Retiro } from "@/lib/type/retiro"

const EMPTY_FORM = { retiroId: "", fechaEmision: "", observaciones: "", tecnicoId: "" }

const columns: TableColumn<ConstanciaRetiro>[] = [
  {
    key: "retiroId",
    header: "Retiro",
    cell: (c) => `#${c.retiroId}`,
    className: "font-mono text-xs font-medium",
  },
  {
    key: "fechaEmision",
    header: "Fecha emisión",
    cell: (c) => formatDate(c.fechaEmision) ?? <span className="italic text-muted-foreground">—</span>,
    className: "text-muted-foreground",
  },
  {
    key: "tecnico",
    header: "Técnico",
    cell: (c) =>
      c.tecnico
        ? `${c.tecnico.nombre} ${c.tecnico.apellido}`
        : <span className="italic text-muted-foreground">—</span>,
  },
  {
    key: "observaciones",
    header: "Observaciones",
    cell: (c) => c.observaciones ?? <span className="italic text-muted-foreground">—</span>,
    className: "text-muted-foreground max-w-xs truncate",
  },
]

export default function ConstanciaRetiroPage() {
  const { constancias, isLoading, mutate } = useConstanciasRetiro()
  const { empleados } = useEmpleadosFull()
  const { donantes } = useDonantes()
  const { donaciones } = useDonaciones()
  const { retiros } = useRetiros()
  const { createConstancia, isLoading: isCreating } = useCreateConstanciaRetiro()
  const { updateConstancia, isLoading: isUpdating } = useUpdateConstanciaRetiro()
  const { deleteConstancia, isLoading: isDeleting } = useDeleteConstanciaRetiro()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ConstanciaRetiro | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const user = getUser()
  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const myDonante = isDonante
    ? donantes.find((d: Donante) => d.usuarioId === user?.id) ?? null
    : null

  const visibleConstancias = isDonante && myDonante
    ? (() => {
        const myDonacionIds = new Set(
          donaciones
            .filter((d: Donacion) => d.donanteId === myDonante.id)
            .map((d: Donacion) => d.id)
        )
        const myRetiroIds = new Set(
          retiros
            .filter((r: Retiro) => myDonacionIds.has(r.donacionId))
            .map((r: Retiro) => r.id)
        )
        return constancias.filter((c: ConstanciaRetiro) => myRetiroIds.has(c.retiroId))
      })()
    : constancias

  const filtered = visibleConstancias.filter((c: ConstanciaRetiro) => {
    const q = search.toLowerCase()
    const tecnico = c.tecnico ? `${c.tecnico.nombre} ${c.tecnico.apellido}`.toLowerCase() : ""
    return (
      String(c.retiroId).includes(q) ||
      (c.observaciones ?? "").toLowerCase().includes(q) ||
      tecnico.includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(c: ConstanciaRetiro) {
    setEditing(c)
    setForm({
      retiroId: String(c.retiroId),
      fechaEmision: c.fechaEmision ? c.fechaEmision.slice(0, 10) : "",
      observaciones: c.observaciones ?? "",
      tecnicoId: c.tecnicoId ? String(c.tecnicoId) : "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.retiroId) {
      toast.error("El retiro es obligatorio")
      return
    }
    try {
      const payload = {
        retiroId: Number(form.retiroId),
        fechaEmision: form.fechaEmision || undefined,
        observaciones: form.observaciones.trim() || undefined,
        tecnicoId: form.tecnicoId ? Number(form.tecnicoId) : undefined,
      }
      if (editing) {
        await updateConstancia({ id: editing.id, ...payload })
        toast.success("Constancia de retiro actualizada")
      } else {
        await createConstancia(payload)
        toast.success("Constancia de retiro creada")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar la constancia de retiro")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteConstancia(id)
      await mutate()
      toast.success("Constancia de retiro desactivada")
    } catch {
      toast.error("Error al eliminar la constancia de retiro")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Constancias de Retiro</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las constancias emitidas para cada retiro de materiales.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por retiro, técnico u observaciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} constancia{filtered.length !== 1 ? "s" : ""}
        </span>
        {!isDonante && (
          <Button className="ml-auto" onClick={openCreate}>
            + Nueva constancia
          </Button>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando constancias..."
        emptyText="No hay constancias de retiro registradas."
        emptySearchText="No se encontraron constancias con ese criterio."
        search={search}
        onEdit={isDonante ? undefined : openEdit}
        onDelete={isDonante ? undefined : handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={sheetOpen}
        onOpenChange={(open) => !open && setSheetOpen(false)}
        title={editing ? "Editar constancia" : "Nueva constancia de retiro"}
        description={
          editing
            ? `Modificá los datos de la constancia del retiro #${editing.retiroId}.`
            : "Registrá una nueva constancia de retiro."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear constancia"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">ID de Retiro</label>
          <Input
            type="number"
            value={form.retiroId}
            onChange={(e) => setForm((f) => ({ ...f, retiroId: e.target.value }))}
            placeholder="Ej: 1"
            min={1}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Fecha de emisión <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            type="date"
            value={form.fechaEmision}
            onChange={(e) => setForm((f) => ({ ...f, fechaEmision: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Técnico responsable <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.tecnicoId}
            onChange={(e) => setForm((f) => ({ ...f, tecnicoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin técnico asignado</option>
            {empleados.map((e: Empleado) => (
              <option key={e.id} value={e.id}>
                {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Observaciones <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
            placeholder="Ej: Material recibido conforme. Sin observaciones."
            rows={4}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
      </FormModal>
    </div>
  )
}