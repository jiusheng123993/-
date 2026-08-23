/**
 * 登录后"是否引导绑定微信头像昵称"的判断（纯函数，便于单测）
 *
 * 背景：微信已禁止静默获取真实头像昵称，只能靠官方"头像昵称填写能力"
 * （chooseAvatar + type=nickname）。微信登录成功后，资料未完善（无头像或无昵称）
 * 且用户未点过"暂不绑定"时，引导进入绑定页；否则直接进首页。
 */
import { STORAGE_KEYS } from '../../constants'

export interface GuideCheckInput {
  /** 是否微信小程序端（App/H5 无 chooseAvatar 能力，不引导） */
  isWeapp: boolean
  /** 当前登录用户（null 表示未登录） */
  user: { id?: string; nickname?: string | null; avatar?: string | null } | null
  /** 用户是否点过"暂不绑定"（Taro.getStorageSync 的原始值，truthy 即视为已跳过） */
  skipped: unknown
}

/**
 * 计算"暂不绑定"标记的存储 key。
 * 带 userId 后缀做账号隔离：同一设备多账号时，A 跳过不影响 B 的引导；
 * 登录页读取时机与绑定页写入时机均在登录成功之后，userId 一定可用，key 必然一致。
 * @param userId - 当前登录用户 ID
 * @returns 完整存储 key
 */
export function bindSkippedKey(userId?: string): string {
  return userId ? `${STORAGE_KEYS.WECHAT_BIND_SKIPPED}_${userId}` : STORAGE_KEYS.WECHAT_BIND_SKIPPED
}

/**
 * 计算是否需要在登录后引导绑定微信头像昵称
 * @param input - 判断输入
 * @returns true=应引导进入绑定页；false=直接进首页
 */
export function shouldGuideWechatBind(input: GuideCheckInput): boolean {
  const { isWeapp, user, skipped } = input
  // 非微信端（App/H5）没有 chooseAvatar 能力，不引导
  if (!isWeapp) return false
  // 未登录不引导
  if (!user) return false
  // 资料已完善（昵称与头像均非空白）不引导；用 trim 防止纯空白串被误判为已完善
  const hasNickname = !!(user.nickname && user.nickname.trim())
  const hasAvatar = !!(user.avatar && user.avatar.trim())
  if (hasNickname && hasAvatar) return false
  // 用户明确跳过过一次后不再反复打断（仍可去个人资料页手动绑定）
  if (skipped) return false
  return true
}
