/**
 * 预设形象头像组件
 *
 * 背景：预设形象图片改为远程 URL（服务端 /uploads 静态托管的品牌头像）后，
 * 在微信开发者工具/线上若 downloadFile 合法域名未配置或被拦截，<Image> 加载失败会
 * 直接空白（只剩品种文字）。这里加 onError 兜底：图片加载失败时回退显示物种 emoji，
 * 保证预设形象区始终有内容，不会"只有文字没有图片"。
 *
 * 展示优先级：品牌小动物头像图片 → 失败回退物种 emoji（🐱/🐶）。
 */
import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'

interface PresetAvatarProps {
  /** 图片地址（远程 URL） */
  src: string
  /** 物种（决定回退 emoji：cat→🐱，dog→🐶） */
  species: 'dog' | 'cat'
  /** 图片样式类 */
  imgClass: string
  /** 回退 emoji 容器样式类 */
  fallbackClass: string
}

export default function PresetAvatar({ src, species, imgClass, fallbackClass }: PresetAvatarProps) {
  // 图片加载失败标记：一旦失败则改用 emoji，避免空白
  const [failed, setFailed] = useState(false)

  // src/物种变化时重置失败标记，避免一次失败后永远显示 emoji
  useEffect(() => {
    setFailed(false)
  }, [src, species])

  if (failed) {
    // 回退：按物种显示 emoji（猫/狗），保证预设卡片始终有形象
    return (
      <View className={fallbackClass}>
        <Text className={`${fallbackClass}-emoji`}>{species === 'cat' ? '🐱' : '🐶'}</Text>
      </View>
    )
  }

  return (
    <Image
      src={src}
      className={imgClass}
      mode='aspectFill'
      lazyLoad
      onError={() => setFailed(true)}
    />
  )
}
