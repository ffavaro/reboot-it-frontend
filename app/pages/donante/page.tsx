"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CrearButton } from "@/components/ui/crear-button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { FiltrosActivos, columnasFiltrables } from "@/components/ui/filtros-activos"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useDonantes,
  useTipoDonantes,
  useCreateDonante,
  useUpdateDonante,
  useDeleteDonante,
  useCreateTipoDonante,
  useUpdateTipoDonante,
  useDeleteTipoDonante,
} from "@/hooks/use-donantes"
import { useUsuarios } from "@/hooks/use-users"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect, maxLength as maxLengthValidator, emailFormat, minLength, dniOCuit } from "@/lib/form-validators"
import { CuitDniField } from "@/components/empleado-fields"
import { RestablecerContrasenaDonante } from "@/components/restablecer-contrasena-donante"
import { getErrorMessage } from "@/lib/utils/helpers"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Donante, TipoDonante } from "@/lib/type/donante"

type Tab = "donantes" | "tipos"

// email, password y cuitDni son los datos del usuario que se crea junto con el donante (solo al crear)
const EMPTY_DONANTE = { tipoDonanteId: 0, nombre: "", razonSocial: "", telefono: "", direccion: "", email: "", password: "", cuitDni: "" }

const EMAIL_MAX = 100
const PASSWORD_MIN = 6
const PASSWORD_MAX = 12
const EMPTY_TIPO = { descripcion: "" }

// ---------------------------------------------------------------------------
// Donantes tab
// ---------------------------------------------------------------------------

