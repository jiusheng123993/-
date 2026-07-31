/**
 * 页面错误组件
 * 显示错误信息和重试按钮
 */
import { View, Text } from '@tarojs/components'
import './PageError.scss'

interface PageErrorProps {
  message: string
  onRetry?: () => void
}

export default function PageError({ message, onRetry }: PageErrorProps) {
  return (
    <View className='page-error'>
      <Text className='page-error__icon'>⚠️</Text>
      <Text className='page-error__message'>{message}</Text>
      {onRetry && (
        <View className='page-error__retry' onClick={onRetry}>
          <Text className='page-error__retry-text'>重试</Text>
        </View>
      )}
    </View>
  )
}
