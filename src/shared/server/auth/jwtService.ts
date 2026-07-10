import crypto from 'crypto'

const JWT_SECRET = process.env.VITE_JWT_SECRET || 'xinghuanhai-dev-secret-key-2026'
const ACCESS_TOKEN_EXPIRY = 7200
const REFRESH_TOKEN_EXPIRY = 604800

interface JwtPayload {
  userId: string
  role: string
  provider: string
  iat: number
  exp: number
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4)
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
}

function hmacSign(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: number = ACCESS_TOKEN_EXPIRY): string {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = hmacSign(`${header}.${body}`, JWT_SECRET)

  return `${header}.${body}.${signature}`
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, signature] = parts
    const expectedSignature = hmacSign(`${header}.${body}`, JWT_SECRET)

    if (signature !== expectedSignature) return null

    const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export function signAccessToken(userId: string, role: string, provider: string): string {
  return signToken({ userId, role, provider }, ACCESS_TOKEN_EXPIRY)
}

export function signRefreshToken(userId: string, role: string, provider: string): string {
  return signToken({ userId, role, provider }, REFRESH_TOKEN_EXPIRY)
}

export function getTokenExpiry(): { accessExpiresIn: number; refreshExpiresIn: number } {
  return {
    accessExpiresIn: ACCESS_TOKEN_EXPIRY,
    refreshExpiresIn: REFRESH_TOKEN_EXPIRY
  }
}
