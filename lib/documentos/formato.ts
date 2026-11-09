const VACIO = "—"

export const texto = (valor: string | number | null | undefined) =>
  valor === null || valor === undefined || valor === "" ? VACIO : String(valor)

export const kilos = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined || valor === "" ? VACIO : `${Number(valor)} kg`

export const numeroDocumento = (id: number) => String(id).padStart(6, "0")
