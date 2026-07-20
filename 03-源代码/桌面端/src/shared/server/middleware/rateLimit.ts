import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const DEFAULT_WINDOW_MS = 60 * 1000
const DEFAULT_MAX_REQUESTS = 60
const AUTH_MAX_REQUESTS = 10
const AUTH_WINDOW_MS = 60 * 1000

const store = new Map<string, RateLimitEntry>()

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function cleanup(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

setInterval(cleanup, 60 * 1000).unref()

export function rateLimit(windowMs: number = DEFAULT_WINDOW_MS, maxRequests: number = DEFAULT_MAX_REQUESTS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req)
    const key = `${ip}:${req.path}`
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      store.set(key, entry)
    }

    entry.count++

    const remaining = Math.max(0, maxRequests - entry.count)
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', remaining.toString())
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString())

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000).toString())
      res.status(429).json({ error: 'Too many requests, please try again later' })
      return
    }

    next()
  }
}

export function authRateLimit() {
  return rateLimit(AUTH_WINDOW_MS, AUTH_MAX_REQUESTS)
}
