export type AuthProviderKind = 'wechat' | 'alipay' | 'apple' | 'dev'

export type AuthRole = 'user' | 'admin'

export interface AuthSession {
  userId: string
  role: AuthRole
  displayName: string
  provider: AuthProviderKind
  accessToken: string
  refreshToken: string
  expiresAt: number
  phoneNumber?: string
  avatarUrl?: string
}

export interface LoginRequest {
  provider: AuthProviderKind
  code: string
  phoneNumber?: string
}

export interface RegisterRequest {
  provider: AuthProviderKind
  code: string
  phoneNumber: string
  displayName: string
  age?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResult {
  success: boolean
  session?: AuthSession
  error?: string
  needRegister?: boolean
  providerUserId?: string
}

export interface OAuthProvider {
  readonly kind: AuthProviderKind
  getAuthCode(): Promise<string>
  getUserInfo(code: string): Promise<OAuthUserInfo>
  isAvailable(): boolean
}

export interface OAuthUserInfo {
  providerUserId: string
  displayName: string
  avatarUrl?: string
  phoneNumber?: string
}

export interface UserRecord {
  userId: string
  providerUserId: string
  provider: AuthProviderKind
  displayName: string
  phoneNumber: string
  avatarUrl?: string
  age?: number
  role: AuthRole
  createdAt: string
  updatedAt: string
  devices: DeviceInfo[]
}

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  platform: string
  lastLoginAt: string
  boundAt: string
}

export const AUTH_STORAGE_KEY = 'growthos-auth-session'

export const AUTH_MODE: AuthProviderKind =
  (import.meta.env.VITE_AUTH_MODE as AuthProviderKind) || 'dev'

export function isRealAuth(provider: AuthProviderKind): boolean {
  return provider !== 'dev'
}
