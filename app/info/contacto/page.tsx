import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MapPin } from "lucide-react"
import { PaginaInfo, Seccion } from "@/components/landing/pagina-info"
import { EMPRESA } from "@/lib/documentos/empresa"

export const metadata: Metadata = { title: "Contacto | Reboot IT" }

export default function ContactoPage() {
  return (
    <PaginaInfo titulo="Contacto" bajada="¿Tenes dudas sobre una donación o un retiro? Escribinos.">
      <div className="grid sm:grid-cols-2 gap-6">
        {EMPRESA.contacto && (
          <a
            href={`mailto:${EMPRESA.contacto}`}
            className="flex gap-4 p-6 rounded-lg border border-red-200 dark:border-red-900 hover:border-red-400 transition-colors"
          >
            <Mail className="size-6 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Correo</p>
              <p>{EMPRESA.contacto}</p>
            </div>
          </a>
        )}

        <div className="flex gap-4 p-6 rounded-lg border border-red-200 dark:border-red-900">
          <MapPin className="size-6 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Dirección</p>
            <p>{EMPRESA.domicilio}</p>
          </div>
        </div>
      </div>

      <Seccion titulo="Solicitar un retiro">
        <p>
          Para donar equipos no hace falta escribirnos: creá una cuenta y cargá la solicitud desde la
          plataforma. Ahí vas a poder elegir el turno y seguir el estado de tu donación.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 rounded-full border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors font-medium"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </Seccion>
    </PaginaInfo>
  )
}
