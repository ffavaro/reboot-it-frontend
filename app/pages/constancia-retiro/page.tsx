"use client"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { FormModal } from "@/components/ui/form-modal"
import { DateInput } from "@/components/ui/date-input"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { AvisoDonante } from "@/components/aviso-donante"
import {
  useConstanciasRetiro,
  useCreateConstanciaRetiro,
  useDeleteConstanciaRetiro,
} from "@/hooks/use-constancia-retiro"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { useDonantes } from "@/hooks/use-donantes"
import { useDonaciones } from "@/hooks/use-donacion"
import { useRetiros } from "@/hooks/use-retiro"
import { useDescargaDocumento } from "@/hooks/use-descarga-documento"
import { useUsuarioSesion } from "@/hooks/use-usuario-sesion"
import { constanciaRetiroApi } from "@/lib/api/constancia-retiro"
import { descargarConstanciaRetiro } from "@/lib/documentos/constancia-retiro"
import { dia, hoyIso } from "@/lib/documentos/formato"
import type { ConstanciaRetiro } from "@/lib/type/constancia-retiro"
import type { Donacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Retiro } from "@/lib/type/retiro"
import Title from "@/components/ui/title"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Campos {
  retiroId: string
  fechaEmision: string
  observaciones: string
  tecnicoId: string
}

const SELECT_CLASES =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
const Guion = () => <span className="italic text-muted-foreground"></span>
const nombreCompleto = (p?: { nombre: string; apellido: string } | null) => (p ? `${p.nombre} ${p.apellido}` : "")

const camposVacios = (): Campos => ({ retiroId: "", fechaEmision: hoyIso(), observaciones: "", tecnicoId: "" })

const camposDe = (c: ConstanciaRetiro): Campos => ({
  retiroId: String(c.retiroId),
  fechaEmision: c.fechaEmision?.slice(0, 10) ?? "",
  observaciones: c.observaciones ?? "",
  tecnicoId: c.tecnicoId ? String(c.tecnicoId) : "",
})

const columnas: TableColumn<ConstanciaRetiro>[] = [
  { key: "retiroId", header: "Retiro", cell: (c) => `#${c.retiroId}`, className: "font-mono text-xs font-medium" },
  {
    key: "fechaEmision",
    header: "Fecha emisión",
    cell: (c) => (c.fechaEmision ? dia(c.fechaEmision) : <Guion />),
    className: "text-muted-foreground",
  },
  { key: "tecnico", header: "Transportista", cell: (c) => nombreCompleto(c.tecnico) || <Guion /> },
  {
    key: "observaciones",
    header: "Observaciones",
    cell: (c) => c.observaciones ?? <Guion />,
    className: "text-muted-foreground max-w-xs truncate",
  },
]

