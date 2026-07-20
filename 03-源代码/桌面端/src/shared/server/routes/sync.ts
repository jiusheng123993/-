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
  strategy?: 'local_wins' | 'remote_wins' | 'latest_wins' | 'field_merge'
}

interface ConflictField {
  path: string
  localValue: unknown
  remoteValue: unknown
  resolvedValue: unknown
}

interface ConflictResolution {
  resolution: 'local' | 'remote' | 'merge'
  strategy: string
  mergedData: SyncPushRequest | null
  conflicts: ConflictField[]
}

function mergePersonaArrays(
  localPersonas: SyncPushRequest['personas'],
  remotePersonas: SyncPushRequest['personas']
): { merged: SyncPushRequest['personas']; conflicts: ConflictField[] } {
  const conflicts: ConflictField[] = []
  const merged: NonNullable<SyncPushRequest['personas']> = []
  const remoteMap = new Map((remotePersonas || []).map(p => [p.id, p]))

  for (const localP of localPersonas || []) {
    const remoteP = remoteMap.get(localP.id)
    if (!remoteP) {
      merged.push(localP)
      continue
    }

    const mergedPersona = { ...remoteP }
    const fieldsToCheck = ['name', 'description', 'personaType', 'avatarUrl', 'isPublic', 'status'] as const
    for (const field of fieldsToCheck) {
      const localVal = localP[field]
      const remoteVal = remoteP[field]
      if (localVal !== undefined && remoteVal !== undefined && localVal !== remoteVal) {
        conflicts.push({
          path: `personas.${localP.id}.${field}`,
          localValue: localVal,
          remoteValue: remoteVal,
          resolvedValue: localVal
        })
      }
      if (localVal !== undefined) {
        (mergedPersona as Record<string, unknown>)[field] = localVal
      }
    }

    if (localP.config && remoteP.config) {
      mergedPersona.config = { ...remoteP.config, ...localP.config }
    } else if (localP.config) {
      mergedPersona.config = localP.config
    }

    merged.push(mergedPersona)
    remoteMap.delete(localP.id)
  }

  for (const remoteP of remoteMap.values()) {
    merged.push(remoteP)
  }

  return { merged, conflicts }
}

function mergeMemoryEventArrays(
  localEvents: SyncPushRequest['memoryEvents'],
  remoteEvents: SyncPushRequest['memoryEvents']
): { merged: SyncPushRequest['memoryEvents']; conflicts: ConflictField[] } {
  const conflicts: ConflictField[] = []
  const localIds = new Set((localEvents || []).map(e => e.id))
  const remoteIds = new Set((remoteEvents || []).map(e => e.id))

  for (const localId of localIds) {
    if (remoteIds.has(localId)) {
      conflicts.push({
        path: `memoryEvents.${localId}`,
        localValue: 'local_event',
        remoteValue: 'remote_event',
        resolvedValue: 'both_kept'
      })
    }
  }

  const merged = [...(remoteEvents || []), ...(localEvents || []).filter(e => !remoteIds.has(e.id))]
  return { merged, conflicts }
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
      const strategy = body.strategy || 'latest_wins'

      let resolution: ConflictResolution

      switch (strategy) {
        case 'local_wins':
          resolution = {
            resolution: 'local',
            strategy,
            mergedData: body.localData,
            conflicts: []
          }
          break

        case 'remote_wins':
          resolution = {
            resolution: 'remote',
            strategy,
            mergedData: body.remoteData,
            conflicts: []
          }
          break

        case 'field_merge': {
          const personaResult = mergePersonaArrays(body.localData.personas, body.remoteData.personas)
          const eventResult = mergeMemoryEventArrays(body.localData.memoryEvents, body.remoteData.memoryEvents)

          resolution = {
            resolution: 'merge',
            strategy,
            mergedData: {
              personas: personaResult.merged,
              memoryEvents: eventResult.merged
            },
            conflicts: [...personaResult.conflicts, ...eventResult.conflicts]
          }
          break
        }

        case 'latest_wins':
        default:
          resolution = {
            resolution: body.localVersion >= body.remoteVersion ? 'local' : 'remote',
            strategy: 'latest_wins',
            mergedData: body.localVersion >= body.remoteVersion ? body.localData : body.remoteData,
            conflicts: []
          }
          break
      }

      res.json(resolution)
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
