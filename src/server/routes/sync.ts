import { Router, type Request, type Response } from 'express'
import { parseBearerToken } from '../auth/authMiddleware'
import { verifyToken } from '../auth/jwtService'
import { personaRepo, memoryEventRepo, syncLogRepo } from '../db/dataRepository'
import type { DbPersona, DbMemoryEvent } from '../db/dataRepository'

interface SyncPushRequest {
  personas?: Array<{
    id: string
    name: string
    description?: string
    personaType?: string
    config?: Record<string, unknown>
    avatarUrl?: string
    isPublic?: boolean
    status?: string
  }>
  memoryEvents?: Array<{
    id: string
    eventType: string
    content?: string
    metadata?: Record<string, unknown>
    importance?: number
  }>
}

interface SyncPullResponse {
  personas: DbPersona[]
  memoryEvents: DbMemoryEvent[]
  syncedAt: string
}

interface SyncConflictRequest {
  localVersion: number
  remoteVersion: number
  localData: SyncPushRequest
  remoteData: SyncPushRequest
}

export function createSyncRouter(): Router {
  const router = Router()

  router.use(async (req: Request, res: Response, next) => {
    const token = parseBearerToken(req)
    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' })
      return
    }

    const payload = await verifyToken(token)
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    ;(req as Request & { userId: string }).userId = payload.sub
    next()
  })

  router.post('/push', async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { userId: string }).userId
      const body = req.body as SyncPushRequest
      const results: { personas: number; memoryEvents: number } = { personas: 0, memoryEvents: 0 }

      if (body.personas && Array.isArray(body.personas)) {
        for (const p of body.personas) {
          const existing = await personaRepo.findById(p.id)
          if (existing) {
            await personaRepo.update(p.id, userId, {
              name: p.name,
              description: p.description,
              config: p.config,
              avatar_url: p.avatarUrl,
              is_public: p.isPublic,
              status: p.status
            })
            await syncLogRepo.log({ userId, tableName: 'personas', recordId: p.id, action: 'update' })
          } else {
            await personaRepo.create({
              userId,
              name: p.name,
              description: p.description,
              personaType: p.personaType,
              config: p.config,
              avatarUrl: p.avatarUrl,
              isPublic: p.isPublic
            })
            await syncLogRepo.log({ userId, tableName: 'personas', recordId: p.id, action: 'insert' })
          }
          results.personas++
        }
      }

      if (body.memoryEvents && Array.isArray(body.memoryEvents)) {
        for (const m of body.memoryEvents) {
          await memoryEventRepo.create({
            userId,
            eventType: m.eventType,
            content: m.content,
            metadata: m.metadata,
            importance: m.importance
          })
          await syncLogRepo.log({ userId, tableName: 'memory_events', recordId: m.id, action: 'insert' })
          results.memoryEvents++
        }
      }

      res.json({
        success: true,
        syncedAt: new Date().toISOString(),
        results
      })
    } catch (err) {
      console.error('[SyncPush]', (err as Error).message)
      res.status(500).json({ error: 'Sync push failed' })
    }
  })

  router.get('/pull', async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { userId: string }).userId
      const since = req.query.since as string | undefined

      const [personas, memoryEvents] = await Promise.all([
        personaRepo.findByUserId(userId),
        memoryEventRepo.findByUserId(userId, { limit: 200 })
      ])

      const filteredPersonas = since
        ? personas.filter(p => p.updated_at > since)
        : personas

      const filteredMemoryEvents = since
        ? memoryEvents.filter(m => m.created_at > since)
        : memoryEvents

      const response: SyncPullResponse = {
        personas: filteredPersonas,
        memoryEvents: filteredMemoryEvents,
        syncedAt: new Date().toISOString()
      }

      res.json(response)
    } catch (err) {
      console.error('[SyncPull]', (err as Error).message)
      res.status(500).json({ error: 'Sync pull failed' })
    }
  })

  router.post('/conflict', async (req: Request, res: Response) => {
    try {
      const body = req.body as SyncConflictRequest

      const resolution: 'local' | 'remote' | 'merge' =
        body.localVersion >= body.remoteVersion ? 'local' : 'remote'

      res.json({
        resolution,
        mergedData: resolution === 'merge' ? { ...body.remoteData, ...body.localData } : null
      })
    } catch (err) {
      console.error('[SyncConflict]', (err as Error).message)
      res.status(500).json({ error: 'Conflict resolution failed' })
    }
  })

  router.get('/status', async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { userId: string }).userId

      const [personaLastSync, memoryLastSync] = await Promise.all([
        syncLogRepo.getLatestSync(userId, 'personas'),
        syncLogRepo.getLatestSync(userId, 'memory_events')
      ])

      res.json({
        connected: true,
        lastSync: personaLastSync || memoryLastSync || null,
        tables: {
          personas: personaLastSync || null,
          memory_events: memoryLastSync || null
        }
      })
    } catch (err) {
      console.error('[SyncStatus]', (err as Error).message)
      res.status(500).json({ error: 'Failed to get sync status' })
    }
  })

  return router
}
