// =============================================================
//  app/layout.tsx — Root Layout
// =============================================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'TaskFlow Pro',
    template: '%s | TaskFlow Pro',
  },
  description: 'Plataforma empresarial de productividad y automatización de flujos de trabajo.',
  keywords: ['productividad', 'kanban', 'automatización', 'equipos'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
