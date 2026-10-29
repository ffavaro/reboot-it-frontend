"use client"
import { Plus } from "lucide-react"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectBuscador } from "@/components/ui/select-buscador"
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
import { required, requiredSelect, maxLength as maxLengthValidator, emailFormat, minLength, dniOCuit, soloLetras, direccionConAltura, telefonoArgentino } from "@/lib/form-validators"
import { CuitDniField } from "@/components/empleado-fields"
import { DireccionMapa } from "@/components/direccion-mapa"
import { isLegalEntity, isOrganismo, JURISDICCIONES } from "@/lib/donante-tipo"
import { RestablecerContrasenaDonante } from "@/components/restablecer-contrasena-donante"
import { getErrorMessage } from "@/lib/utils/helpers"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Donante, TipoDonante } from "@/lib/type/donante"

type Tab = "donantes" | "tipos"

// email, password y cuitDni son los datos del usuario que se crea junto con el donante (solo al crear)
// particular: apellido + nombre; empresa u organismo: razón social (organismo: además jurisdicción y responsable)
const EMPTY_DONANTE = {
  tipoDonanteId: 0, nombre: "", apellido: "", razonSocial: "", jurisdiccion: "", respApellido: "", respNombre: "", cargoResponsable: "",
  telefono: "", direccion: "", email: "", password: "", cuitDni: "",
}

const MAX_NOMBRE = 25

// El nombre se guarda como "Nombre Apellido": se separa por el último espacio, y al unirlo vuelve a quedar igual
function separarNombre(completo: string) {
  const i = completo.trim().lastIndexOf(" ")
  return i < 0 ? { nombre: completo.trim(), apellido: "" } : { nombre: completo.slice(0, i).trim(), apellido: completo.slice(i + 1).trim() }
}

// El responsable se guarda como "Apellido Nombre"
function separarResponsable(completo: string) {
  const i = completo.trim().indexOf(" ")
  return i < 0 ? { respApellido: completo.trim(), respNombre: "" } : { respApellido: completo.slice(0, i).trim(), respNombre: completo.slice(i + 1).trim() }
}

