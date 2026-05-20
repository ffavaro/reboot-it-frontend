import type { EstadoDonacion } from "@/lib/type/donacion"
import { request } from "./client"

export const estadoDonacionApi = {
  getAll: () => request<EstadoDonacion[]>("/estado-donacion"),
}