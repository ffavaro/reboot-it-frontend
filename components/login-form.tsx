'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLogin } from "@/hooks/use-auth"
import { toast } from "react-toastify"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveSession } from "@/lib/auth-utils"
import { homeDePermisos } from "@/lib/nav"
import { permisosApi } from "@/lib/api/permisos"
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { login, isLoading } = useLogin()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const onHandleLogin = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Por favor, ingresa tu correo electrónico y contraseña")
      return
    }

    try {
    const result = await login({ email, password })
    if (result?.access_token) {
      saveSession(result.access_token)
      // cada rol arranca en la primera pantalla que sí puede ver según sus permisos
      const permisos = await permisosApi.mias().catch(() => undefined)
      router.push(homeDePermisos(permisos))
    }
  } catch (err: any) {
    // err ya tiene la forma { statusCode, message, error }
    if (err?.statusCode === 401) {
      toast.error("Usuario o contraseña incorrectos")
    } else if (err?.statusCode === 403 && err?.message) {
      toast.error(String(err.message))
    } else {
      toast.error("Error al iniciar sesión")
    }
  }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="loader" />
        <p className="text-sm  text-black">Iniciando sesión...</p>
      </div>
    )
  }
  

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={onHandleLogin} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Inicio de Sesion</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Ingrese tu correo electrónico y contraseña para acceder a tu cuenta. Si no tienes una cuenta, puedes registrarte haciendo clic en el enlace de abajo.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            autoComplete="email"
            value={email}
            suppressHydrationWarning
            onChange={(e) => { setEmail(e.target.value); e.currentTarget.setCustomValidity("") }}
            onInvalid={(e) => e.currentTarget.setCustomValidity(e.currentTarget.value ? "Ingresá un correo válido." : "Por favor, completá este campo.")}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            suppressHydrationWarning
            value={password}
            onChange={(e) => { setPassword(e.target.value); e.currentTarget.setCustomValidity("") }}
            onInvalid={(e) => e.currentTarget.setCustomValidity("Por favor, completá este campo.")}
          />
        </Field>
        <Field>
          <Button type="submit">Iniciar Sesión</Button>
        </Field>
        <FieldSeparator>O continuar con</FieldSeparator>
        <Field>
          <FieldDescription className="text-center">
              ¿No tienes una cuenta?{" "}
            <a href="/register" className="underline underline-offset-4">
              Registrarse
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
