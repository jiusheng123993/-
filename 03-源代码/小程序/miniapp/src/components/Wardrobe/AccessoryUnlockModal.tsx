/**
 * 饰品解锁弹窗组件
 * 展示饰品获取方式（免费/成就/付费/会员），引导用户解锁
 */
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import type { AccessoryDef, UnlockSource } from '../../types/wardrobeTypes'
import { getAccessoryById } from '../../data/wardrobe/accessories'
import './AccessoryUnlockModal.scss'

interface AccessoryUnlockModalProps {
  visible: boolean
  accessoryId: string | null
  onClose: () => void
  onUpgrade: () => void
}

const SOURCE_CONFIG: Record<UnlockSource, { icon: string; title: string; description: string; actionText: string }> = {
  default: {
    icon: '🆓',
    title: '免费饰品',
    description: '该饰品可免费获取',
    actionText: '立即获取',
  },
  achievement: {
    icon: '🏆',
    title: '成就解锁',
    description: '完成指定成就后即可解锁该饰品',
    actionText: '查看成就',
  },
  paid: {
    icon: '💎',
    title: '付费饰品',
    description: '该饰品需要购买后解锁',
    actionText: '购买解锁',
  },
  member: {
    icon: '👑',
    title: '会员专属',
    description: '开通会员即可解锁全部会员饰品',
    actionText: '开通会员',
  },
}

export default function AccessoryUnlockModal({
  visible,
  accessoryId,
  onClose,
  onUpgrade,
}: AccessoryUnlockModalProps) {
  const accessory = useMemo(
    () => accessoryId ? getAccessoryById(accessoryId) : undefined,
    [accessoryId],
  )

  if (!visible || !accessory) return null

  const config = SOURCE_CONFIG[accessory.unlockSource]
  const price = accessory.unlockCondition.price as number | undefined

  const handleAction = () => {
    switch (accessory.unlockSource) {
      case 'achievement':
        Taro.navigateTo({ url: '/pagesPet/achievement/index' })
        break
      case 'paid':
        Taro.showToast({ title: '支付功能开发中', icon: 'none' })
        break
      case 'member':
        onUpgrade()
        break
      default:
        onClose()
    }
  }

  return (
    <View className='unlock-modal'>
      <View className='unlock-modal__overlay' onClick={onClose} />
      <View className='unlock-modal__card'>
        <View className='unlock-modal__bar' />

        <View className='unlock-modal__icon'>
          <Text className='unlock-modal__icon-text'>{config.icon}</Text>
        </View>

        <Text className='unlock-modal__title'>{accessory.name}</Text>

        <View className='unlock-modal__info'>
          <View className='unlock-modal__info-row'>
            <Text className='unlock-modal__info-label'>槽位</Text>
            <Text className='unlock-modal__info-value'>
              {accessory.slot === 'head' ? '头部' : accessory.slot === 'neck' ? '颈部' : accessory.slot === 'back' ? '背部' : accessory.slot === 'body' ? '身体' : '足部'}
            </Text>
          </View>
          <View className='unlock-modal__info-row'>
            <Text className='unlock-modal__info-label'>获取方式</Text>
            <Text className='unlock-modal__info-value'>{config.title}</Text>
          </View>
          {price != null && (
            <View className='unlock-modal__info-row'>
              <Text className='unlock-modal__info-label'>价格</Text>
              <Text className='unlock-modal__info-value'>💎 {price}</Text>
            </View>
          )}
        </View>

        <Text className='unlock-modal__description'>{config.description}</Text>

        <View className='unlock-modal__actions'>
          <View className='unlock-modal__btn unlock-modal__btn--primary' onClick={handleAction}>
            <Text className='unlock-modal__btn-text'>{config.actionText}</Text>
          </View>
          <View className='unlock-modal__btn unlock-modal__btn--secondary' onClick={onClose}>
            <Text className='unlock-modal__btn-text'>取消</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