const donanteColumns: TableColumn<Donante>[] = [
  {
    key: "tipo",
    header: "Tipo",
    cell: (d) => (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {d.tipoDonante?.descripcion ?? "—"}
      </span>
    ),
  },
  {
    key: "nombre",
    header: "Nombre",
    cell: (d) => <span className="font-medium">{d.nombre}</span>,
  },
  {
    key: "razonSocial",
    header: "Razón social",
    cell: (d) => (
      <span className="text-muted-foreground">
        {d.razonSocial ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "telefono",
    header: "Teléfono",
    cell: (d) => (
      <span className="text-muted-foreground">
        {d.telefono ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "direccion",
    header: "Dirección",
    className: "max-w-45 truncate",
    cell: (d) => (
      <span className="text-muted-foreground">
        {d.direccion ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

function DonantesTab() {
  const { donantes, isLoading, mutate } = useDonantes()
  const { tipos } = useTipoDonantes()
  const { usuarios } = useUsuarios()
  const { createDonante, isLoading: isCreating } = useCreateDonante()
  const { updateDonante, isLoading: isUpdating } = useUpdateDonante()
  const { deleteDonante, isLoading: isDeleting } = useDeleteDonante()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_DONANTE>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Donante | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_DONANTE)

  // Filtro que se activa tocando el Tipo en la grilla
  const [fTipo, setFTipo] = useState<string | null>(null)

  const filtered = donantes.filter(
    (d) =>
      (fTipo === null || d.tipoDonante?.descripcion === fTipo) &&
      (d.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (d.razonSocial ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (d.telefono ?? "").toLowerCase().includes(search.toLowerCase())),
  )

  function set(field: keyof typeof EMPTY_DONANTE, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
    clearError(field)
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_DONANTE)
    reset()
    setModalOpen(true)
  }

  function openEdit(d: Donante) {
    setIsViewing(false)
    setEditing(d)
    setForm({
      tipoDonanteId: d.tipoDonanteId,
      nombre: d.nombre,
      razonSocial: d.razonSocial ?? "",
      telefono: d.telefono ?? "",
      direccion: d.direccion ?? "",
      email: "",
      password: "",
      cuitDni: "",
    })
    reset()
    setModalOpen(true)
  }

  function openView(d: Donante) {
    setIsViewing(true)
    setEditing(d)
    setForm({
      tipoDonanteId: d.tipoDonanteId,
      nombre: d.nombre,
      razonSocial: d.razonSocial ?? "",
      telefono: d.telefono ?? "",
      direccion: d.direccion ?? "",
      email: "",
      password: "",
      cuitDni: "",
    })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      nombre: [required("el nombre"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      tipoDonanteId: [requiredSelect("un tipo de donante")],
      razonSocial: [maxLengthValidator(DEFAULT_TEXT_MAX)],
      direccion: [maxLengthValidator(DEFAULT_TEXT_MAX)],
      // el usuario se crea junto con el donante, así que sus datos solo se piden al crear
      ...(!editing ? {
        email: [required("el email"), emailFormat(), maxLengthValidator(EMAIL_MAX)],
        password: [required("la contraseña"), minLength(PASSWORD_MIN), maxLengthValidator(PASSWORD_MAX)],
        cuitDni: [required("el CUIT/DNI"), dniOCuit()],
      } : {}),
    })) return
    try {
      const payload = {
        tipoDonanteId: form.tipoDonanteId,
        nombre: form.nombre.trim(),
        razonSocial: form.razonSocial.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
      }
      if (editing) {
        await updateDonante({ id: editing.id, ...payload })
        toast.success("Donante actualizado")
      } else {
        await createDonante({
          ...payload,
          usuario: { email: form.email.trim(), password: form.password, cuitDni: form.cuitDni },
        })
        toast.success("Donante creado")
      }
      await mutate()
      setModalOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al guardar el donante"))
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteDonante(Number(id))
      await mutate()
      toast.success("Donante desactivado")
    } catch {
      toast.error("Error al eliminar el donante")
    }
  }

  const selectCls = (hasError?: string) => cn(
    "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
    hasError ? "border-destructive" : "border-input",
  )

  // Usuario vinculado al donante (se muestra al ver o editar un donante ya creado)
  const usuarioDonante = editing?.usuarioId ? usuarios.find((u) => String(u.id) === String(editing.usuarioId)) : undefined

  const canSave =
    !!form.nombre.trim() && form.tipoDonanteId !== 0 &&
    (!!editing || (!!form.email.trim() && form.password.length >= PASSWORD_MIN && !!form.cuitDni))

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre, razón social o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} donante{filtered.length !== 1 ? "s" : ""}
        </span>
        <CrearButton className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo donante
        </CrearButton>
      </div>

      <FiltrosActivos
        filtros={fTipo !== null ? [{ etiqueta: "Tipo", valor: fTipo, quitar: () => setFTipo(null) }] : []}
        onLimpiar={() => setFTipo(null)}
      />

      <DataTable
        data={filtered}
        columns={columnasFiltrables(donanteColumns, {
          tipo: { activo: (d) => fTipo !== null && fTipo === d.tipoDonante?.descripcion, alternar: (d) => setFTipo((v) => (v === (d.tipoDonante?.descripcion ?? null) ? null : d.tipoDonante?.descripcion ?? null)) },
        })}
        isLoading={isLoading}
        loadingText="Cargando donantes..."
        emptyText="No hay donantes registrados."
        emptySearchText="No se encontraron donantes con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver donante" : "Gestionar donante"}
        readOnly={isViewing}
        footerActions={editing && !isViewing ? <RestablecerContrasenaDonante donanteId={editing.id} nombre={editing.nombre} /> : undefined}
        description={
          editing
            ? `Modificá los datos de ${editing.nombre}.`
            : "Completá los datos del nuevo donante."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear donante"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={form.nombre}
            onChange={(e) => set("nombre", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"))}
            placeholder="Juan Pérez"
            className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.nombre}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Razón social <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.razonSocial}
            onChange={(e) => set("razonSocial", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La razón social"))}
            placeholder="Empresa S.A."
          />
          <FieldError>{errors.razonSocial}</FieldError>
        </div>

        {/* Usuario asociado: solo existe después de crear el donante */}
        {editing && (
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Usuario asociado</p>
            <p className="text-sm font-medium">
              {usuarioDonante ? (
                <>
                  {usuarioDonante.nombre}{usuarioDonante.apellido ? ` ${usuarioDonante.apellido}` : ""}{" "}
                  <span className="font-normal text-muted-foreground">({usuarioDonante.email})</span>
                </>
              ) : (
                <span className="italic font-normal text-muted-foreground">Sin usuario asociado</span>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de donante *</label>
          <select
            value={form.tipoDonanteId}
            onChange={(e) => set("tipoDonanteId", Number(e.target.value))}
            className={selectCls(errors.tipoDonanteId)}
          >
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descripcion}
              </option>
            ))}
          </select>
          <FieldError>{errors.tipoDonanteId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value.replace(/\D/g, ""))}
            placeholder="5491112345678"
            inputMode="numeric"
            maxLength={20}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Dirección <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.direccion}
            onChange={(e) => set("direccion", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La dirección"))}
            placeholder="Av. Corrientes 1234, CABA"
          />
          <FieldError>{errors.direccion}</FieldError>
        </div>

        {/* Datos del usuario que se crea junto con el donante */}
        {!editing && (
          <div className="flex flex-col gap-4">
            <h3 className="border-b border-border pb-1 text-sm font-semibold text-primary">Usuario de acceso</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", enforceMaxLength(e.target.value, EMAIL_MAX, "El email"))}
                  placeholder="donante@ejemplo.com"
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
            <CuitDniField value={form.cuitDni} error={errors.cuitDni} onChange={(_, value) => set("cuitDni", value)} />
            <p className="text-xs text-muted-foreground">
              Al crear el donante se crea automáticamente su usuario, con rol Donante, para que pueda iniciar sesión.
            </p>
          </div>
        )}
      </FormModal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tipos de donante tab
// ---------------------------------------------------------------------------

const tipoDonanteColumns: TableColumn<TipoDonante>[] = [
  {
    key: "descripcion",
    header: "Descripción",
    cell: (t) => <span className="font-medium">{t.descripcion}</span>,
  },
]

function TiposTab() {
  const { tipos, isLoading, mutate } = useTipoDonantes()
  const { createTipo, isLoading: isCreating } = useCreateTipoDonante()
  const { updateTipo, isLoading: isUpdating } = useUpdateTipoDonante()
  const { deleteTipo, isLoading: isDeleting } = useDeleteTipoDonante()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_TIPO>()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoDonante | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_TIPO)

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_TIPO)
    reset()
    setModalOpen(true)
  }

  function openEdit(t: TipoDonante) {
    setIsViewing(false)
    setEditing(t)
    setForm({ descripcion: t.descripcion })
    reset()
    setModalOpen(true)
  }

  function openView(t: TipoDonante) {
    setIsViewing(true)
    setEditing(t)
    setForm({ descripcion: t.descripcion })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, { descripcion: [required("la descripción"), maxLengthValidator(DEFAULT_TEXT_MAX)] })) return
    try {
      if (editing) {
        await updateTipo({ id: editing.id, ...form })
        toast.success("Tipo actualizado")
      } else {
        await createTipo(form)
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
        <CrearButton className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </CrearButton>
      </div>

      <DataTable
        data={tipos}
        columns={tipoDonanteColumns}
        isLoading={isLoading}
        loadingText="Cargando tipos..."
        emptyText="No hay tipos de donante registrados."
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver tipo de donante" : "Gestionar tipo de donante"}
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
              setForm({ descripcion: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción") })
              clearError("descripcion")
            }}
            placeholder="Ej: Persona física, Empresa..."
            className={cn(errors.descripcion && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.descripcion}</FieldError>
        </div>
      </FormModal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DonantePage() {
  const [activeTab, setActiveTab] = useState<Tab>("donantes")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Donantes</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los donantes del sistema y sus tipos.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {(["donantes", "tipos"] as Tab[]).map((tab) => (
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
            {tab === "donantes" ? "Donantes" : "Tipos de donante"}
          </button>
        ))}
      </div>

      {activeTab === "donantes" ? <DonantesTab /> : <TiposTab />}
    </div>
  )
}
