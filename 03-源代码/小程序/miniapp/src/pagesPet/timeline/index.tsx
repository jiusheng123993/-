import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { timelineService } from '../../services/timelineService'
import type { PetMoment, PetMilestone } from '../../types/familyTypes'

export default function TimelinePage() {
  const [moments, setMoments] = useState<PetMoment[]>([])
  const [milestones, setMilestones] = useState<PetMilestone[]>([])

  useEffect(() => {
    timelineService.getMoments().then(setMoments).catch(() => {})
    timelineService.getMilestones('').then(setMilestones).catch(() => {})
  }, [])

  if (moments.length === 0 && milestones.length === 0) {
    return (
      <View
        style={{
          minHeight: '100vh',
          background: '#0F1724',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <Text style={{ color: '#8899AA', fontSize: '14px', textAlign: 'center' }}>
          还没有回忆记录{'\n'}在AI聊天中说"帮我记录一段回忆"来添加
        </Text>
      </View>
    )
  }

  return (
    <View
      style={{
        minHeight: '100vh',
        background: '#0F1724',
        padding: '20px',
        paddingTop: '60px',
      }}
    >
      <Text
        style={{
          color: '#F5D78C',
          fontSize: '20px',
          fontFamily: 'serif',
          display: 'block',
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        青橘的时光 ✦
      </Text>

      {moments.map((m, idx) => (
        <View
          key={idx}
          style={{
            marginBottom: '16px',
            padding: '16px',
            borderRadius: '16px',
            background: '#1A2332',
            borderLeft: '3px solid #E8A838',
          }}
        >
          <Text
            style={{ color: '#8899AA', fontSize: '11px', display: 'block' }}
          >
            {new Date(m.createdAt).toLocaleDateString('zh-CN')}
          </Text>
          <Text
            style={{
              color: '#E8DFD5',
              fontSize: '14px',
              lineHeight: '1.6',
              display: 'block',
              marginTop: '4px',
            }}
          >
            {m.aiSummary || (m.content as { text?: string })?.text || '回忆记录'}
          </Text>
        </View>
      ))}
    </View>
  )
}
