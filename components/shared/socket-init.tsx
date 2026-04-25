// =============================================================
//  components/shared/socket-init.tsx
//  Componente que inicializa la conexión de WebSocket
// =============================================================

'use client'

import { useSocketConnection } from '@/hooks/use-socket'

export function SocketInit() {
  useSocketConnection()
  return null
}
