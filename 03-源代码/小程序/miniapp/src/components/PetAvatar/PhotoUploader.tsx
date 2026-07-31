/**
 * 照片上传组件
 * 支持拍照或从相册选择宠物照片，含格式校验和隐私授权
 */
import { View, Text, Image } from '@tarojs/components'
import { useCallback } from 'react'
import Taro from '@tarojs/taro'
import { chooseImageWithPrivacy } from '../../utils/privacy'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic']

interface PhotoUploaderProps {
  value: string | null
  onChange: (url: string) => void
  disabled?: boolean
}

export default function PhotoUploader({ value, onChange, disabled = false }: PhotoUploaderProps) {
  const handleChooseImage = useCallback(async () => {
    if (disabled) return

    try {
      const res = await chooseImageWithPrivacy({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      if (!res.tempFilePaths.length) return

      const filePath = res.tempFilePaths[0]
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        Taro.showToast({ title: '请上传 JPG/PNG/WebP 格式图片', icon: 'none' })
        return
      }

      onChange(filePath)
    } catch (err) {
      if ((err as { errMsg?: string }).errMsg?.includes('cancel')) {
        return
      }
      Taro.showToast({ title: '选择照片失败', icon: 'none' })
    }
  }, [disabled, onChange])

  const handleRemove = useCallback(() => {
    onChange('')
  }, [onChange])

  if (value) {
    return (
      <View className='photo-uploader photo-uploader--has-image'>
        <Image
          className='photo-uploader__preview'
          src={value}
          mode='aspectFill'
        />
        <View className='photo-uploader__actions'>
          <View className='photo-uploader__btn' onClick={handleChooseImage}>
            <Text className='photo-uploader__btn-text'>重新选择</Text>
          </View>
          <View className='photo-uploader__btn photo-uploader__btn--remove' onClick={handleRemove}>
            <Text className='photo-uploader__btn-text'>删除</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='photo-uploader photo-uploader--empty' onClick={handleChooseImage}>
      <View className='photo-uploader__placeholder'>
        <Text className='photo-uploader__icon'>📷</Text>
        <Text className='photo-uploader__label'>点击上传宠物照片</Text>
        <Text className='photo-uploader__hint'>支持拍照或从相册选择</Text>
      </View>
    </View>
  )
}