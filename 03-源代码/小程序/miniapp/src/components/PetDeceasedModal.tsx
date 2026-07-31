/**
 * 宠物离世标记弹窗组件
 * 确认标记宠物已离世，选择离世日期
 */
import { View, Text, Picker } from '@tarojs/components'
import { useState } from 'react'
import './PetDeceasedModal.scss'

interface PetDeceasedModalProps {
  visible: boolean
  petName: string
  onConfirm: (date: string) => void
  onCancel: () => void
}

export default function PetDeceasedModal({ visible, petName, onConfirm, onCancel }: PetDeceasedModalProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  if (!visible) return null

  const handleDateChange = (e: { detail: { value: string } }) => {
    setSelectedDate(e.detail.value)
  }

  return (
    <View className='deceased-modal__overlay' onClick={onCancel}>
      <View className='deceased-modal' onClick={(e) => e.stopPropagation()}>
        <Text className='deceased-modal__title'>😢 标记 {petName} 已离世</Text>
        <Text className='deceased-modal__hint'>此操作不可撤销，请确认</Text>
        <View className='deceased-modal__date-picker'>
          <Text className='deceased-modal__label'>离世日期</Text>
          <Picker mode='date' value={selectedDate} onChange={handleDateChange}>
            <View className='deceased-modal__date-value'>{selectedDate}</View>
          </Picker>
        </View>
        <View className='deceased-modal__actions'>
          <View className='deceased-modal__btn deceased-modal__btn--cancel' onClick={onCancel}>
            <Text>取消</Text>
          </View>
          <View className='deceased-modal__btn deceased-modal__btn--confirm' onClick={() => onConfirm(selectedDate)}>
            <Text>确认标记</Text>
          </View>
        </View>
      </View>
    </View>
  )
}