function formDe(d: Donante) {
  const legal = isLegalEntity(d.tipoDonante)
  return {
    ...EMPTY_DONANTE,
    tipoDonanteId: d.tipoDonanteId,
    ...(legal ? { razonSocial: d.razonSocial ?? d.nombre } : separarNombre(d.nombre)),
    jurisdiccion: d.jurisdiccion ?? "",
    ...separarResponsable(d.responsable ?? ""),
    cargoResponsable: d.cargoResponsable ?? "",
    telefono: d.telefono ?? "",
    direccion: d.direccion ?? "",
  }
}

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

  const [fDonante, setFDonante] = useState("")
  const opcionesDonante = useMemo(
    () => [
      { value: "", label: "Todos los donantes" },
      ...[...donantes]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
        .map((d) => ({ value: String(d.id), label: d.nombre })),
    ],
    [donantes],
  )

  const filtered = donantes.filter(
    (d) =>
      (fTipo === null || d.tipoDonante?.descripcion === fTipo) &&
      (!fDonante || String(d.id) === fDonante) &&
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
    setForm(formDe(d))
    reset()
    setModalOpen(true)
  }

  function openView(d: Donante) {
    setIsViewing(true)
    setEditing(d)
    setForm(formDe(d))
    reset()
    setModalOpen(true)
  }

  const tipoElegido = tipos.find((t) => t.id === form.tipoDonanteId)
  const esLegal = isLegalEntity(tipoElegido)
  const esOrganismo = isOrganismo(tipoElegido)

  async function handleSave() {
    if (!validate(form, {
      tipoDonanteId: [requiredSelect("un tipo de donante")],
      ...(esLegal ? {
        razonSocial: [required(esOrganismo ? "el nombre del organismo" : "la razón social"), minLength(3), maxLengthValidator(DEFAULT_TEXT_MAX)],
      } : {
        nombre: [required("el nombre"), soloLetras("El nombre", MAX_NOMBRE)],
        // los donantes que ya existían pueden tener un solo nombre, por eso el apellido solo se exige al crear
        apellido: [...(editing ? [] : [required("el apellido")]), soloLetras("El apellido", MAX_NOMBRE)],
      }),
      ...(esOrganismo ? {
        jurisdiccion: [requiredSelect("la jurisdicción")],
        respApellido: [required("el apellido del responsable"), soloLetras("El apellido", MAX_NOMBRE)],
        respNombre: [required("el nombre del responsable"), soloLetras("El nombre", MAX_NOMBRE)],
        cargoResponsable: [required("el cargo del responsable"), maxLengthValidator(DEFAULT_TEXT_MAX)],
        telefono: [required("el teléfono de contacto"), telefonoArgentino()],
      } : {}),
      direccion: [...(editing ? [] : [required("la dirección")]), maxLengthValidator(DEFAULT_TEXT_MAX), direccionConAltura()],
      ...(esOrganismo ? {} : { telefono: [telefonoArgentino()] }),
      // el usuario se crea junto con el donante, así que sus datos solo se piden al crear
      ...(!editing ? {
        email: [required("el email"), emailFormat(), maxLengthValidator(EMAIL_MAX)],
        password: [required("la contraseña"), minLength(PASSWORD_MIN), maxLengthValidator(PASSWORD_MAX)],
        cuitDni: [required(esOrganismo ? "el CUIT" : "el CUIT/DNI"), dniOCuit(), ...(esOrganismo ? [(v: unknown) => (String(v ?? "").length === 11 ? null : "El CUIT del organismo debe tener 11 dígitos")] : [])],
      } : {}),
    })) return
    try {
      const payload = {
        tipoDonanteId: form.tipoDonanteId,
        nombre: esLegal ? form.razonSocial.trim() : `${form.nombre.trim()} ${form.apellido.trim()}`.trim(),
        razonSocial: esLegal ? form.razonSocial.trim() : undefined,
        telefono: form.telefono.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
        ...(esOrganismo ? {
          jurisdiccion: form.jurisdiccion,
          responsable: `${form.respApellido.trim()} ${form.respNombre.trim()}`,
          cargoResponsable: form.cargoResponsable.trim(),
        } : {}),
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
    form.tipoDonanteId !== 0 &&
    (esLegal ? !!form.razonSocial.trim() : !!form.nombre.trim() && (!!editing || !!form.apellido.trim())) &&
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
        <Select value={fTipo ?? ""} onValueChange={(v) => setFTipo(v || null)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            {tipos.map((t: TipoDonante) => (
              <SelectItem key={t.id} value={t.descripcion}>{t.descripcion}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SelectBuscador
          className="w-60"
          opciones={opcionesDonante}
          value={fDonante}
          onChange={setFDonante}
          placeholder="Todos los donantes"
          placeholderBusqueda="Buscar donante…"
          aria-label="Filtrar por donante"
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
        filtros={[
          ...(fTipo !== null ? [{ etiqueta: "Tipo", valor: fTipo, quitar: () => setFTipo(null) }] : []),
          ...(fDonante ? [{ etiqueta: "Donante", valor: donantes.find((d) => String(d.id) === fDonante)?.nombre ?? `#${fDonante}`, quitar: () => setFDonante("") }] : []),
        ]}
        onLimpiar={() => { setFTipo(null); setFDonante("") }}
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

        {form.tipoDonanteId !== 0 && (esLegal ? (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{esOrganismo ? "Nombre del organismo *" : "Razón social *"}</label>
              <Input
                value={form.razonSocial}
                onChange={(e) => set("razonSocial", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, esOrganismo ? "El nombre del organismo" : "La razón social"))}
                placeholder={esOrganismo ? "Ministerio de Ambiente" : "Empresa S.A."}
                className={cn(errors.razonSocial && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.razonSocial}</FieldError>
            </div>

            {/* Datos propios del organismo público */}
            {esOrganismo && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Jurisdicción *</label>
                  <select
                    value={form.jurisdiccion}
                    onChange={(e) => set("jurisdiccion", e.target.value)}
                    className={selectCls(errors.jurisdiccion)}
                  >
                    <option value="">— Seleccionar jurisdicción —</option>
                    {JURISDICCIONES.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                  <FieldError>{errors.jurisdiccion}</FieldError>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Apellido del responsable *</label>
                    <Input
                      value={form.respApellido}
                      onChange={(e) => set("respApellido", enforceMaxLength(e.target.value, MAX_NOMBRE, "El apellido"))}
                      placeholder="Gómez"
                      className={cn(errors.respApellido && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldError>{errors.respApellido}</FieldError>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Nombre del responsable *</label>
                    <Input
                      value={form.respNombre}
                      onChange={(e) => set("respNombre", enforceMaxLength(e.target.value, MAX_NOMBRE, "El nombre"))}
                      placeholder="Laura"
                      className={cn(errors.respNombre && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldError>{errors.respNombre}</FieldError>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Cargo del responsable *</label>
                  <Input
                    value={form.cargoResponsable}
                    onChange={(e) => set("cargoResponsable", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El cargo"))}
                    placeholder="Directora de Compras"
                    className={cn(errors.cargoResponsable && "border-destructive focus-visible:ring-destructive")}
                  />
                  <FieldError>{errors.cargoResponsable}</FieldError>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Apellido{editing ? "" : " *"}</label>
              <Input
                value={form.apellido}
                onChange={(e) => set("apellido", enforceMaxLength(e.target.value, MAX_NOMBRE, "El apellido"))}
                placeholder="Pérez"
                className={cn(errors.apellido && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.apellido}</FieldError>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={(e) => set("nombre", enforceMaxLength(e.target.value, MAX_NOMBRE, "El nombre"))}
                placeholder="Juan"
                className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.nombre}</FieldError>
            </div>
          </div>
        ))}

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
          <label className="text-sm font-medium">
            Teléfono {esOrganismo ? "*" : <span className="text-muted-foreground font-normal">(opcional)</span>}
          </label>
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Dirección {editing ? <span className="text-muted-foreground font-normal">(opcional)</span> : "*"}
          </label>
          <DireccionMapa
            value={form.direccion}
            onChange={(v) => set("direccion", enforceMaxLength(v, DEFAULT_TEXT_MAX, "La dirección"))}
            placeholder="Av. Colón 1234, Córdoba"
            maxLength={DEFAULT_TEXT_MAX}
            disabled={isViewing}
            inputClassName={cn(errors.direccion && "border-destructive focus-visible:ring-destructive")}
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
