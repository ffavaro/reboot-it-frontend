import type { Metadata } from "next"
import { PaginaInfo, Seccion } from "@/components/landing/pagina-info"

export const metadata: Metadata = { title: "Política de cookies | Reboot IT" }

const ALMACENAMIENTO = [
  {
    nombre: "session",
    tipo: "Cookie",
    finalidad: "Mantener tu sesión iniciada.",
    duracion: "Hasta que vence la sesión",
  },
  {
    nombre: "theme",
    tipo: "Almacenamiento local",
    finalidad: "Recordar si elegiste el tema claro u oscuro.",
    duracion: "Hasta que lo borres",
  },
  {
    nombre: "Diseño del tablero",
    tipo: "Almacenamiento local",
    finalidad: "Recordar como acomodaste los paneles del dashboards.",
    duracion: "Hasta que lo borres",
  },
]

export default function CookiesPage() {
  return (
    <PaginaInfo titulo="Política de cookies" actualizado="noviembre de 2026">
      <Seccion titulo="Qué usamos">
        <p>
          Solo usamos cookies y almacenamiento local estrictamente necesarios para que la plataforma
          funcione. No usamos cookies de publicidad ni de seguimiento.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 dark:border-gray-800">
            <thead className="bg-gray-50 dark:bg-slate-900 text-left text-gray-900 dark:text-white">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Finalidad</th>
                <th className="p-3">Duración</th>
              </tr>
            </thead>
            <tbody>
              {ALMACENAMIENTO.map((fila) => (
                <tr key={fila.nombre} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="p-3 font-mono">{fila.nombre}</td>
                  <td className="p-3">{fila.tipo}</td>
                  <td className="p-3">{fila.finalidad}</td>
                  <td className="p-3">{fila.duracion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo="Servicios de terceros">
        <p>
          En las secciones con mapas cargamos imágenes de OpenStreetMap, que recibe tu dirección IP al
          servirlas. No compartimos tus datos de tu cuenta con el servico.
        </p>
      </Seccion>

      <Seccion titulo="Cómo controlarlas">
        <p>
          Podés borrar las cookies y el almacenamiento local desde la configuración de tu navegador. Si
          borrás la cookie de sesión, vas a tener que volver a iniciar sesión.
        </p>
      </Seccion>
    </PaginaInfo>
  )
}
