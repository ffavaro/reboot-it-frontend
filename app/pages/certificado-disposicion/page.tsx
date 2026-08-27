"use client"
import { Plus } from "lucide-react"

import { useState, useEffect } from "react"
import type { TokenPayload } from "@/lib/auth-utils"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
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
import { formatDate } from "@/lib/utils/helpers"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { getUser } from "@/lib/auth-utils"

const EMPTY_FORM = {
  loteId: "",
  gestorAmbientalId: "",
  fechaEmision: "",
  numeroCertificado: "",
  terminosCondiciones: "",
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
    setForm({
      ...EMPTY_FORM,
      fechaEmision: new Date().toISOString().slice(0, 10),
      numeroCertificado: `CERT-${new Date().getFullYear()}-`,
    })
    setSheetOpen(true)
  }

  function openEdit(c: CertificadoDisposicion) {
    setIsViewing(false)
    setEditing(c)
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
    try {
      const payload = {
        loteId: Number(form.loteId),
        gestorAmbientalId: Number(form.gestorAmbientalId),
        fechaEmision: form.fechaEmision || undefined,
        numeroCertificado: form.numeroCertificado.trim() || undefined,
        terminosCondiciones: form.terminosCondiciones.trim() || undefined,
      }
      if (editing) {
        await updateCertificado({ id: editing.id, ...payload })
        toast.success("Certificado actualizado")
      } else {
        await createCertificado(payload)
        toast.success("Certificado creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el certificado")
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Certificados de Disposición</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los certificados de disposición final emitidos por gestores ambientales.
        </p>
      </div>

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
          <Button  className="ml-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo certificado
          </Button>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando certificados..."
        emptyText="No hay certificados de disposición registrados."
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
        title={isViewing ? "Ver certificado" : editing ? "Editar certificado" : "Nuevo certificado de disposición"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos del certificado "${editing.numeroCertificado ?? `#${editing.id}`}".`
            : "Registrá un nuevo certificado de disposición final."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear certificado"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote</label>
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
          <label className="text-sm font-medium">Gestor ambiental</label>
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
            N° Certificado <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.numeroCertificado}
            onChange={(e) => setForm((f) => ({ ...f, numeroCertificado: e.target.value }))}
            placeholder="Ej: CERT-2025-0001"
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Fecha de emisión <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <DateInput
            value={form.fechaEmision}
            onChange={(val) => setForm((f) => ({ ...f, fechaEmision: val }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Términos COD <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.terminosCondiciones}
            onChange={(e) => setForm((f) => ({ ...f, terminosCondiciones: e.target.value }))}
            placeholder="Ej: Material procesado conforme normativa vigente"
            maxLength={500}
          />
        </div>
      </FormModal>
    </div>
  )
}
