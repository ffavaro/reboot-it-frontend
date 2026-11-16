import { medioAlmacenamientoApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  MedioAlmacenamiento,
  CreateMedioAlmacenamientoPayload,
  UpdateMedioAlmacenamientoPayload,
} from "@/lib/type/medio-almacenamiento"

const h = crearHooksRecurso<MedioAlmacenamiento, CreateMedioAlmacenamientoPayload, UpdateMedioAlmacenamientoPayload>(
  "/medio-almacenamiento",
  medioAlmacenamientoApi,
)

export function useMediosAlmacenamiento() { const { data, ...r } = h.useLista(); return { medios: data, ...r } }
export function useCreateMedioAlmacenamiento() { const { trigger, ...r } = h.useCrear(); return { createMedio: trigger, ...r } }
export function useUpdateMedioAlmacenamiento() { const { trigger, ...r } = h.useActualizar(); return { updateMedio: trigger, ...r } }
export function useDeleteMedioAlmacenamiento() { const { trigger, ...r } = h.useEliminar(); return { deleteMedio: trigger, ...r } }
