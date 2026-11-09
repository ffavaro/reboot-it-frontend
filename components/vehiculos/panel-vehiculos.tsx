"use client"

import { useState } from "react"
import Link from "next/link"
import { History, Plus } from "lucide-react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useVehiculos,
  useTipoVehiculos,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
  useCreateTipoVehiculo,
} from "@/hooks/use-vehicles"
import { kmLegible } from "@/lib/utils/helpers"
import { problemaPatente } from "@/lib/utils/helpers"
import { dia } from "@/lib/utils/fechas"
import { sinClave, textoDeError } from "@/lib/utils/helpers"
import type { CreateVehiculoPayload, Vehiculo } from "@/lib/type/vehicle"
import { CamposTecnicos, TECNICOS_VACIOS, revisarTecnicos, type DatosTecnicos } from "./campos-tecnicos"
import { EstadoItv } from "./estado-itv"
import {
  CamposTipoVehiculo,
  TIPO_VACIO,
  revisarTipo,
  tipoAPayload,
  type ErroresTipo,
  type FormTipo,
} from "./campos-tipo-vehiculo"
import { SiPuede } from "../permisos/si-puede"

type FormVehiculo = DatosTecnicos & {
  patente: string
  marca: string
  modelo: string
  tipoVehiculoId: string
}
type ErroresVehiculo = Partial<Record<keyof FormVehiculo, string>>
type Apertura = { modo: "alta" } | { modo: "edicion" | "vista"; vehiculo: Vehiculo }

const VEHICULO_VACIO: FormVehiculo = { patente: "", marca: "", modelo: "", tipoVehiculoId: "", ...TECNICOS_VACIOS }

const TEXTOS: { campo: "patente" | "marca" | "modelo"; etiqueta: string; ejemplo: string; largo: number }[] = [
  { campo: "patente", etiqueta: "Patente", ejemplo: "AB123CD", largo: 9 },
  { campo: "marca", etiqueta: "Marca", ejemplo: "Ford", largo: 50 },
  { campo: "modelo", etiqueta: "Modelo", ejemplo: "F-100", largo: 50 },
]

const vehiculoAFormulario = (v: Vehiculo): FormVehiculo => ({
  patente: v.patente,
  marca: v.marca,
  modelo: v.modelo,
  tipoVehiculoId: String(v.tipoVehiculoId),
  kilometraje: v.kilometraje == null ? "" : String(v.kilometraje),
  itvVencimiento: v.itvVencimiento?.slice(0, 10) ?? "",
  tipoCombustible: v.tipoCombustible ?? "",
})

const aPayload = (f: FormVehiculo): CreateVehiculoPayload => ({
  patente: f.patente.trim(),
  marca: f.marca.trim(),
  modelo: f.modelo.trim(),
  tipoVehiculoId: Number(f.tipoVehiculoId),
  kilometraje: Number(f.kilometraje),
  itvVencimiento: f.itvVencimiento,
  tipoCombustible: f.tipoCombustible,
})

function revisarVehiculo(f: FormVehiculo, kmRegistrado: number | null): ErroresVehiculo {
  const errores: ErroresVehiculo = revisarTecnicos(f, kmRegistrado)
  const patente = problemaPatente(f.patente)
  if (patente) errores.patente = patente
  if (!f.marca.trim()) errores.marca = "Ingresá la marca"
  if (!f.modelo.trim()) errores.modelo = "Ingresá el modelo"
  if (!f.tipoVehiculoId) errores.tipoVehiculoId = "Seleccioná un tipo de vehículo"
  return errores
}

const coincide = (v: Vehiculo, texto: string) =>
  [v.patente, v.marca, v.modelo].some((dato) => dato.toLowerCase().includes(texto))

const vacio = <span className="italic text-muted-foreground">—</span>

