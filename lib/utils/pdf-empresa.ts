import type { jsPDF } from "jspdf"
import { EMPRESA } from "@/lib/empresa"

// El logo se busca una vez al cargar la pantalla (si el archivo no existe, el encabezado va solo con texto), así al descargar el
// PDF ya está en memoria y la generación sigue siendo inmediata.
let logo: { datos: string; ancho: number; alto: number } | null = null

async function precargarLogo() {
  try {
    const respuesta = await fetch(EMPRESA.logo)
    if (!respuesta.ok || !(respuesta.headers.get("content-type") ?? "").startsWith("image/")) return
    const blob = await respuesta.blob()
    const datos = await new Promise<string>((resolver, rechazar) => {
      const lector = new FileReader()
      lector.onload = () => resolver(String(lector.result))
      lector.onerror = () => rechazar(lector.error)
      lector.readAsDataURL(blob)
    })
    const imagen = new Image()
    imagen.src = datos
    await imagen.decode()
    logo = { datos, ancho: imagen.naturalWidth, alto: imagen.naturalHeight }
  } catch {
    // sin logo
  }
}
if (typeof window !== "undefined") void precargarLogo()

/**
 * Dibuja arriba de la página el encabezado de la empresa (logo y datos fiscales) y devuelve cuántos milímetros hay que bajar
 * el resto del contenido.
 */
export function dibujarEncabezadoEmpresa(doc: jsPDF): number {
  const ancho = doc.internal.pageSize.getWidth()
  const altoLogo = 14
  let x = 14
  if (logo) {
    const anchoLogo = Math.min(40, (logo.ancho / logo.alto) * altoLogo)
    try {
      doc.addImage(logo.datos, 14, 8, anchoLogo, altoLogo)
      x = 14 + anchoLogo + 5
    } catch {
      // formato de imagen que jsPDF no entiende: se sigue sin logo
    }
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(EMPRESA.razonSocial, x, 14)

  const datos = [
    [EMPRESA.cuit && `CUIT ${EMPRESA.cuit}`, EMPRESA.condicionIva].filter(Boolean).join(" · "),
    EMPRESA.domicilio,
    EMPRESA.contacto,
  ].filter(Boolean)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(100)
  datos.forEach((linea, i) => doc.text(linea, x, 19 + i * 4))
  doc.setTextColor(0)

  const base = Math.max(8 + altoLogo, 19 + datos.length * 4) + 3
  doc.setDrawColor(200)
  doc.line(14, base, ancho - 14, base)
  return base - 8
}
