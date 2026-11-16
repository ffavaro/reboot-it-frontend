import type { Pallet, CreatePalletPayload, UpdatePalletPayload } from "@/lib/type/pallet"
import { crudApi } from "./crud"

export const palletApi = crudApi<Pallet, CreatePalletPayload, UpdatePalletPayload>("/pallet")
