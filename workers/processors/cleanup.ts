import type { Job } from 'bullmq'

import { db } from '@/lib/db'
import { workerLogger } from '@/lib/logger'

export async function cleanupProcessor(job: Job) {
  workerLogger.info({ jobId: job.id }, 'Starting database cleanup')
  
  // Eliminar sesiones revocadas o expiradas hace más de 7 días
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const deletedSessions = await db.session.deleteMany({
    where: {
      OR: [
        { isRevoked: true },
        { expiresAt: { lt: sevenDaysAgo } }
      ]
    }
  })

  workerLogger.info({ count: deletedSessions.count }, 'Cleaned old sessions')
  
  // Limpiar logs de auditoría antiguos (ej. más de 90 días)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const deletedLogs = await db.auditLog.deleteMany({
    where: {
      createdAt: { lt: ninetyDaysAgo }
    }
  })

  workerLogger.info({ count: deletedLogs.count }, 'Cleaned old audit logs')

  return { 
    deletedSessions: deletedSessions.count,
    deletedLogs: deletedLogs.count
  }
}
