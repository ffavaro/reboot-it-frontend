import type { ReactNode } from "react"
import { NavbarPublico } from "./navbar-publico"
import { FooterPublico } from "./footer-publico"

type Props = {
  titulo: string
  bajada?: string
  actualizado?: string
  children: ReactNode
}


export function PaginaInfo({ titulo, bajada, actualizado, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <NavbarPublico />

      <header className="bg-linear-to-br from-red-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-950 dark:to-red-950 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            {titulo}
          </h1>
          {bajada && <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{bajada}</p>}
          {actualizado && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Última actualización: {actualizado}</p>
          )}
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">
          {children}
        </div>
      </main>

      <FooterPublico />
    </div>
  )
}


export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{titulo}</h2>
      {children}
    </section>
  )
}


export function Lista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-6 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
