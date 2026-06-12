import { getSupabase } from '../infrastructure/supabase'
import { dataBackupKeys, SENSITIVE_KEYS } from '../data/dataBackup'

export interface MigrationModule {
  key: string
  label: string
  table: string
  count: number
  status: 'pending' | 'migrating' | 'done' | 'error'
  error?: string
}

export interface MigrationProgress {
  total: number
  done: number
  modules: MigrationModule[]
}

export function scanLocalStorage(): MigrationModule[] {
  const moduleMap: Record<string, { label: string; table: string }> = {
    'growth-workbench-state': { label: '工作区状态', table: 'workspace_state' },
    'growth-workbench-memory-state': { label: '记忆系统', table: 'memory_events' },
    'xinghuanhai-habits-state': { label: '习惯', table: 'habits' },
    'xinghuanhai-goals-state': { label: '目标', table: 'goals' },
    'xinghuanhai-journal-state': { label: '日记', table: 'journals' },
    'xinghuanhai-mood-state': { label: '心情', table: 'mood_records' },
    'xinghuanhai_identities': { label: '身份', table: 'identities' },
    'growth-workbench-custom-personas': { label: '自定义人格', table: 'custom_personas' },
    'persona_schedule': { label: '人格计划', table: 'persona_schedules' },
    'xinghuanhai_entitlements': { label: '权益', table: 'entitlements' },
    'growthos-orders': { label: '订单', table: 'orders' },
    'xinghuanhai_evolution_entries': { label: '进化记录', table: 'evolution_entries' },
    'xinghuanhai_memory_events': { label: '记忆事件', table: 'memory_events' },
    'xinghuanhai-project-state': { label: '项目', table: 'projects' },
    'xinghuanhai-reading-state': { label: '阅读', table: 'reading_records' },
    'xinghuanhai-finance-state': { label: '财务', table: 'finance_records' },
    'xinghuanhai-schedule-state': { label: '日程', table: 'schedules' },
    'xinghuanhai-backlink-state': { label: '双向链接', table: 'backlinks' },
    'xinghuanhai-english-state': { label: '英语学习', table: 'english_records' },
    'xinghuanhai-quicknotes-state': { label: '快速笔记', table: 'notes' },
    'xinghuanhai-wellness-state': { label: '健康生活', table: 'wellness_records' },
    'xinghuanhai-watchlist-state': { label: '观影清单', table: 'watchlist' },
    'xinghuanhai-quotes-state': { label: '名言收藏', table: 'quotes' },
    'xinghuanhai-timeblocks-state': { label: '时间块', table: 'time_blocks' },
    'xinghuanhai-task-templates-state': { label: '任务模板', table: 'task_templates' },
    'xinghuanhai-creator-ideas': { label: '创作灵感', table: 'creator_ideas' },
    'xinghuanhai-module-layout-state': { label: '模块布局', table: 'module_layouts' },
    'xinghuanhai-onboarding-data': { label: '引导数据', table: 'onboarding_data' },
    'studyflow-state': { label: '学习流程(旧)', table: 'study_flow' }
  }

  const modules: MigrationModule[] = []

  for (const key of dataBackupKeys) {
    if (SENSITIVE_KEYS.includes(key)) continue

    const raw = window.localStorage.getItem(key)
    if (!raw) continue

    let count = 0
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        count = parsed.length
      } else if (typeof parsed === 'object' && parsed !== null) {
        count = Object.keys(parsed).length
      }
    } catch {
      count = 1
    }

    const info = moduleMap[key] || { label: key, table: 'unknown' }
    modules.push({
      key,
      label: info.label,
      table: info.table,
      count,
      status: 'pending'
    })
  }

  return modules
}

export async function migrateModule(
  userId: string,
  module: MigrationModule,
  onProgress?: (status: MigrationModule['status'], error?: string) => void
): Promise<void> {
  onProgress?.('migrating')

  try {
    const raw = window.localStorage.getItem(module.key)
    if (!raw) {
      onProgress?.('done')
      return
    }

    const data = JSON.parse(raw)

    switch (module.key) {
      case 'xinghuanhai-habits-state': {
        const habits = Array.isArray(data) ? data : data.habits || []
        await migrateHabits(userId, habits)
        break
      }
      case 'xinghuanhai-goals-state': {
        const goals = Array.isArray(data) ? data : data.goals || []
        await migrateGoals(userId, goals)
        break
      }
      case 'xinghuanhai-journal-state': {
        const journals = Array.isArray(data) ? data : data.journals || []
        await migrateJournals(userId, journals)
        break
      }
      case 'xinghuanhai-mood-state': {
        const moods = Array.isArray(data) ? data : data.moods || []
        await migrateMoods(userId, moods)
        break
      }
      case 'xinghuanhai_identities': {
        const identities = Array.isArray(data) ? data : data.identities || []
        await migrateIdentities(userId, identities)
        break
      }
      case 'growth-workbench-custom-personas': {
        const personas = Array.isArray(data) ? data : data.personas || []
        await migratePersonas(userId, personas)
        break
      }
      case 'xinghuanhai_entitlements': {
        const entitlements = Array.isArray(data) ? data : data.entitlements || []
        await migrateEntitlements(userId, entitlements)
        break
      }
      case 'xinghuanhai_memory_events':
      case 'growth-workbench-memory-state': {
        const events = Array.isArray(data) ? data : data.events || data.memories || []
        await migrateMemoryEvents(userId, events)
        break
      }
      case 'xinghuanhai-quicknotes-state': {
        const notes = Array.isArray(data) ? data : data.notes || []
        await migrateNotes(userId, notes)
        break
      }
      default:
        break
    }

    onProgress?.('done')
  } catch (e) {
    const msg = e instanceof Error ? e.message : '迁移失败'
    onProgress?.('error', msg)
    throw e
  }
}

