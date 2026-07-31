/**
 * 页面加载组件
 * 显示加载动画和提示文字
 */
import { View, Text } from '@tarojs/components'
import './PageLoading.scss'

interface PageLoadingProps {
  text?: string
}

export default function PageLoading({ text = '加载中...' }: PageLoadingProps) {
  return (
    <View className='page-loading'>
      <View className='page-loading__spinner' />
      <Text className='page-loading__text'>{text}</Text>
    </View>
  )
}
