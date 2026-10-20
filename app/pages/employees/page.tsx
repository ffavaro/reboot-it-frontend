"use client"
import { Plus, RotateCcw, UserRound } from "lucide-react"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CrearButton } from "@/components/ui/crear-button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useEmpleadosFull,
  useRoles,
  useCreateEmpleado,
  useUpdateEmpleado,
  useDeleteEmpleado,
  useReactivarEmpleado,
} from "@/hooks/use-employees"
import type { EstadoEmpleados } from "@/lib/api/empleados"
import { usePermisosPantalla } from "@/components/permisos-pantalla"
import { getUser } from "@/lib/auth-utils"
import { uploadFoto } from "@/lib/api/client"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect, maxLength as maxLengthValidator, dniOCuit, notFutureDate, emailFormat, minLength } from "@/lib/form-validators"
import { CuitDniField, DireccionField, FechaAltaField, DIRECCION_MAX } from "@/components/empleado-fields"
import { formatFechaISO, getErrorMessage, todayISO } from "@/lib/utils/helpers"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Empleado } from "@/lib/type/user"
import type { TableColumn } from "@/components/ui/data-table"
import { useUsuarios } from "@/hooks/use-users"

// Límites del usuario que se crea junto con el empleado
const EMAIL_MAX = 100
const PASSWORD_MIN = 6
const PASSWORD_MAX = 12

const EMPTY_FORM = {
  rolId: 0,
  nombre: "",
  apellido: "",
  cuitDni: "",
  fechaAlta: "",
  direccion: "",
  telefono: "",
  cargo: "",
  tieneCarnet: false,
  email: "",
  password: "",
}

