// =============================================================
//  lib/integrations/exchangerate/index.ts — Integración con ExchangeRate-API
// =============================================================

import { logger } from '@/lib/logger'
import { withCache, TTL } from '@/lib/redis'

export type ExchangeRates = {
  base: string // ej: "USD"
  rates: Record<string, number> // ej: { "MXN": 17.2, "EUR": 0.92 }
  updatedAt: string // ISO string
}

/**
 * Obtiene las tasas de cambio para una moneda base.
 */
export async function getExchangeRates(baseCurrency = 'USD'): Promise<ExchangeRates> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) {
    throw new Error('EXCHANGE_RATE_API_KEY not configured')
  }

  return withCache(
    `exchange:${baseCurrency}`,
    async () => {
      logger.debug({ baseCurrency }, 'Fetching exchange rates from ExchangeRate-API')

      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      const res = await fetch(url)

      if (!res.ok) {
        logger.error({ status: res.status, baseCurrency }, 'ExchangeRate API error')
        throw new Error(`ExchangeRate API error: ${res.status}`)
      }

      interface ExchangeRateResponse {
        result: string
        'error-type'?: string
        conversion_rates: Record<string, number>
      }

      const data = (await res.json()) as ExchangeRateResponse

      if (data.result !== 'success') {
        throw new Error(`ExchangeRate API returned error: ${data['error-type'] || 'Unknown error'}`)
      }

      return {
        base: baseCurrency,
        rates: data.conversion_rates,
        updatedAt: new Date().toISOString(),
      }
    },
    TTL.SHORT,
  )
}

/**
 * Convierte un monto entre dos monedas.
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const data = await getExchangeRates(from)
  const rate = data.rates[to]

  if (!rate) {
    throw new Error(`Exchange rate not found for currency: ${to}`)
  }

  const converted = amount * rate
  return Math.round(converted * 100) / 100
}
