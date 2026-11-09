import type { DatosConstanciaRetiro } from "@/lib/type/constancia-retiro"
import { EMPRESA } from "./empresa"
import { dia, diaYHora } from "@/lib/utils/fechas"
import { kilos, numeroDocumento, texto } from "./formato"
import { DocumentoPdf } from "./pdf"

export async function descargarConstanciaRetiro(datos: DatosConstanciaRetiro) {
  const numero = numeroDocumento(datos.constanciaId)
  const chofer = datos.transportista ? `${datos.transportista.nombre} ${datos.transportista.apellido}` : null
  const vehiculo = datos.vehiculo
    ? `${datos.vehiculo.patente} (${[datos.vehiculo.marca, datos.vehiculo.modelo].filter(Boolean).join(" ")})`
    : null

  const pdf = await DocumentoPdf.crear()
  pdf
    .titulo("Constancia de retiro", `Emitida por ${EMPRESA.marca}`)
    .extremos(`Constancia N° ${numero}`, `Emisión: ${dia(datos.fechaEmision)}`)
    .ficha([
      ["Donante", texto(datos.donante.nombre)],
      ["Teléfono", texto(datos.donante.telefono)],
      ["Dirección de retiro", texto(datos.direccion)],
      ["Retiro realizado", diaYHora(datos.fechaRetiro)],
      ["Donación", texto(datos.donacionId)],
      ["Turno", texto(datos.turnoId)],
      ["Transportista", texto(chofer)],
      ["CUIT / DNI transportista", texto(datos.transportista?.cuitDni)],
      ["Vehículo", texto(vehiculo)],
      ["Peso estimado", kilos(datos.pesoEstimadoKg)],
    ])
    .subtitulo("Materiales retirados")
    .tabla(
      ["Tipo de material", "Cantidad"],
      datos.materiales.length > 0
        ? datos.materiales.map((m) => [m.tipo, texto(m.cantidad)])
        : [["No se cargaron materiales", "—"]],
      [1],
    )

  if (datos.observaciones) pdf.subtitulo("Observaciones").parrafo(datos.observaciones)

  pdf.firmas("Firma del transportista", "Firma del donante", chofer ?? undefined)
  pdf.guardar(`constancia-retiro-${numero}`)
}
