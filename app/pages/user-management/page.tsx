"use client"
import { Plus } from "lucide-react"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useUsuarios, useUpdateUsuario, useDeleteUsuario, useCreateUsuario } from "@/hooks/use-users"
import { useEmpleadosFull, useCreateEmpleado } from "@/hooks/use-employees"
import { useRoles } from "@/hooks/use-roles"
import { useDonantes, useUpdateDonante, useCreateDonante, useTipoDonantes } from "@/hooks/use-donantes"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect, minLength, onlyLetters, emailFormat, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX, tieneNumeroDeCalle } from "@/lib/utils/text-limit"
import {
  JURISDICCIONES,
  LARGO_CARGO,
  LARGO_NOMBRE_PERSONA,
  esOrganismoPublico,
  esPersonaJuridica,
  problemaDeNombre,
  unirResponsable,
} from "@/lib/organismo"
import type { Rol, Usuario } from "@/lib/type/user"
import type { Donante } from "@/lib/type/donante"
import Title from "@/components/ui/title"
import { openCreate, openEdit, openView, set, filterBySearch } from "@/lib/utils/utils-modal"

const ROL_STYLES: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  supervisor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  tecnico: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  operador: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

function RolBadge({ rol }: { rol: Rol }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        ROL_STYLES[rol.nombre] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      )}
    >
      {rol.nombre}
    </span>
  )
}

function AvatarInitials({ nombre }: { nombre: string }) {
  const initials = nombre
    .split(" ")
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
  apellido: "",
  nombre: "",
  email: "",
  password: "",
  rolId: "",
  empleadoId: "",
  donanteId: "",
}

const NOMBRE_MAX = DEFAULT_TEXT_MAX
const EMAIL_MAX = DEFAULT_TEXT_MAX
const PASSWORD_MAX = 12

const EMPTY_QUICK_EMPLEADO = { rolId: "", nombre: "", apellido: "", telefono: "", cargo: "" }
const EMPTY_QUICK_DONANTE = {
  tipoDonanteId: "",
  nombre: "",
  apellido: "",
  razonSocial: "",
  telefono: "",
  direccion: "",
  jurisdiccion: "",
  respApellido: "",
  respNombre: "",
  cargoResponsable: "",
}

const COLUMNS: TableColumn<Usuario>[] = [
  {
    key: "nombre",
    header: "Usuario",
    cell: (row) => (
      <div className="flex flex-wrap items-center gap-3">
        <AvatarInitials nombre={row.nombre} />
        <span className="font-medium">{row.nombre} {row.apellido}</span>
      </div>
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
      ) : (
        <span className="text-muted-foreground italic">Sin asociar</span>
      ),
  },
]

