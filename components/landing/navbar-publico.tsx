import Link from "next/link"

export function NavbarPublico() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 dark:bg-black/95 backdrop-blur supports-backdrop-filter:bg-gray-900/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center" aria-label="Reboot IT - Inicio">
            <img src="/img/logo_reboot_it_sin_fondo.png" alt="Reboot IT" className="h-16 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
