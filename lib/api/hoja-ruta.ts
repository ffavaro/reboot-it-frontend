import type { ConfirmarRetiroResultado, ConstanciaRetiroDatos, GenerarHojaRutaPayload, HojaRutaDia, HojaRutaHistorico } from "@/lib/type/hoja-ruta"
import { request } from "./client"

export const hojaRutaApi = {
  // Genera la hoja de ruta de una fecha con los turnos pendientes de retiro (queda En proceso)
  generar: (payload: GenerarHojaRutaPayload) =>
    request<HojaRutaDia>("/hojas-ruta/generar", { method: "POST", body: JSON.stringify(payload) }),

  // Confirma el retiro de un turno: lo finaliza y genera su constancia; con el último turno se finaliza la hoja
  confirmarRetiro: (turnoId: number) =>
    request<ConfirmarRetiroResultado>(`/hojas-ruta/turnos/${turnoId}/confirmar-retiro`, { method: "POST" }),

  constancia: (turnoId: number) =>
    request<ConstanciaRetiroDatos>(`/hojas-ruta/turnos/${turnoId}/constancia`),
}

export type { HojaRutaDia, HojaRutaHistorico }
