// =============================================================
//  components/shared/socket-init.tsx
//  Componente que inicializa la conexión de WebSocket
// =============================================================

'use client'

import { useCurrentUser } from '@/hooks/use-auth'
import { useSocketConnection } from '@/hooks/use-socket'

export function SocketInit() {
  // Tras recargar, la sesión (cookie) sigue viva pero isAuthenticated no se persiste:
  // se confirma con /api/auth/me para que el socket se vuelva a conectar.
  useCurrentUser()
  useSocketConnection()
  return null
}
