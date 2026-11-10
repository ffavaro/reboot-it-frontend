"use client"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useEmpleadosTransportistas,
  useCreateEmpleadoTransportista,
  useUpdateEmpleadoTransportista,
  useDeleteEmpleadoTransportista,
} from "@/hooks/use-empleado-transportista"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useVehiculos, useTipoVehiculos } from "@/hooks/use-vehicles"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect } from "@/lib/form-validators"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Empleado } from "@/lib/type/user"
import type { Vehiculo } from "@/lib/type/vehicle"
import type { TableColumn } from "@/components/ui/data-table"
import Title from "@/components/ui/title"
import { filterBySearch, openCreate, openEdit, openView } from "@/lib/utils/utils-modal"
import { uploadFoto } from "@/lib/api/client"
import { situacionCarnet, textoCarnet } from "@/components/transportistas/estado-carnet"
import { EstadoCarnet } from "@/components/transportistas/estado-carnet"
import { CampoCarnet } from "@/components/transportistas/campo-carnet"
import { AvisoTransportistas } from "@/components/transportistas/aviso-transportistas"


const EMPTY_FORM = { empleadoId: "", vehiculoId: "", fechaAsignacion: "", carnetVencimiento: "" }

const COLUMNS: TableColumn<EmpleadoTransportista>[] = [
  {
    key: "empleado",
    header: "Empleado",
    cell: (t) =>
      t.empleado ? (
        <span className="font-medium">{t.empleado.nombre} {t.empleado.apellido}</span>
      ) : (
        <span className="italic text-muted-foreground"></span>
      ),
  },
  {
    key: "vehiculo",
    header: "Vehículo",
    cell: (t) =>
      t.vehiculo ? (
        <span className="text-muted-foreground">
          <span className="font-mono text-xs">{t.vehiculo.patente}</span>
          {" · "}
          {t.vehiculo.marca} {t.vehiculo.modelo}
        </span>
      ) : (
        <span className="italic text-muted-foreground">Sin vehículo</span>
      ),
  },
  {
    key: "fechaAsignacion",
    header: "Fecha asignación",
    cell: (t) =>
      t.fechaAsignacion ? (
        <span className="text-muted-foreground">
          {t.fechaAsignacion.slice(0, 10).split("-").reverse().join("/")}
        </span>
      ) : (
        <span className="italic text-muted-foreground">Sin fecha</span>
      ),
  },
  {
    key: "carnetVencimiento",
    header: "Carnet de conducir",
    cell: (t) => <EstadoCarnet ficha={t} />,
  },
]

const datosDelForm = (t: EmpleadoTransportista) => ({
  empleadoId: String(t.empleadoId),
  vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
  fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 10) : "",
  carnetVencimiento: t.carnetVencimiento ? t.carnetVencimiento.slice(0, 10) : "",
})

