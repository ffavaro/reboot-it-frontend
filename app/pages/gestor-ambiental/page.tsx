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
  useGestoresAmbientales,
  useCreateGestorAmbiental,
  useUpdateGestorAmbiental,
  useDeleteGestorAmbiental,
} from "@/hooks/use-gestor-ambiental"
import type { GestorAmbiental } from "@/lib/type/gestor-ambiental"

const EMPTY_FORM = { razonSocial: "", cuit: "", habilitacion: "", contacto: "" }

export default function GestorAmbientalPage() {
  const { gestores, isLoading, mutate } = useGestoresAmbientales()
  const { createGestor, isLoading: isCreating } = useCreateGestorAmbiental()
  const { updateGestor, isLoading: isUpdating } = useUpdateGestorAmbiental()
  const { deleteGestor, isLoading: isDeleting } = useDeleteGestorAmbiental()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<GestorAmbiental | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = gestores.filter(
    (g) =>
      g.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      (g.cuit ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.habilitacion ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.contacto ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(g: GestorAmbiental) {
    setEditing(g)
    setForm({
      razonSocial: g.razonSocial,
      cuit: g.cuit ?? "",
      habilitacion: g.habilitacion ?? "",
      contacto: g.contacto ?? "",
    })
    setSheetOpen(true)
  }

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.razonSocial.trim()) {
      toast.error("La razón social es obligatoria")
      return
    }
    try {
      const payload = {
        razonSocial: form.razonSocial.trim(),
        cuit: form.cuit.trim() || undefined,
        habilitacion: form.habilitacion.trim() || undefined,
        contacto: form.contacto.trim() || undefined,
      }
      if (editing) {
        await updateGestor({ id: editing.id, ...payload })
        toast.success("Gestor ambiental actualizado")
      } else {
        await createGestor(payload)
        toast.success("Gestor ambiental creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el gestor ambiental")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteGestor(id)
      await mutate()
      toast.success("Gestor ambiental desactivado")
    } catch {
      toast.error("Error al eliminar el gestor ambiental")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestores Ambientales</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las empresas habilitadas para la disposición final de materiales.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por razón social, CUIT, habilitación o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} gestor{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo gestor
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Razón social</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">CUIT</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Habilitación</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contacto</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando gestores ambientales...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron gestores con ese criterio."
                    : "No hay gestores ambientales registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{g.razonSocial}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {g.cuit ?? <span className="italic not-italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {g.habilitacion ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {g.habilitacion}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {g.contacto ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === g.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => handleDelete(g.id)}
                            disabled={isDeleting}
                          >
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(g)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(g.id)}
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
            <SheetTitle>{editing ? "Editar gestor ambiental" : "Nuevo gestor ambiental"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos de "${editing.razonSocial}".`
                : "Completá los datos del nuevo gestor ambiental."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Razón social</label>
              <Input
                value={form.razonSocial}
                onChange={(e) => set("razonSocial", e.target.value)}
                placeholder="Ej: Reciclados S.A."
                maxLength={150}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                CUIT <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                value={form.cuit}
                onChange={(e) => set("cuit", e.target.value)}
                placeholder="30-12345678-9"
                maxLength={20}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                N° de habilitación <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                value={form.habilitacion}
                onChange={(e) => set("habilitacion", e.target.value)}
                placeholder="Ej: HAB-2024-001"
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Contacto <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                value={form.contacto}
                onChange={(e) => set("contacto", e.target.value)}
                placeholder="Ej: info@reciclados.com / +54 11 1234-5678"
                maxLength={100}
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={handleSave}
              disabled={isCreating || isUpdating}
              className="w-full"
            >
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear gestor"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
