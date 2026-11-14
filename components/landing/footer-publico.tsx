import Link from "next/link"

type Enlace = { label: string; href: string }

const COLUMNAS: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: "Producto",
    enlaces: [
      { label: "Características", href: "/#caracteristicas" },
      { label: "Cómo funciona", href: "/#como-funciona" },
    ],
  },
  {
    titulo: "Empresa",
    enlaces: [
      { label: "Sobre nosotros", href: "/info/nosotros" },
      { label: "Contacto", href: "/info/contacto" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { label: "Privacidad", href: "/info/privacidad" },
      { label: "Términos", href: "/info/terminos" },
      { label: "Cookies", href: "/info/cookies" },
    ],
  },
]

export function FooterPublico() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" aria-label="Reboot IT - Inicio">
              <img src="/img/logo_reboot_it_sin_fondo.png" alt="Reboot IT" className="h-20 w-auto mb-4" />
            </Link>
            <p className="text-sm">Reciclaje responsable de componentes electrónicos</p>
          </div>

          {COLUMNAS.map((columna) => (
            <div key={columna.titulo}>
              <h3 className="text-white font-semibold mb-4">{columna.titulo}</h3>
              <ul className="space-y-2 text-sm">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.href}>
                    <Link href={enlace.href} className="hover:text-white transition">
                      {enlace.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm">
            © {new Date().getFullYear()} Reboot IT. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
