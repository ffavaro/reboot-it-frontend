"use client"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { DatePicker } from "@/components/ui/date-picker"
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
import { uploadFoto } from "@/lib/api/client"
import type { RegistroFotografico } from "@/lib/type/registro-fotografico"
import type { Lote } from "@/lib/type/lote"
import { dia, hoyIso } from "@/lib/utils/fechas"
import { openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import { useFormErrors } from "@/hooks/use-form-errors"
import Title from "@/components/ui/title"

const EMPTY_FORM = { loteId: "", fecha: "" }

const columns: TableColumn<RegistroFotografico>[] = [
  {
    key: "loteId",
    header: "Lote",
    cell: (r) => (
      r.loteId
        ? <span className="font-mono text-xs font-medium">#{r.loteId}</span>
        : <span className="italic text-muted-foreground text-xs"></span>
    ),
  },
  {
    key: "imagen",
    header: "Foto",
    cell: (r) => (
      <a href={r.urlImagen} target="_blank" rel="noopener noreferrer" title="Ver foto completa">
        <img
          src={r.urlImagen}
          alt={`Registro #${r.id}`}
          className="h-12 w-12 rounded-md object-cover bg-muted hover:opacity-80 transition-opacity border border-border"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
        />
      </a>
    ),
  },
  {
    key: "fecha",
    header: "Fecha",
    cell: (r) => (
      <span className="text-muted-foreground">
        {dia(r.fecha)}
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const { clearError } = useFormErrors<typeof EMPTY_FORM>()

  useEffect(() => {
    return () => { if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl) }
  }, [fotoPreviewUrl])

  const filtered = registros.filter((r: RegistroFotografico) => {
    const q = search.toLowerCase()
    return String(r.loteId ?? "").includes(q) || String(r.id).includes(q)
  })

  function resetFileState() {
    setSelectedFile(null)
    setFotoPreviewUrl(null)
    setFileInputKey((k) => k + 1)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    setSelectedFile(file)
    setFotoPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleSave() {
    if (!editing && !selectedFile) {
      toast.error("Seleccioná una foto para el registro")
      return
    }
    if (!form.loteId) {
      toast.error("El lote es obligatorio")
      return
    }
    setIsUploading(true)
    try {
      let urlImagen = editing?.urlImagen ?? ""
      if (selectedFile) {
        urlImagen = await uploadFoto(selectedFile)
      }

      const payload = {
        loteId: Number(form.loteId),
        urlImagen,
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
    } finally {
      setIsUploading(false)
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

  const canSave = !!form.loteId && (!!editing || !!selectedFile)

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Registro Fotográfico"
        description="Administrá las fotos asociadas a los lotes del sistema."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({
          setIsViewing, setEditing, setForm, reset: resetFileState, setModalOpen,
          EMPTY_FORM: { ...EMPTY_FORM, fecha: hoyIso() },
        })}
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando registros fotográficos..."
        emptyText="No hay registros fotográficos."
        emptySearchText="No se encontraron registros con ese criterio."
        search={search}
        onView={(t) => openView({
          t, setIsViewing, setEditing, setForm, reset: resetFileState, setModalOpen,
          jsonEntidad: {
            loteId: t.loteId ? String(t.loteId) : "",
            fecha: t.fecha ? t.fecha.slice(0, 10) : "",
          },
        })}
        onEdit={(t) => openEdit({
          t, setIsViewing, setEditing, setForm, reset: resetFileState, setModalOpen,
          jsonEntidad: {
            loteId: t.loteId ? String(t.loteId) : "",
            fecha: t.fecha ? t.fecha.slice(0, 10) : "",
          },
        })}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) resetFileState()
        }}
        title={
          isViewing
            ? "Ver registro fotográfico"
            : editing
            ? "Editar registro fotográfico"
            : "Nuevo registro fotográfico"
        }
        readOnly={isViewing}
        description={
          editing
            ? "Modificá los datos del registro fotográfico."
            : "Subí una foto y asociala a un lote."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating || isUploading}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear registro"}
      >
        {/* Foto actual (modo edición/vista) */}
        {editing && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Foto actual</p>
            <a href={editing.urlImagen} target="_blank" rel="noopener noreferrer">
              <img
                src={editing.urlImagen}
                alt="Foto actual"
                className="h-32 w-auto rounded-md object-contain border border-border hover:opacity-80 transition-opacity"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            </a>
          </div>
        )}

        {/* File input (oculto en modo vista) */}
        {!isViewing && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              {editing ? "Reemplazar foto" : "Foto"}
              {!editing && <span className="ml-1 text-destructive">*</span>}
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                {editing ? "(opcional)" : "(jpg, jpeg, png, webp  máx. 5 MB)"}
              </span>
            </label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium file:cursor-pointer cursor-pointer"
            />
            {fotoPreviewUrl && (
              <img
                src={fotoPreviewUrl}
                alt="Vista previa"
                className="h-32 w-auto rounded-md object-contain border border-border"
              />
            )}
          </div>
        )}

        {/* Lote */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote *</label>
          <select
            value={form.loteId}
            onChange={(e) => set({ setFrom: setForm, fileds: "loteId", value: e.target.value, clearError })}
            disabled={isViewing}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
          >
            <option value="">Seleccionar lote...</option>
            {lotes.map((l: Lote) => (
              <option key={l.id} value={l.id}>
                Lote #{l.id}{l.pesoBrutoKg ? `  ${l.pesoBrutoKg} kg` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fecha</label>
          <DatePicker
            variant="field"
            value={form.fecha}
            onChange={(v) => set({ setFrom: setForm, fileds: "fecha", value: v, clearError })}
            disabled={isViewing || !editing}
          />
        </div>
      </FormModal>
    </div>
  )
}
