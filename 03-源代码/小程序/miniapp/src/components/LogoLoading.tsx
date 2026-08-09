/**
 * 品牌缓冲页（Logo 加载动画）
 *
 * 用于小程序启动/数据加载时作为缓冲层展示：
 * - 全屏暖色遮罩，居中展示猫狗 Logo
 * - Logo 浮动呼吸（logoFloat）+ 背后柔光（glowPulse）
 * - 品牌名"星河宠记"淡入 + 三点加载指示（dotBounce）
 * - 全部为 transform/opacity 动画，不阻塞主线程
 * - 提供 prefers-reduced-motion 降级：保留淡入，去掉位移动画
 */
import { View, Text, Image } from '@tarojs/components'
import logoCatdog from '../assets/logo-catdog-01.webp'
import './LogoLoading.scss'

export default function LogoLoading() {
  return (
    <View className='logo-loading'>
      {/* 背后柔光层 */}
      <View className='logo-loading__glow' />
      <View className='logo-loading__center'>
        {/* 浮动呼吸的猫狗 Logo */}
        <View className='logo-loading__logo'>
          <Image className='logo-loading__logo-img' src={logoCatdog} mode='aspectFit' />
        </View>
        {/* 品牌名 */}
        <Text className='logo-loading__name'>星河宠记</Text>
        {/* 三点加载指示 */}
        <View className='logo-loading__dots'>
          <View className='logo-loading__dot' />
          <View className='logo-loading__dot' />
          <View className='logo-loading__dot' />
        </View>
      </View>
    </View>
  )
}