const COLUMNAS: TableColumn<Vehiculo>[] = [
  { key: "patente", header: "Patente", cell: (v) => <span className="font-mono font-medium tracking-wider">{v.patente}</span> },
  { key: "marca", header: "Marca", cell: (v) => v.marca },
  { key: "modelo", header: "Modelo", cell: (v) => <span className="text-muted-foreground">{v.modelo}</span> },
  {
    key: "tipo",
    header: "Tipo",
    cell: (v) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {v.tipoVehiculo?.descripcion ?? "—"}
      </span>
    ),
  },
  { key: "combustible", header: "Combustible", cell: (v) => v.tipoCombustible ?? vacio },
  {
    key: "kilometraje",
    header: "Kilometraje",
    cell: (v) =>
      v.kilometraje == null ? (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Sin cargar</span>
      ) : (
        <Link
          href={`/pages/vehicles/historial-km?vehiculo=${v.id}`}
          title="Ver historial de kilometraje"
          className="inline-flex items-center gap-1.5 tabular-nums hover:text-primary hover:underline"
        >
          {kmLegible(v.kilometraje)}
          <History className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </Link>
      ),
  },
  {
    key: "itv",
    header: "Venc. ITV",
    cell: (v) =>
      v.itvVencimiento ? (
        <span className="inline-flex items-center gap-2">
          <span className="tabular-nums text-muted-foreground">{dia(v.itvVencimiento)}</span>
          <EstadoItv vencimiento={v.itvVencimiento} />
        </span>
      ) : (
        vacio
      ),
  },
]

