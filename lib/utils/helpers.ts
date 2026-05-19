export const formatDate = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}