export const COLOR = {
  azul: "#378ADD",
  verde: "#639922",
  naranja: "#F5A623",
  rojo: "#E24B4A",
  violeta: "#8B5CF6",
  turquesa: "#14B8A6",
  rosa: "#EC4899",
  gris: "#71716a",
} as const

export const SERIE = [COLOR.azul, COLOR.verde, COLOR.naranja, COLOR.rojo, COLOR.violeta, COLOR.turquesa, COLOR.rosa]

export const colorSerie = (i: number) => SERIE[i % SERIE.length]

export const GRILLA = { strokeDasharray: "3 3", stroke: "rgba(128,128,128,0.18)" }

export const CAJA_TOOLTIP = { borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.25)", fontSize: 12 }

export const CURSOR_BARRA = { fill: "rgba(128,128,128,0.08)" }

export const MARCAS = { fontSize: 11 }

export const ALTO_EJE_X = 42

export const tituloX = (value: string) => ({ value, position: "insideBottom" as const, offset: 0, fontSize: 11, fill: "currentColor" })

export const tituloY = (value: string, derecha = false) => ({
  value,
  angle: derecha ? 90 : -90,
  position: derecha ? ("insideRight" as const) : ("insideLeft" as const),
  fontSize: 11,
  fill: "currentColor",
  style: { textAnchor: "middle" as const },
})
