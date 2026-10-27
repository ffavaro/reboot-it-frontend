// Títulos de los ejes de los gráficos: el eje X lleva el título debajo y el Y, girado a la izquierda (o a la derecha)
export const etiquetaX = (value: string) => ({
  value,
  position: "insideBottom" as const,
  offset: 0,
  fontSize: 11,
  fill: "currentColor",
})

export const etiquetaY = (value: string, lado: "izquierda" | "derecha" = "izquierda") => ({
  value,
  angle: lado === "izquierda" ? -90 : 90,
  position: (lado === "izquierda" ? "insideLeft" : "insideRight") as "insideLeft" | "insideRight",
  fontSize: 11,
  fill: "currentColor",
  style: { textAnchor: "middle" as const },
})

// Alto que reserva el eje X para las marcas y su título
export const ALTO_EJE_X = 42
