import type {
  DatosConstancia,
  GenerarHojaRutaPayload,
  HojaRutaDia,
  HojaRutaHistorico,
  HojaRutaHistoricoQuery,
  ResultadoRetiro,
} from "@/lib/type/hoja-ruta"
import { request } from "./client"

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== "") query.set(clave, String(valor))
  }
  const texto = query.toString()
  return texto ? `?${texto}` : ""
}

export const hojaRutaApi = {
  generar: (payload: GenerarHojaRutaPayload) =>
    request<HojaRutaDia>("/hojas-ruta/generar", { method: "POST", body: JSON.stringify(payload) }),

  confirmarRetiro: (turnoId: number) =>
    request<ResultadoRetiro>(`/hojas-ruta/turnos/${turnoId}/confirmar-retiro`, { method: "POST" }),

  constancia: (turnoId: number) =>
    request<DatosConstancia>(`/hojas-ruta/turnos/${turnoId}/constancia`),
}