export function PanelVehiculos() {
  const { vehiculos, isLoading, mutate } = useVehiculos()
  const { tipos, mutate: refrescarTipos } = useTipoVehiculos()
  const { createVehiculo, isLoading: creando } = useCreateVehiculo()
  const { updateVehiculo, isLoading: actualizando } = useUpdateVehiculo()
  const { deleteVehiculo, isLoading: borrando } = useDeleteVehiculo()
  const { createTipo, isLoading: creandoTipo } = useCreateTipoVehiculo()

  const [busqueda, setBusqueda] = useState("")
  const [apertura, setApertura] = useState<Apertura | null>(null)
  const [form, setForm] = useState<FormVehiculo>(VEHICULO_VACIO)
  const [errores, setErrores] = useState<ErroresVehiculo>({})

  const [tipoNuevo, setTipoNuevo] = useState<FormTipo | null>(null)
  const [erroresTipo, setErroresTipo] = useState<ErroresTipo>({})

  const actual = apertura && apertura.modo !== "alta" ? apertura.vehiculo : null
  const soloLectura = apertura?.modo === "vista"
  const texto = busqueda.trim().toLowerCase()
  const visibles = texto ? vehiculos.filter((v) => coincide(v, texto)) : vehiculos
  const incompletos = vehiculos.filter((v) => v.kilometraje == null).length

  function abrir(nueva: Apertura) {
    setApertura(nueva)
    setForm(nueva.modo === "alta" ? VEHICULO_VACIO : vehiculoAFormulario(nueva.vehiculo))
    setErrores({})
  }

  function cambiar(campo: keyof FormVehiculo, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => sinClave(e, campo))
  }

  async function guardar() {
    const encontrados = revisarVehiculo(form, actual?.kilometraje ?? null)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return
    try {
      if (actual) await updateVehiculo({ id: actual.id, ...aPayload(form) })
      else await createVehiculo(aPayload(form))
      await mutate()
      toast.success(actual ? "Vehículo actualizado" : "Vehículo creado")
      setApertura(null)
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo guardar el vehículo"))
    }
  }

  async function desactivar(id: number | string) {
    try {
      await deleteVehiculo(Number(id))
      await mutate()
      toast.success("Vehículo desactivado")
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo desactivar el vehículo"))
    }
  }

  function cambiarTipo(campo: keyof FormTipo, valor: string) {
    setTipoNuevo((f) => (f ? { ...f, [campo]: valor } : f))
    setErroresTipo((e) => sinClave(e, campo))
  }

  async function guardarTipo() {
    if (!tipoNuevo) return
    const encontrados = revisarTipo(tipoNuevo)
    setErroresTipo(encontrados)
    if (Object.keys(encontrados).length) return
    try {
      const creado = await createTipo(tipoAPayload(tipoNuevo))
      await refrescarTipos()
      if (creado) cambiar("tipoVehiculoId", String(creado.id))
      toast.success("Tipo de vehículo creado")
      setTipoNuevo(null)
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo crear el tipo de vehículo"))
    }
  }

  const conError = (error?: string) => cn(error && "border-destructive focus-visible:ring-destructive")

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por patente, marca o modelo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-sm"
        />
        {incompletos > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {incompletos === 1
              ? "1 vehículo no tiene kilometraje cargado y no va a poder salir en una hoja de ruta."
              : `${incompletos} vehículos no tienen kilometraje cargado y no van a poder salir en una hoja de ruta.`}
          </span>
        )}
        <SiPuede accion="crear">
        <Button className="ml-auto" onClick={() => abrir({ modo: "alta" })}>
          <Plus className="h-4 w-4" />
          Nuevo vehículo
        </Button>
        </SiPuede>
      </div>

      <DataTable
        data={visibles}
        columns={COLUMNAS}
        isLoading={isLoading}
        loadingText="Cargando vehículos..."
        emptyText="No hay vehículos registrados."
        emptySearchText="No se encontraron vehículos con ese criterio."
        search={busqueda}
        onView={(v) => abrir({ modo: "vista", vehiculo: v })}
        onEdit={(v) => abrir({ modo: "edicion", vehiculo: v })}
        onDelete={desactivar}
        isDeleting={borrando}
      />

      <FormModal
        open={apertura !== null}
        onOpenChange={(abierto) => !abierto && setApertura(null)}
        title={soloLectura ? "Ver vehículo" : actual ? "Editar vehículo" : "Nuevo vehículo"}
        description={actual ? `Datos del vehículo ${actual.patente}.` : "Completá los datos del nuevo vehículo."}
        readOnly={soloLectura}
        onSave={guardar}
        isLoading={creando || actualizando}
        saveLabel={actual ? "Guardar cambios" : "Crear vehículo"}
      >
        {TEXTOS.map(({ campo, etiqueta, ejemplo, largo }) => (
          <div key={campo} className="flex flex-col gap-2">
            <label className="text-sm font-medium">{etiqueta} *</label>
            <Input
              value={form[campo]}
              onChange={(e) => cambiar(campo, campo === "patente" ? e.target.value.toUpperCase() : e.target.value)}
              placeholder={ejemplo}
              maxLength={largo}
              className={conError(errores[campo])}
            />
            <FieldError>{errores[campo]}</FieldError>
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de vehículo *</label>
          <div className="flex gap-2">
            <select
              value={form.tipoVehiculoId}
              onChange={(e) => cambiar("tipoVehiculoId", e.target.value)}
              className={cn(
                "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                errores.tipoVehiculoId ? "border-destructive" : "border-input",
              )}
            >
              <option value="">— Seleccionar tipo —</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.descripcion}</option>
              ))}
            </select>
            {!soloLectura && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="No está en la lista: crear nuevo tipo de vehículo"
                onClick={() => { setTipoNuevo(TIPO_VACIO); setErroresTipo({}) }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FieldError>{errores.tipoVehiculoId}</FieldError>
        </div>

        <CamposTecnicos valores={form} errores={errores} kmRegistrado={actual?.kilometraje} cambiar={cambiar} />
      </FormModal>

      <FormModal
        open={tipoNuevo !== null}
        onOpenChange={(abierto) => !abierto && setTipoNuevo(null)}
        title="Nuevo tipo de vehículo"
        description="Cargá los datos del tipo para asociarlo al vehículo."
        onSave={guardarTipo}
        isLoading={creandoTipo}
        saveDisabled={!tipoNuevo?.descripcion.trim() || !tipoNuevo?.pesoMaximo.trim()}
        saveLabel="Crear tipo"
      >
        {tipoNuevo && <CamposTipoVehiculo form={tipoNuevo} errores={erroresTipo} cambiar={cambiarTipo} />}
      </FormModal>
    </>
  )
}
