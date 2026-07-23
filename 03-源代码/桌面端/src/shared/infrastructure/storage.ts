import { getSupabase } from './supabase'

const AVATAR_BUCKET = 'avatars'
const BACKUP_BUCKET = 'backups'

export interface UploadResult {
  path: string | null
  publicUrl: string | null
  error: string | null
}

export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  const supabase = getSupabase()
  if (!supabase) return { path: null, publicUrl: null, error: 'Supabase 未配置' }

  const fileExt = file.name.split('.').pop() || 'png'
  const filePath = `${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true })

  if (error) return { path: null, publicUrl: null, error: error.message }

  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(data.path)

  return { path: data.path, publicUrl: urlData.publicUrl, error: null }
}

export async function deleteAvatar(path: string): Promise<{ error: string | null }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase 未配置' }

  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path])
  return { error: error?.message || null }
}

export async function uploadBackup(userId: string, data: string): Promise<UploadResult> {
  const supabase = getSupabase()
  if (!supabase) return { path: null, publicUrl: null, error: 'Supabase 未配置' }

  const filePath = `${userId}/backup-${Date.now()}.json`
  const blob = new Blob([data], { type: 'application/json' })

  const { data: uploadData, error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .upload(filePath, blob)

  if (error) return { path: null, publicUrl: null, error: error.message }

  const { data: urlData } = supabase.storage
    .from(BACKUP_BUCKET)
    .getPublicUrl(uploadData.path)

  return { path: uploadData.path, publicUrl: urlData.publicUrl, error: null }
}

export async function listBackups(userId: string): Promise<{ name: string; created_at: string }[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .list(userId)

  if (error || !data) return []
  return data.map((f) => ({ name: f.name, created_at: f.created_at }))
}
