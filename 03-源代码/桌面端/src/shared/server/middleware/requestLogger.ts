import type { Request, Response, NextFunction } from 'express'

interface RequestLog {
  method: string
  path: string
  status: number
  duration: number
  ip: string
  userId?: string
  userAgent?: string
  timestamp: string
}

const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie'])

function sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = '****'
    } else if (typeof value === 'string') {
      sanitized[key] = value.length > 200 ? value.slice(0, 200) + '...' : value
    } else if (Array.isArray(value)) {
      sanitized[key] = value[0]?.length > 200 ? value[0].slice(0, 200) + '...' : (value[0] || '')
    }
  }
  return sanitized
}

function formatLogEntry(log: RequestLog): string {
  const parts = [
    `[${log.timestamp}]`,
    log.method,
    log.path,
    `${log.status}`,
    `${log.duration}ms`,
    `ip=${log.ip}`
  ]
  if (log.userId) parts.push(`uid=${log.userId}`)
  return parts.join(' ')
}

export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now()
    const timestamp = new Date().toISOString()

    const authHeader = req.headers.authorization
    let userId: string | undefined
    if (authHeader) {
      try {
        const parts = authHeader.split(' ')
        if (parts.length === 2) {
          const payload = parts[1].split('.')
          if (payload.length === 3) {
            const decoded = Buffer.from(payload[1], 'base64').toString('utf8')
            const parsed = JSON.parse(decoded) as { sub?: string }
            userId = parsed.sub
          }
        }
      } catch {
        userId = undefined
      }
    }

    const originalEnd = res.end
    let finished = false

    res.end = function (...args: unknown[]) {
      if (!finished) {
        finished = true
        const duration = Date.now() - start
        const log: RequestLog = {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
          ip: req.ip || req.socket.remoteAddress || 'unknown',
          userId,
          userAgent: req.headers['user-agent']?.slice(0, 100),
          timestamp
        }

        const logLine = formatLogEntry(log)

        if (res.statusCode >= 500) {
          console.error(`[RequestLog] ${logLine}`)
        } else if (res.statusCode >= 400) {
          console.warn(`[RequestLog] ${logLine}`)
        } else {
          console.log(`[RequestLog] ${logLine}`)
        }
      }

      return originalEnd.apply(res, args as [unknown, ...unknown[]])
    }

    next()
  }
}
