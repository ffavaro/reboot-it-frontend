"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CrearButton } from "@/components/ui/crear-button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useUsuarios, useUpdateUsuario, useDeleteUsuario, useCreateUsuario } from "@/hooks/use-users"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useRoles } from "@/hooks/use-roles"
import { useDonantes } from "@/hooks/use-donantes"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect, minLength, onlyLetters, emailFormat, maxLength as maxLengthValidator, dniOCuit } from "@/lib/form-validators"
import { CuitDniField } from "@/components/empleado-fields"
import { getErrorMessage } from "@/lib/utils/helpers"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import { EstadoBadge } from "@/components/ui/estado-badge"
import { ROL_COLORS, colorPorEstadoInsensible } from "@/lib/estado-colores"
import type { Rol, Usuario } from "@/lib/type/user"
import type { Donante } from "@/lib/type/donante"

function RolBadge({ rol }: { rol: Rol }) {
  return (
    <EstadoBadge
      texto={rol.nombre}
      capitalize
      colorClass={colorPorEstadoInsensible(ROL_COLORS, rol.nombre, "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")}
    />
  )
}

function AvatarInitials({ nombre }: { nombre: string }) {
  const initials = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      {initials}
    </div>
  )
}

const SELECT_CLASS = (hasError?: boolean) =>
  cn(
    "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50",
    hasError ? "border-destructive focus:ring-destructive" : "border-input"
  )

const EMPTY_FORM = {
  nombre: "",
  apellido: "",
  cuitDni: "",
  email: "",
  password: "",
  rolId: "",
  empleadoId: "",
}

const NOMBRE_MAX = DEFAULT_TEXT_MAX
const EMAIL_MAX = 100
const PASSWORD_MIN = 6
const PASSWORD_MAX = 12

const esRolDonante = (rol?: Rol | null) => rol?.nombre.toLowerCase() === "donante"

const nombreCompleto = (u: Pick<Usuario, "nombre" | "apellido">) => [u.nombre, u.apellido].filter(Boolean).join(" ")

function formDesdeUsuario(u: Usuario) {
  return {
    nombre: u.nombre,
    apellido: u.apellido ?? "",
    cuitDni: u.cuitDni ?? "",
    email: u.email,
    password: "",
    rolId: String(u.rol.id),
    empleadoId: u.empleadoId ? String(u.empleadoId) : "",
  }
}

const COLUMNS: TableColumn<Usuario>[] = [
  {
    key: "nombre",
    header: "Usuario",
    cell: (row) => (
      <div className="flex flex-wrap items-center gap-3">
        <AvatarInitials nombre={nombreCompleto(row)} />
        <span className="font-medium">{nombreCompleto(row)}</span>
      </div>
    ),
  },
  {
    key: "cuitDni",
    header: "CUIT / DNI",
    cell: (row) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.cuitDni ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "email",
    header: "Email",
    cell: (row) => <span className="text-muted-foreground">{row.email}</span>,
  },
  {
    key: "rol",
    header: "Rol",
    cell: (row) => <RolBadge rol={row.rol} />,
  },
  {
    key: "empleado",
    header: "Empleado asociado",
    cell: (row) =>
      row.empleado ? (
        <span>{row.empleado.nombre} {row.empleado.apellido}</span>
      ) : esRolDonante(row.rol) ? (
        <span className="text-muted-foreground italic">No aplica (donante)</span>
      ) : (
        <span className="text-muted-foreground italic">Sin asociar</span>
      ),
  },
]

