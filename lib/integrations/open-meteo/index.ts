// =============================================================
//  lib/integrations/open-meteo/index.ts — Integración con Open-Meteo
// =============================================================

import { logger } from '@/lib/logger'
import { withCache, TTL } from '@/lib/redis'

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm'

export type WeatherData = {
  temperature: number // Celsius, redondeado
  feelsLike: number // Celsius, redondeado
  humidity: number // porcentaje 0-100
  windSpeed: number // km/h, redondeado
  precipitation: number // mm
  weatherCode: number // código WMO original
  description: string // descripción en español
  condition: WeatherCondition
  isDay: boolean
}

/**
 * Mapea códigos WMO a condiciones de TaskFlow.
 */
function mapWMOCode(code: number): { condition: WeatherCondition; description: string } {
  if ([0, 1].includes(code)) return { condition: 'clear', description: 'Despejado' }
  if ([2, 3, 45, 48].includes(code)) return { condition: 'cloudy', description: 'Nublado' }
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return { condition: 'rain', description: 'Lluvia' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'snow', description: 'Nieve' }
  if ([95, 96, 99].includes(code)) return { condition: 'storm', description: 'Tormenta' }
  return { condition: 'cloudy', description: 'Condición desconocida' }
}

/**
 * Obtiene el clima actual para unas coordenadas dadas.
 */
export async function getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const cacheKey = `weather:${latitude.toFixed(2)}:${longitude.toFixed(2)}`

  return withCache(
    cacheKey,
    async () => {
      logger.debug({ latitude, longitude }, 'Fetching weather from Open-Meteo')

      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', latitude.toString())
      url.searchParams.set('longitude', longitude.toString())
      url.searchParams.set(
        'current',
        'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day',
      )
      url.searchParams.set('timezone', 'auto')
      url.searchParams.set('forecast_days', '1')

      const res = await fetch(url.toString())
      if (!res.ok) {
        logger.error({ status: res.status, latitude, longitude }, 'Open-Meteo API error')
        throw new Error(`Open-Meteo API error: ${res.status}`)
      }

      interface OpenMeteoResponse {
        current: {
          temperature_2m: number
          apparent_temperature: number
          relative_humidity_2m: number
          wind_speed_10m: number
          precipitation: number
          weather_code: number
          is_day: number | boolean
        }
      }

      const data = (await res.json()) as OpenMeteoResponse
      const current = data.current
      const { condition, description } = mapWMOCode(current.weather_code)

      return {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        precipitation: current.precipitation,
        weatherCode: current.weather_code,
        description,
        condition,
        isDay: Boolean(current.is_day),
      }
    },
    TTL.WEATHER,
  )
}

/**
 * Verifica si se cumple una condición climática específica.
 */
export async function checkWeatherCondition(
  latitude: number,
  longitude: number,
  targetCondition: WeatherCondition,
): Promise<{ matches: boolean; weather: WeatherData }> {
  const weather = await getCurrentWeather(latitude, longitude)
  return {
    matches: weather.condition === targetCondition,
    weather,
  }
}
