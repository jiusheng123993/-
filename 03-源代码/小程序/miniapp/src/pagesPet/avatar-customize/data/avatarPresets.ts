/**
 * 预设头像库数据（位于 pagesPet 分包内）
 *
 * 免费用户可直接从这 16 张预设头像里选择（狗 8 张 + 猫 8 张），
 * 每种画风搭配一个常见品种，保证多宠家庭里每只宠物都能选到不一样的形象。
 *
 * 为什么放在分包内：
 * - 图片由 Seedream 生成后原图约 300-440KB/张，16 张共 5MB，放主包会撑爆 2MB 限制；
 * - 这里统一改成 512x512 WebP（共约 200KB），并通过 import 静态引用，
 *   让 Taro 把图片打进 pagesPet 分包，主包体积不受影响。
 */
import dog01Q from '../assets/preset/dog/01-q.webp'
import dog02Japanese from '../assets/preset/dog/02-japanese.webp'
import dog03American from '../assets/preset/dog/03-american.webp'
import dog04Watercolor from '../assets/preset/dog/04-watercolor.webp'
import dog05Clay from '../assets/preset/dog/05-clay.webp'
import dog06Pixel from '../assets/preset/dog/06-pixel.webp'
import dog07Lineart from '../assets/preset/dog/07-lineart.webp'
import dog08Plush from '../assets/preset/dog/08-plush.webp'
import cat01Q from '../assets/preset/cat/01-q.webp'
import cat02Japanese from '../assets/preset/cat/02-japanese.webp'
import cat03American from '../assets/preset/cat/03-american.webp'
import cat04Watercolor from '../assets/preset/cat/04-watercolor.webp'
import cat05Clay from '../assets/preset/cat/05-clay.webp'
import cat06Pixel from '../assets/preset/cat/06-pixel.webp'
import cat07Lineart from '../assets/preset/cat/07-lineart.webp'
import cat08Plush from '../assets/preset/cat/08-plush.webp'

/** 预设头像条目 */
export interface AvatarPreset {
  /** 唯一 ID（用于保存时记录选中的预设） */
  id: string
  species: 'dog' | 'cat'
  /** 画风 key（q/japanese/american/watercolor/clay/pixel/lineart/plush） */
  styleKey: string
  /** 画风名称 */
  styleLabel: string
  /** 品种（保证同一物种内 8 张脸型/毛色差异明显） */
  breed: string
  /** 图片资源（Taro 打包后为可用的本地路径） */
  image: string
}

/** 全部预设头像：狗 8 张 + 猫 8 张 */
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'dog-q', species: 'dog', styleKey: 'q', styleLabel: 'Q版萌系', breed: '金毛犬', image: dog01Q },
  { id: 'dog-japanese', species: 'dog', styleKey: 'japanese', styleLabel: '日系治愈', breed: '柴犬', image: dog02Japanese },
  { id: 'dog-american', species: 'dog', styleKey: 'american', styleLabel: '美式卡通', breed: '柯基', image: dog03American },
  { id: 'dog-watercolor', species: 'dog', styleKey: 'watercolor', styleLabel: '水彩手绘', breed: '比熊', image: dog04Watercolor },
  { id: 'dog-clay', species: 'dog', styleKey: 'clay', styleLabel: '黏土萌宠', breed: '法斗', image: dog05Clay },
  { id: 'dog-pixel', species: 'dog', styleKey: 'pixel', styleLabel: '像素复古', breed: '哈士奇', image: dog06Pixel },
  { id: 'dog-lineart', species: 'dog', styleKey: 'lineart', styleLabel: '极简线稿', breed: '边牧', image: dog07Lineart },
  { id: 'dog-plush', species: 'dog', styleKey: 'plush', styleLabel: '毛绒玩偶', breed: '萨摩耶', image: dog08Plush },

  { id: 'cat-q', species: 'cat', styleKey: 'q', styleLabel: 'Q版萌系', breed: '橘猫', image: cat01Q },
  { id: 'cat-japanese', species: 'cat', styleKey: 'japanese', styleLabel: '日系治愈', breed: '布偶猫', image: cat02Japanese },
  { id: 'cat-american', species: 'cat', styleKey: 'american', styleLabel: '美式卡通', breed: '英短蓝猫', image: cat03American },
  { id: 'cat-watercolor', species: 'cat', styleKey: 'watercolor', styleLabel: '水彩手绘', breed: '奶牛猫', image: cat04Watercolor },
  { id: 'cat-clay', species: 'cat', styleKey: 'clay', styleLabel: '黏土萌宠', breed: '三花猫', image: cat05Clay },
  { id: 'cat-pixel', species: 'cat', styleKey: 'pixel', styleLabel: '像素复古', breed: '暹罗猫', image: cat06Pixel },
  { id: 'cat-lineart', species: 'cat', styleKey: 'lineart', styleLabel: '极简线稿', breed: '黑猫', image: cat07Lineart },
  { id: 'cat-plush', species: 'cat', styleKey: 'plush', styleLabel: '毛绒玩偶', breed: '美短', image: cat08Plush },
]

/** 按物种筛选预设头像 */
export function getPresetsBySpecies(species: 'dog' | 'cat'): AvatarPreset[] {
  return AVATAR_PRESETS.filter((item) => item.species === species)
}
