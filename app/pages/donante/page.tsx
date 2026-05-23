"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
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

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Donante | null>(null)
  const [form, setForm] = useState(EMPTY_DONANTE)

  const filtered = donantes.filter(
    (d) =>
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (d.razonSocial ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.telefono ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_DONANTE)
    setModalOpen(true)
  }

  function openEdit(d: Donante) {
    setEditing(d)
    setForm({
      usuarioId: d.usuarioId ?? 0,
      tipoDonanteId: d.tipoDonanteId,
      nombre: d.nombre,
      razonSocial: d.razonSocial ?? "",
      telefono: d.telefono ?? "",
      direccion: d.direccion ?? "",
    })
    setModalOpen(true)
  }

  function set(field: keyof typeof EMPTY_DONANTE, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.tipoDonanteId) {
      toast.error("Nombre y tipo de donante son obligatorios")
      return
    }
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
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar donante" : "Nuevo donante"}
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
          />
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
          <label className="text-sm font-medium">
            Usuario asociado <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.usuarioId}
            onChange={(e) => set("usuarioId", Number(e.target.value))}
            className={cn(
              "w-full rounded-4xl border border-input bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
            )}
          >
            <option value={0}>— Sin usuario —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de donante</label>
          <select
            value={form.tipoDonanteId}
            onChange={(e) => set("tipoDonanteId", Number(e.target.value))}
            className={cn(
              "w-full rounded-4xl border border-input bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
            )}
          >
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descripcion}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
            placeholder="+54 9 11 1234-5678"
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

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoDonante | null>(null)
  const [form, setForm] = useState(EMPTY_TIPO)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_TIPO)
    setModalOpen(true)
  }

  function openEdit(t: TipoDonante) {
    setEditing(t)
    setForm({ descripcion: t.descripcion })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }
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
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar tipo" : "Nuevo tipo de donante"}
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
            onChange={(e) => setForm({ descripcion: e.target.value })}
            placeholder="Ej: Persona física, Empresa..."
            maxLength={100}
          />
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
