"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { donantesApi } from "@/lib/api"
import { getUser } from "@/lib/auth-utils"
import type { Donante } from "@/lib/type/donante"

type FormErrors = Partial<{ nombre: string; razonSocial: string; direccion: string }>

function isLegalEntity(descripcion: string | undefined): boolean {
  if (!descripcion) return false
  const d = descripcion.toLowerCase()
  return d.includes("empresa") || d.includes("organismo") || d.includes("público") || d.includes("publico")
}

export default function PerfilPage() {
  const user = getUser()
  const [donante, setDonante] = useState<Donante | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ nombre: "", razonSocial: "", direccion: "", telefono: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof typeof form, boolean>>>({})

  useEffect(() => {
    if (!user?.id) return
    donantesApi.getAll().then((lista) => {
      const found = lista.find((d) => d.usuarioId === user.id)
      if (found) {
        setDonante(found)
        setForm({
          nombre: found.nombre ?? "",
          razonSocial: found.razonSocial ?? "",
          direccion: found.direccion ?? "",
          telefono: found.telefono ?? "",
        })
      } else {
        setNotFound(true)
      }
    }).catch(() => setNotFound(true))
  }, [user?.id])

  const usesRazonSocial = isLegalEntity(donante?.tipoDonante?.descripcion)

  function validate(f: typeof form): FormErrors {
    const e: FormErrors = {}
    if (usesRazonSocial) {
      if (!f.razonSocial.trim()) e.razonSocial = "La razón social es obligatoria"
      else if (f.razonSocial.trim().length < 3) e.razonSocial = "Mínimo 3 caracteres"
    } else {
      if (!f.nombre.trim()) e.nombre = "El nombre es obligatorio"
      else if (f.nombre.trim().length < 3) e.nombre = "Mínimo 3 caracteres"
    }
    if (!f.direccion.trim()) e.direccion = "La dirección es obligatoria"
    else if (f.direccion.trim().length < 5) e.direccion = "Ingresá una dirección válida"
    return e
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (touched[name as keyof typeof form]) setErrors(validate(updated))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof typeof form
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors(validate(form))
  }

  const handleSave = async () => {
    const allTouched = { nombre: true, razonSocial: true, direccion: true, telefono: true }
    setTouched(allTouched)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (!donante) return

    setIsSaving(true)
    try {
      const nombreEfectivo = usesRazonSocial ? form.razonSocial.trim() : form.nombre.trim()
      await donantesApi.update(donante.id, {
        nombre: nombreEfectivo,
        razonSocial: usesRazonSocial ? form.razonSocial.trim() : null,
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
      })
      setDonante((prev) => prev ? { ...prev, nombre: nombreEfectivo, razonSocial: form.razonSocial, direccion: form.direccion, telefono: form.telefono } : prev)
      toast.success("Perfil actualizado correctamente")
    } catch {
      toast.error("Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const err = (name: keyof typeof form) =>
    touched[name] && errors[name as keyof FormErrors]
      ? "border-red-400 focus-visible:ring-red-400"
      : ""

  const FieldError = ({ name }: { name: keyof FormErrors }) =>
    touched[name] && errors[name] ? (
      <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
    ) : null

  if (!user) return null

  return (
    <div className="flex flex-col gap-6 p-6 max-w-lg">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Editá tu información de donante.
        </p>
      </div>

      {/* Datos de cuenta — solo lectura */}
      <div className="rounded-2xl border border-border p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Datos de cuenta
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Correo electrónico</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Rol</p>
            <p className="text-sm font-medium capitalize">{user.rol?.nombre ?? "—"}</p>
          </div>
          {donante?.tipoDonante && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipo de donante</p>
              <p className="text-sm font-medium">{donante.tipoDonante.descripcion}</p>
            </div>
          )}
        </div>
      </div>

      {/* Datos editables */}
      {notFound ? (
        <div className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
          No se encontró un perfil de donante asociado a tu cuenta.
        </div>
      ) : !donante ? (
        <div className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
          Cargando perfil...
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Datos de donante
          </h2>

          {/* Nombre o Razón Social según tipo */}
          {usesRazonSocial ? (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Razón Social
              </label>
              <Input
                name="razonSocial"
                type="text"
                placeholder="Empresa S.A."
                className={`h-9 text-sm ${err("razonSocial")}`}
                value={form.razonSocial}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError name="razonSocial" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nombre Completo
              </label>
              <Input
                name="nombre"
                type="text"
                placeholder="Juan Pérez"
                className={`h-9 text-sm ${err("nombre")}`}
                value={form.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError name="nombre" />
            </div>
          )}

          {/* Dirección */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Dirección
            </label>
            <Input
              name="direccion"
              type="text"
              placeholder="Av. Corrientes 1234, CABA"
              className={`h-9 text-sm ${err("direccion")}`}
              value={form.direccion}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <FieldError name="direccion" />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Teléfono <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <Input
              name="telefono"
              type="tel"
              placeholder="+54 11 1234-5678"
              className="h-9 text-sm"
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full mt-1">
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}
    </div>
  )
}
