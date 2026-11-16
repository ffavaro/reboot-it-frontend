import { palletApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Pallet, CreatePalletPayload, UpdatePalletPayload } from "@/lib/type/pallet"

const h = crearHooksRecurso<Pallet, CreatePalletPayload, UpdatePalletPayload>("/pallet", palletApi)

export function usePallets() { const { data, ...r } = h.useLista(); return { pallets: data, ...r } }
export function useCreatePallet() { const { trigger, ...r } = h.useCrear(); return { createPallet: trigger, ...r } }
export function useUpdatePallet() { const { trigger, ...r } = h.useActualizar(); return { updatePallet: trigger, ...r } }
export function useDeletePallet() { const { trigger, ...r } = h.useEliminar(); return { deletePallet: trigger, ...r } }
