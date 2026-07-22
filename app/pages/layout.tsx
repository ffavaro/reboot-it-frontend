"use client"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@base-ui/react";
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
import { useRouter } from "next/navigation"
import { ChatWidget } from "@/components/chat-widget";s

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  const router = useRouter()
  useEffect(() => { setUser(getUser()) }, [])

  const handleLogout = () => {
    clearSession()
    router.push("/")
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <ThemeProvider defaultTheme="light">
        <AppSidebar />
        <SidebarInset>
           <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbPage className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-white">Reboot IT</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full">
                    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left leading-tight">
                        <span className="text-white">{user.nombre}</span>
                        <span className="text-xs text-white font-normal">{user.email}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => router.push("/pages/perfil")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                     <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          <main>
            {children}
          </main>
          <ChatWidget />
        </SidebarInset>
      </ThemeProvider>
    </SidebarProvider>
  )
}
