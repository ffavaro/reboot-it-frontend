"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { CrearButton } from "@/components/ui/crear-button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useMateriales,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useClasificarMaterial,
} from "@/hooks/use-material"
import { useLotes } from "@/hooks/use-lote"
import { useTipoMateriales, useCreateTipoMaterial } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { useTipos, useCreateTipo } from "@/hooks/use-tipo"
import { useMisPermisos } from "@/hooks/use-permisos"
import { puede, puedeVerPantalla } from "@/lib/nav"
import { FiltrosActivos, columnasFiltrables } from "@/components/ui/filtros-activos"
import { useMarcas, useCreateMarca } from "@/hooks/use-marca"
import { useModelos, useCreateModelo } from "@/hooks/use-modelo"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Material } from "@/lib/type/material"
import type { Lote } from "@/lib/type/lote"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"
import type { Tipo } from "@/lib/type/tipo"
import type { Marca } from "@/lib/type/marca"
import type { Modelo } from "@/lib/type/modelo"
import { CONDICION_MATERIAL, esCondicion, esCondicionSinClasificar } from "@/lib/constants/estados"

const EMPTY_FORM = { loteId: "", tipoMaterialId: "", condicionMaterialId: "", descripcion: "" }
const EMPTY_QUICK_TIPO = { nombre: "", descripcion: "" }
const EMPTY_QUICK_MODELO = { nombre: "", marcaId: "", tipoId: "" }
const TIPO_ALMACENAMIENTO = "almacenamiento"

