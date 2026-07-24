import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useCallback, useRef } from 'react'
import Taro from '@tarojs/taro'

interface Model3DViewerProps {
  modelUrl: string
  thumbnailUrl?: string | null
}

export default function Model3DViewer({ modelUrl, thumbnailUrl }: Model3DViewerProps) {
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
  const lastDistanceRef = useRef<number | null>(null)

  const handleDownload = async () => {
    try {
      Taro.showLoading({ title: '下载中...' })
      const res = await Taro.downloadFile({
        url: modelUrl,
      })

      if (res.statusCode === 200) {
        await Taro.saveFile({
          tempFilePath: res.tempFilePath,
        })
        Taro.hideLoading()
        Taro.showToast({ title: '模型已保存', icon: 'success' })
      } else {
        Taro.hideLoading()
        Taro.showToast({ title: '下载失败', icon: 'none' })
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '下载失败，请稍后重试', icon: 'none' })
    }
  }

  const handlePreview = () => {
    if (thumbnailUrl) {
      Taro.previewImage({
        urls: [thumbnailUrl],
        current: thumbnailUrl,
      })
    }
  }

  const handleReset = useCallback(() => {
    setRotation(0)
    setScale(1)
  }, [])

  const handleTouchStart = useCallback((e: any) => {
    const touches = e.touches
    if (touches.length === 1) {
      lastTouchRef.current = { x: touches[0].clientX, y: touches[0].clientY }
    } else if (touches.length === 2) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      lastDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const handleTouchMove = useCallback((e: any) => {
    const touches = e.touches
    if (touches.length === 1 && lastTouchRef.current) {
      const dx = touches[0].clientX - lastTouchRef.current.x
      setRotation(prev => prev + dx * 0.5)
      lastTouchRef.current = { x: touches[0].clientX, y: touches[0].clientY }
    } else if (touches.length === 2 && lastDistanceRef.current) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const delta = distance - lastDistanceRef.current
      setScale(prev => Math.min(Math.max(prev + delta * 0.005, 0.5), 3))
      lastDistanceRef.current = distance
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null
    lastDistanceRef.current = null
  }, [])

  return (
    <View className='model-3d-viewer'>
      <View
        className='model-3d-viewer__preview'
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {thumbnailUrl ? (
          <Image
            className='model-3d-viewer__thumbnail'
            src={thumbnailUrl}
            mode='aspectFit'
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: 'transform 0.05s linear',
            }}
          />
        ) : (
          <View className='model-3d-viewer__placeholder' onClick={handlePreview}>
            <Text className='model-3d-viewer__placeholder-icon'>🧊</Text>
            <Text className='model-3d-viewer__placeholder-text'>3D 模型已生成</Text>
            <Text className='model-3d-viewer__placeholder-hint'>点击查看大图</Text>
          </View>
        )}
      </View>
      <View className='model-3d-viewer__controls'>
        <Text className='model-3d-viewer__hint'>单指拖拽旋转，双指缩放</Text>
        <View className='model-3d-viewer__btn-group'>
          <View className='model-3d-viewer__btn model-3d-viewer__btn--secondary' onClick={handleReset}>
            <Text className='model-3d-viewer__btn-text'>重置视角</Text>
          </View>
          <Button className='model-3d-viewer__btn' onClick={handleDownload}>
            <Text className='model-3d-viewer__btn-text'>下载 .glb 模型</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
