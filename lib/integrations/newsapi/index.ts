// =============================================================
//  lib/integrations/newsapi/index.ts — Integración con NewsAPI
// =============================================================

import { logger } from '@/lib/logger'
import { withCache, TTL } from '@/lib/redis'

export type NewsArticle = {
  title: string
  description: string | null
  url: string
  source: string
  publishedAt: string
  urlToImage: string | null
}

/**
 * Obtiene las noticias principales filtradas por una búsqueda.
 */
export async function getTopHeadlines(query: string, pageSize = 5): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY

  if (!apiKey) {
    logger.warn('NEWS_API_KEY not defined. Skipping news fetch.')
    return []
  }

  return withCache(
    `news:${query}:${pageSize}`,
    async () => {
      logger.debug({ query, pageSize }, 'Fetching news from NewsAPI')

      const url = new URL('https://newsapi.org/v2/top-headlines')
      url.searchParams.set('q', query)
      url.searchParams.set('language', 'es')
      url.searchParams.set('pageSize', pageSize.toString())
      url.searchParams.set('apiKey', apiKey)

      const res = await fetch(url.toString())
      if (!res.ok) {
        logger.error({ status: res.status }, 'NewsAPI error')
        throw new Error(`NewsAPI error: ${res.status}`)
      }

      interface NewsApiResponse {
        status: string
        message?: string
        articles: Array<{
          title: string
          description: string | null
          url: string
          source: { name: string }
          publishedAt: string
          urlToImage: string | null
        }>
      }

      const data = (await res.json()) as NewsApiResponse

      if (data.status !== 'ok') {
        throw new Error(`NewsAPI returned error: ${data.message || 'Unknown error'}`)
      }

      return (data.articles || []).map((article) => ({
        title: article.title,
        description: article.description || null,
        url: article.url,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage || null,
      }))
    },
    TTL.NEWS,
  )
}
