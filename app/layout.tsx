// =============================================================
//  app/layout.tsx — Root Layout
// =============================================================

import type { Metadata } from 'next'
import { Archivo, JetBrains_Mono } from 'next/font/google'

import { Providers } from '@/components/shared/providers'
import './globals.css'

// Archivo con eje de anchura: expandida para rótulos (columnas, marca) y normal para leer.
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: {
    default: 'TaskFlow Pro',
    template: '%s | TaskFlow Pro',
  },
  description:
    'Tableros sincronizados en tiempo real y automatizaciones por horario, cambio de estado o webhook.',
  keywords: ['productividad', 'kanban', 'automatización', 'equipos'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${archivo.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
