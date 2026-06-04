"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useMateriales,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useClasificarMaterial,
} from "@/hooks/use-material"
import { useLotes } from "@/hooks/use-lote"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { useTipos } from "@/hooks/use-tipo"
import { useMarcas } from "@/hooks/use-marca"
import { useModelos } from "@/hooks/use-modelo"
import type { Material } from "@/lib/type/material"
import type { Lote } from "@/lib/type/lote"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"
import type { Tipo } from "@/lib/type/tipo"
import type { Marca } from "@/lib/type/marca"
import type { Modelo } from "@/lib/type/modelo"

const EMPTY_FORM = { loteId: "", tipoMaterialId: "", condicionMaterialId: "", descripcion: "" }
const TIPO_ALMACENAMIENTO = "almacenamiento"

const columns: TableColumn<Material>[] = [
  {
    key: "loteId",
    header: "Lote",
    cell: (m) => <span className="font-mono text-xs">#{m.loteId}</span>,
  },
  {
    key: "tipoMaterial",
    header: "Tipo de material",
    cell: (m) =>
      m.tipoMaterial?.nombre ?? (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "condicion",
    header: "Condición",
    cell: (m) =>
      m.condicionMaterial?.condicion ? (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {m.condicionMaterial.condicion}
        </span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "descripcion",
    header: "Descripción",
    className: "max-w-[240px] truncate",
    cell: (m) => (
      <span className="text-muted-foreground">
        {m.descripcion ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function MaterialPage() {
  const { materiales, isLoading, mutate } = useMateriales()
  const { lotes } = useLotes()
  const { tipoMateriales } = useTipoMateriales()
  const { condiciones } = useCondicionesMaterial()
  const { tipos } = useTipos()
  const { marcas } = useMarcas()
  const { modelos } = useModelos()
  const { createMaterial, isLoading: isCreating } = useCreateMaterial()
  const { updateMaterial } = useUpdateMaterial()
  const { deleteMaterial, isLoading: isDeleting } = useDeleteMaterial()
  const { clasificarMaterial, isLoading: isClasificando } = useClasificarMaterial()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [requiereDestruccion, setRequiereDestruccion] = useState<boolean>(false)
  const [destruccionTipoId, setDestruccionTipoId] = useState("")
  const [destruccionMarcaId, setDestruccionMarcaId] = useState("")
  const [destruccionModeloId, setDestruccionModeloId] = useState("")

  // Filtra modelos según la marca seleccionada
  const modelosFiltrados = destruccionMarcaId
    ? modelos.filter((m: Modelo) => String(m.marcaId) === destruccionMarcaId)
    : modelos

  const filtered = materiales.filter((m: Material) => {
    const q = search.toLowerCase()
    const tipo = m.tipoMaterial?.nombre?.toLowerCase() ?? ""
    const condicion = m.condicionMaterial?.condicion?.toLowerCase() ?? ""
    return (
      String(m.loteId).includes(q) ||
      tipo.includes(q) ||
      condicion.includes(q) ||
      (m.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  // Resuelve si el tipo seleccionado actualmente es "Almacenamiento"
  const tipoSeleccionado = tipoMateriales.find(
    (t: TipoMaterial) => String(t.id) === form.tipoMaterialId,
  )
  const esAlmacenamiento =
    tipoSeleccionado?.nombre?.toLowerCase() === TIPO_ALMACENAMIENTO

  function resetDestruccion() {
    setRequiereDestruccion(false)
    setDestruccionTipoId("")
    setDestruccionMarcaId("")
    setDestruccionModeloId("")
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    resetDestruccion()
    setModalOpen(true)
  }

  function openEdit(m: Material) {
    setIsViewing(false)
    setEditing(m)
    setForm({
      loteId: String(m.loteId),
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: String(m.condicionMaterialId),
      descripcion: m.descripcion ?? "",
    })
    resetDestruccion()
    setModalOpen(true)
  }

  function openView(m: Material) {
    setIsViewing(true)
    setEditing(m)
    setForm({
      loteId: String(m.loteId),
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: String(m.condicionMaterialId),
      descripcion: m.descripcion ?? "",
    })
    resetDestruccion()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.loteId || !form.tipoMaterialId || !form.condicionMaterialId) {
      toast.error("Lote, tipo de material y condición son obligatorios")
      return
    }
    if (esAlmacenamiento && requiereDestruccion) {
      if (!destruccionTipoId || !destruccionMarcaId || !destruccionModeloId) {
        toast.error("Para el proceso de destrucción debe seleccionar tipo, marca y modelo del medio de almacenamiento")
        return
      }
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        tipoMaterialId: Number(form.tipoMaterialId),
        condicionMaterialId: Number(form.condicionMaterialId),
        descripcion: form.descripcion.trim() || undefined,
      }

      if (editing) {
        await updateMaterial({ id: editing.id, ...payload })
        // Si es almacenamiento con destrucción, crear medio + proceso después de actualizar
        if (esAlmacenamiento && requiereDestruccion) {
          await clasificarMaterial({
            id: editing.id,
            condicionMaterialId: payload.condicionMaterialId,
            requiereDestruccion: true,
            tipoId: destruccionTipoId ? Number(destruccionTipoId) : undefined,
            marcaId: destruccionMarcaId ? Number(destruccionMarcaId) : undefined,
            modeloId: destruccionModeloId ? Number(destruccionModeloId) : undefined,
          })
          toast.success("Material actualizado. Se creó el proceso de destrucción.")
        } else {
          toast.success("Material actualizado")
        }
      } else {
        const created = await createMaterial(payload)
        if (esAlmacenamiento && requiereDestruccion && created) {
          await clasificarMaterial({
            id: (created as Material).id,
            condicionMaterialId: payload.condicionMaterialId,
            requiereDestruccion: true,
            tipoId: destruccionTipoId ? Number(destruccionTipoId) : undefined,
            marcaId: destruccionMarcaId ? Number(destruccionMarcaId) : undefined,
            modeloId: destruccionModeloId ? Number(destruccionModeloId) : undefined,
          })
          toast.success("Material creado. Se creó el proceso de destrucción.")
        } else {
          toast.success("Material creado")
        }
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el material")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteMaterial(Number(id))
      await mutate()
      toast.success("Material desactivado")
    } catch {
      toast.error("Error al eliminar el material")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los materiales registrados por lote.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por lote, tipo, condición o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} material{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo material
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando materiales..."
        emptyText="No hay materiales registrados."
        emptySearchText="No se encontraron materiales con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver material" : editing ? "Editar material" : "Nuevo material"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del material." : "Registrá un nuevo material en un lote."}
        onSave={handleSave}
        isLoading={isCreating || isClasificando}
        saveLabel={editing ? "Guardar cambios" : "Crear material"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote</label>
          <select
            value={form.loteId}
            onChange={(e) => setForm((f) => ({ ...f, loteId: e.target.value }))}
            disabled={isViewing}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
          >
            <option value="">Seleccionar lote...</option>
            {lotes.map((l: Lote) => (
              <option key={l.id} value={l.id}>
                #{l.id} — Donación #{l.donacionId}
                {l.pesoBrutoKg ? ` (${l.pesoBrutoKg} kg)` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de material</label>
          <select
            value={form.tipoMaterialId}
            onChange={(e) => {
              setForm((f) => ({ ...f, tipoMaterialId: e.target.value }))
              setRequiereDestruccion(false)
            }}
            disabled={isViewing}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
          >
            <option value="">Seleccionar tipo...</option>
            {tipoMateriales.map((t: TipoMaterial) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Condición</label>
          <select
            value={form.condicionMaterialId}
            onChange={(e) => setForm((f) => ({ ...f, condicionMaterialId: e.target.value }))}
            disabled={isViewing}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
          >
            <option value="">Seleccionar condición...</option>
            {condiciones.map((c: CondicionMaterial) => (
              <option key={c.id} value={c.id}>{c.condicion}</option>
            ))}
          </select>
        </div>

        {/* Toggle destrucción — solo visible si tipo es Almacenamiento y no es vista */}
        {esAlmacenamiento && !isViewing && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">
              ¿Requiere proceso de destrucción?
            </p>
            <p className="text-xs text-amber-700">
              Al confirmar se creará un <span className="font-medium">Medio de Almacenamiento</span> y un{" "}
              <span className="font-medium">Proceso de Destrucción</span> asociados a este material.
            </p>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requiereDestruccion"
                  checked={requiereDestruccion === true}
                  onChange={() => setRequiereDestruccion(true)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">Sí</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requiereDestruccion"
                  checked={requiereDestruccion === false}
                  onChange={() => { setRequiereDestruccion(false); resetDestruccion() }}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">No</span>
              </label>
            </div>

            {requiereDestruccion && (
              <div className="flex flex-col gap-3 border-t border-amber-200 pt-3 mt-1">
                <p className="text-xs font-medium text-amber-800">Datos del medio de almacenamiento</p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-amber-800">
                    Tipo <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={destruccionTipoId}
                    onChange={(e) => setDestruccionTipoId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-amber-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                  >
                    <option value="">Sin tipo...</option>
                    {tipos.map((t: Tipo) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-amber-800">
                    Marca <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={destruccionMarcaId}
                    onChange={(e) => { setDestruccionMarcaId(e.target.value); setDestruccionModeloId("") }}
                    className="flex h-9 w-full rounded-md border border-amber-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                  >
                    <option value="">Sin marca...</option>
                    {marcas.map((m: Marca) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-amber-800">
                    Modelo <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={destruccionModeloId}
                    onChange={(e) => setDestruccionModeloId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-amber-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                  >
                    <option value="">Sin modelo...</option>
                    {modelosFiltrados.map((m: Modelo) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            placeholder="Descripción del material..."
            value={form.descripcion}
            disabled={isViewing}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  )
}
