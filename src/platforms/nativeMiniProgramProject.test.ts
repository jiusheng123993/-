import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { miniProgramBlueprint } from './miniProgramBlueprint'

const projectRoot = join(process.cwd(), miniProgramBlueprint.implementationRoute.projectRoot)
const readJson = <T>(relativePath: string): T => JSON.parse(readFileSync(join(process.cwd(), relativePath), 'utf-8')) as T

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
    expect(appConfig.window.navigationBarTitleText).toBe('GrowthOS')
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

    expect(projectConfig.projectname).toBe('personal-study-planner-miniprogram')
    expect(projectConfig.miniprogramRoot).toBe('miniprogram/')
    expect(projectConfig.setting.es6).toBe(true)
    expect(projectConfig.setting.minified).toBe(true)
  })
})