export default function UserManagementPage() {
  const { usuarios, isLoading, mutate } = useUsuarios()
  const { empleados, mutate: mutateEmpleados } = useEmpleadosFull()
  const { roles } = useRoles()
  const { donantes } = useDonantes()
  const { updateUsuario, isLoading: isUpdating } = useUpdateUsuario()
  const { createUsuario, isLoading: isCreating } = useCreateUsuario()
  const { deleteUsuario, isLoading: isDeleting } = useDeleteUsuario()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const isEdit = !!editingUser
  const isSaving = isUpdating || isCreating
  // Los usuarios donantes se crean junto con su donante (pantalla Donantes): acá no cambian de rol ni de vínculo
  const esUsuarioDonante = esRolDonante(editingUser?.rol)

  // El rol Donante no se asigna desde esta pantalla
  const rolesAsignables = roles.filter((r) => r.nombre.toLowerCase() !== "donante")

  // Un empleado solo puede tener un usuario: se ofrecen los que todavía no tienen (más el actual, al editar)
  const empleadosConUsuario = new Set(usuarios.map((u) => String(u.empleadoId ?? "")).filter(Boolean))
  const empleadosDisponibles = empleados.filter(
    (emp) => !empleadosConUsuario.has(String(emp.id)) || String(emp.id) === String(editingUser?.empleadoId ?? ""),
  )

  const donanteVinculado: Donante | undefined = esUsuarioDonante
    ? donantes.find((d: Donante) => d.usuarioId != null && String(d.usuarioId) === String(editingUser?.id))
    : undefined

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    clearError(key)
  }

  function handleNombreChange(campo: "nombre" | "apellido", value: string) {
    const filtered = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
    if (filtered !== value) {
      toast.error("Solamente se permiten letras", { toastId: `${campo}-solo-letras` })
    }
    setField(campo, enforceMaxLength(filtered, NOMBRE_MAX, campo === "nombre" ? "El nombre" : "El apellido"))
  }

  // Al alta de un usuario para un empleado existente se completan sus datos (se pueden corregir)
  function handleEmpleadoChange(empleadoId: string) {
    const emp = empleados.find((e) => String(e.id) === empleadoId)
    if (!isEdit && emp) {
      setForm((f) => ({
        ...f,
        empleadoId,
        nombre: emp.nombre,
        apellido: emp.apellido,
        cuitDni: emp.cuitDni ?? f.cuitDni,
        rolId: String(emp.rolId),
      }))
      ;(["empleadoId", "nombre", "apellido", "cuitDni", "rolId"] as const).forEach(clearError)
      return
    }
    setField("empleadoId", empleadoId)
  }

  function openCreate() {
    setIsViewing(false)
    setEditingUser(null)
    setForm(EMPTY_FORM)
    reset()
    setModalOpen(true)
  }

  function openEdit(user: Usuario) {
    setIsViewing(false)
    reset()
    setForm(formDesdeUsuario(user))
    setEditingUser(user)
    setModalOpen(true)
  }

  function openView(user: Usuario) {
    setIsViewing(true)
    reset()
    setForm(formDesdeUsuario(user))
    setEditingUser(user)
    setModalOpen(true)
  }

  function handleModalChange(open: boolean) {
    if (!open) {
      setModalOpen(false)
      setEditingUser(null)
      reset()
    }
  }

  const filtered = usuarios.filter((u) => {
    const q = search.toLowerCase()
    return (
      nombreCompleto(u).toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.cuitDni ?? "").includes(search.trim())
    )
  })

  const canSave = isEdit
    ? !!form.nombre.trim() && (esUsuarioDonante || (!!form.rolId && !!form.empleadoId))
    : !!form.nombre.trim() && !!form.apellido.trim() && !!form.cuitDni && !!form.email.trim() &&
      form.password.length >= PASSWORD_MIN && !!form.rolId && !!form.empleadoId

  async function handleSave() {
    const ok = validate(form, {
      nombre: [required("el nombre"), onlyLetters(), maxLengthValidator(NOMBRE_MAX)],
      // al editar, los usuarios anteriores a este cambio pueden no tener apellido ni CUIT/DNI: se validan solo si se cargan
      apellido: [...(isEdit ? [] : [required("el apellido")]), onlyLetters(), maxLengthValidator(NOMBRE_MAX)],
      cuitDni: [...(isEdit ? [] : [required("el CUIT/DNI")]), dniOCuit()],
      ...(!isEdit ? {
        email: [required("el email"), emailFormat(), maxLengthValidator(EMAIL_MAX)],
        password: [required("la contraseña"), minLength(PASSWORD_MIN), maxLengthValidator(PASSWORD_MAX)],
      } : {}),
      ...(!esUsuarioDonante ? {
        rolId: [requiredSelect("un rol")],
        empleadoId: [requiredSelect("un empleado")],
      } : {}),
    })
    if (!ok) return

    const datosPersonales = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim() || undefined,
      cuitDni: form.cuitDni || undefined,
    }

    try {
      if (isEdit && editingUser) {
        await updateUsuario({
          id: editingUser.id,
          ...datosPersonales,
          ...(esUsuarioDonante ? {} : { rolId: Number(form.rolId), empleadoId: form.empleadoId ? Number(form.empleadoId) : null }),
        })
        toast.success("Usuario actualizado correctamente")
      } else {
        await createUsuario({
          ...datosPersonales,
          email: form.email.trim(),
          password: form.password,
          rolId: Number(form.rolId),
          empleadoId: form.empleadoId ? Number(form.empleadoId) : null,
        })
        toast.success("Usuario creado correctamente")
      }
      await Promise.all([mutate(), mutateEmpleados()])
      setModalOpen(false)
      setEditingUser(null)
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? "Error al actualizar el usuario" : "Error al crear el usuario"))
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteUsuario(String(id))
      await mutate()
      toast.success("Usuario eliminado")
    } catch {
      toast.error("Error al eliminar el usuario")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los usuarios del sistema, sus roles y su vinculación con empleados. Los usuarios de los
          empleados y de los donantes se crean automáticamente desde las pantallas Empleados y Donantes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre, email o CUIT/DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <CrearButton onClick={openCreate} className="ml-auto">
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </CrearButton>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando usuarios..."
        emptyText="No hay usuarios registrados."
        emptySearchText="No se encontraron usuarios con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={handleModalChange}
        title={isViewing ? "Ver usuario" : "Gestionar usuario"}
        readOnly={isViewing}
        description={
          isEdit
            ? `Modificá los datos${esUsuarioDonante ? "" : ", el rol y el empleado asociado"} de ${editingUser ? nombreCompleto(editingUser) : ""}.`
            : "Completá los datos para crear un usuario para un empleado que todavía no tiene uno."
        }
        onSave={handleSave}
        isLoading={isSaving}
        saveDisabled={!canSave}
        saveLabel={isEdit ? "Guardar cambios" : "Crear usuario"}
      >
        {/* Empleado asociado: primero, porque completa los datos personales */}
        {!esUsuarioDonante && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Empleado asociado *</label>
            <select
              value={form.empleadoId}
              onChange={(e) => handleEmpleadoChange(e.target.value)}
              disabled={isViewing}
              className={SELECT_CLASS(!!errors.empleadoId)}
            >
              <option value="">— Seleccionar empleado —</option>
              {empleadosDisponibles.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido}{emp.cuitDni ? ` - ${emp.cuitDni}` : ""}
                </option>
              ))}
            </select>
            <FieldError>{errors.empleadoId}</FieldError>
            {!isViewing && empleadosDisponibles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todos los empleados ya tienen usuario. Al crear un empleado desde la pantalla Empleados, su usuario se
                crea automáticamente.
              </p>
            )}
          </div>
        )}

        {/* Donante vinculado (solo usuarios donantes) */}
        {esUsuarioDonante && (
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Donante asociado</p>
            <p className="text-sm font-medium">
              {donanteVinculado ? donanteVinculado.nombre : <span className="italic font-normal text-muted-foreground">Sin donante asociado</span>}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Apellido{isEdit ? "" : " *"}</label>
            <Input
              value={form.apellido}
              onChange={(e) => handleNombreChange("apellido", e.target.value)}
              placeholder="García"
              className={cn(errors.apellido && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{errors.apellido}</FieldError>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nombre *</label>
            <Input
              value={form.nombre}
              onChange={(e) => handleNombreChange("nombre", e.target.value)}
              placeholder="Juan"
              className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{errors.nombre}</FieldError>
          </div>
        </div>

        <CuitDniField
          value={form.cuitDni}
          error={errors.cuitDni}
          requerido={!isEdit}
          onChange={(_, value) => setField("cuitDni", value)}
        />

        {/* Email y contraseña: solo al crear (el email es fijo y no hay cambio de contraseña desde acá) */}
        {isEdit ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{editingUser?.email}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", enforceMaxLength(e.target.value, EMAIL_MAX, "El email"))}
                placeholder="juan@ejemplo.com"
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.email}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Contraseña *{" "}
                <span className="text-muted-foreground font-normal">({PASSWORD_MIN} a {PASSWORD_MAX} caracteres)</span>
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setField("password", enforceMaxLength(e.target.value, PASSWORD_MAX, "La contraseña"))}
                placeholder="••••••••"
                className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.password}</FieldError>
            </div>
          </>
        )}

        {/* Rol: los usuarios donantes lo conservan; el rol Donante no se puede asignar desde acá */}
        {esUsuarioDonante ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Rol</p>
            <p className="text-sm font-medium">Donante</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Rol *</label>
            <select
              value={form.rolId}
              onChange={(e) => setField("rolId", e.target.value)}
              disabled={isViewing}
              className={SELECT_CLASS(!!errors.rolId)}
            >
              <option value="">— Seleccionar rol —</option>
              {rolesAsignables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}
                </option>
              ))}
            </select>
            <FieldError>{errors.rolId}</FieldError>
          </div>
        )}
      </FormModal>
    </div>
  )
}
