/**
 * 全局路由防抖守卫单测（monkey-patch 方案）
 * 覆盖：透传放行 / 冷却拦截 / settle 后收窄冷却 / 失败也释放锁 / 占位窗防锁死
 * / 分包长占位窗（8s，覆盖分包首载下载期的连点竞态）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Taro from '@tarojs/taro'

// Taro mock：navigateTo/redirectTo 为可控行为的 vi.fn；
// installRouteGuard 会就地替换这两个属性，本文件与被测模块共享同一 mock 单例。
// 用 vi.hoisted 提升引用，供 vi.mock 工厂与测试体共享同一实例
const taroApiMocks = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
}))

vi.mock('@tarojs/taro', () => ({ default: taroApiMocks }))

// 被测模块用动态导入：vi.mock 之后不允许再出现静态 import（eslint import/first）
const { installRouteGuard, resetRouteGuardLock } = await import('../routeGuard')

// 打补丁前的原始 mock 引用：installRouteGuard 会【就地替换】Taro 对象上的同名
// 属性（Taro 与 taroApiMocks 是同一对象，事后读取拿到的是 wrapped 版本），因此
// 必须在守卫安装前按值捕获原函数，供测试控制"真实路由 API"的行为
const originalNav = {
  navigateTo: taroApiMocks.navigateTo,
  redirectTo: taroApiMocks.redirectTo,
}

/** 让 mocked API 返回可控结算时机的 promise（模拟分包下载中的慢路由） */
function makeControllable(name: 'navigateTo' | 'redirectTo') {
  const api = originalNav[name]
  // mockReset 清空此前阶段的调用计数与实现，本阶段从零开始统计
  api.mockReset()
  let resolveFn!: (v?: unknown) => void
  let rejectFn!: (e?: unknown) => void
  const pending = new Promise<unknown>((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })
  api.mockImplementation(() => pending)
  return {
    api,
    /** 模拟路由成功完成 */
    settleResolve: () => resolveFn({ errMsg: `${name}:ok` }),
    /** 模拟路由失败结束（同样应释放锁） */
    settleReject: (e: Error) => rejectFn(e),
  }
}

