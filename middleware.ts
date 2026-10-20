import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// '/' es pública solo como ruta exacta: como todas las rutas empiezan con '/', compararla por prefijo
// dejaba pública a toda la aplicación y el middleware nunca redirigía al login
const PUBLIC_EXACT_PATHS = ['/']
// El resto, por coincidencia exacta o por prefijo explícito ('/login' y '/login/...', pero no '/loginx')
const PUBLIC_PATH_PREFIXES = ['/login', '/register', '/forgot-password']

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  )
}

function isExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isExpired(decodeURIComponent(token))) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }

  return NextResponse.next()
}

export const config = {
  // Se salta lo estático: _next, api y cualquier archivo con extensión (favicon, /img/logo.png, etc.)
  matcher: ['/((?!_next/static|_next/image|api|.*\\.[a-zA-Z0-9]+$).*)'],
}