async function migrateHabits(userId: string, habits: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || habits.length === 0) return

  const rows = habits.map((h) => ({
    user_id: userId,
    name: String(h.name || h.title || ''),
    frequency: String(h.frequency || 'daily'),
    streak: Number(h.streak || 0),
    created_at: String(h.createdAt || h.created_at || new Date().toISOString())
  }))

  await supabase.from('habits').upsert(rows, { onConflict: 'id' })
}

async function migrateGoals(userId: string, goals: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || goals.length === 0) return

  const rows = goals.map((g) => ({
    user_id: userId,
    title: String(g.title || ''),
    subject: g.subject ? String(g.subject) : null,
    target_date: g.targetDate || g.target_date || null,
    progress: Number(g.progress || 0),
    status: String(g.status || 'active'),
    created_at: String(g.createdAt || g.created_at || new Date().toISOString())
  }))

  await supabase.from('goals').upsert(rows, { onConflict: 'id' })
}

async function migrateJournals(userId: string, journals: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || journals.length === 0) return

  const rows = journals.map((j) => ({
    user_id: userId,
    title: j.title ? String(j.title) : null,
    content: String(j.content || ''),
    mood: j.mood ? String(j.mood) : null,
    tags: Array.isArray(j.tags) ? j.tags : [],
    entry_date: String(j.entryDate || j.entry_date || new Date().toISOString().split('T')[0]),
    created_at: String(j.createdAt || j.created_at || new Date().toISOString())
  }))

  await supabase.from('journals').upsert(rows, { onConflict: 'id' })
}

async function migrateMoods(userId: string, moods: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || moods.length === 0) return

  const rows = moods.map((m) => ({
    user_id: userId,
    mood: String(m.mood || 'okay'),
    note: m.note ? String(m.note) : null,
    recorded_at: String(m.recordedAt || m.recorded_at || new Date().toISOString())
  }))

  await supabase.from('mood_records').upsert(rows, { onConflict: 'id' })
}

async function migrateIdentities(userId: string, identities: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || identities.length === 0) return

  const rows = identities.map((i) => ({
    user_id: userId,
    name: String(i.name || ''),
    role: String(i.role || 'student'),
    avatar_emoji: i.avatarEmoji ? String(i.avatarEmoji) : null,
    is_active: Boolean(i.isActive || false),
    created_at: String(i.createdAt || i.created_at || new Date().toISOString())
  }))

  await supabase.from('identities').upsert(rows, { onConflict: 'id' })
}

async function migratePersonas(userId: string, personas: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || personas.length === 0) return

  const rows = personas.map((p) => ({
    user_id: userId,
    name: String(p.name || ''),
    description: p.description ? String(p.description) : null,
    tone: p.tone ? String(p.tone) : null,
    identity: p.identity ? String(p.identity) : null,
    avatar_emoji: p.avatarEmoji ? String(p.avatarEmoji) : null,
    is_published: Boolean(p.isPublished || false),
    safety_status: String(p.safetyStatus || 'pending'),
    created_at: String(p.createdAt || p.created_at || new Date().toISOString())
  }))

  await supabase.from('custom_personas').upsert(rows, { onConflict: 'id' })
}

async function migrateEntitlements(userId: string, entitlements: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || entitlements.length === 0) return

  const rows = entitlements.map((e) => ({
    user_id: userId,
    key: String(e.key || e.code || ''),
    source: String(e.source || 'migration'),
    expires_at: e.expiresAt || e.expireAt || null,
    metadata: e.metadata || {},
    created_at: String(e.createdAt || e.created_at || new Date().toISOString())
  }))

  await supabase.from('entitlements').upsert(rows, { onConflict: 'user_id,key' })
}

async function migrateMemoryEvents(userId: string, events: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || events.length === 0) return

  const rows = events.map((e) => ({
    user_id: userId,
    type: String(e.type || 'system'),
    title: String(e.title || ''),
    content: e.content ? String(e.content) : null,
    importance: Number(e.importance || 1),
    tags: Array.isArray(e.tags) ? e.tags : [],
    forgotten: Boolean(e.forgotten || false),
    created_at: String(e.createdAt || e.created_at || new Date().toISOString())
  }))

  await supabase.from('memory_events').upsert(rows, { onConflict: 'id' })
}

async function migrateNotes(userId: string, notes: Array<Record<string, unknown>>) {
  const supabase = getSupabase()
  if (!supabase || notes.length === 0) return

  const rows = notes.map((n) => ({
    user_id: userId,
    title: String(n.title || ''),
    subject: n.subject ? String(n.subject) : null,
    content: n.content ? String(n.content) : null,
    created_at: String(n.createdAt || n.created_at || new Date().toISOString())
  }))

  await supabase.from('notes').upsert(rows, { onConflict: 'id' })
}

export function clearLocalStorageAfterMigration(modules: MigrationModule[]): void {
  for (const mod of modules) {
    if (mod.status === 'done') {
      window.localStorage.removeItem(mod.key)
    }
  }
}
