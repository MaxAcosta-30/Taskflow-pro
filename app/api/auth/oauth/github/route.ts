// =============================================================
//  app/api/auth/oauth/github/route.ts — GitHub OAuth
// =============================================================

import type { NextRequest } from 'next/server'

import { setAuthCookies, createSession, getClientIp } from '@/lib/auth/helpers'
import { generateTokens } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { authLogger } from '@/lib/logger'

const GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID!
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!
const APP_URL              = process.env.NEXT_PUBLIC_APP_URL!

// ── GET /api/auth/oauth/github — Iniciar flujo OAuth ─────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Si no hay code, redirigir a GitHub para autorización
  if (!code) {
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.set('scope', 'user:email')
    githubAuthUrl.searchParams.set('redirect_uri', `${APP_URL}/api/auth/oauth/github`)
    // state para CSRF protection
    const csrfState = crypto.randomUUID()
    githubAuthUrl.searchParams.set('state', csrfState)

    return Response.redirect(githubAuthUrl.toString())
  }

  // Si hubo error en GitHub
  if (error) {
    return Response.redirect(`${APP_URL}/login?error=oauth_denied`)
  }

  try {
    // 1. Intercambiar code por access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify({
        client_id:     GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string }

    if (!tokenData.access_token) {
      authLogger.warn({ error: tokenData.error }, 'GitHub token exchange failed')
      return Response.redirect(`${APP_URL}/login?error=oauth_failed`)
    }

    // 2. Obtener datos del usuario de GitHub
    const [githubUser, githubEmails] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }).then((r) => r.json()) as Promise<{
        id: number
        name: string | null
        login: string
        avatar_url: string
      }>,

      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }).then((r) => r.json()) as Promise<
        Array<{ email: string; primary: boolean; verified: boolean }>
      >,
    ])

    const primaryEmail = githubEmails.find((e) => e.primary && e.verified)?.email
    if (!primaryEmail) {
      return Response.redirect(`${APP_URL}/login?error=no_email`)
    }

    const providerUserId = String(githubUser.id)

    // 3. Buscar cuenta OAuth existente
    let userId: string

    const existingOAuth = await db.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider: 'github', providerUserId } },
    })

    if (existingOAuth) {
      userId = existingOAuth.userId
      // Actualizar access token
      await db.oAuthAccount.update({
        where: { id: existingOAuth.id },
        data:  { accessToken: tokenData.access_token },
      })
    } else {
      // 4. Buscar si ya existe usuario con ese email
      const existingUser = await db.user.findUnique({ where: { email: primaryEmail } })

      if (existingUser) {
        // Vincular cuenta OAuth al usuario existente
        userId = existingUser.id
      } else {
        // Crear nuevo usuario
        const newUser = await db.user.create({
          data: {
            email:      primaryEmail,
            name:       githubUser.name ?? githubUser.login,
            avatarUrl:  githubUser.avatar_url,
            isVerified: true,
          },
        })
        userId = newUser.id
      }

      await db.oAuthAccount.create({
        data: {
          userId,
          provider:       'github',
          providerUserId,
          accessToken:    tokenData.access_token,
        },
      })
    }

    // 5. Obtener usuario completo
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })

    if (!user?.isActive) {
      return Response.redirect(`${APP_URL}/login?error=account_disabled`)
    }

    // 6. Generar tokens y sesión
    const tokens = generateTokens({ sub: user.id, email: user.email, role: user.role })

    await createSession({
      userId:       user.id,
      refreshToken: tokens.refreshToken,
      userAgent:    req.headers.get('user-agent') ?? undefined,
      ipAddress:    getClientIp(req),
    })

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    setAuthCookies(tokens.accessToken, tokens.refreshToken)

    authLogger.info({ userId: user.id, provider: 'github' }, 'OAuth login')

    return Response.redirect(`${APP_URL}/`)
  } catch (error) {
    authLogger.error({ error }, 'GitHub OAuth error')
    return Response.redirect(`${APP_URL}/login?error=server_error`)
  }
}
