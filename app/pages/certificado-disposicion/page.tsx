"use client"
import { Plus, FileText, ExternalLink } from "lucide-react"

import { useState, useEffect } from "react"
import type { TokenPayload } from "@/lib/auth-utils"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { CrearButton } from "@/components/ui/crear-button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { FormModal } from "@/components/ui/form-modal"
import { DateInput } from "@/components/ui/date-input"
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
import type { CertificadoDisposicion } from "@/lib/type/certificado-disposicion"
import type { Lote } from "@/lib/type/lote"
import type { GestorAmbiental } from "@/lib/type/gestor-ambiental"
import type { Donante } from "@/lib/type/donante"
import { formatDate, getErrorMessage } from "@/lib/utils/helpers"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { getUser } from "@/lib/auth-utils"
import { uploadFoto } from "@/lib/api/client"
import { certificadoDisposicionApi } from "@/lib/api/certificado-disposicion"
import { descargarCertificadoPdf } from "@/lib/utils/certificado-pdf"

const EMPTY_FORM = {
  loteId: "",
  gestorAmbientalId: "",
  fechaEmision: "",
  numeroCertificado: "",
  terminosCondiciones: "",
}

function todayISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function previewNumeroCertificado(certificados: CertificadoDisposicion[]): string {
  const anio = new Date().getFullYear()
  const prefijo = `CERT-${anio}-`
  const cantidad = certificados.filter((c) => c.numeroCertificado?.startsWith(prefijo)).length
  return `${prefijo}${String(cantidad + 1).padStart(4, "0")}`
}

