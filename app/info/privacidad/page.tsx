import type { Metadata } from "next"
import Link from "next/link"
import { PaginaInfo, Seccion, Lista } from "@/components/landing/pagina-info"
import { EMPRESA } from "@/lib/documentos/empresa"

export const metadata: Metadata = { title: "Política de privacidad | Reboot IT" }

export default function PrivacidadPage() {
  return (
    <PaginaInfo titulo="Política de privacidad" actualizado="noviembre de 2026">
      <Seccion titulo="1. Responsable de los datos">
        <p>
          El responsable del tratamiento de los datos personales es {EMPRESA.razonSocial} (&ldquo;{EMPRESA.marca}&rdquo;),
          con domicilio en {EMPRESA.domicilio}. Tratamos tus datos de acuerdo con la Ley N.º 25.326 de
          Protección de los Datos Personales.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué datos recopilamos">
        <Lista
          items={[
            "Datos de cuenta: nombre, correo electrónico, CUIT o DNI y contraseña (guardada cifrada).",
            "Datos para el retiro: domicilio, fecha y turno elegidos.",
            "Datos de la donación: tipo, marca, modelo y estado de los equipos, y las fotos que se registran durante el proceso.",
            "Registros de uso: acciones realizadas en la plataforma, con fines de auditoría y seguridad.",
          ]}
        />
      </Seccion>

      <Seccion titulo="3. Para qué los usamos">
        <Lista
          items={[
            "Gestionar tu cuenta y autenticarte.",
            "Coordinar los retiros y comunicarnos con vos sobre tus donaciones.",
            "Emitir constancias de retiro y certificados de destrucción o disposición final.",
            "Cumplir obligaciones legales y ambientales sobre el tratamiento de residuos electrónicos.",
          ]}
        />
        <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>
      </Seccion>

      <Seccion titulo="4. Con quién los compartimos">
        <p>
          Solo con quienes intervienen en el servicio: el personal y los transportistas que realizan el
          retiro, y los gestores ambientales habilitados que reciben el material para su disposición final,
          en la medida necesaria para cada tarea.
        </p>
      </Seccion>

      <Seccion titulo="5. Datos dentro de los equipos donados">
        <p>
          Te recomendamos borrar tu información personal antes de donar. De todos modos, los medios de
          almacenamiento que recibimos se destruyen de forma segura y no accedemos a su contenido.
        </p>
      </Seccion>

      <Seccion titulo="6. Tus derechos">
        <p>
          Podés pedir acceso, rectificación, actualización o supresión de tus datos en cualquier momento a
          través de nuestro <Link href="/info/contacto" className="text-red-600 hover:underline">canal de contacto</Link>.
          La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley
          N.º 25.326, atiende las denuncias y reclamos relativos al incumplimiento de las normas sobre
          protección de datos personales.
        </p>
      </Seccion>

      <Seccion titulo="7. Cambios en esta política">
        <p>
          Podemos actualizar esta política. Vamos a publicar la nueva versión en esta página con su fecha de
          actualización.
        </p>
      </Seccion>
    </PaginaInfo>
  )
}
