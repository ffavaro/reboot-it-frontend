import type { Usuario, CreateUsuarioPayload, UpdateUsuarioPayload } from "@/lib/type/user"
import { crudApi } from "./crud"

const base = crudApi<Usuario, CreateUsuarioPayload, UpdateUsuarioPayload, string>("/usuarios")

export const usuariosApi = { ...base, delete: base.remove }
