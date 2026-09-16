"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
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
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect, maxLength as maxLengthValidator, positiveNumber, maxDigits } from "@/lib/form-validators"
import { enforceMaxLength } from "@/lib/utils/text-limit"
import { enforceDecimalInput } from "@/lib/utils/number-limit"
import type { Vehiculo, TipoVehiculo } from "@/lib/type/vehicle"

type Tab = "vehiculos" | "tipos"

const DESCRIPCION_MAX = 35
const PESO_MINIMO_MAX_DIGITS = 2
const PESO_MAXIMO_MAX_DIGITS = 3

const EMPTY_VEHICULO = { tipoVehiculoId: 0, patente: "", marca: "", modelo: "" }
const EMPTY_TIPO = { descripcion: "", pesoMinimo: "", pesoMaximo: "" }

// ---------------------------------------------------------------------------
// Vehículos tab
// ---------------------------------------------------------------------------

const vehiculoColumns: TableColumn<Vehiculo>[] = [
  {
    key: "patente",
    header: "Patente",
    cell: (v) => <span className="font-mono font-medium tracking-wider">{v.patente}</span>,
  },
  {
    key: "marca",
    header: "Marca",
    cell: (v) => v.marca,
  },
  {
    key: "modelo",
    header: "Modelo",
    cell: (v) => <span className="text-muted-foreground">{v.modelo}</span>,
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (v) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {v.tipoVehiculo?.descripcion ?? "—"}
      </span>
    ),
  },
]

