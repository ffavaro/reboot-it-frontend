import { jsPDF } from "jspdf"
import autoTable, { type UserOptions } from "jspdf-autotable"
import { EMPRESA } from "./empresa"

type Logo = { url: string; relacion: number }
type Celda = string | number

const MARGEN = 15
const GRIS_TEXTO = 110
const AZUL_OSCURO: [number, number, number] = [30, 41, 59]
const GRIS_ETIQUETA: [number, number, number] = [241, 245, 249]

let logoPendiente: Promise<Logo | null> | null = null

function leerComoDataUrl(blob: Blob) {
  return new Promise<string>((ok, falla) => {
    const lector = new FileReader()
    lector.onload = () => ok(String(lector.result))
    lector.onerror = () => falla(lector.error)
    lector.readAsDataURL(blob)
  })
}

async function descargarLogo(): Promise<Logo | null> {
  try {
    const res = await fetch(EMPRESA.logo)
    const tipo = res.headers.get("content-type") ?? ""
    if (!res.ok || !tipo.startsWith("image/")) return null
    const url = await leerComoDataUrl(await res.blob())
    const img = new Image()
    img.src = url
    await img.decode()
    return { url, relacion: img.naturalWidth / img.naturalHeight }
  } catch {
    return null
  }
}

const obtenerLogo = () => (logoPendiente ??= descargarLogo())

export class DocumentoPdf {
  readonly doc: jsPDF
  private y = 0
  private constructor(doc: jsPDF) {
    this.doc = doc
  }

  static async crear(orientacion: "portrait" | "landscape" = "portrait") {
    const documento = new DocumentoPdf(new jsPDF({ orientation: orientacion, unit: "mm", format: "a4" }))
    documento.membrete(await obtenerLogo())
    return documento
  }

  get ancho() {
    return this.doc.internal.pageSize.getWidth()
  }

  get alto() {
    return this.doc.internal.pageSize.getHeight()
  }

  get utilizable() {
    return this.ancho - MARGEN * 2
  }

  private fuente(tamano: number, estilo: "normal" | "bold" = "normal", gris = 0) {
    this.doc.setFont("helvetica", estilo)
    this.doc.setFontSize(tamano)
    this.doc.setTextColor(gris)
  }

  private membrete(logo: Logo | null) {
    const altoLogo = 16
    let xTexto = MARGEN
    if (logo) {
      const anchoLogo = Math.min(altoLogo * logo.relacion, 42)
      try {
        this.doc.addImage(logo.url, MARGEN, 9, anchoLogo, altoLogo)
        xTexto += anchoLogo + 4
      } catch {
        xTexto = MARGEN
      }
    }

    this.fuente(13, "bold")
    this.doc.text(EMPRESA.marca, xTexto, 14)

    const fiscal = [EMPRESA.cuit && `CUIT ${EMPRESA.cuit}`, EMPRESA.condicionIva].filter(Boolean).join("  |  ")
    const lineas = [EMPRESA.razonSocial, fiscal, EMPRESA.domicilio, EMPRESA.contacto].filter((l) => l.length > 0)
    this.fuente(8, "normal", GRIS_TEXTO)
    lineas.forEach((linea, i) => this.doc.text(linea, xTexto, 18.5 + i * 3.6))

    const fin = Math.max(9 + altoLogo, 18.5 + lineas.length * 3.6) + 2
    this.doc.setDrawColor(220, 38, 38)
    this.doc.setLineWidth(0.6)
    this.doc.line(MARGEN, fin, this.ancho - MARGEN, fin)
    this.doc.setLineWidth(0.2)
    this.y = fin + 9
  }

  titulo(texto: string, bajada?: string) {
    this.fuente(17, "bold")
    this.doc.text(texto, this.ancho / 2, this.y, { align: "center" })
    this.y += 6
    if (bajada) {
      this.fuente(10, "normal", GRIS_TEXTO)
      this.doc.text(bajada, this.ancho / 2, this.y, { align: "center" })
      this.y += 5
    }
    this.y += 4
    return this
  }

