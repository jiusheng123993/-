/**
 * 家庭页宠物头像组件
 *
 * 职责：统一家庭页各处的宠物头像展示，保证"每个宠物头像都是小动物"。
 * 展示优先级（与档案页 PetAvatar 语义一致）：
 *   1. 宠物有照片（avatarPhotoUrl）→ 显示真实照片；
 *   2. 有 AI 卡通形象（avatarCartoonUrl）→ 显示用户定制的形象；
 *   3. 都没有 → 按品种匹配显示品牌风格小动物头像（远程 /uploads 静态托管）；
 *   4. 图片加载失败 → 回退物种 emoji（🐱/🐕），避免空白头像。
 *
 * 类名约定：调用方传入 imgClass（图片铺满圆形框）与 emojiClass（回退 emoji），
 * 样式沿用各展示位已有的 -img / -emoji 类，无需新增 CSS。
 */
import { useState, useEffect } from 'react'
import { Image, Text } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { getHomeStyleAvatarUrl, normalizeSpecies } from '../../data/homeStyleAvatars'
import type { PetProfile } from '../../services/petService'

interface FamilyPetAvatarProps {
  /** 宠物档案（用于照片/卡通形象/品种匹配） */
  pet: Pick<PetProfile, 'id' | 'species' | 'breed' | 'breedId' | 'avatarPhotoUrl' | 'avatarCartoonUrl'>
  /** 图片样式类（圆形裁剪铺满） */
  imgClass: string
  /** 加载失败回退 emoji 的样式类 */
  emojiClass: string
  /** 透传给 <Image> 的内联样式（如边框色） */
  style?: CSSProperties
}

export default function FamilyPetAvatar({ pet, imgClass, emojiClass, style }: FamilyPetAvatarProps) {
  // 图片加载失败标记：一旦失败则改用 emoji，避免裂图
  const [failed, setFailed] = useState(false)

  // 照片 → 用户定制的卡通形象 → 品种匹配的小动物头像（与档案页 PetAvatar 优先级一致，
  // 保证"家庭页跟随档案"：档案里保存的形象这里必须能显示）
  const src = pet.avatarPhotoUrl || pet.avatarCartoonUrl || getHomeStyleAvatarUrl(pet)

  // src 变化（宠物切换/照片更新）时重置失败标记，避免一次失败后永远显示 emoji
  useEffect(() => {
    setFailed(false)
  }, [src])

  if (failed) {
    // 回退：按物种显示 emoji（猫/狗），保证头像位始终有内容（复用同一归一化逻辑）
    return <Text className={emojiClass}>{normalizeSpecies(pet.species) === 'cat' ? '🐱' : '🐕'}</Text>
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