function VehiculosTab() {
  const { vehiculos, isLoading, mutate } = useVehiculos()
  const { tipos, mutate: mutateTipos } = useTipoVehiculos()
  const { createVehiculo, isLoading: isCreating } = useCreateVehiculo()
  const { updateVehiculo, isLoading: isUpdating } = useUpdateVehiculo()
  const { deleteVehiculo, isLoading: isDeleting } = useDeleteVehiculo()
  const { createTipo, isLoading: isCreatingTipo } = useCreateTipoVehiculo()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_VEHICULO>()
  const {
    errors: tipoErrors,
    validate: validateTipo,
    clearError: clearTipoError,
    reset: resetTipoErrors,
  } = useFormErrors<typeof EMPTY_TIPO>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehiculo | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_VEHICULO)

  const [quickTipoOpen, setQuickTipoOpen] = useState(false)
  const [quickTipoForm, setQuickTipoForm] = useState(EMPTY_TIPO)

  const filtered = vehiculos.filter(
    (v) =>
      v.patente.toLowerCase().includes(search.toLowerCase()) ||
      v.marca.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase()),
  )

  function set(field: keyof typeof EMPTY_VEHICULO, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
    clearError(field)
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_VEHICULO)
    reset()
    setModalOpen(true)
  }

  function openEdit(v: Vehiculo) {
    setIsViewing(false)
    setEditing(v)
    setForm({ tipoVehiculoId: v.tipoVehiculoId, patente: v.patente, marca: v.marca, modelo: v.modelo })
    reset()
    setModalOpen(true)
  }

  function openView(v: Vehiculo) {
    setIsViewing(true)
    setEditing(v)
    setForm({ tipoVehiculoId: v.tipoVehiculoId, patente: v.patente, marca: v.marca, modelo: v.modelo })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      patente: [required("la patente")],
      marca: [required("la marca")],
      modelo: [required("el modelo")],
      tipoVehiculoId: [requiredSelect("un tipo de vehículo")],
    })) return
    try {
      if (editing) {
        await updateVehiculo({ id: editing.id, ...form })
        toast.success("Vehículo actualizado")
      } else {
        await createVehiculo(form)
        toast.success("Vehículo creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el vehículo")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteVehiculo(Number(id))
      await mutate()
      toast.success("Vehículo desactivado")
    } catch {
      toast.error("Error al eliminar el vehículo")
    }
  }

  function openQuickTipo() {
    setQuickTipoForm(EMPTY_TIPO)
    resetTipoErrors()
    setQuickTipoOpen(true)
  }

  async function handleSaveQuickTipo() {
    if (!validateTipo(quickTipoForm, {
      descripcion: [required("la descripción"), maxLengthValidator(DESCRIPCION_MAX)],
      pesoMinimo: [positiveNumber(), maxDigits(PESO_MINIMO_MAX_DIGITS)],
      pesoMaximo: [positiveNumber(), maxDigits(PESO_MAXIMO_MAX_DIGITS)],
    })) return
    if (
      quickTipoForm.pesoMinimo !== "" &&
      quickTipoForm.pesoMaximo !== "" &&
      Number(quickTipoForm.pesoMinimo) > Number(quickTipoForm.pesoMaximo)
    ) {
      toast.error("El peso mínimo no puede ser mayor al peso máximo")
      return
    }
    try {
      const nuevo = await createTipo({
        descripcion: quickTipoForm.descripcion.trim(),
        pesoMinimo: quickTipoForm.pesoMinimo !== "" ? Number(quickTipoForm.pesoMinimo) : undefined,
        pesoMaximo: quickTipoForm.pesoMaximo !== "" ? Number(quickTipoForm.pesoMaximo) : undefined,
      })
      await mutateTipos()
      if (nuevo) set("tipoVehiculoId", nuevo.id)
      toast.success("Tipo de vehículo creado")
      setQuickTipoOpen(false)
    } catch {
      toast.error("Error al crear el tipo de vehículo")
    }
  }

  const canSaveQuickTipo = !!quickTipoForm.descripcion.trim()

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por patente, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo vehículo
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={vehiculoColumns}
        isLoading={isLoading}
        loadingText="Cargando vehículos..."
        emptyText="No hay vehículos registrados."
        emptySearchText="No se encontraron vehículos con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver vehículo" : editing ? "Editar vehículo" : "Nuevo vehículo"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de ${editing.patente}.`
            : "Completá los datos del nuevo vehículo."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear vehículo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Patente</label>
          <Input
            value={form.patente}
            onChange={(e) => set("patente", e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={20}
            className={cn(errors.patente && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.patente}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Marca</label>
          <Input
            value={form.marca}
            onChange={(e) => set("marca", e.target.value)}
            placeholder="Ford"
            maxLength={50}
            className={cn(errors.marca && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.marca}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Modelo</label>
          <Input
            value={form.modelo}
            onChange={(e) => set("modelo", e.target.value)}
            placeholder="F-100"
            maxLength={50}
            className={cn(errors.modelo && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.modelo}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de vehículo</label>
          <div className="flex gap-2">
            <select
              value={form.tipoVehiculoId}
              onChange={(e) => set("tipoVehiculoId", Number(e.target.value))}
              className={cn(
                "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                errors.tipoVehiculoId ? "border-destructive" : "border-input",
              )}
            >
              <option value={0}>— Seleccionar tipo —</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.descripcion}
                </option>
              ))}
            </select>
            {!isViewing && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="No está en la lista: crear nuevo tipo de vehículo"
                onClick={openQuickTipo}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FieldError>{errors.tipoVehiculoId}</FieldError>
        </div>
      </FormModal>

      {/* Alta rápida de tipo de vehículo */}
      <FormModal
        open={quickTipoOpen}
        onOpenChange={setQuickTipoOpen}
        title="Nuevo tipo de vehículo"
        description="Cargá los datos del tipo para asociarlo al vehículo."
        onSave={handleSaveQuickTipo}
        isLoading={isCreatingTipo}
        saveDisabled={!canSaveQuickTipo}
        saveLabel="Crear tipo"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Descripción *</label>
          <Input
            value={quickTipoForm.descripcion}
            onChange={(e) => {
              setQuickTipoForm((f) => ({
                ...f,
                descripcion: enforceMaxLength(e.target.value, DESCRIPCION_MAX, "La descripción"),
              }))
              clearTipoError("descripcion")
            }}
            placeholder="Ej: Camión, Camioneta, Auto..."
            className={cn(tipoErrors.descripcion && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{tipoErrors.descripcion}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso mínimo (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            inputMode="decimal"
            placeholder="Ej: 10"
            value={quickTipoForm.pesoMinimo}
            onChange={(e) => {
              setQuickTipoForm((f) => ({
                ...f,
                pesoMinimo: enforceDecimalInput(e.target.value, PESO_MINIMO_MAX_DIGITS, "El peso mínimo"),
              }))
              clearTipoError("pesoMinimo")
            }}
            className={cn(tipoErrors.pesoMinimo && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{tipoErrors.pesoMinimo}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso máximo (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            inputMode="decimal"
            placeholder="Ej: 90"
            value={quickTipoForm.pesoMaximo}
            onChange={(e) => {
              setQuickTipoForm((f) => ({
                ...f,
                pesoMaximo: enforceDecimalInput(e.target.value, PESO_MAXIMO_MAX_DIGITS, "El peso máximo"),
              }))
              clearTipoError("pesoMaximo")
            }}
            className={cn(tipoErrors.pesoMaximo && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{tipoErrors.pesoMaximo}</FieldError>
        </div>
      </FormModal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tipos de Vehículo tab
// ---------------------------------------------------------------------------

const tipoVehiculoColumns: TableColumn<TipoVehiculo>[] = [
  {
    key: "descripcion",
    header: "Descripción",
    cell: (t) => <span className="font-medium">{t.descripcion}</span>,
  },
  {
    key: "pesoMinimo",
    header: "Peso mínimo (kg)",
    cell: (t) => (
      <span className="text-muted-foreground">
        {t.pesoMinimo ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "pesoMaximo",
    header: "Peso máximo (kg)",
    cell: (t) => (
      <span className="text-muted-foreground">
        {t.pesoMaximo ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

function TiposTab() {
  const { tipos, isLoading, mutate } = useTipoVehiculos()
  const { createTipo, isLoading: isCreating } = useCreateTipoVehiculo()
  const { updateTipo, isLoading: isUpdating } = useUpdateTipoVehiculo()
  const { deleteTipo, isLoading: isDeleting } = useDeleteTipoVehiculo()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_TIPO>()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoVehiculo | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_TIPO)

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_TIPO)
    reset()
    setModalOpen(true)
  }

  function openEdit(t: TipoVehiculo) {
    setIsViewing(false)
    setEditing(t)
    setForm({
      descripcion: t.descripcion,
      pesoMinimo: t.pesoMinimo != null ? String(t.pesoMinimo) : "",
      pesoMaximo: t.pesoMaximo != null ? String(t.pesoMaximo) : "",
    })
    reset()
    setModalOpen(true)
  }

  function openView(t: TipoVehiculo) {
    setIsViewing(true)
    setEditing(t)
    setForm({
      descripcion: t.descripcion,
      pesoMinimo: t.pesoMinimo != null ? String(t.pesoMinimo) : "",
      pesoMaximo: t.pesoMaximo != null ? String(t.pesoMaximo) : "",
    })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      descripcion: [required("la descripción"), maxLengthValidator(DESCRIPCION_MAX)],
      pesoMinimo: [positiveNumber(), maxDigits(PESO_MINIMO_MAX_DIGITS)],
      pesoMaximo: [positiveNumber(), maxDigits(PESO_MAXIMO_MAX_DIGITS)],
    })) return
    if (
      form.pesoMinimo !== "" &&
      form.pesoMaximo !== "" &&
      Number(form.pesoMinimo) > Number(form.pesoMaximo)
    ) {
      toast.error("El peso mínimo no puede ser mayor al peso máximo")
      return
    }
    try {
      const payload = {
        descripcion: form.descripcion.trim(),
        pesoMinimo: form.pesoMinimo !== "" ? Number(form.pesoMinimo) : undefined,
        pesoMaximo: form.pesoMaximo !== "" ? Number(form.pesoMaximo) : undefined,
      }
      if (editing) {
        await updateTipo({ id: editing.id, ...payload })
        toast.success("Tipo actualizado")
      } else {
        await createTipo(payload)
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

  const canSave = !!form.descripcion.trim()

  return (
    <>
      <div className="flex items-center">
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </Button>
      </div>

      <DataTable
        data={tipos}
        columns={tipoVehiculoColumns}
        isLoading={isLoading}
        loadingText="Cargando tipos..."
        emptyText="No hay tipos de vehículo registrados."
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver tipo de vehículo" : editing ? "Editar tipo" : "Nuevo tipo de vehículo"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá la descripción de "${editing.descripcion}".`
            : "Ingresá la descripción del nuevo tipo."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear tipo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Descripción *</label>
          <Input
            value={form.descripcion}
            onChange={(e) => {
              setForm((f) => ({ ...f, descripcion: enforceMaxLength(e.target.value, DESCRIPCION_MAX, "La descripción") }))
              clearError("descripcion")
            }}
            placeholder="Ej: Camión, Camioneta, Auto..."
            className={cn(errors.descripcion && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.descripcion}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso mínimo (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            inputMode="decimal"
            placeholder="Ej: 10"
            value={form.pesoMinimo}
            onChange={(e) => {
              setForm((f) => ({ ...f, pesoMinimo: enforceDecimalInput(e.target.value, PESO_MINIMO_MAX_DIGITS, "El peso mínimo") }))
              clearError("pesoMinimo")
            }}
            className={cn(errors.pesoMinimo && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.pesoMinimo}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso máximo (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            inputMode="decimal"
            placeholder="Ej: 90"
            value={form.pesoMaximo}
            onChange={(e) => {
              setForm((f) => ({ ...f, pesoMaximo: enforceDecimalInput(e.target.value, PESO_MAXIMO_MAX_DIGITS, "El peso máximo") }))
              clearError("pesoMaximo")
            }}
            className={cn(errors.pesoMaximo && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.pesoMaximo}</FieldError>
        </div>
      </FormModal>
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
