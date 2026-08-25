/**
 * 全局路由防抖守卫 —— 修复「routeDone with a webviewId N is not found」
 *
 * 报错机制：上一次页面路由尚未完成时又发起新路由，微信基础库随后收到前一
 * webview 的 routeDone 消息时，该 webview 已被销毁/替换，找不到对应实例即报
 * 此错（框架级路由竞态）。典型触发：分包页（pagesPet / pagesUser）首次进入
 * 需下载分包、路由耗时长，用户以为没点上而快速连点 → 两次 navigateTo 并发。
 *
 * 方案：启动时包装（monkey-patch）Taro.navigateTo / Taro.redirectTo，加全局
 * 冷却锁——路由进行中（原 API 未 settle）的重复调用静默忽略；settle 后再留
 * 300ms 收尾冷却，覆盖基础库 routeDone 消息迟到的情况。
 *
 * 为什么不用 Taro.addInterceptor：实测本项目 Taro 3.6.0 的 addInterceptor 被
 * 绑定在 request 专用的 Link 拦截链上（@tarojs/shared native-apis.js:
 * equipCommonApis），只对 Taro.request 生效，拦不到路由 API。
 *
 * 安全性论证：
 * - 小程序构建下 @tarojs/taro 为 CommonJS 单例（module.exports = taro），
 *   全项目所有 `import Taro from '@tarojs/taro'` 拿到同一对象引用，运行期
 *   成员访问调用，替换属性即全局生效；
 * - 全项目 navigateTo/redirectTo 调用均为「发完即忘」，唯一带失败降级链的
 *   safeNavigateBack 用的是 switchTab/reLaunch/navigateBack（不在补丁范围），
 *   因此静默吞掉重复导航无副作用；
 * - 微信框架自身的页面切换（tab 切换、系统返回）不经 Taro.navigateTo，
 *   补丁不影响框架行为；switchTab/reLaunch/navigateBack 有登录守卫与降级链
 *   依赖（authGuard.redirectToLoginIfNeeded / safeNavigateBack），刻意不碰。
 */
import Taro from '@tarojs/taro'

/** 路由进行中的占位保护窗：原 API 迟迟不 settle 时的最长锁定期（防锁死） */
const PENDING_HOLD_MS = 1500

/** 路由 settle 后的收尾冷却：等待基础库 routeDone 消息处理完再放行下一次导航 */
const SETTLE_BUFFER_MS = 300

/** 冷却截止时间戳（ms）；0 表示当前无锁 */
let lockUntil = 0

/** 防重复安装标记（app 入口可能因热更新等多次执行顶层代码） */
let installed = false

/**
 * 尝试获取路由执行权
 * @returns true=获得执行权；false=冷却中被拦截（调用方应静默跳过本次导航）
 */
function acquireRouteLock(): boolean {
  const now = Date.now()
  if (now < lockUntil) return false
  // 先按「进行中占位窗」上锁：即使原 API 同步抛错/永不回调，锁也会自动过期，
  // 不会出现一次异常导致后续所有导航被永久吞掉的死锁
  lockUntil = now + PENDING_HOLD_MS
  return true
}

/**
 * 安装全局路由防抖守卫（应用入口装载一次）
 * 仅包装 navigateTo / redirectTo；冷却截止时间戳见模块顶部常量说明。
 */
export function installRouteGuard(): void {
  if (installed) return
  installed = true

  /**
   * 包装单个路由 API：保留原函数的 Promise 返回与 success/fail/complete
   * 回调语义（原样透传 options 与返回值），仅在其外层叠加冷却锁。
   */
  const wrapNav = <T extends (options: never) => Promise<unknown>>(apiName: string, original: T): T => {
    const wrapped = (options: Parameters<T>[0]): ReturnType<T> => {
      if (!acquireRouteLock()) {
        console.warn(`[routeGuard] 上一次路由未完成，已忽略本次重复${apiName}`)
        // 以成功形态收尾（与微信 ok 响应形状一致）；被吞的是「冗余重复导航」，
        // 不触发原 options 回调，避免调用方误以为页面真的打开了两次
        return Promise.resolve({ errMsg: `${apiName}:ok` }) as ReturnType<T>
      }
      const result = original(options)
      // 独立监听链释放锁：不污染返回给调用方的 result；
      // catch 兜底防止「路由失败」在监听链上产生 unhandled rejection
      Promise.resolve(result)
        .catch(() => {})
        .finally(() => {
          // 路由已结束：把占位长窗收紧为短冷却（快速完成的路由不多占点击响应时间）
          lockUntil = Date.now() + SETTLE_BUFFER_MS
        })
      // 原样透传原 API 的 Promise（含 success/fail/complete 回调语义）
      return result as ReturnType<T>
    }
    return wrapped as unknown as T
  }

  // 逐个替换 Taro 单例上的方法（bind 保证原函数 this 指向 Taro 自身）
  const navNames = ['navigateTo', 'redirectTo'] as const
  for (const name of navNames) {
    const original = (Taro as unknown as Record<string, ((options: never) => Promise<unknown>) | undefined>)[name]
    if (typeof original !== 'function') continue
    ;(Taro as unknown as Record<string, unknown>)[name] = wrapNav(name, original.bind(Taro))
  }
}

/** 仅供测试：重置守卫内部状态 */
export function resetRouteGuardLock(): void {
  lockUntil = 0
}
