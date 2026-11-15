import { request } from "./client"

export type IdRecurso = number | string
// Tipo de peticiones
export interface CrudApi<T, C, U, I extends IdRecurso = number> {
  getAll: () => Promise<T[]>
  create: (data: C) => Promise<T>
  update: (id: I, data: U) => Promise<T>
  remove: (id: I) => Promise<void>
}
// Funcion para unificar los tipos de peticiones al backend
export function crudApi<T, C, U, I extends IdRecurso = number>(ruta: string): CrudApi<T, C, U, I> {
  console.log(ruta);
    return {
    getAll: () => request<T[]>(ruta),
    create: (data) => request<T>(ruta, { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request<T>(`${ruta}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id) => request<void>(`${ruta}/${id}`, { method: "DELETE" }),
  }
}
