// =============================================================
//  middleware.ts — Next.js Middleware
//  Protege rutas autenticadas y redirige según el estado de auth
// =============================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/oauth',
  '/api/health',
  '/api/metrics',
  '/api/webhooks',
]

// Rutas que solo pueden acceder usuarios NO autenticados
const AUTH_ONLY_ROUTES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorar archivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  const isPublicRoute  = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))

  // Obtener access token de la cookie
  const accessToken = request.cookies.get('access_token')?.value

  // ── Usuario NO autenticado intentando acceder a ruta protegida ──
  if (!accessToken && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Usuario autenticado intentando acceder a login/register ──
  if (accessToken && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Pasar headers de seguridad a todas las respuestas ──
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