describe('routeGuard 全局路由防抖守卫', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetRouteGuardLock()
    // 清零原始 mock 的调用计数（wrapped 闭包引用的就是它们）
    originalNav.navigateTo.mockClear()
    originalNav.redirectTo.mockClear()
    // 幂等安装：首次真正打补丁，其后为 no-op（补丁闭包内的 original 即当前 mock）
    installRouteGuard()
  })

  it('should pass the first navigation through to the original API', async () => {
    const nav = makeControllable('navigateTo')
    const p = (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/edit/index?id=1' })

    expect(nav.api).toHaveBeenCalledTimes(1)
    expect(nav.api.mock.calls[0][0]).toEqual({ url: '/pagesPet/edit/index?id=1' })
    nav.settleResolve()
    await expect(p).resolves.toEqual({ errMsg: 'navigateTo:ok' })
  })

  it('should silently drop a repeated navigation while the previous route is pending', async () => {
    // 第一次：放行但不 settle（模拟分包首次下载、路由长时间未完成）
    const first = makeControllable('navigateTo')
    void (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/add/index' })
    expect(first.api).toHaveBeenCalledTimes(1)

    // 冷却期内的第二次点击：应被静默吞掉（原 API 不再被调用），以 ok 形态收尾
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(
      (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/add/index' })
    ).resolves.toEqual({ errMsg: 'navigateTo:ok' })
    expect(first.api).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()

    first.settleResolve()
    await Promise.resolve()
  })

  it('should allow a new navigation after settle plus buffer elapses', async () => {
    // 第一次路由成功完成
    const first = makeControllable('navigateTo')
    const p1 = (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/family/index' })
    first.settleResolve()
    await p1

    // settle 后仍有收尾冷却：立刻再点仍被拦
    await expect(
      (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/family/index' })
    ).resolves.toEqual({ errMsg: 'navigateTo:ok' })
    expect(first.api).toHaveBeenCalledTimes(1)

    // 收尾冷却结束后恢复放行
    vi.advanceTimersByTime(301)
    const second = makeControllable('navigateTo')
    const p2 = (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/mine/index' })
    expect(second.api).toHaveBeenCalledTimes(1)
    second.settleResolve()
    await p2
  })

  it('should release the lock when the route fails (reject)', async () => {
    // 路由失败同样必须释放锁，否则一次跳转失败会卡死后续所有导航
    const failing = makeControllable('navigateTo')
    const p1 = (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/checkin/index' })
    failing.settleReject(new Error('route failed'))
    await expect(p1).rejects.toThrow('route failed')

    vi.advanceTimersByTime(301)
    const next = makeControllable('navigateTo')
    const p2 = (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/checkin/index' })
    expect(next.api).toHaveBeenCalledTimes(1)
    next.settleResolve()
    await p2
  })

  it('should auto-release the lock when the original API never settles (anti-deadlock, main-package window)', async () => {
    // 路由永不完成：冷却期内的重复导航被拦（主包短占位窗 1500ms）
    const stuck = makeControllable('redirectTo')
    void (Taro.redirectTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/family/index' })

    await expect(
      (Taro.redirectTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/family/index' })
    ).resolves.toEqual({ errMsg: 'redirectTo:ok' })
    expect(stuck.api).toHaveBeenCalledTimes(1)

    // 推进超过主包占位保护窗(1500ms)：锁自动过期，新导航放行
    vi.advanceTimersByTime(1501)
    const afterExpiry = makeControllable('redirectTo')
    const p = (Taro.redirectTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/index/index' })
    expect(afterExpiry.api).toHaveBeenCalledTimes(1)
    afterExpiry.settleResolve()
    await p
  })

  it('should keep the long 8s hold window for subpackage URLs and drop rapid re-taps during first-load (regression: routeDone race)', async () => {
    // 分包首次进入需下载分包（实测 pagesPet ~1.9MB、pagesUser ~0.85MB，普通网络下载
    // 常超主包导 1500ms 占位窗）——用户在等待期连点是「routeDone with a webviewId
    // N is not found」竞态的典型触发。本次修复：分包目标用 8s 长占位窗覆盖下载期。
    const stuck = makeControllable('navigateTo')
    void (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/avatar-customize/index' })
    expect(stuck.api).toHaveBeenCalledTimes(1)

    // 推进 3s：已超过旧版主包窗(1500ms)，但仍在分包长窗(8s)内——第二次点击必须被吞
    vi.advanceTimersByTime(3000)
    await expect(
      (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/avatar-customize/index' })
    ).resolves.toEqual({ errMsg: 'navigateTo:ok' })
    expect(stuck.api).toHaveBeenCalledTimes(1)

    // 再推进越过 8s 长窗（累计 8001ms）：防死锁兜底放行，后续可重新导航
    vi.advanceTimersByTime(5001)
    const afterExpiry = makeControllable('navigateTo')
    const p = (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/avatar-customize/index' })
    expect(afterExpiry.api).toHaveBeenCalledTimes(1)
    afterExpiry.settleResolve()
    await p
  })

  it('should guard redirectTo with the same lock', async () => {
    const first = makeControllable('redirectTo')
    const p1 = (Taro.redirectTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/add/index' })
    expect(first.api).toHaveBeenCalledTimes(1)

    await expect(
      (Taro.redirectTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesPet/add/index' })
    ).resolves.toEqual({ errMsg: 'redirectTo:ok' })
    expect(first.api).toHaveBeenCalledTimes(1)

    first.settleResolve()
    await p1
  })

  it('should share one lock across APIs (navigateTo pending blocks redirectTo)', async () => {
    // navigateTo 路由挂起中：redirectTo 也应被同一把锁拦截（竞态不分 API）
    const nav = makeControllable('navigateTo')
    void (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/index/index' })

    await expect(
      (Taro.redirectTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pagesUser/onboarding/index' })
    ).resolves.toEqual({ errMsg: 'redirectTo:ok' })
    // 原始 redirectTo 不应被真实调用
    expect(originalNav.redirectTo).not.toHaveBeenCalled()

    nav.settleResolve()
    await Promise.resolve()
  })

  it('should not trigger options success/fail/complete callbacks for dropped navigations', async () => {
    // 契约锁定：被吞的重复导航以 ok 形态 resolve，但绝不触发调用方传入的回调
    // （全项目调用均为发完即忘，此契约保证未来新增回调依赖时能显式暴露问题）
    const first = makeControllable('navigateTo')
    void (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/family/index' })

    const callbacks = { success: vi.fn(), fail: vi.fn(), complete: vi.fn() }
    const dropped = await (
      Taro.navigateTo as unknown as (o: Record<string, unknown>) => Promise<unknown>
    )({ url: '/pages/family/index', ...callbacks })
    expect(dropped).toEqual({ errMsg: 'navigateTo:ok' })
    expect(callbacks.success).not.toHaveBeenCalled()
    expect(callbacks.fail).not.toHaveBeenCalled()
    expect(callbacks.complete).not.toHaveBeenCalled()

    first.settleResolve()
    await Promise.resolve()
  })

  it('should be idempotent when installed repeatedly', async () => {
    // 幂等契约：重复安装不得二次包裹（否则一次导航会穿透两层导致原 API 双调）
    installRouteGuard()
    installRouteGuard()

    const nav = makeControllable('navigateTo')
    const p = (Taro.navigateTo as unknown as (o: { url: string }) => Promise<unknown>)({ url: '/pages/mine/index' })
    expect(nav.api).toHaveBeenCalledTimes(1)
    nav.settleResolve()
    await p
  })
})