const columns: TableColumn<Material>[] = [
  {
    key: "loteId",
    header: "Donación",
    cell: (m) =>
      m.lote?.donacionId != null
        ? <span className="font-mono text-xs">#{m.lote.donacionId}</span>
        : <span className="italic text-muted-foreground">—</span>,
  },
  {
    key: "tipoMaterial",
    header: "Tipo de material",
    cell: (m) =>
      m.tipoMaterial?.nombre ?? (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "condicion",
    header: "Condición",
    cell: (m) =>
      m.condicionMaterial?.condicion ? (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {m.condicionMaterial.condicion}
        </span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "descripcion",
    header: "Descripción",
    className: "max-w-[240px] truncate",
    cell: (m) => (
      <span className="text-muted-foreground">
        {m.descripcion ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function MaterialPage() {
  const { materiales, isLoading, mutate } = useMateriales()
  const { lotes } = useLotes()
  const { permisos } = useMisPermisos()
  const router = useRouter()
  const { tipoMateriales, mutate: mutateTipoMateriales } = useTipoMateriales()
  const { condiciones } = useCondicionesMaterial()
  const { tipos, mutate: mutateTipos } = useTipos()
  const { marcas, mutate: mutateMarcas } = useMarcas()
  const { modelos, mutate: mutateModelos } = useModelos()
  const { createTipo, isLoading: isCreatingTipoMedio } = useCreateTipo()
  const { createMarca, isLoading: isCreatingMarca } = useCreateMarca()
  const { createModelo, isLoading: isCreatingModelo } = useCreateModelo()
  const { createMaterial, isLoading: isCreating } = useCreateMaterial()
  const { updateMaterial } = useUpdateMaterial()
  const { deleteMaterial, isLoading: isDeleting } = useDeleteMaterial()
  const { clasificarMaterial, isLoading: isClasificando } = useClasificarMaterial()
  const { createTipoMaterial, isLoading: isCreatingTipo } = useCreateTipoMaterial()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [requiereDestruccion, setRequiereDestruccion] = useState<boolean>(false)
  const [destruccionTipoId, setDestruccionTipoId] = useState("")
  const [destruccionMarcaId, setDestruccionMarcaId] = useState("")
  const [destruccionModeloId, setDestruccionModeloId] = useState("")

  const [quickTipoOpen, setQuickTipoOpen] = useState(false)
  // Alta rápida de tipo, marca y modelo del medio de almacenamiento (solo quien tiene permiso de crear en esos catálogos)
  const [quickMedioOpen, setQuickMedioOpen] = useState<"tipo" | "marca" | "modelo" | null>(null)
  const [quickNombre, setQuickNombre] = useState("")
  const [quickModeloForm, setQuickModeloForm] = useState(EMPTY_QUICK_MODELO)
  const [quickTipoForm, setQuickTipoForm] = useState(EMPTY_QUICK_TIPO)

  // Filtra modelos según la marca seleccionada
  const modelosFiltrados = destruccionMarcaId
    ? modelos.filter((m: Modelo) => String(m.marcaId) === destruccionMarcaId)
    : modelos

  const puedeClasificar = puede(permisos, "materiales", "editar")
  const puedeVerProceso = puedeVerPantalla(permisos, "proceso_destruccion")
  const verProceso = (id: number) => router.push(`/pages/proceso-destruccion?proceso=${id}`)

  const columnasConClasificar: TableColumn<Material>[] = [
    ...columns,
    {
      key: "clasificacion",
      header: "Clasificación",
      cell: (m: Material) =>
        esCondicionSinClasificar(m.condicionMaterial?.condicion) ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Por clasificar</span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Clasificado</span>
        ),
    },
    {
      key: "procesoDestruccion",
      header: "Proceso de destrucción",
      cell: (m: Material) =>
        m.procesoDestruccion ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
              Sí{m.procesoDestruccion.estado ? ` · ${m.procesoDestruccion.estado}` : ""}
            </span>
            {puedeVerProceso && (
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); verProceso(m.procesoDestruccion!.id) }}>
                Ver proceso
              </Button>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
    },
    // Botón "Clasificar" en la grilla: abre directo el formulario de los materiales que todavía están "A definir"
    ...(puedeClasificar
      ? [{
          key: "clasificar",
          header: "",
          cell: (m: Material) =>
            esCondicionSinClasificar(m.condicionMaterial?.condicion) ? (
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={(e) => { e.stopPropagation(); openEdit(m) }}
              >
                Clasificar
              </Button>
            ) : null,
        }]
      : []),
  ]

  // Filtros que se activan tocando el valor en la grilla
  const [fTipo, setFTipo] = useState<string | null>(null)
  const [fCondicion, setFCondicion] = useState<string | null>(null)
  const [fProceso, setFProceso] = useState<"Sí" | "No" | null>(null)
  const [fClasif, setFClasif] = useState<"Clasificado" | "Por clasificar" | null>(null)
  const procesoDe = (m: Material) => (m.procesoDestruccion ? "Sí" : "No")
  const clasifDe = (m: Material) => (esCondicionSinClasificar(m.condicionMaterial?.condicion) ? "Por clasificar" : "Clasificado")

  // más recientes primero
  const filtered = materiales.filter((m: Material) => {
    if (fTipo !== null && m.tipoMaterial?.nombre !== fTipo) return false
    if (fCondicion !== null && m.condicionMaterial?.condicion !== fCondicion) return false
    if (fProceso !== null && procesoDe(m) !== fProceso) return false
    if (fClasif !== null && clasifDe(m) !== fClasif) return false
    const q = search.toLowerCase()
    const tipo = m.tipoMaterial?.nombre?.toLowerCase() ?? ""
    const condicion = m.condicionMaterial?.condicion?.toLowerCase() ?? ""
    return (
      String(m.lote?.donacionId ?? "").includes(q) ||
      tipo.includes(q) ||
      condicion.includes(q) ||
      (m.descripcion ?? "").toLowerCase().includes(q)
    )
  }).sort((a: Material, b: Material) => b.id - a.id)

  // Resuelve si el tipo seleccionado actualmente es "Almacenamiento"
  const tipoSeleccionado = tipoMateriales.find(
    (t: TipoMaterial) => String(t.id) === form.tipoMaterialId,
  )
  const esAlmacenamiento =
    tipoSeleccionado?.nombre?.toLowerCase() === TIPO_ALMACENAMIENTO

  // Condición por defecto de todo material nuevo: se define recién al clasificarlo
  const condicionADefinir = condiciones.find(
    (c: CondicionMaterial) => esCondicion(c.condicion, CONDICION_MATERIAL.A_DEFINIR),
  )

  function resetDestruccion() {
    setRequiereDestruccion(false)
    setDestruccionTipoId("")
    setDestruccionMarcaId("")
    setDestruccionModeloId("")
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      condicionMaterialId: condicionADefinir ? String(condicionADefinir.id) : "",
    })
    resetDestruccion()
    setModalOpen(true)
  }

  function openEdit(m: Material) {
    setIsViewing(false)
    setEditing(m)
    setForm({
      loteId: m.loteId ? String(m.loteId) : "",
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: m.condicionMaterialId
        ? String(m.condicionMaterialId)
        : condicionADefinir ? String(condicionADefinir.id) : "",
      descripcion: m.descripcion ?? "",
    })
    resetDestruccion()
    setModalOpen(true)
  }

  function openView(m: Material) {
    setIsViewing(true)
    setEditing(m)
    setForm({
      loteId: m.loteId ? String(m.loteId) : "",
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: m.condicionMaterialId
        ? String(m.condicionMaterialId)
        : condicionADefinir ? String(condicionADefinir.id) : "",
      descripcion: m.descripcion ?? "",
    })
    resetDestruccion()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }
    if (!form.tipoMaterialId) {
      toast.error("El tipo de material es obligatorio")
      return
    }
    if (esAlmacenamiento && requiereDestruccion) {
      if (!destruccionTipoId || !destruccionMarcaId || !destruccionModeloId) {
        toast.error("Para el proceso de destrucción debe seleccionar tipo, marca y modelo del medio de almacenamiento")
        return
      }
    }
    try {
      const payload = {
        loteId: form.loteId ? Number(form.loteId) : undefined,
        tipoMaterialId: Number(form.tipoMaterialId),
        condicionMaterialId: form.condicionMaterialId ? Number(form.condicionMaterialId) : undefined,
        descripcion: form.descripcion.trim(),
      }

      if (editing) {
        await updateMaterial({ id: editing.id, ...payload })
        // Si es almacenamiento con destrucción, crear medio + proceso después de actualizar
        if (esAlmacenamiento && requiereDestruccion && payload.condicionMaterialId) {
          await clasificarMaterial({
            id: editing.id,
            condicionMaterialId: payload.condicionMaterialId,
            requiereDestruccion: true,
            tipoId: destruccionTipoId ? Number(destruccionTipoId) : undefined,
            marcaId: destruccionMarcaId ? Number(destruccionMarcaId) : undefined,
            modeloId: destruccionModeloId ? Number(destruccionModeloId) : undefined,
          })
          toast.success("Material actualizado. Se creó el proceso de destrucción.")
        } else {
          toast.success("Material actualizado")
        }
      } else {
        const created = await createMaterial(payload)
        if (esAlmacenamiento && requiereDestruccion && created && payload.condicionMaterialId) {
          await clasificarMaterial({
            id: (created as Material).id,
            condicionMaterialId: payload.condicionMaterialId,
            requiereDestruccion: true,
            tipoId: destruccionTipoId ? Number(destruccionTipoId) : undefined,
            marcaId: destruccionMarcaId ? Number(destruccionMarcaId) : undefined,
            modeloId: destruccionModeloId ? Number(destruccionModeloId) : undefined,
          })
          toast.success("Material creado. Se creó el proceso de destrucción.")
        } else {
          toast.success("Material creado")
        }
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el material")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteMaterial(Number(id))
      await mutate()
      toast.success("Material desactivado")
    } catch {
      toast.error("Error al eliminar el material")
    }
  }

  function openQuickTipo() {
    setQuickTipoForm(EMPTY_QUICK_TIPO)
    setQuickTipoOpen(true)
  }

  function openQuickMedio(que: "tipo" | "marca" | "modelo") {
    setQuickNombre("")
    setQuickModeloForm({ nombre: "", marcaId: destruccionMarcaId, tipoId: destruccionTipoId })
    setQuickMedioOpen(que)
  }

  async function handleSaveQuickTipo() {
    if (!quickTipoForm.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      const nuevo = await createTipoMaterial({
        nombre: quickTipoForm.nombre.trim(),
        descripcion: quickTipoForm.descripcion.trim() || undefined,
      })
      await mutateTipoMateriales()
      if (nuevo) setForm((f) => ({ ...f, tipoMaterialId: String(nuevo.id) }))
      toast.success("Tipo de material creado")
      setQuickTipoOpen(false)
    } catch {
      toast.error("Error al crear el tipo de material")
    }
  }

  async function handleSaveQuickMedio() {
    try {
      if (quickMedioOpen === "tipo") {
        const nuevo = await createTipo({ nombre: quickNombre.trim() })
        await mutateTipos()
        if (nuevo) setDestruccionTipoId(String(nuevo.id))
        toast.success("Tipo creado")
      } else if (quickMedioOpen === "marca") {
        const nuevo = await createMarca({ nombre: quickNombre.trim() })
        await mutateMarcas()
        if (nuevo) { setDestruccionMarcaId(String(nuevo.id)); setDestruccionModeloId("") }
        toast.success("Marca creada")
      } else if (quickMedioOpen === "modelo") {
        const nuevo = await createModelo({
          nombre: quickModeloForm.nombre.trim(),
          marcaId: Number(quickModeloForm.marcaId),
          tipoId: Number(quickModeloForm.tipoId),
        })
        await mutateModelos()
        if (nuevo) {
          setDestruccionMarcaId(String(nuevo.marcaId))
          setDestruccionModeloId(String(nuevo.id))
        }
        toast.success("Modelo creado")
      }
      setQuickMedioOpen(null)
    } catch (err: any) {
      toast.error(err?.message ? String(Array.isArray(err.message) ? err.message[0] : err.message) : "No se pudo crear el registro")
    }
  }

  const canSaveQuickTipo = !!quickTipoForm.nombre.trim()
  const canSaveQuickMedio = quickMedioOpen === "modelo"
    ? !!quickModeloForm.nombre.trim() && !!quickModeloForm.marcaId && !!quickModeloForm.tipoId
    : !!quickNombre.trim()
  // El "+" aparece solo para quien puede crear en ese catálogo (Técnico, Administrativo y SysAdmin)
  const puedeCrearTipo = puede(permisos, "tipos", "crear")
  const puedeCrearMarca = puede(permisos, "marcas", "crear")
  const puedeCrearModelo = puede(permisos, "modelos", "crear")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los materiales registrados por donación.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por donación, tipo, condición o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} material{filtered.length !== 1 ? "es" : ""}
        </span>
        <CrearButton className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo material
        </CrearButton>
      </div>

      <FiltrosActivos
        filtros={[
          ...(fTipo !== null ? [{ etiqueta: "Tipo de material", valor: fTipo, quitar: () => setFTipo(null) }] : []),
          ...(fCondicion !== null ? [{ etiqueta: "Condición", valor: fCondicion, quitar: () => setFCondicion(null) }] : []),
          ...(fClasif !== null ? [{ etiqueta: "Clasificación", valor: fClasif, quitar: () => setFClasif(null) }] : []),
          ...(fProceso !== null ? [{ etiqueta: "Proceso de destrucción", valor: fProceso, quitar: () => setFProceso(null) }] : []),
        ]}
        onLimpiar={() => { setFTipo(null); setFCondicion(null); setFProceso(null); setFClasif(null) }}
      />

      <DataTable
        data={filtered}
        columns={columnasFiltrables(columnasConClasificar, {
          tipoMaterial: { activo: (m) => fTipo !== null && fTipo === m.tipoMaterial?.nombre, alternar: (m) => setFTipo((v) => (v === (m.tipoMaterial?.nombre ?? null) ? null : m.tipoMaterial?.nombre ?? null)) },
          condicion: { activo: (m) => fCondicion !== null && fCondicion === m.condicionMaterial?.condicion, alternar: (m) => setFCondicion((v) => (v === (m.condicionMaterial?.condicion ?? null) ? null : m.condicionMaterial?.condicion ?? null)) },
          clasificacion: { activo: (m) => fClasif === clasifDe(m), alternar: (m) => setFClasif((v) => (v === clasifDe(m) ? null : clasifDe(m))) },
          procesoDestruccion: { activo: (m) => fProceso === procesoDe(m), alternar: (m) => setFProceso((v) => (v === procesoDe(m) ? null : procesoDe(m))) },
        })}
        isLoading={isLoading}
        loadingText="Cargando materiales..."
        emptyText="No hay materiales registrados."
        emptySearchText="No se encontraron materiales con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver material" : "Gestionar material"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del material." : "Registrá un nuevo material de una donación."}
        onSave={handleSave}
        isLoading={isCreating || isClasificando}
        saveLabel={editing ? "Guardar cambios" : "Crear material"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium">Descripción *</label>
            <Input
              placeholder="Descripción del material..."
              value={form.descripcion}
              disabled={isViewing}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción") }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tipo de material *</label>
            <div className="flex gap-2">
              <select
                value={form.tipoMaterialId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, tipoMaterialId: e.target.value }))
                  setRequiereDestruccion(false)
                }}
                disabled={isViewing}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
              >
                <option value="">Seleccionar tipo...</option>
                {tipoMateriales.map((t: TipoMaterial) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              {!isViewing && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="No está en la lista: crear nuevo tipo de material"
                  onClick={openQuickTipo}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Condición <span className="text-muted-foreground font-normal">("A definir" hasta clasificar)</span>
            </label>
            <select
              value={form.condicionMaterialId}
              onChange={(e) => setForm((f) => ({ ...f, condicionMaterialId: e.target.value }))}
              disabled={isViewing}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
            >
              {condiciones.map((c: CondicionMaterial) => (
                <option key={c.id} value={c.id}>{c.condicion}</option>
              ))}
            </select>
          </div>

          {editing?.procesoDestruccion && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 sm:col-span-2">
              <div className="text-sm text-amber-900">
                <p className="font-medium">Proceso de destrucción asociado: #{editing.procesoDestruccion.id}</p>
                <p className="text-xs text-amber-700">
                  Estado: {editing.procesoDestruccion.estado ?? "—"}
                  {editing.procesoDestruccion.metodoDestruccionId ? "" : " · falta definir el método y el responsable"}
                </p>
              </div>
              {puedeVerProceso && (
                <Button type="button" size="sm" variant="outline" onClick={() => verProceso(editing.procesoDestruccion!.id)}>
                  Ver proceso
                </Button>
              )}
            </div>
          )}

          {/* Destrucción: solo si el tipo es Almacenamiento, no es vista y todavía no tiene un proceso asociado */}
          {esAlmacenamiento && !isViewing && !editing?.procesoDestruccion && (
            <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 sm:col-span-2">
              <p className="text-sm font-medium text-amber-900">¿Requiere proceso de destrucción?</p>
              <p className="text-xs text-amber-700">
                Al confirmar se creará un <span className="font-medium">Medio de Almacenamiento</span> y un{" "}
                <span className="font-medium">Proceso de Destrucción</span> asociados a este material.
              </p>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="requiereDestruccion" checked={requiereDestruccion === true} onChange={() => setRequiereDestruccion(true)} className="accent-primary" />
                  <span className="text-sm font-medium">Sí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="requiereDestruccion" checked={requiereDestruccion === false} onChange={() => { setRequiereDestruccion(false); resetDestruccion() }} className="accent-primary" />
                  <span className="text-sm font-medium">No</span>
                </label>
              </div>

              {requiereDestruccion && (
                <div className="mt-1 grid gap-3 border-t border-amber-200 pt-3 sm:grid-cols-3">
                  <p className="text-xs font-medium text-amber-800 sm:col-span-3">Datos del medio de almacenamiento</p>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-amber-800">Tipo <span className="text-red-600">*</span></label>
                    <div className="flex gap-2">
                      <select value={destruccionTipoId} onChange={(e) => setDestruccionTipoId(e.target.value)} className="flex h-9 w-full rounded-md border border-amber-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400">
                        <option value="">Sin tipo...</option>
                        {tipos.map((t: Tipo) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                      {puedeCrearTipo && (
                        <Button type="button" variant="outline" size="icon" title="No está en la lista: crear un tipo" onClick={() => openQuickMedio("tipo")}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-amber-800">Marca <span className="text-red-600">*</span></label>
                    <div className="flex gap-2">
                      <select value={destruccionMarcaId} onChange={(e) => { setDestruccionMarcaId(e.target.value); setDestruccionModeloId("") }} className="flex h-9 w-full rounded-md border border-amber-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400">
                        <option value="">Sin marca...</option>
                        {marcas.map((m: Marca) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                      {puedeCrearMarca && (
                        <Button type="button" variant="outline" size="icon" title="No está en la lista: crear una marca" onClick={() => openQuickMedio("marca")}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-amber-800">Modelo <span className="text-red-600">*</span></label>
                    <div className="flex gap-2">
                      <select value={destruccionModeloId} onChange={(e) => setDestruccionModeloId(e.target.value)} className="flex h-9 w-full rounded-md border border-amber-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400">
                        <option value="">Sin modelo...</option>
                        {modelosFiltrados.map((m: Modelo) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                      {puedeCrearModelo && (
                        <Button type="button" variant="outline" size="icon" title="No está en la lista: crear un modelo" onClick={() => openQuickMedio("modelo")}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* La donación se muestra solo para consulta: no se cambia desde acá */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium">Donación</label>
            <select value={form.loteId} disabled className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60">
              <option value="">Sin donación asignada</option>
              {lotes.map((l: Lote) => (
                <option key={l.id} value={l.id}>
                  Donación #{l.donacionId}
                  {l.pesoBrutoKg ? ` (${l.pesoBrutoKg} kg)` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormModal>

      {/* Alta rápida de tipo de material */}
      <FormModal
        open={quickTipoOpen}
        onOpenChange={setQuickTipoOpen}
        title="Gestionar tipo de material"
        description="Cargá los datos del tipo para asociarlo al material."
        onSave={handleSaveQuickTipo}
        isLoading={isCreatingTipo}
        saveDisabled={!canSaveQuickTipo}
        saveLabel="Crear tipo"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={quickTipoForm.nombre}
            onChange={(e) => setQuickTipoForm((f) => ({ ...f, nombre: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre") }))}
            placeholder="Ej: Electrónico, Eléctrico, Batería..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={quickTipoForm.descripcion}
            onChange={(e) => setQuickTipoForm((f) => ({ ...f, descripcion: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción") }))}
            placeholder="Breve descripción del tipo de material"
          />
        </div>
      </FormModal>

      {/* Alta rápida de tipo, marca o modelo del medio de almacenamiento */}
      <FormModal
        open={quickMedioOpen !== null}
        onOpenChange={(abierto) => { if (!abierto) setQuickMedioOpen(null) }}
        title={quickMedioOpen === "tipo" ? "Nuevo tipo" : quickMedioOpen === "marca" ? "Nueva marca" : "Nuevo modelo"}
        description="Se carga en el catálogo y queda seleccionado en el medio de almacenamiento."
        onSave={handleSaveQuickMedio}
        isLoading={isCreatingTipoMedio || isCreatingMarca || isCreatingModelo}
        saveDisabled={!canSaveQuickMedio}
        saveLabel="Crear"
      >
        {quickMedioOpen === "modelo" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input value={quickModeloForm.nombre} onChange={(e) => setQuickModeloForm((f) => ({ ...f, nombre: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre") }))} placeholder="Ej: Barracuda 500GB" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Marca *</label>
              <select value={quickModeloForm.marcaId} onChange={(e) => setQuickModeloForm((f) => ({ ...f, marcaId: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Seleccionar marca...</option>
                {marcas.map((m: Marca) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Tipo *</label>
              <select value={quickModeloForm.tipoId} onChange={(e) => setQuickModeloForm((f) => ({ ...f, tipoId: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Seleccionar tipo...</option>
                {tipos.map((t: Tipo) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input value={quickNombre} onChange={(e) => setQuickNombre(enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"))} placeholder={quickMedioOpen === "marca" ? "Ej: Seagate" : "Ej: HDD"} />
          </div>
        )}
      </FormModal>
    </div>
  )
}
