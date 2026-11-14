import type { Metadata } from "next"
import Link from "next/link"
import { PaginaInfo, Seccion, Lista } from "@/components/landing/pagina-info"

export const metadata: Metadata = { title: "Sobre nosotros | Reboot IT" }

const HISTORIA: { anio: string; parrafos: string[] }[] = [
  {
    anio: "2020",
    parrafos: [
      "Durante la pandemia de COVID-19 (2020), El Pentágono debió reestructurarse debido a la recesión económica, transfiriendo su división de servicios técnicos a uno de los actuales socios fundadores de MSIT, quien posteriormente impulsó la creación de la nueva razón social.",
    ],
  },
  {
    anio: "2021",
    parrafos: [
      "La empresa inició sus actividades brindando soporte técnico y servicios de Service Desk al Grupo Tagle, cliente que permitió su consolidación inicial. En sus primeros años, la compañía orientó su estrategia hacia la profesionalización de los servicios informáticos y la expansión de su cartera de clientes corporativos.",
    ],
  },
  {
    anio: "2022",
    parrafos: [
      "Durante 2022, MSIT amplió su nómina y comenzó a operar en nuevas empresas como Papelera Cumbre, Dulcor S.A. y La Lácteo, lo que implicó la necesidad de ampliar su infraestructura y crear un taller técnico propio, destinado al mantenimiento y reparación de equipamiento informático.",
      "En paralelo, la organización implementó un nuevo esquema de servicios por abono mensual, ofreciendo mantenimiento preventivo de hardware y software a clientes como ATACC y RIC Logística Ambiental. Esta etapa marcó la incorporación de un centro de soporte remoto que permitió atender incidentes de manera centralizada, optimizando recursos y mejorando la atención al cliente.",
    ],
  },
  {
    anio: "2023",
    parrafos: [
      "En 2023, MSIT firmó un contrato estratégico con el Club Atlético Belgrano de Córdoba, a cargo del soporte técnico y la gestión de red durante los eventos deportivos. Este hito consolidó su presencia dentro del sector corporativo y afianzó su reputación como proveedor confiable de soluciones tecnológicas.",
    ],
  },
  {
    anio: "2024",
    parrafos: [
      "A pesar de la coyuntura económica de 2024, la empresa logró mantener la mayoría de sus contratos vigentes, ajustando costos y renegociando condiciones con clientes clave como Grupo Tagle.",
      "Durante este mismo período, MSIT incorporó un nuevo servicio orientado a la gestión y reciclado de residuos tecnológicos (RAEE), formalizando un área dedicada a la recuperación y reutilización de componentes electrónicos. Este nuevo enfoque representa una evolución significativa dentro de su modelo de negocio, integrando la sostenibilidad ambiental y la economía circular como pilares estratégicos de su crecimiento futuro.",
    ],
  },
]

export default function NosotrosPage() {
  return (
    <PaginaInfo
      titulo="Sobre nosotros"
      bajada="Reparamos, reciclamos y reiniciamos el ciclo de vida de los dispositivos electrónicos."
    >
      <Seccion titulo="MSIT S.A.S.">
        <p>
          MSIT S.A.S. (Mesa de Servicios IT) es una empresa cordobesa fundada el 1° de junio de 2021, dedicada
          a la prestación de servicios tecnológicos especializados para empresas. Su origen se vincula con la
          firma El Pentágono S.R.L., una compañía de informática que se dedicaba a la venta de insumos y
          servicio técnico.
        </p>
      </Seccion>

      <Seccion titulo="Nuestra historia">
        <ol className="relative border-l-2 border-red-200 dark:border-red-900 ml-2 space-y-8">
          {HISTORIA.map((etapa) => (
            <li key={etapa.anio} className="pl-6">
              <span
                className="absolute -left-[9px] mt-1.5 size-4 rounded-full bg-red-600 ring-4 ring-white dark:ring-slate-950"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">{etapa.anio}</p>
              <div className="space-y-3">
                {etapa.parrafos.map((parrafo, i) => (
                  <p key={i}>{parrafo}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion titulo="Qué es Reboot IT">
        <p>
          Reboot IT es una plataforma para gestionar la donación, el retiro y el tratamiento responsable de
          equipos electrónicos en desuso. Acompañamos a personas, empresas y organismos desde la solicitud de
          retiro hasta la disposición final, con trazabilidad en cada etapa.
        </p>
      </Seccion>

      <Seccion titulo="Qué hacemos">
        <Lista
          items={[
            "Coordinamos turnos y hojas de ruta para retirar los equipos donados.",
            "Clasificamos el material para reacondicionarlo o derivarlo a reciclaje.",
            "Destruimos de forma segura los medios de almacenamiento y emitimos el certificado correspondiente.",
            "Trabajamos con gestores ambientales habilitados para la disposición final de los residuos.",
          ]}
        />
      </Seccion>

      <Seccion titulo="Por qué lo hacemos">
        <p>
          Los residuos de aparatos eléctricos y electrónicos crecen año a año y mal gestionados, contaminan
          y desperdician materiales valiosos. Creemos que darles una segunda vida, o reciclarlos de forma
          segura, es parte de usar la tecnología de manera responsable.
        </p>
      </Seccion>

      <Seccion titulo="¿Querés sumarte?">
        <p>
          Creá una cuenta para solicitar tu primer retiro, o{" "}
          <Link href="/info/contacto" className="text-red-600 hover:underline">escribinos</Link> si tenés
          dudas.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center px-6 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
        >
          Crear cuenta
        </Link>
      </Seccion>
    </PaginaInfo>
  )
}