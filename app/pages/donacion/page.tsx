"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Building2, FileCheck2, Truck } from "lucide-react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormModal } from "@/components/ui/form-modal"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { SelectorTurno } from "@/components/donacion/selector-turno"
import { FotosMateriales, liberarFotos, type FotoElegida } from "@/components/donacion/fotos-materiales"
import { TrazabilidadDonacion } from "@/components/donacion/trazabilidad-donacion"
import { EmitirCertificado } from "@/components/donacion/emitir-certificado"
import { TurnoConfirmado, type ResumenTurno } from "@/components/donacion/turno-confirmado"
import { useDonaciones, useCreateDonacion, useUpdateDonacion, useDeleteDonacion } from "@/hooks/use-donacion"
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import { useTurnos } from "@/hooks/use-turno"
import { useUsuarioSesion } from "@/hooks/use-usuario-sesion"
import { uploadFoto } from "@/lib/api/client"
import { enforceDecimalInput } from "@/lib/utils/number-limit"
import { ESTADO_DONACION_COLORS } from "@/lib/utils/estados"
import { tieneNumeroDeCalle } from "@/lib/utils/text-limit"
import { textoDeError } from "@/lib/utils/helpers"
import { formDonacion, type Apertura, type CreateDetallePayload, type Donacion, type Formulario } from "@/lib/type/donacion"
import Title from "@/components/ui/title"
import { Materiales } from "@/components/donacion/material"
import { useTipoMateriales } from "@/hooks/use-tipo-material"

const DIGITOS_PESO = 3
const ROLES_CERTIFICADO = ["admin", "administrativo"]
const CAMPO = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"

function donacionAFormulario(d: Donacion): Formulario {
  return {
    donanteId: String(d.donanteId),
    estadoDonacionId: d.estadoDonacionId != null ? String(d.estadoDonacionId) : "",
    fechaHora: "",
    descripcion: d.descripcion ?? "",
    necesitaRetiro: d.necesitaRetiro ?? false,
    otraDireccion: !!d.direccionRetiro,
    direccionRetiro: d.direccionRetiro ?? "",
    pesoEstimadoKg: d.pesoEstimadoKg != null ? String(d.pesoEstimadoKg) : "",
    materiales: (d.detalles ?? []).map((m) => ({
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: m.condicionMaterialId != null ? String(m.condicionMaterialId) : "",
      cantidadEstimada: m.cantidadEstimada != null ? String(m.cantidadEstimada) : "",
    })),
  }
}

function problemaDelFormulario(f: Formulario, esAlta: boolean): string | null {
  if (!f.donanteId) return "Elegí el donante"
  if (esAlta && !f.fechaHora) return "Elegí la fecha y el horario del turno"
  if (f.materiales.length === 0) return "Agregá al menos un material"
  if (f.materiales.some((m) => !m.tipoMaterialId)) return "Elegí el tipo de cada material"
  if (f.materiales.some((m) => !/^[1-9]\d*$/.test(m.cantidadEstimada.trim()))) return "La cantidad de cada material debe ser un número entero mayor a 0"
  if (f.necesitaRetiro && f.otraDireccion) {
    if (!f.direccionRetiro.trim()) return "Ingresá la dirección del retiro"
    if (!tieneNumeroDeCalle(f.direccionRetiro)) return "Incluí la altura (número de la casa) en la dirección del retiro"
  }
  if (!f.pesoEstimadoKg.trim()) return "Ingresá el peso estimado de la donación"
  if (!(Number(f.pesoEstimadoKg) > 0)) return "El peso estimado debe ser mayor a 0"
  return null
}

