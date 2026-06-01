import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { miniProgramBlueprint } from './miniProgramBlueprint'

const projectRoot = join(process.cwd(), miniProgramBlueprint.implementationRoute.projectRoot)
const readJson = <T>(relativePath: string): T => JSON.parse(readFileSync(join(process.cwd(), relativePath), 'utf-8')) as T
const readText = (relativePath: string): string => readFileSync(join(process.cwd(), relativePath), 'utf-8')

type MiniProgramAppConfig = {
  pages: string[]
  window: {
    navigationBarTitleText: string
  }
  tabBar: {
    list: Array<{
      pagePath: string
      text: string
    }>
  }
}

type MiniProgramProjectConfig = {
  projectname: string
  miniprogramRoot: string
  setting: {
    es6: boolean
    minified: boolean
  }
}

describe('native WeChat Mini Program project', () => {
  it('creates the native project root selected by the blueprint', () => {
    expect(existsSync(projectRoot)).toBe(true)
    expect(existsSync(join(process.cwd(), 'project.config.json'))).toBe(true)
  })

  it('maps blueprint navigation to native app pages and tab bar entries', () => {
    const appConfig = readJson<MiniProgramAppConfig>('miniprogram/app.json')

    expect(appConfig.pages).toEqual([
      'pages/home/index',
      'pages/plan/index',
      'pages/quick-add/index',
      'pages/modules/index',
      'pages/profile/index'
    ])
    expect(appConfig.tabBar.list.map((item) => item.text)).toEqual(miniProgramBlueprint.navigation.map((item) => item.label))
    expect(appConfig.window.navigationBarTitleText).toBe('星寰海')
  })

  it('keeps a native mini program page file set for every navigation entry', () => {
    const appConfig = readJson<MiniProgramAppConfig>('miniprogram/app.json')

    for (const page of appConfig.pages) {
      expect(existsSync(join(projectRoot, `${page}.js`))).toBe(true)
      expect(existsSync(join(projectRoot, `${page}.json`))).toBe(true)
      expect(existsSync(join(projectRoot, `${page}.wxml`))).toBe(true)
      expect(existsSync(join(projectRoot, `${page}.wxss`))).toBe(true)
    }
  })

  it('keeps shared native blueprint data aligned with the desktop blueprint', () => {
    const nativeBlueprint = readJson<typeof miniProgramBlueprint>('miniprogram/shared/blueprint.json')

    expect(nativeBlueprint.positioning).toBe(miniProgramBlueprint.positioning)
    expect(nativeBlueprint.implementationRoute).toEqual(miniProgramBlueprint.implementationRoute)
    expect(nativeBlueprint.navigation).toEqual(miniProgramBlueprint.navigation)
    expect(nativeBlueprint.modules).toEqual(miniProgramBlueprint.modules)
    expect(nativeBlueprint.syncStrategy).toBe(miniProgramBlueprint.syncStrategy)
  })

  it('uses WeChat DevTools project config without adding cross-platform framework dependencies', () => {
    const projectConfig = readJson<MiniProgramProjectConfig>('project.config.json')

    expect(projectConfig.projectname).toBe('xinghuanhai-miniprogram')
    expect(projectConfig.miniprogramRoot).toBe('miniprogram/')
    expect(projectConfig.setting.es6).toBe(true)
    expect(projectConfig.setting.minified).toBe(true)
  })

  it('renders the home page as a complete mobile workbench instead of a placeholder', () => {
    const homeScript = readText('miniprogram/pages/home/index.js')
    const homeTemplate = readText('miniprogram/pages/home/index.wxml')

    expect(homeScript).toContain('priorities')
    expect(homeScript).toContain('shortcuts')
    expect(homeScript).toContain('energyStatus')
    expect(homeScript).toContain('reviewSummary')
    expect(homeScript).toContain('低压力恢复')
    expect(homeScript).toContain('今日复盘')
    expect(homeTemplate).toContain('今日优先级')
    expect(homeTemplate).toContain('快捷入口')
    expect(homeTemplate).toContain('energyStatus')
    expect(homeTemplate).toContain('reviewSummary')
  })

  it('renders the plan page with tasks, goals, schedule and review sections', () => {
    const planScript = readText('miniprogram/pages/plan/index.js')
    const planTemplate = readText('miniprogram/pages/plan/index.wxml')

    expect(planScript).toContain('tasks')
    expect(planScript).toContain('goals')
    expect(planScript).toContain('schedule')
    expect(planScript).toContain('reviewPrompts')
    expect(planTemplate).toContain('今日任务')
    expect(planTemplate).toContain('目标进度')
    expect(planTemplate).toContain('日程时间盒')
    expect(planTemplate).toContain('轻量复盘')
  })

  it('renders quick capture with typed capture entries and privacy hints', () => {
    const quickAddScript = readText('miniprogram/pages/quick-add/index.js')
    const quickAddTemplate = readText('miniprogram/pages/quick-add/index.wxml')

    expect(quickAddScript).toContain('captureTypes')
    expect(quickAddScript).toContain('privacyHint')
    expect(quickAddScript).toContain('任务')
    expect(quickAddScript).toContain('灵感')
    expect(quickAddScript).toContain('症状')
    expect(quickAddTemplate).toContain('captureTypes')
    expect(quickAddTemplate).toContain('隐私提示')
  })

  it('renders module center with toggles, privacy levels and staged availability', () => {
    const modulesScript = readText('miniprogram/pages/modules/index.js')
    const modulesTemplate = readText('miniprogram/pages/modules/index.wxml')

    expect(modulesScript).toContain('moduleGroups')
    expect(modulesScript).toContain('enabledCount')
    expect(modulesScript).toContain('privacyLevelLabels')
    expect(modulesScript).toContain('availableNow')
    expect(modulesScript).toContain('可用')
    expect(modulesScript).toContain('预留')
    expect(modulesTemplate).toContain('已开启模块')
    expect(modulesTemplate).toContain('隐私级别')
    expect(modulesTemplate).toContain('availabilityLabel')
    expect(modulesTemplate).toContain('switch')
  })

  it('renders profile with privacy controls, local export and destructive delete safeguards', () => {
    const profileScript = readText('miniprogram/pages/profile/index.js')
    const profileTemplate = readText('miniprogram/pages/profile/index.wxml')

    expect(profileScript).toContain('privacyControls')
    expect(profileScript).toContain('dataActions')
    expect(profileScript).toContain('syncStatus')
    expect(profileScript).toContain('sensitiveDataNotice')
    expect(profileScript).toContain('本地导出')
    expect(profileScript).toContain('删除数据')
    expect(profileScript).toContain('二次确认')
    expect(profileTemplate).toContain('隐私控制')
    expect(profileTemplate).toContain('dataActions')
    expect(profileTemplate).toContain('settings')
  })

  it('exposes a standalone WeChat DevTools project directory ready to import', () => {
    const standaloneRoot = join(process.cwd(), 'mini-program-app')

    expect(existsSync(standaloneRoot)).toBe(true)
    expect(existsSync(join(standaloneRoot, 'project.config.json'))).toBe(true)
    expect(existsSync(join(standaloneRoot, 'project.private.config.json'))).toBe(true)
    expect(existsSync(join(standaloneRoot, 'sitemap.json'))).toBe(true)
    expect(existsSync(join(standaloneRoot, 'app.js'))).toBe(true)
    expect(existsSync(join(standaloneRoot, 'app.json'))).toBe(true)
    expect(existsSync(join(standaloneRoot, 'app.wxss'))).toBe(true)
    expect(existsSync(join(standaloneRoot, 'README.md'))).toBe(true)

    const projectConfig = readJson<MiniProgramProjectConfig>('mini-program-app/project.config.json')

    expect(projectConfig.projectname).toBe('xinghuanhai-miniprogram')
    expect(projectConfig.miniprogramRoot).toBe('./')
    expect(projectConfig.setting.es6).toBe(true)
    expect(projectConfig.setting.minified).toBe(true)
  })

  it('mirrors every blueprint navigation page inside the standalone mini program directory', () => {
    const appConfig = readJson<MiniProgramAppConfig>('mini-program-app/app.json')

    expect(appConfig.pages).toEqual([
      'pages/home/index',
      'pages/plan/index',
      'pages/quick-add/index',
      'pages/modules/index',
      'pages/profile/index'
    ])
    expect(appConfig.tabBar.list.map((item) => item.text)).toEqual(miniProgramBlueprint.navigation.map((item) => item.label))

    for (const page of appConfig.pages) {
      expect(existsSync(join(process.cwd(), 'mini-program-app', `${page}.js`))).toBe(true)
      expect(existsSync(join(process.cwd(), 'mini-program-app', `${page}.json`))).toBe(true)
      expect(existsSync(join(process.cwd(), 'mini-program-app', `${page}.wxml`))).toBe(true)
      expect(existsSync(join(process.cwd(), 'mini-program-app', `${page}.wxss`))).toBe(true)
    }
  })

  it('keeps the standalone mini program shared blueprint identical to the desktop blueprint', () => {
    const standaloneBlueprint = readJson<typeof miniProgramBlueprint>('mini-program-app/shared/blueprint.json')

    expect(standaloneBlueprint.positioning).toBe(miniProgramBlueprint.positioning)
    expect(standaloneBlueprint.navigation).toEqual(miniProgramBlueprint.navigation)
    expect(standaloneBlueprint.modules).toEqual(miniProgramBlueprint.modules)
    expect(standaloneBlueprint.syncStrategy).toBe(miniProgramBlueprint.syncStrategy)
  })

  it('keeps standalone mini program page sources identical to the in-repo mirror', () => {
    const pageFiles = [
      'pages/home/index.js',
      'pages/home/index.wxml',
      'pages/home/index.wxss',
      'pages/plan/index.js',
      'pages/plan/index.wxml',
      'pages/plan/index.wxss',
      'pages/quick-add/index.js',
      'pages/quick-add/index.wxml',
      'pages/quick-add/index.wxss',
      'pages/modules/index.js',
      'pages/modules/index.wxml',
      'pages/modules/index.wxss',
      'pages/profile/index.js',
      'pages/profile/index.wxml',
      'pages/profile/index.wxss'
    ]

    for (const relative of pageFiles) {
      const mirror = readText(`miniprogram/${relative}`)
      const standalone = readText(`mini-program-app/${relative}`)
      expect(standalone).toBe(mirror)
    }
  })
})
