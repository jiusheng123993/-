/**
 * 宠物形象生成进度组件
 * 展示 2D/3D 形象的生成进度条、完成提示和失败重试
 */
import { View, Text } from '@tarojs/components'

interface GenerationProgressProps {
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  type: '2d' | '3d'
  error?: string | null
  onRetry?: () => void
}

export default function GenerationProgress({ progress, status, type, error, onRetry }: GenerationProgressProps) {
  const label = type === '2d' ? '2D 形象' : '3D 模型'

  if (status === 'failed') {
    return (
      <View className='generation-progress generation-progress--failed'>
        <Text className='generation-progress__icon'>❌</Text>
        <Text className='generation-progress__text'>{error || `${label}生成失败`}</Text>
        {onRetry && (
          <View className='generation-progress__retry-btn' onClick={onRetry}>
            <Text className='generation-progress__retry-btn-text'>重试</Text>
          </View>
        )}
      </View>
    )
  }

  if (status === 'completed') {
    return (
      <View className='generation-progress generation-progress--completed'>
        <Text className='generation-progress__icon'>✅</Text>
        <Text className='generation-progress__text'>{label}生成完成</Text>
      </View>
    )
  }

  return (
    <View className='generation-progress'>
      <View className='generation-progress__header'>
        <Text className='generation-progress__label'>正在生成{label}...</Text>
        <Text className='generation-progress__percent'>{progress}%</Text>
      </View>
      <View className='generation-progress__bar'>
        <View
          className='generation-progress__fill'
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className='generation-progress__hint'>
        {type === '2d' ? '正在绘制多角度形象，请耐心等待' : '正在构建 3D 模型，可能需要 2-5 分钟'}
      </Text>
    </View>
  )
}