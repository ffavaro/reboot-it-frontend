"use client"

import { useState, useEffect } from "react"
import type { TokenPayload } from "@/lib/auth-utils"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import {
  useDonaciones,
  useCreateDonacion,
  useUpdateDonacion,
  useDeleteDonacion,
} from "@/hooks/use-donacion"
import { useDonantes } from "@/hooks/use-donantes"
import type { Donacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import { getUser } from "@/lib/auth-utils"
import { FormModal } from "@/components/ui/form-modal"


const ESTADO_COLORS: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Completada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-100 text-red-800",
}

export default function DonacionPage() {
  const { donaciones, isLoading, mutate } = useDonaciones()
  const { donantes } = useDonantes()
  const { createDonacion, isLoading: isCreating } = useCreateDonacion()
  const { updateDonacion, isLoading: isUpdating } = useUpdateDonacion()
  const { deleteDonacion, isLoading: isDeleting } = useDeleteDonacion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Donacion | null>(null)
  const [form, setForm] = useState({
  donanteId: "",
  fechaHora: "",
  descripcion: "",
  estado_donacion_: "",
  })
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
    const donante = d.donante?.nombre?.toLowerCase() ?? ""
    return (
      donante.includes(q) ||
      (d.estado ?? "").toLowerCase().includes(q) ||
      (d.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      donanteId: myDonante ? String(myDonante.id) : "",
    })
    setSheetOpen(true)
  }

  function openEdit(d: Donacion) {
    setEditing(d)
    setForm({
      donanteId: String(d.donanteId),
      fechaHora: "",
      descripcion: d.descripcion ?? "",
      estado: d.estado ?? "",
    })
    setSheetOpen(true)
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
    try {
      if (editing) {
        await updateDonacion({
          id: editing.id,
          donanteId: Number(form.donanteId),
          descripcion: form.descripcion.trim() || undefined,
          estado: form.estado || undefined,
        })
        toast.success("Donación actualizada")
      } else {
        await createDonacion({
          donanteId: Number(form.donanteId),
          fechaHora: form.fechaHora,
          descripcion: form.descripcion.trim() || undefined,
          estado: form.estado || undefined,
        })
        toast.success("Donación creada")
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
      className: "font-mono text-xs",
    },
    ...(!isDonante ? [{
      key: "donante",
      header: "Donante",
      cell: (d: Donacion) => d.donante?.nombre ?? <span className="italic text-muted-foreground">#{d.donanteId}</span>,
    }] : []),
    {
      key: "estado",
      header: "Estado",
      cell: (d) => d.estado ? (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[d.estado] ?? "bg-gray-100 text-gray-800"}`}>
          {d.estado}
        </span>
      ) : <span className="italic text-muted-foreground">—</span>,
    },
    {
      key: "descripcion",
      header: "Descripción",
      cell: (d) => d.descripcion ?? <span className="italic text-muted-foreground">—</span>,
      className: "max-w-[260px] truncate text-muted-foreground",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Donaciones</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las donaciones registradas por donante.
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
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        title={editing ? "Editar donación" : "Nueva donación"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
       // isSaving={isCreating || isUpdating}
        saveLabel={ editing ?"Guardar cambios" : "Crear donacion"}
      >
       <div className="flex flex-col gap-2">
        {!isDonante && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Donante</label>
            <select
              value={form.donanteId}
              onChange={(e) => setForm((f) => ({ ...f, donanteId: e.target.value }))}
              disabled={isDonante || !!editing}
              className="w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Seleccionar donante</option>
              {donantes.map((d: Donante) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({d.tipoDonanteId === 1 ? d.nombre : d.razonSocial})
                </option>
              ))}
            </select>
          </div>
        )}
       </div>
      </FormModal>
  
    </div>
  )
}
