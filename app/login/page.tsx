"use client"

import { LoginForm } from "@/components/login-form"
import { Recycle } from "lucide-react"
import Link from "next/link"

export default function LoginPages() {
  return (
    <div className="grid h-screen lg:grid-cols-2">
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
      <div className="hidden lg:block w-full h-full overflow-hidden bg-black">
        <img
          src="../../img/rebootit_login_v6.svg"
          alt="Ilustración de Reboot IT"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
