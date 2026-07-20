import { getDbClient } from './migration'
import type { UserRecord, DeviceInfo, AuthProviderKind } from '../../auth/authTypes'

export interface DbUser {
  id: string
  provider: string
  provider_user_id: string
  phone_number: string | null
  display_name: string
  avatar_url: string | null
  age: number | null
  role: string
  created_at: string
  updated_at: string
}

export interface DbDevice {
  id: string
  user_id: string
  device_name: string
  platform: string
  last_login_at: string
  bound_at: string
}

function toUserRecord(row: DbUser, devices: DbDevice[] = []): UserRecord {
  return {
    userId: row.id,
    providerUserId: row.provider_user_id,
    provider: row.provider as AuthProviderKind,
    displayName: row.display_name,
    phoneNumber: row.phone_number || '',
    avatarUrl: row.avatar_url || undefined,
    age: row.age || undefined,
    role: row.role as 'user' | 'admin',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    devices: devices.map(toDeviceInfo)
  }
}

function toDeviceInfo(row: DbDevice): DeviceInfo {
  return {
    deviceId: row.id,
    deviceName: row.device_name,
    platform: row.platform,
    lastLoginAt: row.last_login_at,
    boundAt: row.bound_at
  }
}

export const userRepo = {
  async findByProviderUserId(
    provider: AuthProviderKind,
    providerUserId: string
  ): Promise<UserRecord | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('provider', provider)
      .eq('provider_user_id', providerUserId)
      .single()

    if (error || !data) return undefined

    const { data: devices } = await client
      .from('devices')
      .select('*')
      .eq('user_id', data.id)

    return toUserRecord(data as DbUser, (devices as DbDevice[]) || [])
  },

  async findByUserId(userId: string): Promise<UserRecord | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return undefined

    const { data: devices } = await client
      .from('devices')
      .select('*')
      .eq('user_id', data.id)

    return toUserRecord(data as DbUser, (devices as DbDevice[]) || [])
  },

  async findByPhoneNumber(phoneNumber: string): Promise<UserRecord | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (error || !data) return undefined

    const { data: devices } = await client
      .from('devices')
      .select('*')
      .eq('user_id', data.id)

    return toUserRecord(data as DbUser, (devices as DbDevice[]) || [])
  },

  async createUser(params: {
    provider: AuthProviderKind
    providerUserId: string
    displayName: string
    phoneNumber: string
    age?: number
    avatarUrl?: string
  }): Promise<UserRecord> {
    const client = getDbClient()
    const { data, error } = await client
      .from('users')
      .insert({
        provider: params.provider,
        provider_user_id: params.providerUserId,
        display_name: params.displayName,
        phone_number: params.phoneNumber,
        avatar_url: params.avatarUrl || null,
        age: params.age || null,
        role: 'user'
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create user: ${error.message}`)
    return toUserRecord(data as DbUser, [])
  },

  async updateUser(
    userId: string,
    updates: Partial<Pick<UserRecord, 'displayName' | 'avatarUrl' | 'age'>>
  ): Promise<UserRecord | undefined> {
    const client = getDbClient()
    const dbUpdates: Record<string, unknown> = {}
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
    if (updates.age !== undefined) dbUpdates.age = updates.age
    dbUpdates.updated_at = new Date().toISOString()

    const { data, error } = await client
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error || !data) return undefined

    const { data: devices } = await client
      .from('devices')
      .select('*')
      .eq('user_id', data.id)

    return toUserRecord(data as DbUser, (devices as DbDevice[]) || [])
  },

  async bindDevice(
    userId: string,
    deviceName: string,
    platform?: string
  ): Promise<DeviceInfo | null> {
    const client = getDbClient()
    const { data, error } = await client
      .from('devices')
      .insert({
        user_id: userId,
        device_name: deviceName,
        platform: platform || 'web'
      })
      .select()
      .single()

    if (error || !data) return null
    return toDeviceInfo(data as DbDevice)
  },

  async getDevices(userId: string): Promise<DeviceInfo[]> {
    const client = getDbClient()
    const { data } = await client
      .from('devices')
      .select('*')
      .eq('user_id', userId)

    return (data as DbDevice[] || []).map(toDeviceInfo)
  },

  async unbindDevice(userId: string, deviceId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', userId)

    return !error
  },

  async getAllUsers(): Promise<UserRecord[]> {
    const client = getDbClient()
    const { data } = await client
      .from('users')
      .select('*')

    if (!data) return []

    const users = data as DbUser[]
    const result: UserRecord[] = []

    for (const user of users) {
      const { data: devices } = await client
        .from('devices')
        .select('*')
        .eq('user_id', user.id)

      result.push(toUserRecord(user, (devices as DbDevice[]) || []))
    }

    return result
  }
}