  extremos(izquierda: string, derecha: string) {
    this.fuente(10)
    this.doc.text(izquierda, MARGEN, this.y)
    this.doc.text(derecha, this.ancho - MARGEN, this.y, { align: "right" })
    this.y += 7
    return this
  }

  nota(texto: string) {
    this.fuente(8.5, "normal", GRIS_TEXTO)
    this.doc.text(texto, MARGEN, this.y)
    this.y += 5
    return this
  }

  parrafo(texto: string) {
    this.fuente(10)
    const lineas: string[] = this.doc.splitTextToSize(texto, this.utilizable)
    this.doc.text(lineas, MARGEN, this.y)
    this.y += lineas.length * 4.8 + 3
    return this
  }

  subtitulo(texto: string) {
    this.fuente(11, "bold")
    this.doc.text(texto, MARGEN, this.y)
    this.y += 5.5
    return this
  }

  private tablaBase(opciones: UserOptions) {
    autoTable(this.doc, { startY: this.y, margin: { left: MARGEN, right: MARGEN }, ...opciones })
    const final = (this.doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
    this.y = (final ?? this.y) + 8
    return this
  }

  ficha(pares: Array<[string, string]>) {
    return this.tablaBase({
      body: pares,
      theme: "grid",
      styles: { fontSize: 9.5, cellPadding: 2.4, textColor: 20 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: "bold", fillColor: GRIS_ETIQUETA } },
    })
  }

  tabla(encabezados: string[], filas: Celda[][], alineacionDerecha: number[] = []) {
    const columnStyles = Object.fromEntries(alineacionDerecha.map((i) => [i, { halign: "right" as const }]))
    return this.tablaBase({
      head: [encabezados],
      body: filas,
      theme: "striped",
      headStyles: { fillColor: AZUL_OSCURO },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles,
    })
  }

  listado(encabezados: string[], filas: Celda[][]) {
    return this.tablaBase({
      head: [encabezados],
      body: filas,
      theme: "striped",
      headStyles: { fillColor: AZUL_OSCURO, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.6, overflow: "linebreak" },
    })
  }

  firmas(izquierda: string, derecha: string, aclaracionIzquierda?: string): this {
    const linea = Math.max(this.y + 22, this.alto - 45)
    if (linea > this.alto - 20) {
      this.doc.addPage()
      this.y = MARGEN
      return this.firmas(izquierda, derecha, aclaracionIzquierda)
    }
    const tramo = 68
    const centroIzq = MARGEN + tramo / 2 + 5
    const centroDer = this.ancho - MARGEN - tramo / 2 - 5
    this.doc.setDrawColor(130)
    this.doc.line(centroIzq - tramo / 2, linea, centroIzq + tramo / 2, linea)
    this.doc.line(centroDer - tramo / 2, linea, centroDer + tramo / 2, linea)
    this.fuente(9)
    this.doc.text(izquierda, centroIzq, linea + 5, { align: "center" })
    this.doc.text(derecha, centroDer, linea + 5, { align: "center" })
    if (aclaracionIzquierda) {
      this.fuente(9, "bold")
      this.doc.text(aclaracionIzquierda, centroIzq, linea + 10, { align: "center" })
    }
    return this
  }

  guardar(nombre: string) {
    const total = this.doc.getNumberOfPages()
    for (let pagina = 1; pagina <= total; pagina++) {
      this.doc.setPage(pagina)
      this.fuente(7.5, "normal", GRIS_TEXTO)
      this.doc.text(`${EMPRESA.marca} · Página ${pagina} de ${total}`, this.ancho - MARGEN, this.alto - 8, { align: "right" })
    }
    this.doc.save(nombre.endsWith(".pdf") ? nombre : `${nombre}.pdf`)
  }
}
