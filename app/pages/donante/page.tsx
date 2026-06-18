"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useDonantes,
  useTipoDonantes,
  useCreateDonante,
  useUpdateDonante,
  useDeleteDonante,
  useCreateTipoDonante,
  useUpdateTipoDonante,
  useDeleteTipoDonante,
} from "@/hooks/use-donantes"
import { useUsuarios } from "@/hooks/use-users"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect } from "@/lib/form-validators"
import type { Donante, TipoDonante } from "@/lib/type/donante"

type Tab = "donantes" | "tipos"

const EMPTY_DONANTE = { usuarioId: 0, tipoDonanteId: 0, nombre: "", razonSocial: "", telefono: "", direccion: "" }
const EMPTY_TIPO = { descripcion: "" }

// ---------------------------------------------------------------------------
// Donantes tab
// ---------------------------------------------------------------------------

const donanteColumns: TableColumn<Donante>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (d) => <span className="font-medium">{d.nombre}</span>,
  },
  {
    key: "razonSocial",
    header: "Razón social",
    cell: (d) => (
      <span className="text-muted-foreground">
        {d.razonSocial ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (d) => (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {d.tipoDonante?.descripcion ?? "—"}
      </span>
    ),
  },
  {
    key: "telefono",
    header: "Teléfono",
    cell: (d) => (
      <span className="text-muted-foreground">
        {d.telefono ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "direccion",
    header: "Dirección",
    className: "max-w-45 truncate",
    cell: (d) => (
      <span className="text-muted-foreground">
        {d.direccion ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

function DonantesTab() {
  const { donantes, isLoading, mutate } = useDonantes()
  const { tipos } = useTipoDonantes()
  const { usuarios } = useUsuarios()
  const { createDonante, isLoading: isCreating } = useCreateDonante()
  const { updateDonante, isLoading: isUpdating } = useUpdateDonante()
  const { deleteDonante, isLoading: isDeleting } = useDeleteDonante()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_DONANTE>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Donante | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_DONANTE)

  const filtered = donantes.filter(
    (d) =>
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (d.razonSocial ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.telefono ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function set(field: keyof typeof EMPTY_DONANTE, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
    clearError(field)
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_DONANTE)
    reset()
    setModalOpen(true)
  }

  function openEdit(d: Donante) {
    setIsViewing(false)
    setEditing(d)
    setForm({
      usuarioId: d.usuarioId ?? 0,
      tipoDonanteId: d.tipoDonanteId,
      nombre: d.nombre,
      razonSocial: d.razonSocial ?? "",
      telefono: d.telefono ?? "",
      direccion: d.direccion ?? "",
    })
    reset()
    setModalOpen(true)
  }

  function openView(d: Donante) {
    setIsViewing(true)
    setEditing(d)
    setForm({
      usuarioId: d.usuarioId ?? 0,
      tipoDonanteId: d.tipoDonanteId,
      nombre: d.nombre,
      razonSocial: d.razonSocial ?? "",
      telefono: d.telefono ?? "",
      direccion: d.direccion ?? "",
    })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      nombre: [required("el nombre")],
      tipoDonanteId: [requiredSelect("un tipo de donante")],
      usuarioId: [requiredSelect("un usuario")],
    })) return
    try {
      const payload = {
        usuarioId: form.usuarioId || undefined,
        tipoDonanteId: form.tipoDonanteId,
        nombre: form.nombre.trim(),
        razonSocial: form.razonSocial.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
      }
      if (editing) {
        await updateDonante({ id: editing.id, ...payload })
        toast.success("Donante actualizado")
      } else {
        await createDonante(payload)
        toast.success("Donante creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el donante")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteDonante(Number(id))
      await mutate()
      toast.success("Donante desactivado")
    } catch {
      toast.error("Error al eliminar el donante")
    }
  }

  const selectCls = (hasError?: string) => cn(
    "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
    hasError ? "border-destructive" : "border-input",
  )

  return (
    <>
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre, razón social o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} donante{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo donante
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={donanteColumns}
        isLoading={isLoading}
        loadingText="Cargando donantes..."
        emptyText="No hay donantes registrados."
        emptySearchText="No se encontraron donantes con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver donante" : editing ? "Editar donante" : "Nuevo donante"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de ${editing.nombre}.`
            : "Completá los datos del nuevo donante."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear donante"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Juan Pérez"
            maxLength={100}
            className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.nombre}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Razón social <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.razonSocial}
            onChange={(e) => set("razonSocial", e.target.value)}
            placeholder="Empresa S.A."
            maxLength={150}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Usuario asociado</label>
          <select
            value={form.usuarioId}
            onChange={(e) => set("usuarioId", Number(e.target.value))}
            className={selectCls(errors.usuarioId)}
          >
            <option value={0}>— Seleccionar usuario —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.email})
              </option>
            ))}
          </select>
          <FieldError>{errors.usuarioId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de donante</label>
          <select
            value={form.tipoDonanteId}
            onChange={(e) => set("tipoDonanteId", Number(e.target.value))}
            className={selectCls(errors.tipoDonanteId)}
          >
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descripcion}
              </option>
            ))}
          </select>
          <FieldError>{errors.tipoDonanteId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value.replace(/\D/g, ""))}
            placeholder="5491112345678"
            inputMode="numeric"
            maxLength={20}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Dirección <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            placeholder="Av. Corrientes 1234, CABA"
            maxLength={255}
          />
        </div>
      </FormModal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tipos de donante tab
// ---------------------------------------------------------------------------

const tipoDonanteColumns: TableColumn<TipoDonante>[] = [
  {
    key: "descripcion",
    header: "Descripción",
    cell: (t) => <span className="font-medium">{t.descripcion}</span>,
  },
]

function TiposTab() {
  const { tipos, isLoading, mutate } = useTipoDonantes()
  const { createTipo, isLoading: isCreating } = useCreateTipoDonante()
  const { updateTipo, isLoading: isUpdating } = useUpdateTipoDonante()
  const { deleteTipo, isLoading: isDeleting } = useDeleteTipoDonante()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_TIPO>()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoDonante | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_TIPO)

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_TIPO)
    reset()
    setModalOpen(true)
  }

  function openEdit(t: TipoDonante) {
    setIsViewing(false)
    setEditing(t)
    setForm({ descripcion: t.descripcion })
    reset()
    setModalOpen(true)
  }

  function openView(t: TipoDonante) {
    setIsViewing(true)
    setEditing(t)
    setForm({ descripcion: t.descripcion })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, { descripcion: [required("la descripción")] })) return
    try {
      if (editing) {
        await updateTipo({ id: editing.id, ...form })
        toast.success("Tipo actualizado")
      } else {
        await createTipo(form)
        toast.success("Tipo creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el tipo")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteTipo(Number(id))
      await mutate()
      toast.success("Tipo desactivado")
    } catch {
      toast.error("Error al eliminar el tipo")
    }
  }

  return (
    <>
      <div className="flex items-center">
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo tipo
        </Button>
      </div>

      <DataTable
        data={tipos}
        columns={tipoDonanteColumns}
        isLoading={isLoading}
        loadingText="Cargando tipos..."
        emptyText="No hay tipos de donante registrados."
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver tipo de donante" : editing ? "Editar tipo" : "Nuevo tipo de donante"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá la descripción de "${editing.descripcion}".`
            : "Ingresá la descripción del nuevo tipo."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear tipo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Descripción</label>
          <Input
            value={form.descripcion}
            onChange={(e) => { setForm({ descripcion: e.target.value }); clearError("descripcion") }}
            placeholder="Ej: Persona física, Empresa..."
            maxLength={100}
            className={cn(errors.descripcion && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.descripcion}</FieldError>
        </div>
      </FormModal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DonantePage() {
  const [activeTab, setActiveTab] = useState<Tab>("donantes")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Donantes</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los donantes del sistema y sus tipos.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {(["donantes", "tipos"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "donantes" ? "Donantes" : "Tipos de donante"}
          </button>
        ))}
      </div>

      {activeTab === "donantes" ? <DonantesTab /> : <TiposTab />}
    </div>
  )
}
