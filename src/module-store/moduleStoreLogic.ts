import { defaultModules } from './ModuleRegistry'
import type { CanvasItem, Module, ModuleId, ModuleSize, ModuleStoreState } from './types'

const CANVAS_COLUMNS = 4
const LAYOUT_VERSION = 2

const keywordModuleMap: Array<{ keywords: string[]; moduleIds: ModuleId[] }> = [
  { keywords: ['任务', '待办', '行动', '计划', '项目', '交付', '看板', '冲刺', '生产线', '创作'], moduleIds: ['today-actions', 'statistics', 'persona-plan'] },
  { keywords: ['专注', '番茄', '自律', '习惯', '打卡'], moduleIds: ['focus-session', 'today-actions'] },
  { keywords: ['日历', '日程', '发布', '会议', '截止', '排期'], moduleIds: ['calendar'] },
  { keywords: ['笔记', '灵感', '记录', '复盘', '素材', '错题'], moduleIds: ['notes'] },
  { keywords: ['天气', '出行', '生活'], moduleIds: ['weather'] },
  { keywords: ['统计', '数据', '指标', '趋势', '成长'], moduleIds: ['statistics'] }
]

const safeText = (value: string, fallback: string) => {
  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized.length > 0 ? normalized : fallback
}

const rectsOverlap = (a: CanvasItem, b: CanvasItem) => {
  const aRight = a.position.x + a.size.columns
  const bRight = b.position.x + b.size.columns
  const aBottom = a.position.y + a.size.rows
  const bBottom = b.position.y + b.size.rows

  return a.position.x < bRight && aRight > b.position.x && a.position.y < bBottom && aBottom > b.position.y
}

export const snapCanvasPosition = (position: { x: number; y: number }, size: ModuleSize) => {
  return {
    x: Math.max(0, Math.min(CANVAS_COLUMNS - size.columns, Math.round(position.x))),
    y: Math.max(0, Math.round(position.y))
  }
}

export const findNextCanvasPosition = (items: CanvasItem[], size: ModuleSize) => {
  for (let y = 0; y < 50; y += 1) {
    for (let x = 0; x <= CANVAS_COLUMNS - size.columns; x += 1) {
      const candidate: CanvasItem = { moduleId: '__candidate__', position: { x, y }, size }
      if (!items.some((item) => rectsOverlap(candidate, item))) return { x, y }
    }
  }
  return { x: 0, y: items.length }
}

export const createInitialModuleStoreState = (availableModules: Module[] = defaultModules): ModuleStoreState => ({
  availableModules,
  activeModules: [],
  isStoreOpen: false
})

export const addModuleToLayout = (state: ModuleStoreState, moduleId: ModuleId): ModuleStoreState => {
  if (state.activeModules.some((item) => item.moduleId === moduleId)) return state
  const module = state.availableModules.find((item) => item.id === moduleId)
  if (!module) return state
  const item: CanvasItem = {
    moduleId,
    position: findNextCanvasPosition(state.activeModules, module.size),
    size: module.size
  }
  return { ...state, activeModules: [...state.activeModules, item] }
}

export const removeModuleFromLayout = (
  state: ModuleStoreState,
  moduleId: ModuleId,
  options: { deleteCustomModule?: boolean } = {}
): ModuleStoreState => {
  const nextActiveModules = state.activeModules.filter((item) => item.moduleId !== moduleId)
  const target = state.availableModules.find((module) => module.id === moduleId)
  const shouldDelete = options.deleteCustomModule === true && target?.isCustom === true

  return {
    ...state,
    activeModules: nextActiveModules,
    availableModules: shouldDelete
      ? state.availableModules.filter((module) => module.id !== moduleId)
      : state.availableModules
  }
}

export const moveModuleInLayout = (
  state: ModuleStoreState,
  moduleId: ModuleId,
  position: { x: number; y: number }
): ModuleStoreState => ({
  ...state,
  activeModules: state.activeModules.map((item) =>
    item.moduleId === moduleId
      ? { ...item, position: snapCanvasPosition(position, item.size) }
      : item
  )
})

export const resizeModuleInLayout = (state: ModuleStoreState, moduleId: ModuleId, size: ModuleSize): ModuleStoreState => ({
  ...state,
  activeModules: state.activeModules.map((item) =>
    item.moduleId === moduleId
      ? { ...item, size, position: snapCanvasPosition(item.position, size) }
      : item
  )
})

export const createCustomModule = (input: Omit<Module, 'id' | 'isDefault'>): Module => {
  const title = safeText(input.title, '自定义模块')
  const idBase = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
  return {
    ...input,
    id: `custom-${idBase || Date.now().toString(36)}`,
    title,
    description: safeText(input.description, '用于承载你的个性化工作流'),
    icon: safeText(input.icon, 'Sparkles'),
    category: 'custom',
    isDefault: false,
    isCustom: true
  }
}

