const BASE_URL = process.env.NEXT_PUBLIC_URL_BACKEND ?? "http://localhost:3001"

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }

  return res.json()
}

export async function fetcher<T>(path: string): Promise<T> {
  return request<T>(path)
}

export async function uploadFoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${BASE_URL}/upload`, { method: "POST", body: formData })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }
  const data: { url: string } = await res.json()
  return `${BASE_URL}${data.url}`
}
