/**
 * 全家福场景常量自洽性测试
 * 守护三件事：
 * 1. 五大主题分组里的场景 key 与标签表完全一致（不缺不杂）
 * 2. 场景总数 = 22（与服务端 FAMILY_PHOTO_SCENES 白名单数量对齐；服务端另有 schema↔清单同步单测）
 * 3. 默认场景（温馨客厅）必须在分组里真实存在，否则宫格默认选中态会渲染不出来
 */
import { describe, it, expect } from 'vitest'
import {
  FAMILY_PHOTO_SCENE_GROUPS,
  FAMILY_PHOTO_SCENE_LABELS,
  DEFAULT_FAMILY_PHOTO_SCENE,
} from '../familyPhotoService'

describe('FAMILY_PHOTO_SCENE 常量自洽', () => {
  it('每个分组场景都有对应标签（emoji+label 非空）', () => {
    for (const group of FAMILY_PHOTO_SCENE_GROUPS) {
      for (const scene of group.scenes) {
        const meta = FAMILY_PHOTO_SCENE_LABELS[scene]
        expect(meta, `场景 ${scene} 缺少标签`).toBeTruthy()
        expect(meta.label.length).toBeGreaterThan(0)
        expect(meta.emoji.length).toBeGreaterThan(0)
      }
    }
  })

  it('分组内无重复场景 key，总数为 22（与服务端白名单数量一致）', () => {
    const keys = FAMILY_PHOTO_SCENE_GROUPS.flatMap((g) => g.scenes)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.length).toBe(22)
    // 标签表也不得多出分组外的孤儿条目
    expect(Object.keys(FAMILY_PHOTO_SCENE_LABELS).length).toBe(22)
  })

  it('默认场景（温馨客厅）存在于分组中', () => {
    const allKeys = FAMILY_PHOTO_SCENE_GROUPS.flatMap((g) => g.scenes)
    expect(allKeys).toContain(DEFAULT_FAMILY_PHOTO_SCENE)
  })
})
