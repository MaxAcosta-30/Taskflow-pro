// =============================================================
//  lib/integrations/ipinfo/index.ts — Integración con IPInfo
// =============================================================

import { logger } from '@/lib/logger'

export type IpData = {
  ip: string
  city: string | null
  region: string | null
  country: string | null
  timezone: string | null
  org: string | null
}

/**
 * Obtiene información geográfica y de red para una dirección IP.
 */
export async function getIpInfo(ip: string): Promise<IpData> {
  // Manejo de localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return {
      ip,
      city: null,
      region: null,
      country: null,
      timezone: null,
      org: null,
    }
  }

  try {
    const token = process.env.IPINFO_TOKEN
    const url = new URL(`https://ipinfo.io/${ip}/json`)
    if (token) url.searchParams.set('token', token)

    const res = await fetch(url.toString())
    if (!res.ok) {
      logger.warn({ status: res.status, ip }, 'IPInfo request failed')
      return { ip, city: null, region: null, country: null, timezone: null, org: null }
    }

    interface IpInfoResponse {
      ip: string
      city?: string
      region?: string
      country?: string
      timezone?: string
      org?: string
    }

    const data = (await res.json()) as IpInfoResponse
    return {
      ip: data.ip || ip,
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      timezone: data.timezone || null,
      org: data.org || null,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message, ip }, 'Error fetching IPInfo')
    return {
      ip,
      city: null,
      region: null,
      country: null,
      timezone: null,
      org: null,
    }
  }
}
