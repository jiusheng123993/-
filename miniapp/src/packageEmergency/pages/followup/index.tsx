import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { useEmergencyStore } from '../../../stores/emergencyStore'
import './index.scss'

interface FollowupItem {
  id: string
  emergency_id: string
  user_id: string
  status: string
  mood_rating: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

const DEFAULT_RECOVERY_STEPS = [
  '保持规律的作息时间',
  '每天进行适度的运动',
  '与信任的人分享你的感受'
]

export default function FollowupPage() {
  const router = useRouter()
  const { emergencyId } = router.params
  const { user } = useAuthStore()
  const { session } = useEmergencyStore()

  const [moodRating, setMoodRating] = useState<number>(5)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (emergencyId) {
      loadFollowupData()
    }
  }, [emergencyId])

  const loadFollowupData = async () => {
    if (!emergencyId || !user) return

    try {
      const stored = Taro.getStorageSync(`followup_${emergencyId}`)
      if (stored) {
        const data = JSON.parse(stored) as FollowupItem
        if (data.mood_rating) {
          setMoodRating(data.mood_rating)
        }
        if (data.notes) {
          setNotes(data.notes)
        }
      }
    } catch (error) {
      console.error('加载跟进数据失败:', error)
    }
  }

  const handleSubmit = async () => {
    if (!emergencyId || !user || submitting) return

    setSubmitting(true)
    try {
      const followupData: FollowupItem = {
        id: `followup_${emergencyId}_${Date.now()}`,
        emergency_id: emergencyId,
        user_id: user.id,
        mood_rating: moodRating,
        notes: notes,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      Taro.setStorageSync(`followup_${emergencyId}`, JSON.stringify(followupData))

      Taro.showToast({
        title: '提交成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({
        title: '提交失败',
        icon: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoodSelect = (rating: number) => {
    setMoodRating(rating)
  }

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return '😢'
    if (rating <= 4) return '😔'
    if (rating <= 6) return '😐'
    if (rating <= 8) return '🙂'
    return '😊'
  }

  const getMoodText = (rating: number) => {
    if (rating <= 2) return '很糟糕'
    if (rating <= 4) return '不太好'
    if (rating <= 6) return '一般'
    if (rating <= 8) return '还不错'
    return '很好'
  }

  return (
    <View className='followup-page'>
      <View className='followup-header'>
        <Text className='header-title'>跟进反馈</Text>
        <Text className='header-subtitle'>记录你的恢复情况</Text>
      </View>

      <View className='followup-content'>
        <View className='mood-section'>
          <Text className='section-title'>现在感觉怎么样？</Text>
          <View className='mood-display'>
            <Text className='mood-emoji'>{getMoodEmoji(moodRating)}</Text>
            <Text className='mood-text'>{getMoodText(moodRating)}</Text>
          </View>
          <View className='mood-slider'>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <View 
                key={num}
                className={`mood-item ${moodRating === num ? 'active' : ''}`}
                onClick={() => handleMoodSelect(num)}
              >
                <Text className='mood-number'>{num}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className='notes-section'>
          <Text className='section-title'>有什么想记录的吗？</Text>
          <Input
            className='notes-input'
            placeholder='记录你的想法、感受或进展...'
            value={notes}
            onInput={(e) => setNotes(e.detail.value)}
            maxlength={500}
          />
        </View>

        <View className='tips-section'>
          <Text className='section-title'>恢复建议</Text>
          <View className='tips-list'>
            {DEFAULT_RECOVERY_STEPS.map((step: string, index: number) => (
              <View key={index} className='tip-item'>
                <Text className='tip-icon'>✓</Text>
                <Text className='tip-text'>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className='followup-footer'>
        <Button 
          className='submit-btn'
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          提交反馈
        </Button>
      </View>
    </View>
  )
}