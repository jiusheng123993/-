import { describe, expect, it } from 'vitest'
import {
  addModuleToLayout,
  createCustomModule,
  createInitialModuleStoreState,
  exportModuleLayout,
  importModuleLayout,
  moveModuleInLayout,
  recommendModulesForIdentity,
  removeModuleFromLayout,
  resizeModuleInLayout
} from './moduleStoreLogic'
import { defaultModules } from './ModuleRegistry'

const initialState = () => createInitialModuleStoreState(defaultModules)

describe('moduleStoreLogic', () => {
  it('adds a module to the next aligned canvas slot without duplicating it', () => {
    const state = initialState()
    const withTasks = addModuleToLayout(state, 'today-tasks')
    const withDuplicate = addModuleToLayout(withTasks, 'today-tasks')
    const withTimer = addModuleToLayout(withDuplicate, 'focus-timer')

    expect(withTasks.activeModules).toEqual([
      { moduleId: 'today-tasks', position: { x: 0, y: 0 }, size: { columns: 2, rows: 1 } }
    ])
    expect(withDuplicate.activeModules).toHaveLength(1)
    expect(withTimer.activeModules[1]).toEqual({
      moduleId: 'focus-timer',
      position: { x: 2, y: 0 },
      size: { columns: 1, rows: 1 }
    })
  })

  it('removes modules and keeps custom module definitions only until explicitly deleted', () => {
    const custom = createCustomModule({
      title: '晨间复盘',
      description: '记录醒来后的第一个行动',
      icon: 'Sunrise',
      category: 'custom',
      size: { columns: 1, rows: 1 },
      isCustom: true
    })
    const state = addModuleToLayout(
      { ...initialState(), availableModules: [...defaultModules, custom] },
      custom.id
    )

    const removedFromCanvas = removeModuleFromLayout(state, custom.id)
    const deleted = removeModuleFromLayout(removedFromCanvas, custom.id, { deleteCustomModule: true })

    expect(removedFromCanvas.activeModules).toHaveLength(0)
    expect(removedFromCanvas.availableModules.some((module) => module.id === custom.id)).toBe(true)
    expect(deleted.availableModules.some((module) => module.id === custom.id)).toBe(false)
  })

  it('snaps dragged module positions to the canvas grid and clamps negative values', () => {
    const state = addModuleToLayout(initialState(), 'statistics')

    const moved = moveModuleInLayout(state, 'statistics', { x: 2.7, y: -1.2 })
    const resized = resizeModuleInLayout(moved, 'statistics', { columns: 4, rows: 1 })

    expect(moved.activeModules[0].position).toEqual({ x: 2, y: 0 })
    expect(resized.activeModules[0].size).toEqual({ columns: 4, rows: 1 })
  })

  it('recommends default modules from identity description keywords and persona module names', () => {
    const recommended = recommendModulesForIdentity({
      identityDescription: '我是内容创作者，需要灵感、发布日历、笔记和统计复盘',
      personaModuleTitles: ['灵感收集箱', '内容生产线', '发布日历']
    })

    expect(recommended.map(module => module.id)).toEqual(
      expect.arrayContaining(['notes', 'calendar', 'statistics', 'persona-plan', 'today-actions'])
    )
  })

  it('exports and imports a safe shareable layout payload', () => {
    const custom = createCustomModule({
      title: '自定义模块',
      description: '用于验证导入导出',
      icon: 'Sparkles',
      category: 'custom',
      size: { columns: 2, rows: 1 },
      isCustom: true
    })
    const state = addModuleToLayout(
      { ...initialState(), availableModules: [...defaultModules, custom] },
      custom.id
    )
    const exported = exportModuleLayout(state)
    const imported = importModuleLayout(exported, defaultModules)

    expect(JSON.parse(exported)).toMatchObject({ version: 2 })
    expect(imported.availableModules.some((module) => module.id === custom.id)).toBe(true)
    expect(imported.activeModules).toEqual(state.activeModules)
  })

  it('rejects invalid layout import payloads', () => {
    expect(() => importModuleLayout('{"version":3}', defaultModules)).toThrow('布局版本不受支持')
    expect(() => importModuleLayout('not-json', defaultModules)).toThrow('布局文件格式无效')
  })

  it('migrates legacy string size to object size on import', () => {
    const legacyPayload = JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      modules: [],
      activeModules: [
        { moduleId: 'today-tasks', position: { x: 0, y: 0 }, size: 'medium' },
        { moduleId: 'focus-timer', position: { x: 2, y: 0 }, size: 'small' },
        { moduleId: 'statistics', position: { x: 0, y: 1 }, size: 'large' },
        { moduleId: 'weather', position: { x: 2, y: 1 }, size: 'full-width' }
      ]
    })

    const imported = importModuleLayout(legacyPayload, defaultModules)

    expect(imported.activeModules).toHaveLength(4)
    expect(imported.activeModules[0].size).toEqual({ columns: 2, rows: 1 })
    expect(imported.activeModules[1].size).toEqual({ columns: 1, rows: 1 })
    expect(imported.activeModules[2].size).toEqual({ columns: 2, rows: 2 })
    expect(imported.activeModules[3].size).toEqual({ columns: 4, rows: 1 })
  })
})