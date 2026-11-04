"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { FormModal } from "@/components/ui/form-modal"
import { DateInput } from "@/components/ui/date-input"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { AvisoDonante } from "@/components/aviso-donante"
import { EnlaceArchivoFinal, SelectorArchivoFinal, validarArchivoFinal } from "@/components/archivo-certificado-final"
import {
  useCertificadosDisposicion,
  useCreateCertificadoDisposicion,
  useUpdateCertificadoDisposicion,
  useDeleteCertificadoDisposicion,
} from "@/hooks/use-certificado-disposicion"
import { useLotes } from "@/hooks/use-lote"
import { useGestoresAmbientales } from "@/hooks/use-gestor-ambiental"
import { useDonantes } from "@/hooks/use-donantes"
import { useDonaciones } from "@/hooks/use-donacion"
import { useDescargaDocumento } from "@/hooks/use-descarga-documento"
import { useUsuarioSesion } from "@/hooks/use-usuario-sesion"
import { certificadoDisposicionApi } from "@/lib/api/certificado-disposicion"
import { uploadFoto } from "@/lib/api/client"
import { descargarCertificadoDisposicion } from "@/lib/documentos/certificado-disposicion"
import { dia, hoyIso } from "@/lib/documentos/formato"
import type { CertificadoDisposicion } from "@/lib/type/certificado-disposicion"
import type { Donante } from "@/lib/type/donante"
import type { GestorAmbiental } from "@/lib/type/gestor-ambiental"
import type { Lote } from "@/lib/type/lote"

type Modo = "crear" | "editar" | "ver"

interface Campos {
  loteId: string
  gestorAmbientalId: string
  fechaEmision: string
  numeroCertificado: string
  terminosCondiciones: string
}

const ESTADO_LISTO_PARA_CERTIFICAR = "Pendiente de emision certificado"
const SELECT_CLASES =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
const Guion = () => <span className="italic text-muted-foreground"></span>

function siguienteNumero(existentes: CertificadoDisposicion[]): string {
  const prefijo = `CERT-${new Date().getFullYear()}-`
  const usados = existentes.filter((c) => c.numeroCertificado?.startsWith(prefijo)).length
  return prefijo + String(usados + 1).padStart(4, "0")
}

const camposDe = (c: CertificadoDisposicion): Campos => ({
  loteId: String(c.loteId),
  gestorAmbientalId: String(c.gestorAmbientalId),
  fechaEmision: c.fechaEmision?.slice(0, 10) ?? "",
  numeroCertificado: c.numeroCertificado ?? "",
  terminosCondiciones: c.terminosCondiciones ?? "",
})

const columnas: TableColumn<CertificadoDisposicion>[] = [
  {
    key: "numeroCertificado",
    header: "N° Certificado",
    cell: (c) => c.numeroCertificado ?? <Guion />,
    className: "font-mono text-xs font-medium",
  },
  { key: "gestorAmbiental", header: "Gestor ambiental", cell: (c) => c.gestorAmbiental?.razonSocial ?? <Guion /> },
  {
    key: "lote",
    header: "Lote",
    cell: (c) => <span className="font-mono text-xs">#{c.loteId}</span>,
    className: "text-muted-foreground",
  },
  {
    key: "fechaEmision",
    header: "Fecha emisión",
    cell: (c) => (c.fechaEmision ? dia(c.fechaEmision) : <Guion />),
    className: "text-muted-foreground",
  },
  {
    key: "archivoFinalUrl",
    header: "Certificado final",
    cell: (c) => <EnlaceArchivoFinal url={c.archivoFinalUrl} compacto />,
  },
  {
    key: "terminos",
    header: "Términos",
    cell: (c) => c.terminosCondiciones ?? <Guion />,
    className: "text-muted-foreground max-w-xs truncate",
  },
]

