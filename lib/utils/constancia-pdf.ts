import { descargarConstanciaRetiro } from "@/lib/documentos/constancia-retiro"
import type { DatosConstancia } from "@/lib/type/hoja-ruta"

export function descargarConstanciaPdf(datos: DatosConstancia) {
  return descargarConstanciaRetiro(datos)
}
