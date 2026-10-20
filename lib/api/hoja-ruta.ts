import type { HojaRutaDia, HojaRutaHistorico } from "@/lib/type/hoja-ruta"
import { request } from "./client"

export const hojaRutaApi = {
  iniciar: (empleadoTransportistaId: number) =>
    request<HojaRutaDia>("/hojas-ruta/iniciar", { method: "POST", body: JSON.stringify({ empleadoTransportistaId }) }),

  finalizar: (id: number, kmFinal: number) =>
    request<HojaRutaDia>(`/hojas-ruta/${id}/finalizar`, { method: "POST", body: JSON.stringify({ kmFinal }) }),
}

export type { HojaRutaDia, HojaRutaHistorico }
