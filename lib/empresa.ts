/**
 * Datos de la empresa que aparecen en el encabezado de los PDF (constancia de retiro y certificado de disposición final).
 * Los datos fiscales y el logo los provee la empresa: lo que quede vacío no se imprime.
 *  - Logo: copiar el archivo a public/img/logo_msit.png (PNG o JPG con ese nombre); si no está, el encabezado va solo con texto.
 */
export const EMPRESA = {
  razonSocial: "MSIT S.A.S.",
  cuit: "", // por ejemplo "30-12345678-9"
  condicionIva: "", // por ejemplo "IVA Responsable Inscripto"
  domicilio: "", // domicilio fiscal
  contacto: "", // teléfono y/o email
  logo: "/img/logo_msit.png",
}