export default function EmpleadoTransportistaPage() {
  const { transportistas, isLoading, mutate } = useEmpleadosTransportistas()
  const { empleados: todosEmpleados } = useEmpleadosFull()
  const empleados = todosEmpleados.filter((e: Empleado) => {
    const rol = e.rol?.nombre?.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    return rol === "transportista"
  })
  const { vehiculos, mutate: mutateVehiculos } = useVehiculos()
  const { tipos } = useTipoVehiculos()
  const { createTransportista, isLoading: isCreating } = useCreateEmpleadoTransportista()
  const { updateTransportista, isLoading: isUpdating } = useUpdateEmpleadoTransportista()
  const { deleteTransportista, isLoading: isDeleting } = useDeleteEmpleadoTransportista()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmpleadoTransportista | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [carnetFile, setCarnetFile] = useState<File | null>(null)
  const [carnetError, setCarnetError] = useState("")
  const [subiendo, setSubiendo] = useState(false)

  const fichaPorEmpleado = useMemo(
    () => new Map(transportistas.map((t: EmpleadoTransportista) => [t.empleadoId, t])),
    [transportistas],
  )
  const sinFicha = empleados.filter((e: Empleado) => !fichaPorEmpleado.has(e.id)).length
  const conProblemas = transportistas.filter((t: EmpleadoTransportista) => situacionCarnet(t) !== "vigente").length

  const etiquetaEmpleado = (e: Empleado) => {
    const base = `${e.nombre} ${e.apellido}`
    const ficha = fichaPorEmpleado.get(e.id)
    if (!ficha) return `${base} · Sin ficha de transportista`
    return `${base} · ${textoCarnet(ficha)}`
  }

  const limpiarCarnet = () => {
    setCarnetFile(null)
    setCarnetError("")
    reset()
  }

  const filtered = filterBySearch(transportistas, search, ["nombre", "apellido", "pantente", "nombreCompleto"])

  const handleSave = async () => {
    const formOk = validate(form, {
      empleadoId: [requiredSelect("un empleado")],
      vehiculoId: [requiredSelect("un vehículo")],
      carnetVencimiento: [required("el vencimiento del carnet")],
    })
    const faltaFoto = !carnetFile && !editing?.carnetUrl
    if (faltaFoto) setCarnetError("Subí la foto del carnet de conducir")
    if (!formOk || faltaFoto || carnetError) return
    try {
      setSubiendo(true)
      const carnetUrl = carnetFile ? await uploadFoto(carnetFile) : editing?.carnetUrl ?? undefined
      const payload = {
        empleadoId: Number(form.empleadoId),
        vehiculoId: Number(form.vehiculoId),
        fechaAsignacion: form.fechaAsignacion || undefined,
        carnetUrl,
        carnetVencimiento: form.carnetVencimiento,
      }
      if (editing) {
        await updateTransportista({ id: editing.id, ...payload })
        toast.success("Empleado transportista actualizado")
      } else {
        await createTransportista(payload)
        toast.success("Empleado transportista creado")
      }
      await mutate()
      setModalOpen(false)
      limpiarCarnet()
    } catch {
      toast.error("Error al guardar el empleado transportista")
    } finally {
      setSubiendo(false)
    }
  }

  const handleDelete = async (id: number | string) => {
    try {
      await deleteTransportista(id as number)
      await mutate()
      toast.success("Empleado transportista desactivado")
    } catch {
      toast.error("Error al eliminar el empleado transportista")
    }
  }

  const canSave = !!form.empleadoId && !!form.vehiculoId && !!form.carnetVencimiento && (!!carnetFile || !!editing?.carnetUrl)

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Empleados Transportista"
        description="Administrá la asignación de empleados a vehículos de transporte."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({
          setIsViewing,
          setEditing,
          setForm,
          reset: limpiarCarnet,
          setModalOpen,
          EMPTY_FORM
        })}
      />

      <AvisoTransportistas sinFicha={sinFicha} conProblemas={conProblemas} />

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando transportistas..."
        emptyText="No hay empleados transportistas registrados."
        emptySearchText="No se encontraron transportistas con ese criterio."
        search={search}
        onView={(t) => openView({
          t: t,
          setIsViewing,
          setEditing,
          setForm,
          reset: limpiarCarnet,
          setModalOpen,
          jsonEntidad: datosDelForm(t),
        })}
        onEdit={(t) => openEdit({
          t: t,
          setIsViewing,
          setEditing,
          setForm,
          reset: limpiarCarnet,
          setModalOpen,
          jsonEntidad: datosDelForm(t),
        })}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => {
          if (open) return
          setModalOpen(false)
          limpiarCarnet()
        }}
        title={isViewing ? "Ver transportista" : editing ? "Editar transportista" : "Nuevo transportista"}
        readOnly={isViewing}
        description={
          editing
            ? "Modificá la asignación del empleado transportista."
            : "Asigná un empleado como transportista."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating || subiendo}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear transportista"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Empleado *</label>
          <select
            value={form.empleadoId}
            onChange={(e) => { setForm((f) => ({ ...f, empleadoId: e.target.value })); clearError("empleadoId") }}
            className={cn(
              "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              errors.empleadoId ? "border-destructive" : "border-input",
            )}
          >
            <option value="">Seleccionar empleado...</option>
            {empleados.map((e: Empleado) => (
              <option key={e.id} value={e.id}>
                {etiquetaEmpleado(e)}
              </option>
            ))}
          </select>
          <FieldError>{errors.empleadoId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Vehículo *</label>
          <div className="flex gap-2">
            <select
              value={form.vehiculoId}
              onChange={(e) => { setForm((f) => ({ ...f, vehiculoId: e.target.value })); clearError("vehiculoId") }}
              className={cn(
                "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                errors.vehiculoId ? "border-destructive" : "border-input",
              )}
            >
              <option value="">Seleccionar vehículo...</option>
              {vehiculos.map((v: Vehiculo) => (
                <option key={v.id} value={v.id}>
                  {v.patente}  {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          </div>
          <FieldError>{errors.vehiculoId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fecha de asignación</label>
          <DatePicker
            variant="field"
            value={form.fechaAsignacion}
            disabled={!editing}
            onChange={(v) => setForm((f) => ({ ...f, fechaAsignacion: v }))}
          />
        </div>

        <CampoCarnet
          vencimiento={form.carnetVencimiento}
          onVencimiento={(valor) => {
            setForm((f) => ({ ...f, carnetVencimiento: valor }))
            clearError("carnetVencimiento")
          }}
          errorVencimiento={errors.carnetVencimiento}
          fotoActual={editing?.carnetUrl ?? null}
          archivo={carnetFile}
          onArchivo={setCarnetFile}
          errorFoto={carnetError}
          onErrorFoto={setCarnetError}
          soloLectura={isViewing}
        />
      </FormModal>
    </div>
  )
}