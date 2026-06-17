import type { UserRecord, DeviceInfo, AuthProviderKind } from '../../auth/authTypes'
import { userRepo } from '../db/userRepository'

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
  findByProviderUserId(provider: AuthProviderKind, providerUserId: string): Promise<UserRecord | undefined>
  findByUserId(userId: string): Promise<UserRecord | undefined>
  findByPhoneNumber(phoneNumber: string): Promise<UserRecord | undefined>
  createUser(params: {
    provider: AuthProviderKind
    providerUserId: string
    displayName: string
    phoneNumber: string
    age?: number
    avatarUrl?: string
  }): Promise<UserRecord>
  updateUser(userId: string, updates: Partial<Pick<UserRecord, 'displayName' | 'avatarUrl' | 'age'>>): Promise<UserRecord | undefined>
  bindDevice(userId: string, deviceName: string, platform?: string): Promise<DeviceInfo | null>
  getDevices(userId: string): Promise<DeviceInfo[]>
  unbindDevice(userId: string, deviceId: string): Promise<boolean>
  getAllUsers(): Promise<UserRecord[]>
}

function createMemoryUserStore(): UserStore {
  return {
    async findByProviderUserId(provider: AuthProviderKind, providerUserId: string) {
      const key = `${provider}:${providerUserId}`
      const userId = providerIndex.get(key)
      if (!userId) return undefined
      return users.get(userId)
    },

    async findByUserId(userId: string) {
      return users.get(userId)
    },

    async findByPhoneNumber(phoneNumber: string) {
      for (const user of users.values()) {
        if (user.phoneNumber === phoneNumber) return user
      }
      return undefined
    },

    async createUser(params) {
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

    async updateUser(userId, updates) {
      const user = users.get(userId)
      if (!user) return undefined

      Object.assign(user, updates, { updatedAt: new Date().toISOString() })
      return user
    },

    async bindDevice(userId, deviceName, platform) {
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

    async getDevices(userId) {
      const user = users.get(userId)
      return user ? [...user.devices] : []
    },

    async unbindDevice(userId, deviceId) {
      const user = users.get(userId)
      if (!user) return false

      const index = user.devices.findIndex(d => d.deviceId === deviceId)
      if (index === -1) return false

      user.devices.splice(index, 1)
      user.updatedAt = new Date().toISOString()
      return true
    },

    async getAllUsers() {
      return Array.from(users.values())
    }
  }
}

function createPersistentUserStore(): UserStore {
  return {
    async findByProviderUserId(provider, providerUserId) {
      try {
        return await userRepo.findByProviderUserId(provider, providerUserId)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        return undefined
      }
    },

    async findByUserId(userId) {
      try {
        return await userRepo.findByUserId(userId)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        return users.get(userId)
      }
    },

    async findByPhoneNumber(phoneNumber) {
      try {
        return await userRepo.findByPhoneNumber(phoneNumber)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        for (const user of users.values()) {
          if (user.phoneNumber === phoneNumber) return user
        }
        return undefined
      }
    },

    async createUser(params) {
      try {
        return await userRepo.createUser(params)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        const memoryStore = createMemoryUserStore()
        return memoryStore.createUser(params)
      }
    },

    async updateUser(userId, updates) {
      try {
        return await userRepo.updateUser(userId, updates)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        const user = users.get(userId)
        if (!user) return undefined
        Object.assign(user, updates, { updatedAt: new Date().toISOString() })
        return user
      }
    },

    async bindDevice(userId, deviceName, platform) {
      try {
        return await userRepo.bindDevice(userId, deviceName, platform)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
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
      }
    },

    async getDevices(userId) {
      try {
        return await userRepo.getDevices(userId)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        const user = users.get(userId)
        return user ? [...user.devices] : []
      }
    },

    async unbindDevice(userId, deviceId) {
      try {
        return await userRepo.unbindDevice(userId, deviceId)
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        const user = users.get(userId)
        if (!user) return false
        const index = user.devices.findIndex(d => d.deviceId === deviceId)
        if (index === -1) return false
        user.devices.splice(index, 1)
        user.updatedAt = new Date().toISOString()
        return true
      }
    },

    async getAllUsers() {
      try {
        return await userRepo.getAllUsers()
      } catch (err) {
        console.warn('[UserStore] Supabase unavailable, falling back to memory:', (err as Error).message)
        return Array.from(users.values())
      }
    }
  }
}

let instance: UserStore | null = null

export function createUserStore(): UserStore {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    return createPersistentUserStore()
  }
  return createMemoryUserStore()
}

export function getUserStore(): UserStore {
  if (!instance) {
    instance = createUserStore()
  }
  return instance
}
