import type { Rack, CreateRackPayload, UpdateRackPayload } from "@/lib/type/rack"
import { crudApi } from "./crud"

export const rackApi = crudApi<Rack, CreateRackPayload, UpdateRackPayload>("/rack")