export default function ConstanciaRetiroPage() {
  const { constancias, isLoading, mutate } = useConstanciasRetiro()
  const { transportistas } = useEmpleadosTransportistas()
  const { donantes } = useDonantes()
  const { donaciones } = useDonaciones()
  const { retiros } = useRetiros()
  const { createConstancia, isLoading: creando } = useCreateConstanciaRetiro()
  const { deleteConstancia, isLoading: borrando } = useDeleteConstanciaRetiro()
  const { usuario, esDonante } = useUsuarioSesion()
  const { descargar } = useDescargaDocumento(
    constanciaRetiroApi.getDatosDocumento,
    descargarConstanciaRetiro,
    "No se pudo generar el PDF de la constancia",
  )

  const [busqueda, setBusqueda] = useState("")
  const [consultada, setConsultada] = useState<ConstanciaRetiro | null>(null)
  const [campos, setCampos] = useState<Campos | null>(null)

  const propias = useMemo(() => {
    if (!esDonante) return constancias
    const donante = donantes.find((d: Donante) => d.usuarioId === usuario?.id)
    if (!donante) return []
    const donacionesPropias = new Set(
      donaciones.filter((d: Donacion) => d.donanteId === donante.id).map((d: Donacion) => d.id),
    )
    const retirosPropios = new Set(
      retiros.filter((r: Retiro) => donacionesPropias.has(r.donacionId)).map((r: Retiro) => r.id),
    )
    return constancias.filter((c: ConstanciaRetiro) => retirosPropios.has(c.retiroId))
  }, [esDonante, constancias, donantes, donaciones, retiros, usuario])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return propias
    return propias.filter((c: ConstanciaRetiro) =>
      [String(c.retiroId), c.observaciones ?? "", nombreCompleto(c.tecnico)].some((v) => v.toLowerCase().includes(q)),
    )
  }, [propias, busqueda])

  const soloLectura = consultada !== null
  const opcionesRetiro = retiros.filter(
    (r: Retiro) => !r.fechaRetiro || String(r.id) === campos?.retiroId,
  )

  function abrirNueva() {
    setConsultada(null)
    setCampos(camposVacios())
  }

  function abrirConsulta(c: ConstanciaRetiro) {
    setConsultada(c)
    setCampos(camposDe(c))
  }

  function cerrar() {
    setCampos(null)
    setConsultada(null)
  }

  function elegirRetiro(retiroId: string) {
    const retiro = retiros.find((r: Retiro) => String(r.id) === retiroId)
    const empleadoId = retiro?.empleadoTransportista?.empleadoId
    setCampos((c) =>
      c && {
        ...c,
        retiroId,
        fechaEmision: retiroId ? hoyIso() : c.fechaEmision,
        tecnicoId: empleadoId ? String(empleadoId) : c.tecnicoId,
      },
    )
  }

  const crear =  async () => {
    if (!campos?.retiroId || !campos.tecnicoId) {
      toast.error("Elegí el retiro y el transportista")
      return
    }
    try {
      await createConstancia({
        retiroId: Number(campos.retiroId),
        fechaEmision: campos.fechaEmision || undefined,
        observaciones: campos.observaciones.trim() || undefined,
        tecnicoId: Number(campos.tecnicoId),
      })
      await mutate()
      toast.success("Constancia de retiro creada")
      cerrar()
    } catch {
      toast.error("No se pudo crear la constancia de retiro")
    }
  }

  const eliminar = async (id: number | string) => {
    try {
      await deleteConstancia(Number(id))
      await mutate()
      toast.success("Constancia de retiro desactivada")
    } catch {
      toast.error("No se pudo eliminar la constancia de retiro")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Constancias de Retiro"
        description="Constancias emitidas para cada retiro de materiales. Una vez emitidas no se modifican."
        search={busqueda}
        setSearch={setBusqueda}
        filtered={visibles}
        openCreate={abrirNueva}
      />

      {esDonante && (
        <AvisoDonante>
          Las constancias de retiro aparecen acá cuando se confirma el retiro de tu donación.
        </AvisoDonante>
      )}

      <DataTable
        data={visibles}
        columns={columnas}
        isLoading={isLoading}
        loadingText="Cargando constancias..."
        emptyText={esDonante ? "Todavía no hay constancias disponibles para vos." : "No hay constancias de retiro registradas."}
        emptySearchText="No se encontraron constancias con ese criterio."
        search={busqueda}
        onView={abrirConsulta}
        onDownload={(c) => descargar(c.id)}
        onDelete={esDonante ? undefined : eliminar}
        isDeleting={borrando}
      />

      {campos && (
        <FormModal
          open
          onOpenChange={(abierto) => !abierto && cerrar()}
          title={soloLectura ? "Ver constancia" : "Nueva constancia de retiro"}
          readOnly={soloLectura}
          description={
            consultada
              ? `Constancia del retiro #${consultada.retiroId}.`
              : "Registrá una nueva constancia de retiro. Después de crearla no se puede editar."
          }
          onSave={crear}
          isLoading={creando}
          saveDisabled={!campos.retiroId || !campos.tecnicoId}
          saveLabel="Crear constancia"
        >
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Retiro *</Label>
            <Select>
              <SelectTrigger>
                 <SelectValue placeholder="Seleccionar retiro..." />
              </SelectTrigger>
              <SelectContent>
                {opcionesRetiro.map((r: Retiro) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    #{r.id}  Donación #{r.donacionId}
                    {r.direccion ? `  ${r.direccion}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Fecha de emisión</Label>
            <DateInput value={campos.fechaEmision} onChange={() => {}} disabled />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Transportista *</Label>
            <Select
              value={campos.tecnicoId}
              onValueChange={(e:any) => setCampos((c) => c && { ...c, tecnicoId: e.target.value })}
              
            >
              <SelectTrigger className={SELECT_CLASES}>
                <SelectValue placeholder="Seleccionar transportista..." />
              </SelectTrigger>
              <SelectContent>
                {transportistas.map((t: EmpleadoTransportista) => (
                  <SelectItem key={t.empleadoId} value={String(t.empleadoId)}>
                    {nombreCompleto(t.empleado) || `#${t.empleadoId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">
              Observaciones <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              value={campos.observaciones}
              onChange={(e) => setCampos((c) => c && { ...c, observaciones: e.target.value })}
              placeholder="Ej: Material recibido conforme. Sin observaciones."
              maxLength={300}
              rows={4}
              className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </FormModal>
      )}
    </div>
  )
}
