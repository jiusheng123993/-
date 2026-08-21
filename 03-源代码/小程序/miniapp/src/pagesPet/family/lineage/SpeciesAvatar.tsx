/**
 * 多物种宠物头像组件（家族图谱/家庭动态等分包页面共用）
 *
 * 与 FamilyPetAvatar 的区别：家族图谱支持猫狗以外的物种（鸟/鱼/兔/仓鼠等），
 * 所以这里只对 cat/dog 显示小动物头像图片（品牌风格，品种匹配），
 * 其他物种继续用 emoji，避免把兔子显示成猫狗头像。
 *
 * 展示优先级（与 FamilyPetAvatar 保持一致）：
 *   1. 宠物有照片（avatarPhotoUrl / avatarUrl）→ 显示真实照片；
 *   2. 猫狗 → 品种匹配的小动物头像（失败回退物种 emoji）；
 *   3. 其他物种 → 物种 emoji（鸟/鱼/兔/仓鼠/龟等）。
 */
import { useState, useEffect } from 'react'
import { Image, Text } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { getHomeStyleAvatarUrl, getSpeciesKind } from '../../../data/homeStyleAvatars'

/** 非猫狗物种的 emoji 映射（未知值兜底 🐾） */
const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱',
  dog: '🐕',
  bird: '🐦',
  fish: '🐟',
  rabbit: '🐰',
  hamster: '🐹',
  turtle: '🐢',
  other: '🐾',
}

/**
 * 组件入参：兼容 PetProfile 与 OverviewMember/FeedWithPet
 * （图谱节点只有 species，无 breed/breedId；动态数据有 avatarUrl）。
 * species/breed/breedId 均可选（缺省时按物种兜底到橘猫/金毛）。
 */
interface SpeciesAvatarPet {
  /** 宠物 id（作为失败状态重置的 key） */
  id?: string
  species?: string | null
  breed?: string | null
  breedId?: string | null
  /** 真实照片（PetProfile 用 avatarPhotoUrl；动态/图谱数据用 avatarUrl） */
  avatarPhotoUrl?: string | null
  avatarUrl?: string | null
}

interface SpeciesAvatarProps {
  /** 宠物档案（用于照片/物种/品种匹配） */
  pet: SpeciesAvatarPet
  /** 图片样式类（圆形裁剪铺满） */
  imgClass: string
  /** 回退 emoji 的样式类 */
  emojiClass: string
  /** 透传给 <Image> 的内联样式 */
  style?: CSSProperties
}

export default function SpeciesAvatar({ pet, imgClass, emojiClass, style }: SpeciesAvatarProps) {
  // 图片加载失败标记：一旦失败则改用 emoji，避免裂图
  const [failed, setFailed] = useState(false)

  // 真实照片优先（与 FamilyPetAvatar 一致：有照片显示照片）
  const photoUrl = pet.avatarPhotoUrl || pet.avatarUrl
  // 物种归类：仅猫狗显示小动物头像，其他物种走 emoji
  const kind = getSpeciesKind(pet.species)

  // 照片或猫狗品种匹配的小动物头像 URL；其他物种不拼 URL（直接用 emoji）
  const src = photoUrl || (kind !== 'other' ? getHomeStyleAvatarUrl({ species: kind, breed: pet.breed || '', breedId: pet.breedId || '' }) : '')

  // src/物种/宠物变化时重置失败标记，避免一次失败后永远显示 emoji
  useEffect(() => {
    setFailed(false)
  }, [src, kind, pet.id])

  if (kind === 'other' && !photoUrl) {
    // 非猫狗物种且无照片：按物种 emoji 展示（家族图谱支持多物种）
    return <Text className={emojiClass}>{SPECIES_EMOJI[pet.species || ''] || '🐾'}</Text>
  }

  if (failed) {
    // 回退：有照片时照片失败回退物种 emoji；猫狗回退猫/狗 emoji，其他回退 🐾
    const fallbackEmoji = kind === 'other' ? '🐾' : kind === 'cat' ? '🐱' : '🐕'
    return <Text className={emojiClass}>{fallbackEmoji}</Text>
  }

  return (
    <Image
      src={src}
      className={imgClass}
      mode='aspectFill'
      style={style}
      lazyLoad
      onError={() => setFailed(true)}
    />
  )
}
