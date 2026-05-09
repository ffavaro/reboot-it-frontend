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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Inicio de Sesion</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Ingrese tu correo electrónico y contraseña para acceder a tu cuenta. Si no tienes una cuenta, puedes registrarte haciendo clic en el enlace de abajo.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <a
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input id="password" type="password" required />
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