const columns: TableColumn<CertificadoDisposicion>[] = [
  {
    key: "numeroCertificado",
    header: "N° Certificado",
    cell: (c) => c.numeroCertificado ?? <span className="italic text-muted-foreground">—</span>,
    className: "font-mono text-xs font-medium",
  },
  {
    key: "gestorAmbiental",
    header: "Gestor ambiental",
    cell: (c) => c.gestorAmbiental?.razonSocial ?? <span className="italic text-muted-foreground">—</span>,
  },
  {
    key: "lote",
    header: "Lote",
    cell: (c) => <span className="font-mono text-xs">#{c.loteId}</span>,
    className: "text-muted-foreground",
  },
  {
    key: "fechaEmision",
    header: "Fecha emisión",
    cell: (c) => formatDate(c.fechaEmision) ?? <span className="italic">—</span>,
    className: "text-muted-foreground",
  },
  {
    key: "archivoFinal",
    header: "Certificado final",
    cell: (c) =>
      c.archivoFinalUrl ? (
        <a
          href={c.archivoFinalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <FileText className="h-3.5 w-3.5" />
          Ver archivo
        </a>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "terminos",
    header: "Términos",
    cell: (c) => c.terminosCondiciones ?? <span className="italic">—</span>,
    className: "text-muted-foreground max-w-xs truncate",
  },
]

export default function CertificadoDisposicionPage() {
  const { certificados, isLoading, mutate } = useCertificadosDisposicion()
  const { lotes } = useLotes()
  const { gestores } = useGestoresAmbientales()
  const { donantes } = useDonantes()
  const { donaciones } = useDonaciones()
  const { createCertificado, isLoading: isCreating } = useCreateCertificadoDisposicion()
  const { updateCertificado, isLoading: isUpdating } = useUpdateCertificadoDisposicion()
  const { deleteCertificado, isLoading: isDeleting } = useDeleteCertificadoDisposicion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<CertificadoDisposicion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [user, setUser] = useState<TokenPayload | null>(null)
  // Certificado de disposición final (foto o PDF): obligatorio al crear
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoError, setArchivoError] = useState("")
  const [subiendo, setSubiendo] = useState(false)

  function elegirArchivo(file: File | undefined) {
    if (!file) return
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) {
      setArchivoError("El archivo debe ser una imagen JPG, PNG o WEBP, o un PDF")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setArchivoError("El archivo no puede superar los 5 MB")
      return
    }
    setArchivoError("")
    setArchivo(file)
  }

  useEffect(() => { setUser(getUser()) }, [])

  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const myDonante = isDonante
    ? donantes.find((d: Donante) => d.usuarioId === user?.id) ?? null
    : null
  const myLoteIds = isDonante
    ? new Set(
        donaciones
          .filter((d) => d.donanteId === myDonante?.id)
          .flatMap((d) => lotes.filter((l: Lote) => l.donacionId === d.id).map((l: Lote) => l.id))
      )
    : null

  const visibleCertificados = isDonante && myLoteIds
    ? certificados.filter((c: CertificadoDisposicion) => myLoteIds.has(c.loteId))
    : certificados

  const filtered = visibleCertificados.filter((c: CertificadoDisposicion) => {
    const q = search.toLowerCase()
    return (
      (c.numeroCertificado ?? "").toLowerCase().includes(q) ||
      (c.gestorAmbiental?.razonSocial ?? "").toLowerCase().includes(q) ||
      String(c.loteId).includes(q)
    )
  })

  const lotesDisponibles = lotes.filter((l: Lote) => {
    const don = donaciones.find((d) => d.id === l.donacionId)
    return don?.estadoDonacion?.descripcion === "Pendiente de emision certificado"
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setArchivo(null)
    setArchivoError("")
    setForm({
      ...EMPTY_FORM,
      fechaEmision: todayISO(),
      numeroCertificado: previewNumeroCertificado(certificados),
    })
    setSheetOpen(true)
  }

  function openEdit(c: CertificadoDisposicion) {
    setIsViewing(false)
    setEditing(c)
    setArchivo(null)
    setArchivoError("")
    setForm({
      loteId: String(c.loteId),
      gestorAmbientalId: String(c.gestorAmbientalId),
      fechaEmision: c.fechaEmision ? c.fechaEmision.slice(0, 10) : "",
      numeroCertificado: c.numeroCertificado ?? "",
      terminosCondiciones: c.terminosCondiciones ?? "",
    })
    setSheetOpen(true)
  }

  function openView(c: CertificadoDisposicion) {
    setIsViewing(true)
    setEditing(c)
    setArchivo(null)
    setArchivoError("")
    setForm({
      loteId: String(c.loteId),
      gestorAmbientalId: String(c.gestorAmbientalId),
      fechaEmision: c.fechaEmision ? c.fechaEmision.slice(0, 10) : "",
      numeroCertificado: c.numeroCertificado ?? "",
      terminosCondiciones: c.terminosCondiciones ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.loteId || !form.gestorAmbientalId) {
      toast.error("El lote y el gestor ambiental son obligatorios")
      return
    }
    if (!editing && !archivo) {
      setArchivoError("Subí el certificado de disposición final (foto o PDF)")
      toast.error("El certificado de disposición final es obligatorio")
      return
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        gestorAmbientalId: Number(form.gestorAmbientalId),
        terminosCondiciones: form.terminosCondiciones.trim() || undefined,
      }
      if (editing) {
        await updateCertificado({ id: editing.id, ...payload })
        toast.success("Certificado actualizado")
      } else {
        setSubiendo(true)
        const archivoFinalUrl = await uploadFoto(archivo as File)
        await createCertificado({ ...payload, archivoFinalUrl })
        toast.success("Certificado creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al guardar el certificado"))
    } finally {
      setSubiendo(false)
    }
  }

  // El PDF se arma al descargar con los datos del certificado (no se guarda en el servidor)
  async function descargarPdf(id: number) {
    try {
      descargarCertificadoPdf(await certificadoDisposicionApi.datos(id))
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo descargar el certificado"))
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteCertificado(Number(id))
      await mutate()
      toast.success("Certificado desactivado")
    } catch {
      toast.error("Error al eliminar el certificado")
    }
  }

  const canSave = !!form.loteId && !!form.gestorAmbientalId && (!!editing || !!archivo)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Certificados de Disposición</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los certificados de disposición final emitidos por gestores ambientales.
        </p>
      </div>

      {isDonante && (
        <div role="status" className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Tus certificados de disposición van a estar disponibles cuando tu donación se encuentre finalizada.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por número, gestor o lote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} certificado{filtered.length !== 1 ? "s" : ""}
        </span>
        {!isDonante && (
          <CrearButton  className="ml-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo certificado
          </CrearButton>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        onDownload={(c) => descargarPdf(c.id)}
        isLoading={isLoading}
        loadingText="Cargando certificados..."
        emptyText={isDonante ? "Todavía no tenés certificados disponibles." : "No hay certificados de disposición registrados."}
        emptySearchText="No se encontraron certificados con ese criterio."
        search={search}
        onView={openView}
        onEdit={isDonante ? undefined : openEdit}
        onDelete={isDonante ? undefined : handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={isViewing ? "Ver certificado" : "Gestionar certificado de disposición"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos del certificado "${editing.numeroCertificado ?? `#${editing.id}`}".`
            : "Registrá un nuevo certificado de disposición final."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating || subiendo}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear certificado"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote *</label>
          <select
            value={form.loteId}
            onChange={(e) => setForm((f) => ({ ...f, loteId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar lote...</option>
            {lotesDisponibles.map((l: Lote) => (
              <option key={l.id} value={String(l.id)}>
                Lote #{l.id}{l.pesoBrutoKg ? ` — ${l.pesoBrutoKg} kg` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Gestor ambiental *</label>
          <select
            value={form.gestorAmbientalId}
            onChange={(e) => setForm((f) => ({ ...f, gestorAmbientalId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar gestor...</option>
            {gestores.map((g: GestorAmbiental) => (
              <option key={g.id} value={String(g.id)}>
                {g.razonSocial}{g.cuit ? ` — ${g.cuit}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            N° Certificado <span className="text-muted-foreground font-normal">(autogenerado)</span>
          </label>
          <Input
            value={form.numeroCertificado}
            readOnly
            className="bg-muted cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fecha de emisión</label>
          <DateInput
            value={form.fechaEmision}
            onChange={() => {}}
            readOnly
            className="bg-muted cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Certificado de disposición final {!editing && "*"}{" "}
            {!editing && <span className="text-muted-foreground font-normal">(foto o PDF, hasta 5 MB)</span>}
          </label>
          {editing ? (
            // El archivo queda fijo desde que se emite el certificado
            editing.archivoFinalUrl ? (
              <a
                href={editing.archivoFinalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex w-fit items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir el certificado final
              </a>
            ) : (
              <p className="text-sm italic text-muted-foreground">Este certificado se emitió sin archivo adjunto.</p>
            )
          ) : (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => elegirArchivo(e.target.files?.[0])}
                className="text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium cursor-pointer"
              />
              {archivo && <p className="text-xs text-muted-foreground">Seleccionado: {archivo.name}</p>}
              {archivoError && <p className="text-xs text-destructive">{archivoError}</p>}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Términos COD <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.terminosCondiciones}
            onChange={(e) => setForm((f) => ({ ...f, terminosCondiciones: e.target.value }))}
            placeholder="Ej: Material procesado conforme normativa vigente"
            maxLength={300}
          />
        </div>
      </FormModal>
    </div>
  )
}
