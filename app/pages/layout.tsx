"use client"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserIcon, ChevronRight, LogOut } from "lucide-react"
import { useEffect, useState } from "react";
import { getUser, clearSession } from "@/lib/auth-utils"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "react-toastify"
import { homeDePermisos, puedeAccederARuta } from "@/lib/nav"
import { useMisPermisos } from "@/hooks/use-permisos"
import { PermisosPantallaProvider } from "@/components/permisos-pantalla"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  const [sesionLeida, setSesionLeida] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => { setUser(getUser()); setSesionLeida(true) }, [])

  const { permisos, error: errorPermisos } = useMisPermisos()

  // Protección de pantallas según la matriz de permisos del rol (la misma regla que el menú; el backend valida de nuevo).
  // null = todavía no se leyó la sesión o los permisos · false = el rol no puede ver esta ruta
  const acceso = !sesionLeida ? null : !user ? false : permisos ? puedeAccederARuta(pathname, permisos) : null

  useEffect(() => {
    // sin sesión, o sin poder leer los permisos del usuario: se vuelve a iniciar sesión
    if (sesionLeida && (!user || errorPermisos)) {
      clearSession()
      router.replace("/login")
      return
    }
    if (acceso !== false) return
    toast.error("No tenés permisos para ver esa pantalla.", { toastId: "sin-permiso" })
    router.replace(homeDePermisos(permisos))
  }, [acceso, sesionLeida, user, errorPermisos, permisos, router])

  const handleLogout = () => {
    clearSession()
    router.push("/")
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <ThemeProvider defaultTheme="light">
        <AppSidebar />
        <SidebarInset className="bg-slate-200/70">
           <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-slate-900 border-b border-white/10 shadow-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-3 px-4">
              <SidebarTrigger className="-ml-1 text-white hover:bg-white/10 hover:text-white" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sm font-medium tracking-tight text-white">Reboot IT</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-4 px-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full">
                    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-white/10 text-xs text-white">
                          {user.nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left leading-tight">
                        <span className="text-white">{user.nombre}</span>
                        <span className="text-xs text-white/60 font-normal">{user.email}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-auto text-white/60" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => router.push("/pages/perfil")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} variant="destructive">
                     <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          <main className="p-4 md:p-6">
            {/* No se monta la pantalla hasta confirmar el acceso, así no dispara llamadas que el backend rechazaría */}
            {acceso ? <PermisosPantallaProvider permisos={permisos} pathname={pathname}>{children}</PermisosPantallaProvider> : null}
          </main>{/*
          <ChatWidget /> ver de poner en el otro layout */}
        </SidebarInset>
      </ThemeProvider>
    </SidebarProvider>
  )
}
