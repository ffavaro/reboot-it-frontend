"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
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
import {
  useVehiculos,
  useTipoVehiculos,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
  useCreateTipoVehiculo,
  useUpdateTipoVehiculo,
  useDeleteTipoVehiculo,
} from "@/hooks/use-vehicles"
import type { Vehiculo, TipoVehiculo } from "@/lib/type/vehicle"

type Tab = "vehiculos" | "tipos"

const EMPTY_VEHICULO = { tipoVehiculoId: 0, patente: "", marca: "", modelo: "" }
const EMPTY_TIPO = { descripcion: "" }

// ---------------------------------------------------------------------------
// Vehículos tab
// ---------------------------------------------------------------------------

function VehiculosTab() {
  const { vehiculos, isLoading, mutate } = useVehiculos()
  const { tipos } = useTipoVehiculos()
  const { createVehiculo, isLoading: isCreating } = useCreateVehiculo()
  const { updateVehiculo, isLoading: isUpdating } = useUpdateVehiculo()
  const { deleteVehiculo, isLoading: isDeleting } = useDeleteVehiculo()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Vehiculo | null>(null)
  const [form, setForm] = useState(EMPTY_VEHICULO)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = vehiculos.filter(
    (v) =>
      v.patente.toLowerCase().includes(search.toLowerCase()) ||
      v.marca.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_VEHICULO)
    setSheetOpen(true)
  }

  function openEdit(v: Vehiculo) {
    setEditing(v)
    setForm({ tipoVehiculoId: v.tipoVehiculoId, patente: v.patente, marca: v.marca, modelo: v.modelo })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.patente || !form.marca || !form.modelo || !form.tipoVehiculoId) {
      toast.error("Completá todos los campos")
      return
    }
    try {
      if (editing) {
        await updateVehiculo({ id: editing.id, ...form })
        toast.success("Vehículo actualizado")
      } else {
        await createVehiculo(form)
        toast.success("Vehículo creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el vehículo")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteVehiculo(id)
      await mutate()
      toast.success("Vehículo desactivado")
    } catch {
      toast.error("Error al eliminar el vehículo")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por patente, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo vehículo
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patente</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Modelo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando vehículos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron vehículos.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium tracking-wider">{v.patente}</td>
                  <td className="px-4 py-3">{v.marca}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.modelo}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {v.tipoVehiculo?.descripcion ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === v.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(v.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(v)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(v.id)}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && setSheetOpen(false)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar vehículo" : "Nuevo vehículo"}</SheetTitle>
            <SheetDescription>
              {editing ? `Modificá los datos de ${editing.patente}.` : "Completá los datos del nuevo vehículo."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Patente</label>
              <Input
                value={form.patente}
                onChange={(e) => setForm((f) => ({ ...f, patente: e.target.value.toUpperCase() }))}
                placeholder="ABC123"
                maxLength={20}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Marca</label>
              <Input
                value={form.marca}
                onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                placeholder="Ford"
                maxLength={50}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Modelo</label>
              <Input
                value={form.modelo}
                onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                placeholder="F-100"
                maxLength={50}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Tipo de vehículo</label>
              <select
                value={form.tipoVehiculoId}
                onChange={(e) => setForm((f) => ({ ...f, tipoVehiculoId: Number(e.target.value) }))}
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
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear vehículo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tipos de Vehículo tab
// ---------------------------------------------------------------------------

function TiposTab() {
  const { tipos, isLoading, mutate } = useTipoVehiculos()
  const { createTipo, isLoading: isCreating } = useCreateTipoVehiculo()
  const { updateTipo, isLoading: isUpdating } = useUpdateTipoVehiculo()
  const { deleteTipo, isLoading: isDeleting } = useDeleteTipoVehiculo()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<TipoVehiculo | null>(null)
  const [form, setForm] = useState(EMPTY_TIPO)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_TIPO)
    setSheetOpen(true)
  }

  function openEdit(t: TipoVehiculo) {
    setEditing(t)
    setForm({ descripcion: t.descripcion })
    setSheetOpen(true)
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
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el tipo")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTipo(id)
      await mutate()
      toast.success("Tipo desactivado")
    } catch {
      toast.error("Error al eliminar el tipo")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="flex items-center">
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo tipo
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando tipos...
                </td>
              </tr>
            ) : tipos.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-muted-foreground">
                  No hay tipos de vehículo registrados.
                </td>
              </tr>
            ) : (
              tipos.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.descripcion}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === t.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(t.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(t)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(t.id)}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && setSheetOpen(false)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar tipo" : "Nuevo tipo de vehículo"}</SheetTitle>
            <SheetDescription>
              {editing ? `Modificá la descripción de "${editing.descripcion}".` : "Ingresá la descripción del nuevo tipo."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm({ descripcion: e.target.value })}
                placeholder="Ej: Camión, Camioneta, Auto..."
                maxLength={100}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear tipo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("vehiculos")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Vehículos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los vehículos del sistema y sus tipos.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {(["vehiculos", "tipos"] as Tab[]).map((tab) => (
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
            {tab === "vehiculos" ? "Vehículos" : "Tipos de vehículo"}
          </button>
        ))}
      </div>

      {activeTab === "vehiculos" ? <VehiculosTab /> : <TiposTab />}
    </div>
  )
}
