"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useRegistrosFotograficos,
  useCreateRegistroFotografico,
  useUpdateRegistroFotografico,
  useDeleteRegistroFotografico,
} from "@/hooks/use-registro-fotografico"
import { useLotes } from "@/hooks/use-lote"
import type { RegistroFotografico } from "@/lib/type/registro-fotografico"
import type { Lote } from "@/lib/type/lote"

const EMPTY_FORM = { loteId: "", urlImagen: "", fecha: "" }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const columns: TableColumn<RegistroFotografico>[] = [
  {
    key: "loteId",
    header: "Lote",
    cell: (r) => <span className="font-mono text-xs font-medium">#{r.loteId}</span>,
  },
  {
    key: "urlImagen",
    header: "Imagen",
    className: "max-w-xs",
    cell: (r) => (
      <div className="flex items-center gap-3">
        <img
          src={r.urlImagen}
          alt={`Lote #${r.loteId}`}
          className="h-10 w-10 rounded object-cover bg-muted shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
        />
        <a
          href={r.urlImagen}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline truncate max-w-50"
        >
          {r.urlImagen}
        </a>
      </div>
    ),
  },
  {
    key: "fecha",
    header: "Fecha",
    cell: (r) => (
      <span className="text-muted-foreground">
        {formatDate(r.fecha) ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function RegistroFotograficoPage() {
  const { registros, isLoading, mutate } = useRegistrosFotograficos()
  const { lotes } = useLotes()
  const { createRegistro, isLoading: isCreating } = useCreateRegistroFotografico()
  const { updateRegistro, isLoading: isUpdating } = useUpdateRegistroFotografico()
  const { deleteRegistro, isLoading: isDeleting } = useDeleteRegistroFotografico()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RegistroFotografico | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = registros.filter((r: RegistroFotografico) => {
    const q = search.toLowerCase()
    return (
      String(r.loteId).includes(q) ||
      r.urlImagen.toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(r: RegistroFotografico) {
    setIsViewing(false)
    setEditing(r)
    setForm({
      loteId: String(r.loteId),
      urlImagen: r.urlImagen,
      fecha: r.fecha ? r.fecha.slice(0, 10) : "",
    })
    setModalOpen(true)
  }

  function openView(r: RegistroFotografico) {
    setIsViewing(true)
    setEditing(r)
    setForm({
      loteId: String(r.loteId),
      urlImagen: r.urlImagen,
      fecha: r.fecha ? r.fecha.slice(0, 10) : "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.loteId || !form.urlImagen.trim()) {
      toast.error("El lote y la URL de imagen son obligatorios")
      return
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        urlImagen: form.urlImagen.trim(),
        fecha: form.fecha || undefined,
      }
      if (editing) {
        await updateRegistro({ id: editing.id, ...payload })
        toast.success("Registro fotográfico actualizado")
      } else {
        await createRegistro(payload)
        toast.success("Registro fotográfico creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el registro fotográfico")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteRegistro(Number(id))
      await mutate()
      toast.success("Registro fotográfico desactivado")
    } catch {
      toast.error("Error al eliminar el registro fotográfico")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Registro Fotográfico</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las imágenes asociadas a cada lote del sistema.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por lote o URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo registro
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando registros fotográficos..."
        emptyText="No hay registros fotográficos registrados."
        emptySearchText="No se encontraron registros con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver registro fotográfico" : editing ? "Editar registro fotográfico" : "Nuevo registro fotográfico"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos del registro del lote #${editing.loteId}.`
            : "Agregá una nueva imagen asociada a un lote."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear registro"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote</label>
          <select
            value={form.loteId}
            onChange={(e) => setForm((f) => ({ ...f, loteId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar lote...</option>
            {lotes.map((l: Lote) => (
              <option key={l.id} value={l.id}>
                Lote #{l.id}{l.pesoBrutoKg ? ` — ${l.pesoBrutoKg} kg` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">URL de imagen</label>
          <Input
            value={form.urlImagen}
            onChange={(e) => setForm((f) => ({ ...f, urlImagen: e.target.value }))}
            placeholder="https://storage.ejemplo.com/fotos/imagen.jpg"
            maxLength={500}
          />
          {form.urlImagen && (
            <img
              src={form.urlImagen}
              alt="Vista previa"
              className="mt-1 h-32 w-full rounded-md object-cover bg-muted"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Fecha <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            type="date"
            value={form.fecha}
            onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  )
}