export default function CertificadoDisposicionPage() {
  const { certificados, isLoading, mutate } = useCertificadosDisposicion()
  const { lotes } = useLotes()
  const { gestores } = useGestoresAmbientales()
  const { donantes } = useDonantes()
  const { donaciones } = useDonaciones()
  const { createCertificado, isLoading: creando } = useCreateCertificadoDisposicion()
  const { updateCertificado, isLoading: actualizando } = useUpdateCertificadoDisposicion()
  const { deleteCertificado, isLoading: borrando } = useDeleteCertificadoDisposicion()
  const { descargar } = useDescargaDocumento(
    certificadoDisposicionApi.getDatosDocumento,
    descargarCertificadoDisposicion,
    "No se pudo generar el PDF del certificado",
  )

  const [busqueda, setBusqueda] = useState("")
  const [modo, setModo] = useState<Modo | null>(null)
  const [actual, setActual] = useState<CertificadoDisposicion | null>(null)
  const [campos, setCampos] = useState<Campos | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  const { usuario, esDonante } = useUsuarioSesion()

  const propios = useMemo(() => {
    if (!esDonante) return certificados
    const donante = donantes.find((d: Donante) => d.usuarioId === usuario?.id)
    const donacionesPropias = new Set(donaciones.filter((d) => d.donanteId === donante?.id).map((d) => d.id))
    const lotesPropios = new Set(lotes.filter((l: Lote) => donacionesPropias.has(l.donacionId)).map((l: Lote) => l.id))
    return certificados.filter((c: CertificadoDisposicion) => lotesPropios.has(c.loteId))
  }, [esDonante, certificados, donantes, donaciones, lotes, usuario])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return propios
    return propios.filter((c: CertificadoDisposicion) =>
      [c.numeroCertificado ?? "", c.gestorAmbiental?.razonSocial ?? "", String(c.loteId)].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  }, [propios, busqueda])

  const lotesParaCertificar = lotes.filter(
    (l: Lote) => donaciones.find((d) => d.id === l.donacionId)?.estadoDonacion?.descripcion === ESTADO_LISTO_PARA_CERTIFICAR,
  )

  function abrir(nuevoModo: Modo, certificado: CertificadoDisposicion | null) {
    setModo(nuevoModo)
    setActual(certificado)
    setArchivo(null)
    setErrorArchivo(null)
    setCampos(
      certificado
        ? camposDe(certificado)
        : {
            loteId: "",
            gestorAmbientalId: "",
            fechaEmision: hoyIso(),
            numeroCertificado: siguienteNumero(certificados),
            terminosCondiciones: "",
          },
    )
  }

  const cerrar = () => setModo(null)
  const cambiar = (parcial: Partial<Campos>) => setCampos((c) => (c ? { ...c, ...parcial } : c))

  function elegirArchivo(elegido: File | null) {
    if (!elegido) {
      setArchivo(null)
      return
    }
    const problema = validarArchivoFinal(elegido)
    setErrorArchivo(problema)
    setArchivo(problema ? null : elegido)
  }

  const listoParaGuardar = !!campos?.loteId && !!campos.gestorAmbientalId && (modo !== "crear" || archivo !== null)

  async function guardar() {
    if (!campos || !listoParaGuardar) {
      toast.error(modo === "crear" && !archivo ? "Adjuntá el certificado final (foto o PDF)" : "Elegí el lote y el gestor ambiental")
      return
    }
    const base = {
      loteId: Number(campos.loteId),
      gestorAmbientalId: Number(campos.gestorAmbientalId),
      terminosCondiciones: campos.terminosCondiciones.trim() || undefined,
    }
    try {
      if (modo === "editar" && actual) {
        await updateCertificado({ id: actual.id, ...base })
        toast.success("Certificado actualizado")
      } else {
        setSubiendo(true)
        const archivoFinalUrl = await uploadFoto(archivo as File)
        await createCertificado({ ...base, archivoFinalUrl })
        toast.success("Certificado creado")
      }
      await mutate()
      cerrar()
    } catch (error) {
      const mensaje = (error as { message?: unknown })?.message
      toast.error(typeof mensaje === "string" && mensaje ? mensaje : "No se pudo guardar el certificado")
    } finally {
      setSubiendo(false)
    }
  }

  async function eliminar(id: number | string) {
    try {
      await deleteCertificado(Number(id))
      await mutate()
      toast.success("Certificado desactivado")
    } catch {
      toast.error("No se pudo eliminar el certificado")
    }
  }

  const titulos: Record<Modo, string> = {
    crear: "Nuevo certificado de disposición",
    editar: "Editar certificado",
    ver: "Ver certificado",
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Certificados de Disposición</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los certificados de disposición final emitidos por gestores ambientales.
        </p>
      </div>

      {esDonante && (
        <AvisoDonante>
          Los certificados de disposición final aparecen acá cuando tu donación está finalizada.
        </AvisoDonante>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por número, gestor o lote..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {visibles.length} {visibles.length === 1 ? "certificado" : "certificados"}
        </span>
        {!esDonante && (
          <Button className="ml-auto" onClick={() => abrir("crear", null)}>
            <Plus className="h-4 w-4" />
            Nuevo certificado
          </Button>
        )}
      </div>

      <DataTable
        data={visibles}
        columns={columnas}
        isLoading={isLoading}
        loadingText="Cargando certificados..."
        emptyText={esDonante ? "Todavía no hay certificados disponibles para vos." : "No hay certificados de disposición registrados."}
        emptySearchText="No se encontraron certificados con ese criterio."
        search={busqueda}
        onView={(c) => abrir("ver", c)}
        onEdit={esDonante ? undefined : (c) => abrir("editar", c)}
        onDownload={(c) => descargar(c.id)}
        onDelete={esDonante ? undefined : eliminar}
        isDeleting={borrando}
      />

      {modo && campos && (
        <FormModal
          open
          onOpenChange={(abierto) => !abierto && cerrar()}
          title={titulos[modo]}
          readOnly={modo === "ver"}
          description={
            actual
              ? `Certificado ${actual.numeroCertificado ?? `#${actual.id}`}.`
              : "Registrá un nuevo certificado de disposición final."
          }
          onSave={guardar}
          isLoading={creando || actualizando || subiendo}
          saveDisabled={!listoParaGuardar}
          saveLabel={modo === "crear" ? "Crear certificado" : "Guardar cambios"}
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Lote *</label>
            <select value={campos.loteId} onChange={(e) => cambiar({ loteId: e.target.value })} className={SELECT_CLASES}>
              <option value="">Seleccionar lote...</option>
              {(actual && !lotesParaCertificar.some((l: Lote) => l.id === actual.loteId)
                ? [...lotesParaCertificar, ...lotes.filter((l: Lote) => l.id === actual.loteId)]
                : lotesParaCertificar
              ).map((l: Lote) => (
                <option key={l.id} value={String(l.id)}>
                  Lote #{l.id}
                  {l.pesoBrutoKg ? `  ${l.pesoBrutoKg} kg` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Gestor ambiental *</label>
            <select
              value={campos.gestorAmbientalId}
              onChange={(e) => cambiar({ gestorAmbientalId: e.target.value })}
              className={SELECT_CLASES}
            >
              <option value="">Seleccionar gestor...</option>
              {gestores.map((g: GestorAmbiental) => (
                <option key={g.id} value={String(g.id)}>
                  {g.razonSocial}
                  {g.cuit ? `  ${g.cuit}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                N° Certificado <span className="font-normal text-muted-foreground">(autogenerado)</span>
              </label>
              <Input value={campos.numeroCertificado} readOnly className="cursor-not-allowed bg-muted" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Fecha de emisión</label>
              <DateInput value={campos.fechaEmision} onChange={() => {}} readOnly className="cursor-not-allowed bg-muted" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Certificado de disposición final {modo === "crear" && "*"}</label>
            {modo === "crear" ? (
              <SelectorArchivoFinal archivo={archivo} error={errorArchivo} onElegir={elegirArchivo} />
            ) : (
              <EnlaceArchivoFinal url={actual?.archivoFinalUrl ?? null} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Términos COD <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              value={campos.terminosCondiciones}
              onChange={(e) => cambiar({ terminosCondiciones: e.target.value })}
              placeholder="Ej: Material procesado conforme normativa vigente"
              maxLength={300}
            />
          </div>
        </FormModal>
      )}
    </div>
  )
}
