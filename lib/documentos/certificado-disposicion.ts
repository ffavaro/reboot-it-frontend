import type { DatosCertificadoDisposicion } from "@/lib/type/certificado-disposicion"
import { EMPRESA } from "./empresa"
import { dia, kilos, numeroDocumento, texto } from "./formato"
import { DocumentoPdf } from "./pdf"

export async function descargarCertificadoDisposicion(datos: DatosCertificadoDisposicion) {
  const numero = datos.numeroCertificado ?? numeroDocumento(datos.certificadoId)
  const { donante, gestor } = datos
  const nombreDonante = donante.razonSocial ? `${donante.nombre} (${donante.razonSocial})` : texto(donante.nombre)
  const donacion = texto(datos.donacionId)

  const pdf = await DocumentoPdf.crear()
  pdf
    .titulo("Certificado de disposición final", `Emitido por ${EMPRESA.marca}`)
    .extremos(`Certificado N° ${numero}`, `Emisión: ${dia(datos.fechaEmision)}`)
    .parrafo(
      `${EMPRESA.marca} deja constancia de que los materiales detallados en este certificado, ` +
        `donados por ${nombreDonante} (donación N° ${donacion}), fueron clasificados y entregados ` +
        `al gestor ambiental que se indica para su disposición final.`,
    )
    .ficha([
      ["Donante", nombreDonante],
      ["Dirección del donante", texto(donante.direccion)],
      ["Teléfono del donante", texto(donante.telefono)],
      ["Donación", donacion],
      ["Lote", texto(datos.loteId)],
      ["Peso bruto del lote", kilos(datos.pesoBrutoKg)],
      ["Gestor ambiental", texto(gestor?.razonSocial)],
      ["CUIT del gestor", texto(gestor?.cuit)],
      ["Habilitación", texto(gestor?.habilitacion)],
      ["Contacto del gestor", texto(gestor?.contacto)],
    ])
    .subtitulo("Materiales")
    .tabla(
      ["Tipo de material", "Condición", "Cantidad"],
      datos.materiales.length > 0
        ? datos.materiales.map((m) => [m.tipo, m.condicion, m.cantidad])
        : [["El lote no tiene materiales registrados", "—", "—"]],
      [2],
    )

  if (datos.terminosCondiciones) pdf.subtitulo("Términos y condiciones").parrafo(datos.terminosCondiciones)

  pdf.firmas(`Firma y sello · ${EMPRESA.marca}`, "Firma y sello · Gestor ambiental")
  pdf.guardar(`certificado-disposicion-${numero}`)
}