export default function UserManagementPage() {
  const { usuarios, isLoading, mutate } = useUsuarios()
  const { empleados, mutate: mutateEmpleados } = useEmpleadosFull()
  const { roles } = useRoles()
  const { donantes, mutate: mutateDonantes } = useDonantes()
  const { tipos: tiposDonante } = useTipoDonantes()
  const { updateUsuario, isLoading: isUpdating } = useUpdateUsuario()
  const { createUsuario, isLoading: isCreating } = useCreateUsuario()
  const { deleteUsuario, isLoading: isDeleting } = useDeleteUsuario()
  const { updateDonante } = useUpdateDonante()
  const { createEmpleado, isLoading: isCreatingEmpleado } = useCreateEmpleado()
  const { createDonante, isLoading: isCreatingDonante } = useCreateDonante()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()
  const {
    errors: empleadoErrors,
    validate: validateEmpleado,
    clearError: clearEmpleadoError,
    reset: resetEmpleadoErrors,
  } = useFormErrors<typeof EMPTY_QUICK_EMPLEADO>()
  const {
    errors: donanteErrors,
    validate: validateDonante,
    clearError: clearDonanteError,
    reset: resetDonanteErrors,
  } = useFormErrors<typeof EMPTY_QUICK_DONANTE>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [quickEmpleadoOpen, setQuickEmpleadoOpen] = useState(false)
  const [quickDonanteOpen, setQuickDonanteOpen] = useState(false)
  const [quickEmpleadoForm, setQuickEmpleadoForm] = useState(EMPTY_QUICK_EMPLEADO)
  const [quickDonanteForm, setQuickDonanteForm] = useState(EMPTY_QUICK_DONANTE)

  const quickTipo = tiposDonante.find((t) => String(t.id) === quickDonanteForm.tipoDonanteId)
  const quickEsJuridica = esPersonaJuridica(quickTipo)
  const quickEsOrganismo = esOrganismoPublico(quickTipo)
  const quickTipoElegido = !!quickDonanteForm.tipoDonanteId

  const isEdit = !!editingUser
  const isSaving = isUpdating || isCreating

  const selectedRol = roles.find((r) => String(r.id) === String(form.rolId))
  const esDonante = selectedRol?.nombre.toLowerCase() === "donante"

  function buildUserForm(user: Usuario) {
    const donanteVinculado = donantes.find(
      (d: Donante) => d.usuarioId != null && String(d.usuarioId) === String(user.id)
    )
    return {
      apellido: user.apellido ?? "",
      nombre: user.nombre,
      email: user.email,
      password: "",
      rolId: String(user.rol.id),
      empleadoId: user.empleadoId ? String(user.empleadoId) : "",
      donanteId: donanteVinculado ? String(donanteVinculado.id) : "",
    }
  }

  useEffect(() => {
    if (editingUser) setForm(buildUserForm(editingUser))
  }, [editingUser, donantes])

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    set({ setFrom: setForm, fileds: key, value, clearError })
  }

  function handleNombreChange(value: string) {
    const filtered = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
    if (filtered !== value) {
      toast.error("Solamente se permiten letras", { toastId: "nombre-solo-letras" })
    }
    setField("nombre", enforceMaxLength(filtered, NOMBRE_MAX, "El nombre"))
  }

  function handleApellidoChange(value: string) {
    const filtered = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
    if (filtered !== value) {
      toast.error("Solamente se permiten letras", { toastId: "nombre-solo-letras" })
    }
    setField("apellido", enforceMaxLength(filtered, NOMBRE_MAX, "El apellido"))
  }

  function handleEmailChange(value: string) {
    setField("email", enforceMaxLength(value, EMAIL_MAX, "El email"))
  }

  function handlePasswordChange(value: string) {
    setField("password", enforceMaxLength(value, PASSWORD_MAX, "La contraseña"))
  }

  function handleRolChange(rolId: string) {
    setForm((f) => ({ ...f, rolId, empleadoId: "", donanteId: "" }))
    clearError("rolId")
    clearError("empleadoId")
    clearError("donanteId")
  }

  function setEmpleadoField<K extends keyof typeof EMPTY_QUICK_EMPLEADO>(key: K, value: string) {
    set({ setFrom: setQuickEmpleadoForm, fileds: key, value, clearError: clearEmpleadoError })
  }

  function setDonanteField<K extends keyof typeof EMPTY_QUICK_DONANTE>(key: K, value: string) {
    set({ setFrom: setQuickDonanteForm, fileds: key, value, clearError: clearDonanteError })
  }

  function handleQuickTipoChange(tipoDonanteId: string) {
    setQuickDonanteForm((f) => ({
      ...EMPTY_QUICK_DONANTE,
      tipoDonanteId,
      telefono: f.telefono,
      direccion: f.direccion,
    }))
    resetDonanteErrors()
  }

  function openQuickEmpleado() {
    setQuickEmpleadoForm({ ...EMPTY_QUICK_EMPLEADO, rolId: form.rolId })
    resetEmpleadoErrors()
    setQuickEmpleadoOpen(true)
  }

  function openQuickDonante() {
    setQuickDonanteForm(EMPTY_QUICK_DONANTE)
    resetDonanteErrors()
    setQuickDonanteOpen(true)
  }

  async function handleSaveQuickEmpleado() {
    if (!validateEmpleado(quickEmpleadoForm, {
      nombre: [required("el nombre"), onlyLetters(), maxLengthValidator(DEFAULT_TEXT_MAX)],
      apellido: [required("el apellido"), onlyLetters(), maxLengthValidator(DEFAULT_TEXT_MAX)],
      cargo: [maxLengthValidator(DEFAULT_TEXT_MAX)],
      rolId: [requiredSelect("un rol")],
    })) return

    try {
      const nuevo = await createEmpleado({
        rolId: Number(quickEmpleadoForm.rolId),
        nombre: quickEmpleadoForm.nombre.trim(),
        apellido: quickEmpleadoForm.apellido.trim(),
        telefono: quickEmpleadoForm.telefono.trim() || undefined,
        cargo: quickEmpleadoForm.cargo.trim() || undefined,
      })
      await mutateEmpleados()
      if (nuevo) setField("empleadoId", String(nuevo.id))
      toast.success("Empleado creado")
      setQuickEmpleadoOpen(false)
    } catch {
      toast.error("Error al crear el empleado")
    }
  }

  async function handleSaveQuickDonante() {
    const f = quickDonanteForm
    const personaValidator = (etiqueta: string, largo = LARGO_NOMBRE_PERSONA) => (v: unknown) =>
      problemaDeNombre(String(v ?? ""), etiqueta, largo)

    if (!validateDonante(f, {
      tipoDonanteId: [requiredSelect("un tipo de donante")],
      ...(quickEsJuridica
        ? {
            razonSocial: [
              required(quickEsOrganismo ? "el nombre del organismo" : "la razón social"),
              minLength(3),
              maxLengthValidator(DEFAULT_TEXT_MAX),
            ],
          }
        : {
            nombre: [personaValidator("el nombre")],
            apellido: [personaValidator("el apellido")],
          }),
      ...(quickEsOrganismo
        ? {
            jurisdiccion: [requiredSelect("la jurisdicción")],
            respApellido: [personaValidator("el apellido del responsable")],
            respNombre: [personaValidator("el nombre del responsable")],
            cargoResponsable: [required("el cargo del responsable"), maxLengthValidator(LARGO_CARGO)],
            telefono: [required("el teléfono del organismo")],
          }
        : {}),
      direccion: [
        required("la dirección"),
        minLength(5),
        (v: unknown) => (tieneNumeroDeCalle(String(v ?? "")) ? null : "Incluí la altura (número de la casa)"),
        maxLengthValidator(DEFAULT_TEXT_MAX),
      ],
    })) return

    const nombreEfectivo = quickEsJuridica ? f.razonSocial.trim() : `${f.nombre.trim()} ${f.apellido.trim()}`

    try {
      const nuevo = await createDonante({
        tipoDonanteId: Number(f.tipoDonanteId),
        nombre: nombreEfectivo,
        razonSocial: quickEsJuridica ? f.razonSocial.trim() : undefined,
        telefono: f.telefono.trim() || undefined,
        direccion: f.direccion.trim(),
        ...(quickEsOrganismo
          ? {
              jurisdiccion: f.jurisdiccion,
              responsable: unirResponsable(f.respApellido, f.respNombre),
              cargoResponsable: f.cargoResponsable.trim(),
            }
          : {}),
      })
      await mutateDonantes()
      if (nuevo) setField("donanteId", String(nuevo.id))
      toast.success("Donante creado")
      setQuickDonanteOpen(false)
    } catch {
      toast.error("Error al crear el donante")
    }
  }

  const modalSetters = {
    setIsViewing,
    setEditing: setEditingUser,
    setForm,
    reset,
    setModalOpen,
  }

  function handleModalChange(open: boolean) {
    if (!open) {
      setModalOpen(false)
      setEditingUser(null)
      reset()
    }
  }

  const filtered = filterBySearch(usuarios, search, ["nombre", "email"]) as Usuario[]

  const hasAsociado = esDonante ? !!form.donanteId : !!form.empleadoId
  const canSave = isEdit
    ? !!form.rolId && hasAsociado
    : !!form.apellido.trim() && !!form.nombre.trim() && !!form.email.trim() && form.password.length >= 6 && !!form.rolId && hasAsociado

  const canSaveQuickEmpleado =
    !!quickEmpleadoForm.nombre.trim() && !!quickEmpleadoForm.apellido.trim() && !!quickEmpleadoForm.rolId

  const canSaveQuickDonante = quickTipoElegido

  async function handleSave() {
    const ok = validate(form, {
      ...(!isEdit ? {
        apellido: [required("el apellido"), onlyLetters(), maxLengthValidator(NOMBRE_MAX)],
        nombre: [required("el nombre"), onlyLetters(), maxLengthValidator(NOMBRE_MAX)],
        email: [required("el email"), emailFormat(), maxLengthValidator(EMAIL_MAX)],
        password: [required("la contraseña"), minLength(6), maxLengthValidator(PASSWORD_MAX)],
      } : {}),
      rolId: [requiredSelect("un rol")],
      ...(form.rolId && esDonante ? { donanteId: [requiredSelect("un donante")] } : {}),
      ...(form.rolId && !esDonante ? { empleadoId: [requiredSelect("un empleado")] } : {}),
    })
    if (!ok) return

    try {
      if (isEdit && editingUser) {
        await updateUsuario({
          id: editingUser.id,
          rolId: Number(form.rolId),
          empleadoId: esDonante ? null : (form.empleadoId ? Number(form.empleadoId) : null),
        })
        if (esDonante && form.donanteId) {
          await updateDonante({ id: Number(form.donanteId), usuarioId: Number(editingUser.id) })
        }
        toast.success("Usuario actualizado correctamente")
      } else {
        const newUser = await createUsuario({
          apellido: form.apellido.trim(),
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rolId: Number(form.rolId),
          empleadoId: esDonante ? null : (form.empleadoId ? Number(form.empleadoId) : null),
        })
        if (esDonante && form.donanteId && newUser) {
          await updateDonante({ id: Number(form.donanteId), usuarioId: Number(newUser.id) })
        }
        toast.success("Usuario creado correctamente")
      }
      await mutate()
      setModalOpen(false)
      setEditingUser(null)
    } catch (error: any) {
      if (error.statusCode === 409) {
        toast.error("El email ya está registrado en otro usuario")
      } else {
        toast.error(isEdit ? "Error al actualizar el usuario" : "Error al crear el usuario")
      }
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
      <Title
      titlePage="Gestión de Usuarios"
      description=" Administrá los usuarios del sistema, sus roles y su vinculación con empleados."
      search={search}
      setSearch={setSearch}
      filtered={filtered}
      openCreate={() => openCreate({ ...modalSetters, EMPTY_FORM })}
      ></Title>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando usuarios..."
        emptyText="No hay usuarios registrados."
        emptySearchText="No se encontraron usuarios con ese criterio."
        search={search}
        onView={(user) =>  openView({ ...modalSetters, t: user, jsonEntidad: buildUserForm(user) })}
        onEdit={(user) =>  openEdit({ ...modalSetters, t: user, jsonEntidad: buildUserForm(user) })}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={handleModalChange}
        title={isViewing ? "Ver usuario" : isEdit ? "Editar usuario" : "Nuevo usuario"}
        readOnly={isViewing}
        description={
          isEdit
            ? `Modificá el rol y el empleado asociado de ${editingUser?.nombre}.`
            : "Completá los datos para crear un nuevo usuario."
        }
        onSave={handleSave}
        isLoading={isSaving}
        saveDisabled={!canSave}
        saveLabel={isEdit ? "Guardar cambios" : "Crear usuario"}
      >
        {/* Campos solo en creación */}
        {!isEdit && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Apellido *</label>
              <Input
                value={form.apellido}
                onChange={(e) => handleApellidoChange(e.target.value)}
                placeholder="García"
                className={cn(errors.apellido && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.apellido}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Juan"
                className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.nombre}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="juan@ejemplo.com"
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.email}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Contraseña *{" "}
                <span className="text-muted-foreground font-normal">(6 a {PASSWORD_MAX} caracteres)</span>
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.password}</FieldError>
            </div>
          </>
        )}

        {/* Email de solo lectura en edición */}
        {isEdit && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{editingUser?.email}</p>
          </div>
        )}

        {/* Rol */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Rol *</label>
          <select
            value={form.rolId}
            onChange={(e) => handleRolChange(e.target.value)}
            disabled={isViewing}
            className={SELECT_CLASS(!!errors.rolId)}
          >
            <option value=""> Seleccionar rol </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}
              </option>
            ))}
          </select>
          <FieldError>{errors.rolId}</FieldError>
        </div>
          {form.rolId && esDonante && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Donante *</label>
            <div className="flex gap-2">
              <select
                value={form.donanteId}
                onChange={(e) => setField("donanteId", e.target.value)}
                disabled={isViewing}
                className={SELECT_CLASS(!!errors.donanteId)}
              >
                <option value=""> Seleccionar donante </option>
                {donantes.map((d: Donante) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}{d.razonSocial ? `  ${d.razonSocial}` : ""}
                  </option>
                ))}
              </select>
              {!isViewing && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="No está en la lista: crear nuevo donante"
                  onClick={openQuickDonante}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FieldError>{errors.donanteId}</FieldError>
          </div>
        )}

        {form.rolId && !esDonante && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Empleado asociado *</label>
            <div className="flex gap-2">
              <select
                value={form.empleadoId}
                onChange={(e) => setField("empleadoId", e.target.value)}
                disabled={isViewing}
                className={SELECT_CLASS(!!errors.empleadoId)}
              >
                <option value=""> Seleccionar empleado </option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido}
                  </option>
                ))}
              </select>
              {!isViewing && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="No está en la lista: crear nuevo empleado"
                  onClick={openQuickEmpleado}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FieldError>{errors.empleadoId}</FieldError>
          </div>
        )}
      </FormModal>

      <FormModal
        open={quickEmpleadoOpen}
        onOpenChange={setQuickEmpleadoOpen}
        title="Nuevo empleado"
        description="Cargá los datos del empleado para asociarlo al usuario."
        onSave={handleSaveQuickEmpleado}
        isLoading={isCreatingEmpleado}
        saveDisabled={!canSaveQuickEmpleado}
        saveLabel="Crear empleado"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nombre *</label>
            <Input
              value={quickEmpleadoForm.nombre}
              onChange={(e) =>
                setEmpleadoField(
                  "nombre",
                  enforceMaxLength(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""), DEFAULT_TEXT_MAX, "El nombre"),
                )
              }
              placeholder="Juan"
              className={cn(empleadoErrors.nombre && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{empleadoErrors.nombre}</FieldError>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Apellido *</label>
            <Input
              value={quickEmpleadoForm.apellido}
              onChange={(e) =>
                setEmpleadoField(
                  "apellido",
                  enforceMaxLength(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""), DEFAULT_TEXT_MAX, "El apellido"),
                )
              }
              placeholder="Pérez"
              className={cn(empleadoErrors.apellido && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{empleadoErrors.apellido}</FieldError>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Rol *</label>
          <select
            value={quickEmpleadoForm.rolId}
            onChange={(e) => setEmpleadoField("rolId", e.target.value)}
            className={SELECT_CLASS(!!empleadoErrors.rolId)}
          >
            <option value=""> Seleccionar rol </option>
            {roles.filter((r) => r.nombre.toLowerCase() !== "donante").map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}
              </option>
            ))}
          </select>
          <FieldError>{empleadoErrors.rolId}</FieldError>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Cargo <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={quickEmpleadoForm.cargo}
            onChange={(e) => setEmpleadoField("cargo", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El cargo"))}
            placeholder="Técnico IT"
          />
          <FieldError>{empleadoErrors.cargo}</FieldError>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={quickEmpleadoForm.telefono}
            onChange={(e) => setEmpleadoField("telefono", e.target.value.replace(/\D/g, ""))}
            placeholder="5491112345678"
            inputMode="numeric"
            maxLength={20}
          />
        </div>
      </FormModal>

      <FormModal
        open={quickDonanteOpen}
        onOpenChange={setQuickDonanteOpen}
        title="Nuevo donante"
        description="Cargá los datos del donante para asociarlo al usuario."
        onSave={handleSaveQuickDonante}
        isLoading={isCreatingDonante}
        saveDisabled={!canSaveQuickDonante}
        saveLabel="Crear donante"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Tipo de donante *</label>
          <select
            value={quickDonanteForm.tipoDonanteId}
            onChange={(e) => handleQuickTipoChange(e.target.value)}
            className={SELECT_CLASS(!!donanteErrors.tipoDonanteId)}
          >
            <option value=""> Seleccionar tipo </option>
            {tiposDonante.map((t) => (
              <option key={t.id} value={t.id}>{t.descripcion}</option>
            ))}
          </select>
          <FieldError>{donanteErrors.tipoDonanteId}</FieldError>
        </div>

        {quickTipoElegido && quickEsJuridica && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {quickEsOrganismo ? "Nombre del organismo *" : "Razón social *"}
            </label>
            <Input
              value={quickDonanteForm.razonSocial}
              onChange={(e) => setDonanteField("razonSocial", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, quickEsOrganismo ? "El nombre del organismo" : "La razón social"))}
              placeholder={quickEsOrganismo ? "Ministerio de Ambiente" : "Empresa S.A."}
              className={cn(donanteErrors.razonSocial && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{donanteErrors.razonSocial}</FieldError>
          </div>
        )}

        {quickTipoElegido && quickEsOrganismo && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Jurisdicción *</label>
              <select
                value={quickDonanteForm.jurisdiccion}
                onChange={(e) => setDonanteField("jurisdiccion", e.target.value)}
                className={SELECT_CLASS(!!donanteErrors.jurisdiccion)}
              >
                <option value=""> Seleccionar jurisdicción </option>
                {JURISDICCIONES.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              <FieldError>{donanteErrors.jurisdiccion}</FieldError>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Apellido del responsable *</label>
                <Input
                  value={quickDonanteForm.respApellido}
                  onChange={(e) => setDonanteField("respApellido", e.target.value)}
                  placeholder="Gómez"
                  maxLength={LARGO_NOMBRE_PERSONA}
                  className={cn(donanteErrors.respApellido && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError>{donanteErrors.respApellido}</FieldError>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Nombre del responsable *</label>
                <Input
                  value={quickDonanteForm.respNombre}
                  onChange={(e) => setDonanteField("respNombre", e.target.value)}
                  placeholder="Laura"
                  maxLength={LARGO_NOMBRE_PERSONA}
                  className={cn(donanteErrors.respNombre && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError>{donanteErrors.respNombre}</FieldError>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Cargo del responsable *</label>
              <Input
                value={quickDonanteForm.cargoResponsable}
                onChange={(e) => setDonanteField("cargoResponsable", e.target.value)}
                placeholder="Directora de Compras"
                maxLength={LARGO_CARGO}
                className={cn(donanteErrors.cargoResponsable && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{donanteErrors.cargoResponsable}</FieldError>
            </div>
          </>
        )}

        {quickTipoElegido && !quickEsJuridica && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={quickDonanteForm.nombre}
                onChange={(e) => setDonanteField("nombre", e.target.value)}
                placeholder="Juan"
                maxLength={LARGO_NOMBRE_PERSONA}
                className={cn(donanteErrors.nombre && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{donanteErrors.nombre}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Apellido *</label>
              <Input
                value={quickDonanteForm.apellido}
                onChange={(e) => setDonanteField("apellido", e.target.value)}
                placeholder="Pérez"
                maxLength={LARGO_NOMBRE_PERSONA}
                className={cn(donanteErrors.apellido && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{donanteErrors.apellido}</FieldError>
            </div>
          </div>
        )}

        {quickTipoElegido && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Dirección *</label>
              <Input
                value={quickDonanteForm.direccion}
                onChange={(e) => setDonanteField("direccion", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La dirección"))}
                placeholder="Av. Colón 1234, Córdoba"
                className={cn(donanteErrors.direccion && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{donanteErrors.direccion}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Teléfono{" "}
                {quickEsOrganismo ? "*" : <span className="text-muted-foreground font-normal">(opcional)</span>}
              </label>
              <Input
                value={quickDonanteForm.telefono}
                onChange={(e) => setDonanteField("telefono", e.target.value.replace(/\D/g, ""))}
                placeholder="5491112345678"
                inputMode="numeric"
                maxLength={20}
                className={cn(donanteErrors.telefono && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{donanteErrors.telefono}</FieldError>
            </div>
          </>
        )}
      </FormModal>
    </div>
  )
}
