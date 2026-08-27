"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useMediosAlmacenamiento,
  useCreateMedioAlmacenamiento,
  useUpdateMedioAlmacenamiento,
  useDeleteMedioAlmacenamiento,
} from "@/hooks/use-medio-almacenamiento"
import { useTipos } from "@/hooks/use-tipo"
import { useMarcas } from "@/hooks/use-marca"
import { useModelos } from "@/hooks/use-modelo"
import { useMateriales } from "@/hooks/use-material"
import type { MedioAlmacenamiento } from "@/lib/type/medio-almacenamiento"
import type { Tipo } from "@/lib/type/tipo"
import type { Marca } from "@/lib/type/marca"
import type { Modelo } from "@/lib/type/modelo"
import type { Material } from "@/lib/type/material"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = {
  materialId: "",
  tipoId: "",
  marcaId: "",
  modeloId: "",
  terminosUso: "",
}

const COLUMNS: TableColumn<MedioAlmacenamiento>[] = [
  {
    key: "materialId",
    header: "Material ID",
    cell: (m) => <span className="font-mono text-xs">{m.materialId}</span>,
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (m) => (
      <span className="text-muted-foreground">{m.tipo?.nombre ?? <span className="italic">—</span>}</span>
    ),
  },
  {
    key: "marca",
    header: "Marca",
    cell: (m) => (
      <span className="text-muted-foreground">{m.marca?.nombre ?? <span className="italic">—</span>}</span>
    ),
  },
  {
    key: "modelo",
    header: "Modelo",
    cell: (m) => (
      <span className="text-muted-foreground">{m.modelo?.nombre ?? <span className="italic">—</span>}</span>
    ),
  },
  {
    key: "terminosUso",
    header: "Términos de uso",
    cell: (m) => (
      <span className="text-muted-foreground">{m.terminosUso ?? <span className="italic">—</span>}</span>
    ),
    className: "max-w-xs truncate",
  },
]

export default function MedioAlmacenamientoPage() {
  const { medios, isLoading, mutate } = useMediosAlmacenamiento()
  const { materiales } = useMateriales()
  const { tipos } = useTipos()
  const { marcas } = useMarcas()
  const { modelos } = useModelos()
  const { createMedio, isLoading: isCreating } = useCreateMedioAlmacenamiento()
  const { updateMedio, isLoading: isUpdating } = useUpdateMedioAlmacenamiento()
  const { deleteMedio, isLoading: isDeleting } = useDeleteMedioAlmacenamiento()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MedioAlmacenamiento | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = medios.filter((m: MedioAlmacenamiento) => {
    const q = search.toLowerCase()
    return (
      String(m.materialId).includes(q) ||
      (m.tipo?.nombre ?? "").toLowerCase().includes(q) ||
      (m.marca?.nombre ?? "").toLowerCase().includes(q) ||
      (m.modelo?.nombre ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(m: MedioAlmacenamiento) {
    setIsViewing(false)
    setEditing(m)
    setForm({
      materialId: String(m.materialId),
      tipoId: m.tipoId ? String(m.tipoId) : "",
      marcaId: m.marcaId ? String(m.marcaId) : "",
      modeloId: m.modeloId ? String(m.modeloId) : "",
      terminosUso: m.terminosUso ?? "",
    })
    setModalOpen(true)
  }

  function openView(m: MedioAlmacenamiento) {
    setIsViewing(true)
    setEditing(m)
    setForm({
      materialId: String(m.materialId),
      tipoId: m.tipoId ? String(m.tipoId) : "",
      marcaId: m.marcaId ? String(m.marcaId) : "",
      modeloId: m.modeloId ? String(m.modeloId) : "",
      terminosUso: m.terminosUso ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.materialId) {
      toast.error("El material es obligatorio")
      return
    }
    try {
      const payload = {
        materialId: Number(form.materialId),
        tipoId: form.tipoId ? Number(form.tipoId) : undefined,
        marcaId: form.marcaId ? Number(form.marcaId) : undefined,
        modeloId: form.modeloId ? Number(form.modeloId) : undefined,
        terminosUso: form.terminosUso.trim() || undefined,
      }
      if (editing) {
        await updateMedio({ id: editing.id, ...payload })
        toast.success("Medio de almacenamiento actualizado")
      } else {
        await createMedio(payload)
        toast.success("Medio de almacenamiento creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el medio de almacenamiento")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteMedio(id as number)
      await mutate()
      toast.success("Medio de almacenamiento desactivado")
    } catch {
      toast.error("Error al eliminar el medio de almacenamiento")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Medios de Almacenamiento</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los medios de almacenamiento asociados a materiales del sistema.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por material, tipo, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} medio{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo medio
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando medios de almacenamiento..."
        emptyText="No hay medios de almacenamiento registrados."
        emptySearchText="No se encontraron medios con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver medio de almacenamiento" : editing ? "Editar medio de almacenamiento" : "Nuevo medio de almacenamiento"}
        readOnly={isViewing}
        description={
          editing
            ? "Modificá los datos del medio de almacenamiento."
            : "Completá los datos del nuevo medio de almacenamiento."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear medio"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Material</label>
          <select
            value={form.materialId}
            onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar material...</option>
            {materiales.map((m: Material) => (
              <option key={m.id} value={m.id}>
                #{m.id}{m.tipoMaterial ? ` — ${m.tipoMaterial.nombre}` : ""}{m.descripcion ? ` (${m.descripcion})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Tipo <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.tipoId}
            onChange={(e) => setForm((f) => ({ ...f, tipoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin tipo</option>
            {tipos.map((t: Tipo) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Marca <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.marcaId}
            onChange={(e) => setForm((f) => ({ ...f, marcaId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin marca</option>
            {marcas.map((m: Marca) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Modelo <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.modeloId}
            onChange={(e) => setForm((f) => ({ ...f, modeloId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin modelo</option>
            {modelos
              .filter((mo: Modelo) => !form.marcaId || mo.marcaId === Number(form.marcaId))
              .map((mo: Modelo) => (
                <option key={mo.id} value={mo.id}>{mo.nombre}</option>
              ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Términos de uso <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.terminosUso}
            onChange={(e) => setForm((f) => ({ ...f, terminosUso: e.target.value }))}
            placeholder="Ej: Uso en ambiente seco, temperatura controlada..."
            maxLength={500}
          />
        </div>
      </FormModal>
    </div>
  )
}
