export const formatDate = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export const validateEmail = (v: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export const validateCuitDni = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length === 8 || digits.length === 11;
}