export default function DonacionPage() {
  const { donaciones, isLoading, mutate } = useDonaciones()
  const { donantes } = useDonantes()
  const { tipoMateriales } = useTipoMateriales()
  const { estadosDonacion } = useEstadosDonacion()
  const { turnos, mutate: refrescarTurnos } = useTurnos()
  const { createDonacion, isLoading: creando } = useCreateDonacion()
  const { updateDonacion, isLoading: actualizando } = useUpdateDonacion()
  const { deleteDonacion, isLoading: borrando } = useDeleteDonacion()
  const { usuario, esDonante } = useUsuarioSesion()
  
  const [busqueda, setBusqueda] = useState("")
  const [apertura, setApertura] = useState<Apertura | null>(null)
  const [form, setForm] = useState<Formulario>(formDonacion)
  const [fotos, setFotos] = useState<FotoElegida[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [aCertificar, setACertificar] = useState<Donacion | null>(null)
  const [resumen, setResumen] = useState<ResumenTurno | null>(null)

  const miDonante = usuario ? (donantes.find((d) => d.usuarioId === usuario.id) ?? null) : null
  const soloLoSuyo = esDonante || miDonante !== null
  const puedeCertificar = ROLES_CERTIFICADO.includes(usuario?.rol?.nombre?.trim().toLowerCase() ?? "")
  const editando = apertura?.modo === "edicion" ? apertura.donacion : null
  const donanteElegido = donantes.find((d) => String(d.id) === form.donanteId) ?? null

  const propias = useMemo(
    () => (soloLoSuyo ? donaciones.filter((d) => miDonante && d.donanteId === miDonante.id) : donaciones),
    [donaciones, soloLoSuyo, miDonante],
  )

  const visibles = useMemo(() => {
    const texto = busqueda
    if (!texto) return propias
    return propias.filter((d) =>
      [`#${d.id}`, d.donante?.nombre, d.donante?.razonSocial, d.estadoDonacion?.descripcion, d.descripcion]
        .some((dato) => dato?.includes(texto)),
    )
  }, [propias, busqueda])

  function cambiar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function abrirAlta() {
    const pendiente = estadosDonacion.find((e) => e.id == 1)
    liberarFotos(fotos)
    setFotos([])
    setForm({ ...formDonacion, donanteId: miDonante ? String(miDonante.id) : "", estadoDonacionId: pendiente ? String(pendiente.id) : "" })
    setApertura({ modo: "alta" })
  }

  function abrirEdicion(d: Donacion) {
    setForm(donacionAFormulario(d))
    setApertura({ modo: "edicion", donacion: d })
  }

  function cerrar() {
    liberarFotos(fotos)
    setFotos([])
    setApertura(null)
  }

  function materialesParaEnviar(): CreateDetallePayload[] {
    return form.materiales.map((m) => ({
      tipoMaterialId: Number(m.tipoMaterialId),
      condicionMaterialId: Number(m.condicionMaterialId || 4),
      cantidadEstimada: m.cantidadEstimada ? Number(m.cantidadEstimada) : undefined,
    }))
  }

  const subirFotos = async(): Promise<string[] | null> => {
    if (fotos.length === 0) return []
    setSubiendo(true)
    try {
      return await Promise.all(fotos.map((f) => uploadFoto(f.archivo)))
    } catch (error) {
      toast.error(textoDeError(error, "No se pudieron subir las fotos. Probá de nuevo o quitalas para continuar."))
      return null
    } finally {
      setSubiendo(false)
    }
  }

  const guardar = async () => {
    const problema = problemaDelFormulario(form, !editando)
    if (problema) {
      toast.error(problema)
      return
    }
    const direccion = form.necesitaRetiro && form.otraDireccion ? form.direccionRetiro.trim() : undefined
    const peso = Number(form.pesoEstimadoKg)

    try {
      if (editando) {
        await updateDonacion({
          id: editando.id,
          donanteId: Number(form.donanteId),
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          necesitaRetiro: form.necesitaRetiro,
          direccionRetiro: direccion ?? null,
          pesoEstimadoKg: peso ?? null,
          descripcion: form.descripcion.trim() || undefined,
          detalles: materialesParaEnviar(),
        })
        toast.success("Donación actualizada")
      } else {
        const fotosUrls = await subirFotos()
        if (fotosUrls === null) return
        const creada = await createDonacion({
          donanteId: Number(form.donanteId),
          fechaHora: form.fechaHora,
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          necesitaRetiro: form.necesitaRetiro,
          direccionRetiro: direccion,
          pesoEstimadoKg: peso,
          descripcion: form.descripcion.trim() || undefined,
          fotosUrls: fotosUrls.length ? fotosUrls : undefined,
          detalles: materialesParaEnviar(),
        })
        setResumen({
          donacionId: creada.id,
          turnoId: creada.turno?.id ?? null,
          donante: donanteElegido?.nombre ?? "",
          fechaHora: creada.turno?.fechaHora ?? form.fechaHora,
          modalidad: form.necesitaRetiro ? "Retiro a domicilio" : "Lo lleva a la sucursal",
          direccion: form.necesitaRetiro ? (direccion ?? donanteElegido?.direccion ?? null) : null,
          pesoKg: peso ?? null,
          materiales: form.materiales.map((m) => ({
            nombre: tipoMateriales.find((t) => String(t.id) === m.tipoMaterialId)?.nombre ?? "Material",
            cantidad: m.cantidadEstimada ? `${m.cantidadEstimada} u.` : "sin cantidad",
          })),
          fotos: fotosUrls.length,
        })
        await refrescarTurnos()
      }
      await mutate()
      cerrar()
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo guardar la donación"))
    }
  }

  async function desactivar(id: number | string) {
    try {
      await deleteDonacion(Number(id))
      await mutate()
      toast.success("Donación desactivada")
    } catch (error) {
      toast.error(textoDeError(error, "No se pudo desactivar la donación"))
    }
  }

  const columnas: TableColumn<Donacion>[] = [
    { key: "id", header: "ID", cell: (d) => `#${d.id}`, className: "font-mono text-xs w-14" },
    ...(soloLoSuyo
      ? []
      : [{ key: "donante", header: "Donante", cell: (d: Donacion) => d.donante?.nombre ?? <span className="italic text-muted-foreground">#{d.donanteId}</span> }]),
    {
      key: "estado",
      header: "Estado",
      className: "w-40",
      cell: (d) => {
        const estado = d.estadoDonacion?.descripcion
        if (!estado) return <span className="italic text-muted-foreground">—</span>
        return (
          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", ESTADO_DONACION_COLORS[estado.toLowerCase()] ?? "bg-gray-100 text-gray-800")}>
            {estado}
          </span>
        )
      },
    },
    {
      key: "materiales",
      header: "Materiales",
      className: "w-24",
      cell: (d) => {
        const n = d.detalles?.length ?? 0
        return <span className="text-sm text-muted-foreground">{n} ítem{n !== 1 ? "s" : ""}</span>
      },
    },
    {
      key: "entrega",
      header: "Entrega",
      className: "w-28",
      cell: (d) =>
        d.necesitaRetiro ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            <Truck className="h-3 w-3" /> Retiro
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
            <Building2 className="h-3 w-3" /> Sucursal
          </span>
        ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      className: "max-w-[220px] truncate text-muted-foreground",
      cell: (d) => d.descripcion ?? <span className="italic">—</span>,
    },
    ...(puedeCertificar
      ? [{
        key: "certificar",
        header: "",
        cell: (d: Donacion) =>
          d.estadoDonacion?.id === 5 ? (
            <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => setACertificar(d)}>
              <FileCheck2 className="h-3.5 w-3.5" />
              Emitir certificado
            </Button>
          ) : null,
      }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Donaciones"
        description={soloLoSuyo ? "Tus donaciones y sus turnos." : "Administrá las donaciones y los materiales asociados."}
        search={busqueda}
        filtered={[]}
        setSearch={setBusqueda}
        openCreate={abrirAlta}
      />

      <DataTable
        data={visibles}
        columns={columnas}
        isLoading={isLoading}
        loadingText="Cargando donaciones..."
        emptyText={soloLoSuyo ? "Todavía no registraste donaciones." : "No hay donaciones registradas."}
        emptySearchText="No se encontraron donaciones con ese criterio."
        search={busqueda}
        onView={(d) => setDetalleId(d.id)}
        onEdit={soloLoSuyo ? undefined : abrirEdicion}
        onDelete={soloLoSuyo ? undefined : desactivar}
        isDeleting={borrando}
      />

      <FormModal
        open={apertura !== null}
        onOpenChange={(abierta) => !abierta && cerrar()}
        title={editando ? `Editar donación #${editando.id}` : "Nueva donación"}
        description={editando ? "El turno no se modifica desde acá." : "Elegí el turno, cómo entregás los materiales y qué vas a donar."}
        onSave={guardar}
        isLoading={creando || actualizando || subiendo}
        saveLabel={editando ? "Guardar cambios" : subiendo ? "Subiendo fotos..." : "Crear donación"}
      >
        {!soloLoSuyo && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Donante *</label>
            <select value={form.donanteId} onChange={(e) => cambiar("donanteId", e.target.value)} disabled={!!editando} className={CAMPO}>
              <option value="">— Seleccionar donante —</option>
              {donantes.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}{d.razonSocial ? ` · ${d.razonSocial}` : ""}</option>
              ))}
            </select>
          </div>
        )}

        {apertura?.modo === "alta" && (
          <SelectorTurno turnos={turnos} valor={form.fechaHora} alElegir={(fechaHora) => cambiar("fechaHora", fechaHora)} />
        )}

        {editando && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Estado</label>
            <select value={form.estadoDonacionId} onChange={(e) => cambiar("estadoDonacionId", e.target.value)} className={CAMPO}>
              <option value="">— Seleccionar estado —</option>
              {estadosDonacion.map((e) => (
                <option key={e.id} value={e.id}>{e.descripcion}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Descripción general de la donación..."
            value={form.descripcion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">¿Cómo entregás los materiales? *</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { retiro: false, texto: "Lo llevo a la sucursal", Icono: Building2, activo: "border-primary bg-primary/5 text-primary" },
              { retiro: true, texto: "Necesito retiro a domicilio", Icono: Truck, activo: "border-orange-400 bg-orange-50 text-orange-700" },
            ].map(({ retiro, texto, Icono, activo }) => (
              <button
                key={texto}
                type="button"
                aria-pressed={form.necesitaRetiro === retiro}
                onClick={() => cambiar("necesitaRetiro", retiro)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                  form.necesitaRetiro === retiro ? activo : "border-border text-muted-foreground hover:border-muted-foreground/50",
                )}
              >
                <Icono className="h-4 w-4 shrink-0" />
                {texto}
              </button>
            ))}
          </div>

          {form.necesitaRetiro && (
            <>
              <p className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>El retiro a domicilio tiene un <strong>costo adicional</strong> que se coordina con el equipo de Reboot IT.</span>
              </p>
              <div className="flex flex-col gap-2 rounded-md border px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Dirección registrada: <span className="font-medium text-foreground">{donanteElegido?.direccion ?? "Sin dirección registrada"}</span>
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.otraDireccion}
                    onChange={(e) => cambiar("otraDireccion", e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Retirar en otra dirección
                </label>
                {form.otraDireccion && (
                  <>
                    <Input
                      placeholder="Calle y número, localidad. Ej: Av. Colón 1234, Córdoba"
                      value={form.direccionRetiro}
                      maxLength={255}
                      onChange={(e) => cambiar("direccionRetiro", e.target.value)}
                    />
                    {form.direccionRetiro.trim() && !tieneNumeroDeCalle(form.direccionRetiro) && (
                      <span className="text-xs text-amber-600">Falta la altura (número de la casa).</span>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <Materiales materiales={form.materiales} onChange={(materiales) => cambiar("materiales", materiales)} />

        <div>
          <label className="flex flex-col gap-1.5 pt-1 text-xs font-medium">
            Peso estimado de la donación (kg) *
            <Input
              inputMode="decimal"
              placeholder="Ej: 25.50"
              value={form.pesoEstimadoKg}
              onChange={(e) => cambiar("pesoEstimadoKg", enforceDecimalInput(e.target.value, DIGITOS_PESO, "El peso estimado"))}
            />
            <span className="text-[11px] font-normal text-muted-foreground">Se usa para asignar un vehículo que soporte la carga.</span>
          </label>
        </div>

        {apertura?.modo === "alta" && <FotosMateriales fotos={fotos} alCambiar={setFotos} />}
      </FormModal>

      <TrazabilidadDonacion donacionId={detalleId} alCerrar={() => setDetalleId(null)} />
      <EmitirCertificado donacion={aCertificar} alCerrar={() => setACertificar(null)} alEmitir={async () => { await mutate() }} />
      <TurnoConfirmado resumen={resumen} alCerrar={() => setResumen(null)} />
    </div>
  )
}
