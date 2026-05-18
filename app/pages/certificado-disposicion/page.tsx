"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  useCertificadosDisposicion,
  useCreateCertificadoDisposicion,
  useUpdateCertificadoDisposicion,
  useDeleteCertificadoDisposicion,
} from "@/hooks/use-certificado-disposicion"
import { useLotes } from "@/hooks/use-lote"
import { useGestoresAmbientales } from "@/hooks/use-gestor-ambiental"
import type { CertificadoDisposicion } from "@/lib/type/certificado-disposicion"
import type { Lote } from "@/lib/type/lote"
import type { GestorAmbiental } from "@/lib/type/gestor-ambiental"

const EMPTY_FORM = {
  loteId: "",
  gestorAmbientalId: "",
  fechaEmision: "",
  numeroCertificado: "",
  terminosCondiciones: "",
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function CertificadoDisposicionPage() {
  const { certificados, isLoading, mutate } = useCertificadosDisposicion()
  const { lotes } = useLotes()
  const { gestores } = useGestoresAmbientales()
  const { createCertificado, isLoading: isCreating } = useCreateCertificadoDisposicion()
  const { updateCertificado, isLoading: isUpdating } = useUpdateCertificadoDisposicion()
  const { deleteCertificado, isLoading: isDeleting } = useDeleteCertificadoDisposicion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<CertificadoDisposicion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = certificados.filter((c: CertificadoDisposicion) => {
    const q = search.toLowerCase()
    return (
      (c.numeroCertificado ?? "").toLowerCase().includes(q) ||
      (c.gestorAmbiental?.razonSocial ?? "").toLowerCase().includes(q) ||
      String(c.loteId).includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(c: CertificadoDisposicion) {
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

  async function handleDelete(id: number) {
    try {
      await deleteCertificado(id)
      await mutate()
      toast.success("Certificado desactivado")
    } catch {
      toast.error("Error al eliminar el certificado")
    } finally {
      setDeletingId(null)
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

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por número, gestor o lote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} certificado{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo certificado
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">N° Certificado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gestor ambiental</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lote</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha emisión</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Términos</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando certificados...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron certificados con ese criterio."
                    : "No hay certificados de disposición registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((c: CertificadoDisposicion) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    {c.numeroCertificado ?? <span className="italic text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.gestorAmbiental?.razonSocial ?? <span className="italic text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    #{c.loteId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.fechaEmision) ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {c.terminosCondiciones ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === c.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(c.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(c)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(c.id)}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && setSheetOpen(false)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar certificado" : "Nuevo certificado de disposición"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos del certificado "${editing.numeroCertificado ?? `#${editing.id}`}".`
                : "Registrá un nuevo certificado de disposición final."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Lote</label>
              <select
                value={form.loteId}
                onChange={(e) => setForm((f) => ({ ...f, loteId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar lote...</option>
                {lotes.map((l: Lote) => (
                  <option key={l.id} value={l.id}>
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
                  <option key={g.id} value={g.id}>
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
              <Input
                type="date"
                value={form.fechaEmision}
                onChange={(e) => setForm((f) => ({ ...f, fechaEmision: e.target.value }))}
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
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear certificado"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
