/**
 * 预设形象库数据（位于 pagesPet 分包内）
 *
 * 免费用户可直接从 20 张预设形象里选择（狗 10 张 + 猫 10 张），
 * 图片与家庭页头像同源：均为品牌风格小动物头像（暖橙渐变 + 星星 + 圆裁）。
 *
 * 为什么用本地资源（而非远程 URL）：
 * - 之前用服务端 /uploads 远程 URL，微信开发者工具下若 downloadFile 域名校验拦截，
 *   图片加载失败且 onError 可能不触发，导致「预设形象区只有文字没有图片」；
 * - 本页位于 pagesPet 分包（总包仅 3.1MB / 限 20MB），20 张 256px WebP 约 206KB
 *   直接打进分包，彻底不依赖网络/域名，开发工具与线上都能稳定显示；
 * - 与家庭页头像保持同源（同一批生成图的压缩版），风格完全一致。
 */
import cat01 from '../assets/preset-home/cat/cat-01-orange-tabby.webp'
import cat02 from '../assets/preset-home/cat/cat-02-british-blue.webp'
import cat03 from '../assets/preset-home/cat/cat-03-cow.webp'
import cat04 from '../assets/preset-home/cat/cat-04-calico.webp'
import cat05 from '../assets/preset-home/cat/cat-05-black.webp'
import cat06 from '../assets/preset-home/cat/cat-06-white-blue-eye.webp'
import cat07 from '../assets/preset-home/cat/cat-07-siamese.webp'
import cat08 from '../assets/preset-home/cat/cat-08-ragdoll.webp'
import cat09 from '../assets/preset-home/cat/cat-09-chinese-tabby.webp'
import cat10 from '../assets/preset-home/cat/cat-10-american-shorthair.webp'
import dog01 from '../assets/preset-home/dog/dog-01-golden.webp'
import dog02 from '../assets/preset-home/dog/dog-02-shiba.webp'
import dog03 from '../assets/preset-home/dog/dog-03-corgi.webp'
import dog04 from '../assets/preset-home/dog/dog-04-husky.webp'
import dog05 from '../assets/preset-home/dog/dog-05-samoyed.webp'
import dog06 from '../assets/preset-home/dog/dog-06-french-bulldog.webp'
import dog07 from '../assets/preset-home/dog/dog-07-bichon.webp'
import dog08 from '../assets/preset-home/dog/dog-08-border-collie.webp'
import dog09 from '../assets/preset-home/dog/dog-09-labrador.webp'
import dog10 from '../assets/preset-home/dog/dog-10-poodle.webp'

/** 预设形象条目 */
export interface AvatarPreset {
  /** 唯一 ID（与品牌头像文件名 key 一致，用于保存时记录选中的预设） */
  id: string
  species: 'dog' | 'cat'
  /** 品种展示名（与家庭页头像匹配口径一致） */
  breed: string
  /** 图片资源（Taro 打包后为分包内本地路径，无需网络加载） */
  image: string
}

/** 品牌头像 key → 品种展示名（20 项） */
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

/** 品牌头像 key → 本地图片资源（20 项，与 BREED_LABELS 一一对应） */
const IMAGE_MAP: Record<string, string> = {
  'cat-01-orange-tabby': cat01,
  'cat-02-british-blue': cat02,
  'cat-03-cow': cat03,
  'cat-04-calico': cat04,
  'cat-05-black': cat05,
  'cat-06-white-blue-eye': cat06,
  'cat-07-siamese': cat07,
  'cat-08-ragdoll': cat08,
  'cat-09-chinese-tabby': cat09,
  'cat-10-american-shorthair': cat10,
  'dog-01-golden': dog01,
  'dog-02-shiba': dog02,
  'dog-03-corgi': dog03,
  'dog-04-husky': dog04,
  'dog-05-samoyed': dog05,
  'dog-06-french-bulldog': dog06,
  'dog-07-bichon': dog07,
  'dog-08-border-collie': dog08,
  'dog-09-labrador': dog09,
  'dog-10-poodle': dog10,
}

/** 全部预设形象：狗 10 张 + 猫 10 张（本地资源，key 与品牌头像一致） */
export const AVATAR_PRESETS: AvatarPreset[] = Object.keys(BREED_LABELS).map((key) => ({
  id: key,
  species: key.startsWith('cat-') ? 'cat' : 'dog',
  breed: BREED_LABELS[key],
  image: IMAGE_MAP[key],
}))

/** 按物种筛选预设形象 */
export function getPresetsBySpecies(species: 'dog' | 'cat'): AvatarPreset[] {
  return AVATAR_PRESETS.filter((item) => item.species === species)
}
