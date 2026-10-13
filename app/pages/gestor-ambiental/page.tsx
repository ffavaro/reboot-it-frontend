"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useGestoresAmbientales,
  useCreateGestorAmbiental,
  useUpdateGestorAmbiental,
  useDeleteGestorAmbiental,
} from "@/hooks/use-gestor-ambiental"
import type { GestorAmbiental } from "@/lib/type/gestor-ambiental"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { razonSocial: "", cuit: "", habilitacion: "", contacto: "" }

const COLUMNS: TableColumn<GestorAmbiental>[] = [
  {
    key: "razonSocial",
    header: "Razón social",
    cell: (g) => <span className="font-medium">{g.razonSocial}</span>,
  },
  {
    key: "cuit",
    header: "CUIT",
    cell: (g) => (
      <span className="font-mono text-muted-foreground">
        {g.cuit ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "habilitacion",
    header: "Habilitación",
    cell: (g) =>
      g.habilitacion ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {g.habilitacion}
        </span>
      ) : (
        <span className="text-muted-foreground italic">—</span>
      ),
  },
  {
    key: "contacto",
    header: "Contacto",
    cell: (g) => (
      <span className="text-muted-foreground">
        {g.contacto ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function GestorAmbientalPage() {
  const { gestores, isLoading, mutate } = useGestoresAmbientales()
  const { createGestor, isLoading: isCreating } = useCreateGestorAmbiental()
  const { updateGestor, isLoading: isUpdating } = useUpdateGestorAmbiental()
  const { deleteGestor, isLoading: isDeleting } = useDeleteGestorAmbiental()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GestorAmbiental | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = gestores.filter(
    (g) =>
      g.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      (g.cuit ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.habilitacion ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.contacto ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(g: GestorAmbiental) {
    setIsViewing(false)
    setEditing(g)
    setForm({
      razonSocial: g.razonSocial,
      cuit: g.cuit ?? "",
      habilitacion: g.habilitacion ?? "",
      contacto: g.contacto ?? "",
    })
    setModalOpen(true)
  }

  function openView(g: GestorAmbiental) {
    setIsViewing(true)
    setEditing(g)
    setForm({
      razonSocial: g.razonSocial,
      cuit: g.cuit ?? "",
      habilitacion: g.habilitacion ?? "",
      contacto: g.contacto ?? "",
    })
    setModalOpen(true)
  }

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.razonSocial.trim()) {
      toast.error("La razón social es obligatoria")
      return
    }
    try {
      const payload = {
        razonSocial: form.razonSocial.trim(),
        cuit: form.cuit.trim() || undefined,
        habilitacion: form.habilitacion.trim() || undefined,
        contacto: form.contacto.trim() || undefined,
      }
      if (editing) {
        await updateGestor({ id: editing.id, ...payload })
        toast.success("Gestor ambiental actualizado")
      } else {
        await createGestor(payload)
        toast.success("Gestor ambiental creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el gestor ambiental")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteGestor(id as number)
      await mutate()
      toast.success("Gestor ambiental desactivado")
    } catch {
      toast.error("Error al eliminar el gestor ambiental")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestores Ambientales</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las empresas habilitadas para la disposición final de materiales.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por razón social, CUIT, habilitación o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} gestor{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo gestor
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando gestores ambientales..."
        emptyText="No hay gestores ambientales registrados."
        emptySearchText="No se encontraron gestores con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver gestor ambiental" : editing ? "Editar gestor ambiental" : "Nuevo gestor ambiental"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.razonSocial}".`
            : "Completá los datos del nuevo gestor ambiental."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear gestor"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Razón social</label>
          <Input
            value={form.razonSocial}
            onChange={(e) => set("razonSocial", e.target.value)}
            placeholder="Ej: Reciclados S.A."
            maxLength={150}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            CUIT <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.cuit}
            onChange={(e) => set("cuit", e.target.value)}
            placeholder="30-12345678-9"
            maxLength={20}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            N° de habilitación <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.habilitacion}
            onChange={(e) => set("habilitacion", e.target.value)}
            placeholder="Ej: HAB-2024-001"
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Contacto <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.contacto}
            onChange={(e) => set("contacto", e.target.value)}
            placeholder="Ej: info@reciclados.com / +54 11 1234-5678"
            maxLength={100}
          />
        </div>
      </FormModal>
    </div>
  )
}
