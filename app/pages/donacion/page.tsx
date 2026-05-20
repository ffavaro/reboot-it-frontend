"use client"

import { useState, useEffect } from "react"
import type { TokenPayload } from "@/lib/auth-utils"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormModal } from "@/components/ui/form-modal"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import {
  useDonaciones,
  useCreateDonacion,
  useUpdateDonacion,
  useDeleteDonacion,
} from "@/hooks/use-donacion"
import { useDonantes } from "@/hooks/use-donantes"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import type { Donacion, EstadoDonacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import { getUser } from "@/lib/auth-utils"

const EMPTY_FORM = { donanteId: "", fechaHora: "", estadoDonacionId: "", descripcion: "" }
const EMPTY_DETALLE = { tipoMaterialId: "", descripcion: "", cantidadEstimada: "", observaciones: "" }
type DetalleRow = typeof EMPTY_DETALLE

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  "en proceso": "bg-blue-100 text-blue-800",
  completada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
}

export default function DonacionPage() {
  const { donaciones, isLoading, mutate } = useDonaciones()
  const { donantes } = useDonantes()
  const { tipoMateriales } = useTipoMateriales()
  const { estadosDonacion } = useEstadosDonacion()
  const { createDonacion, isLoading: isCreating } = useCreateDonacion()
  const { updateDonacion, isLoading: isUpdating } = useUpdateDonacion()
  const { deleteDonacion, isLoading: isDeleting } = useDeleteDonacion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Donacion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [detalles, setDetalles] = useState<DetalleRow[]>([])
  const [user, setUser] = useState<TokenPayload | null>(null)

  useEffect(() => { setUser(getUser()) }, [])

  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const myDonante = isDonante
    ? donantes.find((d: Donante) => d.usuarioId === user?.id) ?? null
    : null

  const visibleDonaciones = isDonante
    ? donaciones.filter((d: Donacion) => d.donanteId === myDonante?.id)
    : donaciones

  const filtered = visibleDonaciones.filter((d: Donacion) => {
    const q = search.toLowerCase()
    return (
      (d.donante?.nombre ?? "").toLowerCase().includes(q) ||
      (d.estadoDonacion?.descripcion ?? "").toLowerCase().includes(q) ||
      (d.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, donanteId: myDonante ? String(myDonante.id) : "" })
    setDetalles([])
    setSheetOpen(true)
  }

  function openEdit(d: Donacion) {
    setEditing(d)
    setForm({
      donanteId: String(d.donanteId),
      fechaHora: "",
      estadoDonacionId: d.estadoDonacionId != null ? String(d.estadoDonacionId) : "",
      descripcion: d.descripcion ?? "",
    })
    setDetalles(
      (d.detalles ?? []).map((det) => ({
        tipoMaterialId: String(det.tipoMaterialId),
        descripcion: det.descripcion ?? "",
        cantidadEstimada: det.cantidadEstimada != null ? String(det.cantidadEstimada) : "",
        observaciones: det.observaciones ?? "",
      })),
    )
    setSheetOpen(true)
  }

  function addDetalle() {
    setDetalles((prev) => [...prev, { ...EMPTY_DETALLE }])
  }

  function removeDetalle(idx: number) {
    setDetalles((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateDetalleField(idx: number, field: keyof DetalleRow, value: string) {
    setDetalles((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)))
  }

  async function handleSave() {
    if (!form.donanteId) {
      toast.error("El donante es obligatorio")
      return
    }
    if (!editing && !form.fechaHora) {
      toast.error("La fecha y hora del turno son obligatorias")
      return
    }
    if (detalles.some((d) => !d.tipoMaterialId)) {
      toast.error("Seleccioná el tipo de material para cada ítem")
      return
    }

    const detallesPayload = detalles.map((d) => ({
      tipoMaterialId: Number(d.tipoMaterialId),
      descripcion: d.descripcion.trim() || undefined,
      cantidadEstimada: d.cantidadEstimada ? Number(d.cantidadEstimada) : undefined,
      observaciones: d.observaciones.trim() || undefined,
    }))

    try {
      if (editing) {
        await updateDonacion({
          id: editing.id,
          donanteId: Number(form.donanteId),
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          descripcion: form.descripcion.trim() || undefined,
          detalles: detallesPayload,
        })
        toast.success("Donación actualizada")
      } else {
        await createDonacion({
          donanteId: Number(form.donanteId),
          fechaHora: form.fechaHora,
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          descripcion: form.descripcion.trim() || undefined,
          detalles: detallesPayload,
        })
        toast.success("Donación creada y turno generado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar la donación")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteDonacion(id)
      await mutate()
      toast.success("Donación desactivada")
    } catch {
      toast.error("Error al eliminar la donación")
    }
  }

  const columns: TableColumn<Donacion>[] = [
    {
      key: "id",
      header: "ID",
      cell: (d) => `#${d.id}`,
      className: "font-mono text-xs w-14",
    },
    ...(!isDonante
      ? [
          {
            key: "donante",
            header: "Donante",
            cell: (d: Donacion) =>
              d.donante?.nombre ?? (
                <span className="italic text-muted-foreground">#{d.donanteId}</span>
              ),
          },
        ]
      : []),
    {
      key: "estado",
      header: "Estado",
      cell: (d) => {
        const desc = d.estadoDonacion?.descripcion
        if (!desc) return <span className="italic text-muted-foreground">—</span>
        const color = ESTADO_COLORS[desc.toLowerCase()] ?? "bg-gray-100 text-gray-800"
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
          >
            {desc}
          </span>
        )
      },
      className: "w-32",
    },
    {
      key: "items",
      header: "Materiales",
      cell: (d) => (
        <span className="text-sm text-muted-foreground">
          {d.detalles?.length ?? 0} ítem{(d.detalles?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      ),
      className: "w-24",
    },
    {
      key: "descripcion",
      header: "Descripción",
      cell: (d) =>
        d.descripcion ?? <span className="italic text-muted-foreground">—</span>,
      className: "max-w-[220px] truncate text-muted-foreground",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Donaciones</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las donaciones y los materiales asociados.
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
          {filtered.length} donación{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva donación
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando donaciones..."
        emptyText="No hay donaciones registradas."
        emptySearchText="No se encontraron donaciones con ese criterio."
        search={search}
        onEdit={isDonante ? undefined : openEdit}
        onDelete={isDonante ? undefined : handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Editar donación" : "Nueva donación"}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear donación"}
      >
          <div className="flex flex-col gap-5">
            {/* Donante */}
            {!isDonante && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Donante *</label>
                <select
                  value={form.donanteId}
                  onChange={(e) => setForm((f) => ({ ...f, donanteId: e.target.value }))}
                  disabled={!!editing}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccionar donante...</option>
                  {donantes.map((d: Donante) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                      {d.razonSocial ? ` — ${d.razonSocial}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fecha y hora del turno (solo en creación) */}
            {!editing && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Fecha y hora del turno *</label>
                <input
                  type="datetime-local"
                  value={form.fechaHora}
                  onChange={(e) => setForm((f) => ({ ...f, fechaHora: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}

            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Estado{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <select
                value={form.estadoDonacionId}
                onChange={(e) => setForm((f) => ({ ...f, estadoDonacionId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin estado</option>
                {estadosDonacion.map((e: EstadoDonacion) => (
                  <option key={e.id} value={e.id}>
                    {e.descripcion}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Descripción{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Descripción general de la donación..."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Materiales */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Materiales a donar</span>
                <Button variant="outline" size="sm" type="button" onClick={addDetalle}>
                  + Agregar
                </Button>
              </div>

              {detalles.length === 0 && (
                <p className="text-sm italic text-muted-foreground py-1">
                  Sin materiales cargados.
                </p>
              )}

              {detalles.map((det, idx) => (
                <div key={idx} className="rounded-lg border p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <select
                      value={det.tipoMaterialId}
                      onChange={(e) =>
                        updateDetalleField(idx, "tipoMaterialId", e.target.value)
                      }
                      className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Tipo de material *</option>
                      {tipoMateriales.map((t: TipoMaterial) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Cant."
                      value={det.cantidadEstimada}
                      onChange={(e) =>
                        updateDetalleField(idx, "cantidadEstimada", e.target.value)
                      }
                      className="w-20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeDetalle(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors text-xl leading-none px-1 mt-1"
                    >
                      ×
                    </button>
                  </div>
                  <Input
                    placeholder="Descripción del material (opcional)"
                    value={det.descripcion}
                    onChange={(e) => updateDetalleField(idx, "descripcion", e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Observaciones (opcional)"
                    value={det.observaciones}
                    onChange={(e) =>
                      updateDetalleField(idx, "observaciones", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

      </FormModal>
    </div>
  )
}
