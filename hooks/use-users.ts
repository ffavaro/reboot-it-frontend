import { usuariosApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Usuario, CreateUsuarioPayload, UpdateUsuarioPayload } from "@/lib/type/user"

const h = crearHooksRecurso<Usuario, CreateUsuarioPayload, UpdateUsuarioPayload, string>("/usuarios", usuariosApi)

export function useUsuarios() { const { data, ...r } = h.useLista(); return { usuarios: data, ...r } }
export function useCreateUsuario() { const { trigger, ...r } = h.useCrear(); return { createUsuario: trigger, ...r } }
export function useUpdateUsuario() { const { trigger, ...r } = h.useActualizar(); return { updateUsuario: trigger, ...r } }
export function useDeleteUsuario() { const { trigger, ...r } = h.useEliminar(); return { deleteUsuario: trigger, ...r } }