function AvatarInitials({ nombre, apellido }: { nombre: string; apellido: string }) {
  const initials = `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      {initials}
    </div>
  )
}

function buildColumns(onReactivar?: (e: Empleado) => void): TableColumn<Empleado>[] {
  return [
  {
    key: "nombre",
    header: "Empleado",
    cell: (emp) => (
      <div className="flex flex-wrap items-center gap-3">
        <AvatarInitials nombre={emp.nombre} apellido={emp.apellido} />
        <span className="font-medium">{emp.nombre} {emp.apellido}</span>
        {!emp.isActive && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">Desactivado</span>
        )}
      </div>
    ),
  },
  {
    key: "cuitDni",
    header: "CUIT / DNI",
    cell: (emp) => (
      <span className="font-mono text-xs text-muted-foreground">
        {emp.cuitDni ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "fechaAlta",
    header: "Fecha de alta",
    cell: (emp) => (
      <span className="text-muted-foreground tabular-nums">
        {formatFechaISO(emp.fechaAlta) ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "cargo",
    header: "Cargo",
    cell: (emp) => (
      <span className="text-muted-foreground">
        {emp.cargo ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "rol",
    header: "Rol",
    cell: (emp) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {emp.rol?.nombre ?? "—"}
      </span>
    ),
  },
  {
    key: "telefono",
    header: "Teléfono",
    cell: (emp) => (
      <span className="text-muted-foreground">
        {emp.telefono ?? <span className="italic">—</span>}
      </span>
    ),
  },
  ...(onReactivar ? [{
    key: "reactivar",
    header: "",
    cell: (emp: Empleado) => emp.isActive ? null : (
      <Button variant="outline" size="sm" onClick={() => onReactivar(emp)}>
        <RotateCcw className="h-3.5 w-3.5" />
        Reactivar
      </Button>
    ),
  }] : []),
  ]
}

export default function EmployeePage() {
  const [estado, setEstado] = useState<EstadoEmpleados>("activos")
  const { empleados, isLoading, mutate } = useEmpleadosFull(estado)
  const { reactivarEmpleado } = useReactivarEmpleado()
  const permisosPantalla = usePermisosPantalla()
  // Desactivar, reactivar, ver desactivados y cambiar el rol son exclusivos del SysAdmin
  const puedeDesactivar = permisosPantalla.puede("baja")
  const esAdmin = (getUser()?.rol?.nombre ?? "").trim().toLowerCase() === "admin"
  const { usuarios } = useUsuarios()
  const { roles } = useRoles()
  const { createEmpleado, isLoading: isCreating } = useCreateEmpleado()
  const { updateEmpleado, isLoading: isUpdating } = useUpdateEmpleado()
  const { deleteEmpleado, isLoading: isDeleting } = useDeleteEmpleado()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Empleado | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  // Foto tipo carnet (opcional): archivo elegido y su vista previa
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  useEffect(() => {
    if (!fotoFile) return
    const url = URL.createObjectURL(fotoFile)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [fotoFile])

  function elegirFoto(file: File | undefined) {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("La foto debe ser una imagen JPG, PNG o WEBP")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La foto no puede superar los 5 MB")
      return
    }
    setFotoFile(file)
  }

  async function handleReactivar(e: Empleado) {
    try {
      await reactivarEmpleado(e.id)
      await mutate()
      toast.success("Empleado reactivado")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo reactivar el empleado"))
    }
  }

  const columns = buildColumns(puedeDesactivar ? handleReactivar : undefined)

  const filtered = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.apellido.toLowerCase().includes(search.toLowerCase()) ||
      (e.cargo ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.cuitDni ?? "").includes(search.trim()),
  )

  function set(field: keyof typeof EMPTY_FORM, value: string | number | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
    clearError(field)
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm({ ...EMPTY_FORM, fechaAlta: todayISO() })
    setFotoFile(null)
    setFotoPreview(null)
    reset()
    setModalOpen(true)
  }

  function openEdit(e: Empleado) {
    setIsViewing(false)
    setEditing(e)
    setFotoFile(null)
    setFotoPreview(null)
    setForm({
      rolId: e.rolId,
      nombre: e.nombre,
      apellido: e.apellido,
      cuitDni: e.cuitDni ?? "",
      fechaAlta: e.fechaAlta ? e.fechaAlta.slice(0, 10) : "",
      direccion: e.direccion ?? "",
      telefono: e.telefono ?? "",
      cargo: e.cargo ?? "",
      tieneCarnet: !!e.tieneCarnet,
      email: "",
      password: "",
    })
    reset()
    setModalOpen(true)
  }

  function openView(e: Empleado) {
    setIsViewing(true)
    setEditing(e)
    setFotoFile(null)
    setFotoPreview(null)
    setForm({
      rolId: e.rolId,
      nombre: e.nombre,
      apellido: e.apellido,
      cuitDni: e.cuitDni ?? "",
      fechaAlta: e.fechaAlta ? e.fechaAlta.slice(0, 10) : "",
      direccion: e.direccion ?? "",
      telefono: e.telefono ?? "",
      cargo: e.cargo ?? "",
      tieneCarnet: !!e.tieneCarnet,
      email: "",
      password: "",
    })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      nombre: [required("el nombre"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      apellido: [required("el apellido"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      rolId: [requiredSelect("un rol")],
      cargo: [maxLengthValidator(DEFAULT_TEXT_MAX)],
      cuitDni: [required("el CUIT/DNI"), dniOCuit()],
      fechaAlta: [required("la fecha de alta"), notFutureDate("La fecha de alta")],
      direccion: [required("la dirección"), maxLengthValidator(DIRECCION_MAX)],
      telefono: [required("el teléfono"), minLength(6)],
      // el usuario se crea junto con el empleado, así que email y contraseña solo se piden al crear
      ...(!editing ? {
        email: [required("el email"), emailFormat(), maxLengthValidator(EMAIL_MAX)],
        password: [required("la contraseña"), minLength(PASSWORD_MIN), maxLengthValidator(PASSWORD_MAX)],
      } : {}),
    })) return
    try {
      const fotoUrl = fotoFile ? await uploadFoto(fotoFile) : editing?.fotoUrl ?? undefined
      const payload = {
        tieneCarnet: form.tieneCarnet,
        ...(fotoUrl ? { fotoUrl } : {}),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        cuitDni: form.cuitDni,
        fechaAlta: form.fechaAlta,
        direccion: form.direccion.trim(),
        telefono: form.telefono.trim(),
        cargo: form.cargo.trim() || undefined,
      }
      if (editing) {
        // al editar, solo el SysAdmin envía el rol (cambiarlo es exclusivo suyo)
        await updateEmpleado({ id: editing.id, ...payload, ...(esAdmin ? { rolId: form.rolId } : {}) })
        toast.success("Empleado actualizado")
      } else {
        await createEmpleado({ ...payload, rolId: form.rolId, email: form.email.trim(), password: form.password })
        toast.success("Empleado creado")
      }
      await mutate()
      setModalOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al guardar el empleado"))
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteEmpleado(id as number)
      await mutate()
      toast.success("Empleado desactivado")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo desactivar el empleado"))
    }
  }

  // Usuario que quedó vinculado al empleado al crearlo (se muestra al ver o editar)
  const usuarioAsociado = editing ? usuarios.find((u) => String(u.empleadoId) === String(editing.id)) : undefined

  const canSave =
    !!form.nombre.trim() && !!form.apellido.trim() && form.rolId !== 0 &&
    !!form.cuitDni && !!form.fechaAlta && !!form.direccion.trim() && form.telefono.trim().length >= 6 &&
    (!!editing || (!!form.email.trim() && form.password.length >= PASSWORD_MIN))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Empleados</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los empleados registrados en el sistema.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre, apellido, DNI o cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} empleado{filtered.length !== 1 ? "s" : ""}
        </span>
        {puedeDesactivar && (
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoEmpleados)}
            className="h-9 rounded-4xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filtrar por estado"
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Desactivados</option>
            <option value="todos">Todos</option>
          </select>
        )}
        <CrearButton className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </CrearButton>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando empleados..."
        emptyText={estado === "inactivos" ? "No hay empleados desactivados." : "No hay empleados registrados."}
        emptySearchText="No se encontraron empleados."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        showEdit={(e) => e.isActive}
        showDelete={(e) => e.isActive}
        deleteTexts={{ accion: "Desactivar", pregunta: "¿Desactivar este empleado?", detalle: "No podrá iniciar sesión. Sus datos se conservan y podés reactivarlo cuando quieras.", enCurso: "Desactivando..." }}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver empleado" : "Gestionar empleado"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de ${editing.nombre} ${editing.apellido}.`
            : "Completá los datos del nuevo empleado."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear empleado"}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Columna izquierda — Datos personales */}
          <div className="flex flex-col gap-4">
            <h3 className="border-b border-border pb-1 text-sm font-semibold text-primary">Datos personales</h3>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Apellido *</label>
              <Input
                value={form.apellido}
                onChange={(e) => set("apellido", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El apellido"))}
                placeholder="Pérez"
                className={cn(errors.apellido && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.apellido}</FieldError>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={(e) => set("nombre", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"))}
                placeholder="Juan"
                className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.nombre}</FieldError>
            </div>

            <CuitDniField value={form.cuitDni} error={errors.cuitDni} onChange={set} />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Teléfono *</label>
              <Input
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value.replace(/\D/g, ""))}
                placeholder="5491112345678"
                inputMode="numeric"
                maxLength={20}
                className={cn(errors.telefono && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.telefono}</FieldError>
            </div>

            <DireccionField value={form.direccion} error={errors.direccion} onChange={set} />
          </div>

          {/* Columna derecha — Datos corporativos */}
          <div className="flex flex-col gap-4">
            <h3 className="border-b border-border pb-1 text-sm font-semibold text-primary">Datos corporativos</h3>

            {(!editing || isViewing || esAdmin) && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Rol *</label>
              <select
                value={form.rolId}
                onChange={(e) => set("rolId", Number(e.target.value))}
                className={cn(
                  "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                  errors.rolId ? "border-destructive" : "border-input",
                )}
              >
                <option value={0}>— Seleccionar rol —</option>
                {roles.filter((r) => r.nombre.toLowerCase() !== "donante" && (esAdmin || r.nombre.toLowerCase() !== "admin")).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <FieldError>{errors.rolId}</FieldError>
            </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Cargo <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                value={form.cargo}
                onChange={(e) => set("cargo", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El cargo"))}
                placeholder="Técnico IT"
              />
              <FieldError>{errors.cargo}</FieldError>
            </div>

            <label className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <input
                type="checkbox"
                checked={form.tieneCarnet}
                onChange={(e) => set("tieneCarnet", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                <span className="font-medium">Tiene carnet de conducir</span>
                <span className="block text-xs text-muted-foreground">Es necesario para poder asignarlo como transportista.</span>
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Foto tipo carnet <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
                  {fotoPreview ?? editing?.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(fotoPreview ?? editing?.fotoUrl) as string} alt="Foto del empleado" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                {!isViewing && (
                  <label className="cursor-pointer rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    {fotoPreview ?? editing?.fotoUrl ? "Cambiar foto" : "Elegir foto"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => elegirFoto(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </div>

            {/* Por defecto, la fecha del día en curso; se puede cambiar */}
            <FechaAltaField value={form.fechaAlta} error={errors.fechaAlta} onChange={set} />
          </div>
        </div>

        {/* Usuario con el que el empleado inicia sesión */}
        <div className="flex flex-col gap-4">
          <h3 className="border-b border-border pb-1 text-sm font-semibold text-primary">Usuario</h3>
          {editing ? (
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Usuario asociado</p>
              <p className="text-sm font-medium">
                {usuarioAsociado ? usuarioAsociado.email : <span className="italic font-normal text-muted-foreground">Sin usuario asociado</span>}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", enforceMaxLength(e.target.value, EMAIL_MAX, "El email"))}
                    placeholder="juan.perez@empresa.com"
                    className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
                  />
                  <FieldError>{errors.email}</FieldError>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Contraseña * <span className="text-muted-foreground font-normal">({PASSWORD_MIN} a {PASSWORD_MAX} caracteres)</span>
                  </label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", enforceMaxLength(e.target.value, PASSWORD_MAX, "La contraseña"))}
                    placeholder="••••••••"
                    className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
                  />
                  <FieldError>{errors.password}</FieldError>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Al crear el empleado se crea automáticamente su usuario, con su mismo nombre, apellido, CUIT/DNI y rol.
              </p>
            </>
          )}
        </div>
      </FormModal>
    </div>
  )
}
