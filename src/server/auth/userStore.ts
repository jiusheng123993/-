import type { UserRecord, DeviceInfo, AuthProviderKind } from '../../auth/authTypes'

const users = new Map<string, UserRecord>()
const providerIndex = new Map<string, string>()

function generateUserId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `user-${timestamp}-${random}`
}

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `device-${timestamp}-${random}`
}

export interface UserStore {
  findByProviderUserId(provider: AuthProviderKind, providerUserId: string): UserRecord | undefined
  findByUserId(userId: string): UserRecord | undefined
  findByPhoneNumber(phoneNumber: string): UserRecord | undefined
  createUser(params: {
    provider: AuthProviderKind
    providerUserId: string
    displayName: string
    phoneNumber: string
    age?: number
    avatarUrl?: string
  }): UserRecord
  updateUser(userId: string, updates: Partial<Pick<UserRecord, 'displayName' | 'avatarUrl' | 'age'>>): UserRecord | undefined
  bindDevice(userId: string, deviceName: string, platform?: string): DeviceInfo | null
  getDevices(userId: string): DeviceInfo[]
  unbindDevice(userId: string, deviceId: string): boolean
  getAllUsers(): UserRecord[]
}

export function createUserStore(): UserStore {
  return {
    findByProviderUserId(provider: AuthProviderKind, providerUserId: string): UserRecord | undefined {
      const key = `${provider}:${providerUserId}`
      const userId = providerIndex.get(key)
      if (!userId) return undefined
      return users.get(userId)
    },

    findByUserId(userId: string): UserRecord | undefined {
      return users.get(userId)
    },

    findByPhoneNumber(phoneNumber: string): UserRecord | undefined {
      for (const user of users.values()) {
        if (user.phoneNumber === phoneNumber) return user
      }
      return undefined
    },

    createUser(params): UserRecord {
      const userId = generateUserId()
      const now = new Date().toISOString()

      const user: UserRecord = {
        userId,
        providerUserId: params.providerUserId,
        provider: params.provider,
        displayName: params.displayName,
        phoneNumber: params.phoneNumber,
        avatarUrl: params.avatarUrl,
        age: params.age,
        role: 'user',
        createdAt: now,
        updatedAt: now,
        devices: []
      }

      users.set(userId, user)
      providerIndex.set(`${params.provider}:${params.providerUserId}`, userId)

      return user
    },

    updateUser(userId: string, updates): UserRecord | undefined {
      const user = users.get(userId)
      if (!user) return undefined

      Object.assign(user, updates, { updatedAt: new Date().toISOString() })
      return user
    },

    bindDevice(userId: string, deviceName: string, platform?: string): DeviceInfo | null {
      const user = users.get(userId)
      if (!user) return null

      const now = new Date().toISOString()
      const device: DeviceInfo = {
        deviceId: generateDeviceId(),
        deviceName,
        platform: platform || 'web',
        lastLoginAt: now,
        boundAt: now
      }

      user.devices.push(device)
      user.updatedAt = now
      return device
    },

    getDevices(userId: string): DeviceInfo[] {
      const user = users.get(userId)
      return user ? [...user.devices] : []
    },

    unbindDevice(userId: string, deviceId: string): boolean {
      const user = users.get(userId)
      if (!user) return false

      const index = user.devices.findIndex(d => d.deviceId === deviceId)
      if (index === -1) return false

      user.devices.splice(index, 1)
      user.updatedAt = new Date().toISOString()
      return true
    },

    getAllUsers(): UserRecord[] {
      return Array.from(users.values())
    }
  }
}

let instance: UserStore | null = null

export function getUserStore(): UserStore {
  if (!instance) {
    instance = createUserStore()
  }
  return instance
}
