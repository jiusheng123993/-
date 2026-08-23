/**
 * 会员门槛组件
 *
 * 会员专属功能页面的统一开通引导：非会员看到卡片并引导去会员页。
 * 页面只需配合 useMemberGate 钩子判断权限，命中后直接渲染本组件即可。
 */
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './MemberGate.scss'

interface MemberGateProps {
  /** 功能名称（展示在引导文案里） */
  featureName: string
}

export default function MemberGate({ featureName }: MemberGateProps) {
  return (
    <View className='member-gate'>
      <View className='member-gate-icon'>👑</View>
      <Text className='member-gate-title'>会员专属功能</Text>
      <Text className='member-gate-desc'>{featureName}为星河宠记会员权益（9.9 元/月），开通后即可使用</Text>
      <View className='member-gate-btn' onClick={() => Taro.navigateTo({ url: '/pagesUser/member/index' })}>
        <Text className='member-gate-btn-text'>开通会员</Text>
      </View>
      <Text className='member-gate-hint'>开通会员还可解锁：健康报告导出、无限健康趋势等</Text>
    </View>
  )
}