"use client"

import { LoginForm } from "@/components/login-form"
import { Recycle, Leaf, Package } from "lucide-react"
import Link from "next/link"
import { useCountUp } from "@/hooks/use-count-up"

export default function LoginPages() {
  return (
    <div className="grid h-screen lg:grid-cols-2">
      {/* Panel izquierdo: fondo animado + mensaje de impacto */}
      <div className="hidden lg:flex relative w-full h-full overflow-hidden bg-black items-center justify-center p-10">
        {/* Blobs animados de fondo, con la paleta de la app (primary + chart-2 verde) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-6rem] left-[-4rem] w-96 h-96 rounded-full bg-primary/40 blur-3xl animate-blob" />
          <div className="absolute bottom-[-8rem] right-[-4rem] w-[28rem] h-[28rem] rounded-full bg-[var(--chart-2)]/30 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-[var(--chart-3)]/25 blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Contenido sobre los blobs */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-md">
          <img
            src="../../img/logo_reboot_it.png"
            alt="Reboot IT"
            className="w-40 h-40 object-contain rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-700"
          />
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
            <p className="text-white/90 text-lg font-medium leading-snug">
              Transformamos residuos electrónicos en segundas oportunidades
            </p>
          </div>

          {/* Contador de impacto ambiental */}
          <div className="flex items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
            <ImpactStat icon={Leaf} value={8.4} decimals={1} suffix=" t" label="RAEE recicladas" />
            <div className="w-px h-10 bg-white/20" />
            <ImpactStat icon={Package} value={512} suffix="" label="donaciones procesadas" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10 overflow-auto">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Recycle className="size-4" />
            </div>
             Reboot IT - Reciclaje de Dispositivos Electrónicos
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Estadística de impacto animada (para el panel del login) ───────────────
function ImpactStat({ icon: Icon, value, suffix = "", decimals = 0, label }: {
  icon: typeof Leaf
  value: number
  suffix?: string
  decimals?: number
  label: string
}) {
  const animated = useCountUp(value, 1400)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 text-white">
        <Icon className="w-4 h-4 text-[var(--chart-2)]" />
        <span className="text-xl font-semibold tabular-nums">
          {animated.toFixed(decimals)}{suffix}
        </span>
      </div>
      <p className="text-[11px] text-white/60">{label}</p>
    </div>
  )
}
