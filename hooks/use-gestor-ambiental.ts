import { gestorAmbientalApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  GestorAmbiental,
  CreateGestorAmbientalPayload,
  UpdateGestorAmbientalPayload,
} from "@/lib/type/gestor-ambiental"

const h = crearHooksRecurso<GestorAmbiental, CreateGestorAmbientalPayload, UpdateGestorAmbientalPayload>(
  "/gestor-ambiental",
  gestorAmbientalApi,
)

export function useGestoresAmbientales() { const { data, ...r } = h.useLista(); return { gestores: data, ...r } }
export function useCreateGestorAmbiental() { const { trigger, ...r } = h.useCrear(); return { createGestor: trigger, ...r } }
export function useUpdateGestorAmbiental() { const { trigger, ...r } = h.useActualizar(); return { updateGestor: trigger, ...r } }
export function useDeleteGestorAmbiental() { const { trigger, ...r } = h.useEliminar(); return { deleteGestor: trigger, ...r } }
