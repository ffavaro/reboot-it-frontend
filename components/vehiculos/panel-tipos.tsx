"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useTipoVehiculos,
  useCreateTipoVehiculo,
  useUpdateTipoVehiculo,
  useDeleteTipoVehiculo,
} from "@/hooks/use-vehicles"
import { sinClave, textoDeError } from "@/lib/utils/helpers"
import { pesoLegible } from "@/lib/utils/helpers"
import type { TipoVehiculo } from "@/lib/type/vehicle"
import {
  CamposTipoVehiculo,
  TIPO_VACIO,
  revisarTipo,
  tipoAFormulario,
  tipoAPayload,
  type ErroresTipo,
  type FormTipo,
} from "./campos-tipo-vehiculo"

type Apertura = { modo: "alta" } | { modo: "edicion" | "vista"; tipo: TipoVehiculo }

const peso = (valor: number | null) =>
  valor == null ? <span className="italic">—</span> : pesoLegible(valor)

const COLUMNAS: TableColumn<TipoVehiculo>[] = [
  { key: "descripcion", header: "Descripción", cell: (t) => <span className="font-medium">{t.descripcion}</span> },
  { key: "pesoMinimo", header: "Peso mínimo (kg)", cell: (t) => <span className="text-muted-foreground">{peso(t.pesoMinimo)}</span> },
  { key: "pesoMaximo", header: "Peso máximo (kg)", cell: (t) => <span className="text-muted-foreground">{peso(t.pesoMaximo)}</span> },
]

export function PanelTipos() {
  const { tipos, isLoading, mutate } = useTipoVehiculos()
  const { createTipo, isLoading: creando } = useCreateTipoVehiculo()
  const { updateTipo, isLoading: actualizando } = useUpdateTipoVehiculo()
  const { deleteTipo, isLoading: borrando } = useDeleteTipoVehiculo()

  const [apertura, setApertura] = useState<Apertura | null>(null)
  const [form, setForm] = useState<FormTipo>(TIPO_VACIO)
  const [errores, setErrores] = useState<ErroresTipo>({})

  const actual = apertura && apertura.modo !== "alta" ? apertura.tipo : null
  const soloLectura = apertura?.modo === "vista"

  function abrir(nueva: Apertura) {
    setApertura(nueva)
    setForm(nueva.modo === "alta" ? TIPO_VACIO : tipoAFormulario(nueva.tipo))
    setErrores({})
  }

  function cambiar(campo: keyof FormTipo, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => sinClave(e, campo))
  }

  async function guardar() {
    const encontrados = revisarTipo(form)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return
    try {
      if (actual) await updateTipo({ id: actual.id, ...tipoAPayload(form) })
      else await createTipo(tipoAPayload(form))
      await mutate()
      toast.success(actual ? "Tipo actualizado" : "Tipo creado")
      setApertura(null)
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo guardar el tipo"))
    }
  }

  async function desactivar(id: number | string) {
    try {
      await deleteTipo(Number(id))
      await mutate()
      toast.success("Tipo desactivado")
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo desactivar el tipo"))
    }
  }

  return (
    <>
      <div className="flex items-center">
        <Button className="ml-auto" onClick={() => abrir({ modo: "alta" })}>
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </Button>
      </div>

      <DataTable
        data={tipos}
        columns={COLUMNAS}
        isLoading={isLoading}
        loadingText="Cargando tipos..."
        emptyText="No hay tipos de vehículo registrados."
        onView={(t) => abrir({ modo: "vista", tipo: t })}
        onEdit={(t) => abrir({ modo: "edicion", tipo: t })}
        onDelete={desactivar}
        isDeleting={borrando}
      />

      <FormModal
        open={apertura !== null}
        onOpenChange={(abierto) => !abierto && setApertura(null)}
        title={soloLectura ? "Ver tipo de vehículo" : actual ? "Editar tipo" : "Nuevo tipo de vehículo"}
        description={actual ? `Datos de "${actual.descripcion}".` : "Ingresá los datos del nuevo tipo."}
        readOnly={soloLectura}
        onSave={guardar}
        isLoading={creando || actualizando}
        saveDisabled={!form.descripcion.trim() || !form.pesoMaximo.trim()}
        saveLabel={actual ? "Guardar cambios" : "Crear tipo"}
      >
        <CamposTipoVehiculo form={form} errores={errores} cambiar={cambiar} />
      </FormModal>
    </>
  )
}
