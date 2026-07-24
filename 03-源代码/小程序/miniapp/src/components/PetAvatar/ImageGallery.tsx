import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useMemo } from 'react'
import { AVATAR_EXPRESSIONS, AVATAR_ANGLES, AVATAR_ACTION_ANGLES, AVATAR_ACTIONS } from '../../constants'
import type { Avatar2DImage, AvatarAngle, AvatarExpression, AvatarAction } from '../../types/avatarTypes'

interface ImageGalleryProps {
  images: Avatar2DImage[]
  onSaveAsAvatar?: (image: Avatar2DImage) => void
  onGenerate3D?: () => void
  isGenerating3D?: boolean
  canGenerate3D?: boolean
}

type TabType = 'expression' | 'action'

export default function ImageGallery({
  images,
  onSaveAsAvatar,
  onGenerate3D,
  isGenerating3D = false,
  canGenerate3D = true,
}: ImageGalleryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('expression')
  const [selectedAngle, setSelectedAngle] = useState<AvatarAngle>(AVATAR_ANGLES[0].key)
  const [selectedKey, setSelectedKey] = useState<AvatarExpression | AvatarAction>(AVATAR_EXPRESSIONS[0].key)

  const currentAngles = useMemo(() => {
    return activeTab === 'expression' ? AVATAR_ANGLES : AVATAR_ACTION_ANGLES
  }, [activeTab])

  const currentItems = useMemo(() => {
    return activeTab === 'expression' ? AVATAR_EXPRESSIONS : AVATAR_ACTIONS
  }, [activeTab])

  const currentImage = useMemo(() => {
    return images.find(
      img => img.angle === selectedAngle && img.expression === selectedKey,
    )
  }, [images, selectedAngle, selectedKey])

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab)
    const angles = tab === 'expression' ? AVATAR_ANGLES : AVATAR_ACTION_ANGLES
    const items = tab === 'expression' ? AVATAR_EXPRESSIONS : AVATAR_ACTIONS
    setSelectedAngle(angles[0].key)
    setSelectedKey(items[0].key)
  }

  const handle3DClick = () => {
    if (isGenerating3D) return
    // canGenerate3D=false 时也调用，由父组件处理会员引导
    onGenerate3D?.()
  }

  return (
    <View className='image-gallery'>
      {/* 角度选择器 */}
      <View className='image-gallery__angles'>
        <ScrollView scrollX className='image-gallery__angles-scroll'>
          {currentAngles.map(angle => (
            <View
              key={angle.key}
              className={`image-gallery__angle-item ${selectedAngle === angle.key ? 'image-gallery__angle-item--active' : ''}`}
              onClick={() => setSelectedAngle(angle.key)}
            >
              <Text className='image-gallery__angle-label'>{angle.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 预览区 */}
      <View className='image-gallery__preview'>
        {currentImage ? (
          <Image
            className='image-gallery__preview-img'
            src={currentImage.imageUrl}
            mode='aspectFit'
            lazyLoad
          />
        ) : (
          <View className='image-gallery__preview-empty'>
            <Text className='image-gallery__preview-empty-text'>暂无形象图</Text>
          </View>
        )}
      </View>

      {/* 标签切换 */}
      <View className='image-gallery__tabs'>
        <View
          className={`image-gallery__tab ${activeTab === 'expression' ? 'image-gallery__tab--active' : ''}`}
          onClick={() => handleSwitchTab('expression')}
        >
          <Text className='image-gallery__tab-text'>表情</Text>
        </View>
        <View
          className={`image-gallery__tab ${activeTab === 'action' ? 'image-gallery__tab--active' : ''}`}
          onClick={() => handleSwitchTab('action')}
        >
          <Text className='image-gallery__tab-text'>动作</Text>
        </View>
      </View>

      {/* 表情/动作选择器 */}
      <View className='image-gallery__selector'>
        <ScrollView scrollX className='image-gallery__selector-scroll'>
          {currentItems.map(item => (
            <View
              key={item.key}
              className={`image-gallery__selector-item ${selectedKey === item.key ? 'image-gallery__selector-item--active' : ''}`}
              onClick={() => setSelectedKey(item.key)}
            >
              <Text className='image-gallery__selector-emoji'>{item.emoji}</Text>
              <Text className='image-gallery__selector-label'>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 操作按钮 */}
      {currentImage && (
        <View className='image-gallery__actions'>
          <View className='image-gallery__btn' onClick={() => onSaveAsAvatar?.(currentImage)}>
            <Text className='image-gallery__btn-text'>保存为头像</Text>
          </View>
          <View
            className={`image-gallery__btn image-gallery__btn--3d ${isGenerating3D || !canGenerate3D ? 'image-gallery__btn--disabled' : ''}`}
            onClick={handle3DClick}
          >
            <Text className='image-gallery__btn-text'>
              {isGenerating3D ? '生成中...' : canGenerate3D ? '生成 3D 模型' : '会员专享'}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
