/**
 * shouldGuideWechatBind / bindSkippedKey 单测
 * 覆盖：正常（资料未完善引导）/ 边界（已完善、空白昵称、已跳过、非微信端、跳过标记空串）/ 异常（未登录）
 */
import { describe, it, expect } from 'vitest'
import { shouldGuideWechatBind, bindSkippedKey } from './guide'
import { STORAGE_KEYS } from '../../constants'

describe('shouldGuideWechatBind 登录后是否引导绑定微信头像昵称', () => {
  it('微信端 + 资料未完善（无昵称无头像）+ 未跳过 → 引导', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '', avatar: '' },
        skipped: false,
      })
    ).toBe(true)
  })

  it('微信端 + 只有昵称没有头像 → 引导（头像缺失也算未完善）', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '铲屎官小王', avatar: '' },
        skipped: false,
      })
    ).toBe(true)
  })

  it('微信端 + 只有头像没有昵称 → 引导（昵称缺失也算未完善）', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '', avatar: 'https://cdn.example.com/a.png' },
        skipped: false,
      })
    ).toBe(true)
  })

  it('微信端 + 资料已完善（昵称头像都有）→ 不引导', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '铲屎官小王', avatar: 'https://cdn.example.com/a.png' },
        skipped: false,
      })
    ).toBe(false)
  })

  it('微信端 + 昵称是纯空白串但头像有 → 仍引导（空白昵称不等于已完善）', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '   ', avatar: 'https://cdn.example.com/a.png' },
        skipped: false,
      })
    ).toBe(true)
  })

  it('微信端 + 头像字段是纯空白串但昵称有 → 仍引导', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '铲屎官小王', avatar: '  ' },
        skipped: false,
      })
    ).toBe(true)
  })

  it('微信端 + 资料未完善 + 点过"暂不绑定" → 不引导（避免反复打断）', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '', avatar: '' },
        skipped: true,
      })
    ).toBe(false)
  })

  it('微信端 + 资料未完善 + 跳过标记读取为空串（getStorageSync 无值返回 ""）→ 引导', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: '', avatar: '' },
        skipped: '',
      })
    ).toBe(true)
  })

  it('非微信端（App/H5）→ 不引导（无 chooseAvatar 能力）', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: false,
        user: { nickname: '', avatar: '' },
        skipped: false,
      })
    ).toBe(false)
  })

  it('未登录（user 为 null）→ 不引导', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: null,
        skipped: false,
      })
    ).toBe(false)
  })

  it('用户资料字段为 null（后端新用户默认值）→ 引导', () => {
    expect(
      shouldGuideWechatBind({
        isWeapp: true,
        user: { nickname: null, avatar: null },
        skipped: false,
      })
    ).toBe(true)
  })
})

describe('bindSkippedKey 跳过标记存储 key', () => {
  it('带 userId → key 含 userId 后缀（账号隔离）', () => {
    expect(bindSkippedKey('user_123')).toBe(`${STORAGE_KEYS.WECHAT_BIND_SKIPPED}_user_123`)
  })

  it('无 userId → 退化为裸 key（不崩溃）', () => {
    expect(bindSkippedKey(undefined)).toBe(STORAGE_KEYS.WECHAT_BIND_SKIPPED)
  })
})
