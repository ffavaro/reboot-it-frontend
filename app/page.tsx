'use client'

import { Recycle, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-red-100 dark:border-red-900 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-600 text-white">
                <Recycle className="size-5" />
              </div>
              <span className="text-red-700 dark:text-red-400">Reboot IT</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="px-3 py-2 text-sm font-medium hover:text-red-400 transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/register" className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-red-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-950 dark:to-red-950 py-20 sm:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 dark:bg-red-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-200 dark:bg-rose-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 mb-6">
              ♻️ Reciclaje tecnológico responsable
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Recicla tus componentes electrónicos de forma <span className="text-red-400 dark:text-red-400">responsable</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Reboot IT te ayuda a dar una segunda vida a tus dispositivos electrónicos. Recogemos, reparamos y reciclamos de manera segura y sostenible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">
                Comenzar ahora
                <ArrowRight className="size-5" />
              </Link>
              <Link href="#" className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-red-300 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
                Saber más
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Por qué elegir Reboot IT?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Somos expertos en reciclaje de componentes electrónicos con certificación ambiental
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Recycle,
                title: "100% Ecológico",
                description: "Reciclaje responsable siguiendo estándares ambientales internacionales"
              },
              {
                icon: Zap,
                title: "Recogida Rápida",
                description: "Recoger tus dispositivos en casa sin costo adicional"
              },
              {
                icon: Shield,
                title: "Datos Seguros",
                description: "Eliminación segura de datos con certificado de destrucción"
              },
              {
                icon: TrendingUp,
                title: "Transparencia Total",
                description: "Seguimiento completo del proceso de reciclaje en línea"
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-red-200 dark:border-red-900 hover:border-red-400 dark:hover:border-red-700 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                  <feature.icon className="size-6 text-red-400 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 sm:py-32 bg-linear-to-br from-red-50 to-rose-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Cómo funciona
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Cuatro pasos simples para reciclar responsablemente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Solicita Recogida",
                description: "Completa el formulario indicando qué dispositivos deseas reciclar"
              },
              {
                step: "2",
                title: "Confirmamos",
                description: "Nos comunicaremos para confirmar fecha y hora de la recogida"
              },
              {
                step: "3",
                title: "Recogemos",
                description: "Pasamos por tu dirección para recoger los componentes"
              },
              {
                step: "4",
                title: "Reciclamos",
                description: "Reciclamos responsablemente y te enviamos certificado"
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                    {item.description}
                  </p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-linear-to-r from-red-300 to-transparent transform -translate-y-1/2 -translate-x-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-red-600 dark:bg-red-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para hacer una diferencia?
          </h2>
          <p className="text-lg text-red-50 mb-8 max-w-2xl mx-auto">
            Únete a miles de usuarios que confían en Reboot IT para reciclar responsablemente sus componentes electrónicos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-red-400 hover:bg-gray-100 transition-colors font-medium">
              Crear cuenta 
              <ArrowRight className="size-5" />
            </Link>
            <Link href="#contact" className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-white text-white hover:bg-white/10 transition-colors font-medium">
              Contactar soporte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-white mb-4">
                <div className="flex size-6 items-center justify-center rounded-lg bg-red-600">
                  <Recycle className="size-4" />
                </div>
                Reboot IT
              </div>
              <p className="text-sm">Reciclaje responsable de componentes electrónicos</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Características</a></li>
                <li><a href="#" className="hover:text-white transition">Precios</a></li>
                <li><a href="#" className="hover:text-white transition">Documentación</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition">Términos</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              © 2025 Reboot IT. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}