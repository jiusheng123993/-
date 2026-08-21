/**
 * 预设形象库数据（位于 pagesPet 分包内）
 *
 * 免费用户可直接从 20 张预设形象里选择（狗 10 张 + 猫 10 张），
 * 图片与家庭页头像同源：均为品牌风格小动物头像（服务端 /uploads/avatars/home-style 静态托管），
 * 通过远程 URL 引用（不占分包体积），保证「预设形象」与「家庭页头像」是同一张图、同一种风格。
 *
 * 为什么从本地资源改为远程 URL：
 * - 旧 16 张扁平卡通图（白底方图）与品牌头像（暖橙渐变 + 星星 + 圆裁）风格不一致；
 * - 品牌头像已部署到服务器并接入家庭页，预设库直接复用同源数据派生即可实现"形象 = 头像"。
 */
import { HOME_STYLE_AVATARS, getHomeStyleAvatarUrlByKey } from '../../../data/homeStyleAvatars'

/** 预设形象条目 */
export interface AvatarPreset {
  /** 唯一 ID（与品牌头像文件名 key 一致，用于保存时记录选中的预设） */
  id: string
  species: 'dog' | 'cat'
  /** 品种展示名（与家庭页头像匹配口径一致） */
  breed: string
  /** 图片地址（服务端 /uploads 静态托管的品牌头像，与家庭页头像同图） */
  image: string
}

/** 品牌头像 key → 品种展示名（20 项，与 HOME_STYLE_AVATARS 的 key 一一对应） */
const BREED_LABELS: Record<string, string> = {
  'cat-01-orange-tabby': '橘猫',
  'cat-02-british-blue': '英短蓝猫',
  'cat-03-cow': '奶牛猫',
  'cat-04-calico': '三花猫',
  'cat-05-black': '黑猫',
  'cat-06-white-blue-eye': '白猫',
  'cat-07-siamese': '暹罗猫',
  'cat-08-ragdoll': '布偶猫',
  'cat-09-chinese-tabby': '狸花猫',
  'cat-10-american-shorthair': '美短',
  'dog-01-golden': '金毛犬',
  'dog-02-shiba': '柴犬',
  'dog-03-corgi': '柯基',
  'dog-04-husky': '哈士奇',
  'dog-05-samoyed': '萨摩耶',
  'dog-06-french-bulldog': '法斗',
  'dog-07-bichon': '比熊',
  'dog-08-border-collie': '边牧',
  'dog-09-labrador': '拉布拉多',
  'dog-10-poodle': '泰迪',
}

/** 全部预设形象：狗 10 张 + 猫 10 张（由品牌头像同源数据派生，避免 key 手抄漂移） */
export const AVATAR_PRESETS: AvatarPreset[] = HOME_STYLE_AVATARS.map((item) => ({
  id: item.key,
  species: item.species,
  breed: BREED_LABELS[item.key] || item.key,
  image: getHomeStyleAvatarUrlByKey(item.key, item.species),
}))

/** 按物种筛选预设形象 */
export function getPresetsBySpecies(species: 'dog' | 'cat'): AvatarPreset[] {
  return AVATAR_PRESETS.filter((item) => item.species === species)
}
