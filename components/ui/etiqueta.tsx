
export function Etiqueta({ texto, colors}: { texto: string, colors:any }) {
  const tono = colors[texto.trim()] ?? "bg-gray-100 text-gray-800"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tono}`}>{texto}</span>
}