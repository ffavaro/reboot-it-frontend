import type { Metadata } from "next"
import Link from "next/link"
import { PaginaInfo, Seccion, Lista } from "@/components/landing/pagina-info"
import { EMPRESA } from "@/lib/documentos/empresa"

export const metadata: Metadata = { title: "Términos y condiciones | Reboot IT" }

export default function TerminosPage() {
  return (
    <PaginaInfo titulo="Términos y condiciones" actualizado="noviembre de 2026">
      <Seccion titulo="1. Aceptación">
        <p>
          Al crear una cuenta o usar la plataforma {EMPRESA.marca}, operada por {EMPRESA.razonSocial},
          aceptás estos términos. Si no estás de acuerdo, no uses el servicio. Podes comunicarte con nosotros a via telefonica o email.
        </p>
      </Seccion>

      <Seccion titulo="2. El servicio">
        <p>
          {EMPRESA.marca} permite solicitar el retiro de equipos electrónicos en desuso, seguir el estado de
          cada donación y obtener la documentación asociada (constancias de retiro y certificados de
          disposición final).
        </p>
      </Seccion>

      <Seccion titulo="3. Tu cuenta">
        <Lista
          items={[
            "Tenés que brindar datos reales y mantenerlos actualizados.",
            "Sos responsable de cuidar tu contraseña y de la actividad hecha con tu cuenta.",
            "Podemos suspender cuentas que hagan un uso indebido de la plataforma.",
          ]}
        />
      </Seccion>

      <Seccion titulo="4. Donaciones y retiros">
        <Lista
          items={[
            "Declarás que sos titular de los equipos que donás o que tenés autorización para entregarlos.",
            "Los turnos de retiro están sujetos a disponibilidad y se confirman desde la plataforma.",
            "El retiro a domicilio puede tener un costo adicional, que se informa antes de confirmarlo.",
            "Una vez entregados, los equipos pasan a ser gestionados por Reboot IT y no se devuelven.",
            "Los medios de almacenamiento son destruidos de forma segura una vez informado y aprobado por el cliente.",
          ]}
        />
      </Seccion>

      <Seccion titulo="5. Información en los equipos">
        <p>
          Es responsabilidad del donante respaldar y borrar su información antes de la entrega. Reboot IT
          destruye de forma segura los medios de almacenamiento recibidos, pero no recupera ni devuelve
          datos.
        </p>
      </Seccion>

      <Seccion titulo="6. Limitación de responsabilidad">
        <p>
          Hacemos lo posible para que la plataforma esté disponible y funcione correctamente, pero no
          garantizamos que esté libre de interrupciones o errores.
        </p>
      </Seccion>

      <Seccion titulo="7. Modificaciones">
        <p>
          Podemos modificar estos términos. Los cambios rigen desde su publicación en esta página.
        </p>
      </Seccion>

      <Seccion titulo="8. Contacto">
        <p>
          Ante cualquier consulta, usá nuestro{" "}
          <Link href="/info/contacto" className="text-red-600 hover:underline">canal de contacto</Link>.
        </p>
      </Seccion>
    </PaginaInfo>
  )
}
