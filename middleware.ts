import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

const esRutaLibre = (ruta: string): boolean => {
  if (ruta === '/') return true
  return PUBLIC_PATHS.some((libre) => ruta === libre || ruta.startsWith(`${libre}/`))
}

const isExpired = (token: string): boolean => {
  try {
    const cuerpo = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(cuerpo)) as { exp?: number };
    return typeof exp !== 'number' || Date.now() >= exp * 1000
  } catch (error) {
    return true
  }
}

const alLogin = (request: NextRequest, borrarSession: boolean) => {
  const destino = new URL('/login', request.url);
  const respuesta = NextResponse.redirect(destino)
  if (borrarSession) respuesta.cookies.delete('session')
  return respuesta
}

export function middleware(request: NextRequest) {
  if (esRutaLibre(request.nextUrl.pathname)) return NextResponse.next()

  const cookie = request.cookies.get('session')?.value
  if (!cookie) return alLogin(request, false)
  if (isExpired(decodeURIComponent(cookie))) return alLogin(request, true)
  return NextResponse.next()
}

export const config = {
 matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api|img).*)'],
}