export const upsertCustomModule = (state: ModuleStoreState, module: Module): ModuleStoreState => ({
  ...state,
  availableModules: state.availableModules.some((item) => item.id === module.id)
    ? state.availableModules.map((item) => item.id === module.id ? module : item)
    : [...state.availableModules, module]
})

export const recommendModulesForIdentity = ({
  identityDescription,
  personaModuleTitles = []
}: {
  identityDescription: string
  personaModuleTitles?: string[]
}): Module[] => {
  const text = [identityDescription, ...personaModuleTitles].join(' ').toLowerCase()
  const moduleIds = new Set<ModuleId>()

  keywordModuleMap.forEach(({ keywords, moduleIds: ids }) => {
    if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
      ids.forEach((id) => moduleIds.add(id))
    }
  })

  if (moduleIds.size === 0) {
    ;['today-actions', 'focus-session', 'notes'].forEach((id) => moduleIds.add(id))
  }

  return defaultModules.filter((module) => moduleIds.has(module.id))
}

type LayoutPayload = {
  version: number
  exportedAt: string
  modules: Module[]
  activeModules: CanvasItem[]
}

const legacySizeMap: Record<string, ModuleSize> = {
  small: { columns: 1, rows: 1 },
  medium: { columns: 2, rows: 1 },
  wide: { columns: 3, rows: 1 },
  large: { columns: 2, rows: 2 },
  'extra-large': { columns: 3, rows: 2 },
  'full-width': { columns: 4, rows: 1 },
  tall: { columns: 1, rows: 2 },
  'full-tall': { columns: 4, rows: 2 }
}

const migrateSize = (value: unknown): ModuleSize | null => {
  if (!value) return null
  if (typeof value === 'object') {
    const s = value as Record<string, unknown>
    if (typeof s.columns === 'number' && typeof s.rows === 'number'
      && s.columns >= 1 && s.columns <= 4
      && s.rows >= 1 && s.rows <= 6) {
      return { columns: s.columns, rows: s.rows }
    }
  }
  if (typeof value === 'string' && value in legacySizeMap) {
    return legacySizeMap[value]
  }
  return null
}

const isModuleSize = (value: unknown): value is ModuleSize => {
  return migrateSize(value) !== null
}

const isCanvasItem = (value: unknown): value is CanvasItem => {
  if (!value || typeof value !== 'object') return false
  const item = value as CanvasItem
  const migratedSize = migrateSize(item.size)
  if (!migratedSize) return false
  if (typeof item.moduleId !== 'string') return false
  if (typeof item.position?.x !== 'number' || typeof item.position?.y !== 'number') return false
  ;(item as { size: ModuleSize }).size = migratedSize
  return true
}

const isModule = (value: unknown): value is Module => {
  if (!value || typeof value !== 'object') return false
  const module = value as Module
  const migratedSize = migrateSize(module.size)
  if (!migratedSize) return false
  if (typeof module.id !== 'string') return false
  if (typeof module.title !== 'string') return false
  if (typeof module.description !== 'string') return false
  if (typeof module.icon !== 'string') return false
  if (typeof module.isDefault !== 'boolean') return false
  if (typeof module.isCustom !== 'boolean') return false
  ;(module as { size: ModuleSize }).size = migratedSize
  return true
}

export const exportModuleLayout = (state: ModuleStoreState): string => JSON.stringify({
  version: LAYOUT_VERSION,
  exportedAt: new Date().toISOString(),
  modules: state.availableModules.filter((module) => module.isCustom),
  activeModules: state.activeModules
}, null, 2)

export const importModuleLayout = (raw: string, baseModules: Module[] = defaultModules): ModuleStoreState => {
  let payload: LayoutPayload
  try {
    payload = JSON.parse(raw) as LayoutPayload
  } catch {
    throw new Error('布局文件格式无效')
  }

  if (payload.version !== LAYOUT_VERSION) throw new Error('布局版本不受支持')
  if (!Array.isArray(payload.modules) || !Array.isArray(payload.activeModules)) throw new Error('布局内容不完整')

  const customModules = payload.modules.filter((module) => isModule(module) && module.isCustom)
  const availableModules = [...baseModules]
  customModules.forEach((module) => {
    if (!availableModules.some((item) => item.id === module.id)) availableModules.push(module)
  })

  const availableIds = new Set(availableModules.map((module) => module.id))
  const activeModules = payload.activeModules
    .filter((item) => isCanvasItem(item) && availableIds.has(item.moduleId))
    .map((item) => ({ ...item, position: snapCanvasPosition(item.position, item.size) }))

  return { availableModules, activeModules, isStoreOpen: false }
}
