import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useState, useRef, useEffect, useCallback } from 'react'
import { matchByKeywords, formatResponseContent } from '../engines/emotion/EmotionEngine'
import './GriefCompanion.scss'

type GriefStage = 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance'

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: number
}

interface GriefCompanionProps {
  petName: string
  petAvatar?: string
  species: 'dog' | 'cat'
  deceasedDate: string
  onStageChange?: (stage: GriefStage) => void
}

const STAGES: { key: GriefStage; label: string }[] = [
  { key: 'denial', label: '否认' },
  { key: 'anger', label: '愤怒' },
  { key: 'bargaining', label: '讨价还价' },
  { key: 'depression', label: '抑郁' },
  { key: 'acceptance', label: '接纳' }
]

const STAGE_OPENINGS: Record<GriefStage, string> = {
  denial: '失去{petName}一定让你很难接受。感到不真实是完全正常的，给自己一些时间。',
  anger: '感到愤怒是正常的。对失去{petName}的愤怒，对命运的愤怒，都是悲伤的一部分。',
  bargaining: '也许你还在想"如果当时…"。这些想法很自然，但请记住，你已经给了{petName}最好的爱。',
  depression: '深深的悲伤说明{petName}在你心中有多重要。允许自己难过，这是治愈的过程。',
  acceptance: '虽然{petName}已经离开，但你们之间的爱永远不会消失。那些美好的回忆会一直陪伴你。'
}

const AI_RESPONSES: string[] = [
  '我理解你的感受，这需要时间。',
  '你的情绪是真实的，不需要压抑。',
  '慢慢来，没有人在催促你。',
  '每一个感受都是合理的，允许它们存在。',
  '你并不孤单，我会一直在这里陪伴你。'
]

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈'
}

export default function GriefCompanion({ petName, petAvatar, species, deceasedDate, onStageChange }: GriefCompanionProps) {
  const [currentStage, setCurrentStage] = useState<GriefStage>('denial')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [aiResponseIndex, setAiResponseIndex] = useState(0)
  const scrollViewRef = useRef<string>('')

  useEffect(() => {
    const opening = STAGE_OPENINGS[currentStage].replace(/\{petName\}/g, petName)
    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: opening,
      timestamp: Date.now()
    }
    setMessages([aiMessage])
  }, [])

  const handleStageChange = (stage: GriefStage) => {
    if (stage === currentStage) return
    setCurrentStage(stage)
    onStageChange?.(stage)
    const opening = STAGE_OPENINGS[stage].replace(/\{petName\}/g, petName)
    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: opening,
      timestamp: Date.now()
    }
    setMessages((prev) => [...prev, aiMessage])
  }

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now()
    }

    let aiContent: string
    const emotionMatch = matchByKeywords(trimmed, {
      petName,
      petId: '',
      species,
      isDeceased: true,
      deceasedDate,
      consecutiveAnomalyDays: 0,
      streakDays: 0,
      isNewUser: false,
      recentFoodQueryCount: 0,
      recentSymptomCheckCount: 0,
    })
    if (emotionMatch) {
      aiContent = formatResponseContent(emotionMatch.response.content, petName)
    } else {
      aiContent = AI_RESPONSES[aiResponseIndex]
      setAiResponseIndex((prev) => (prev + 1) % AI_RESPONSES.length)
    }

    const aiMessage: Message = {
      id: `ai-${Date.now() + 1}`,
      role: 'ai',
      content: aiContent,
      timestamp: Date.now() + 100
    }

    setMessages((prev) => [...prev, userMessage, aiMessage])
    setInputText('')
  }

  useEffect(() => {
    scrollViewRef.current = `scroll-${Date.now()}`
  }, [messages])

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <View className='grief-companion'>
      <View className='grief-companion__header'>
        <View className='grief-companion__pet-info'>
          <View className='grief-companion__avatar'>
            {petAvatar ? (
              <View className='grief-companion__avatar-img' style={{ backgroundImage: `url(${petAvatar})` }} />
            ) : (
              <Text className='grief-companion__avatar-emoji'>{SPECIES_EMOJI[species]}</Text>
            )}
          </View>
          <View className='grief-companion__pet-detail'>
            <Text className='grief-companion__pet-name'>{petName}</Text>
            <Text className='grief-companion__deceased-date'>离世日期：{deceasedDate}</Text>
          </View>
        </View>
        <View className='grief-companion__stage-indicator'>
          {STAGES.map((stage) => (
            <View
              key={stage.key}
              className={`grief-companion__stage-dot ${currentStage === stage.key ? 'grief-companion__stage-dot--active' : ''}`}
              onClick={() => handleStageChange(stage.key)}
            >
              <View className='grief-companion__stage-dot-inner' />
            </View>
          ))}
        </View>
        <View className='grief-companion__stage-labels'>
          {STAGES.map((stage) => (
            <Text
              key={stage.key}
              className={`grief-companion__stage-label ${currentStage === stage.key ? 'grief-companion__stage-label--active' : ''}`}
            >
              {stage.label}
            </Text>
          ))}
        </View>
      </View>

      <ScrollView
        className='grief-companion__messages'
        scrollY
        scrollIntoView={scrollViewRef.current}
        scrollWithAnimation
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            id={msg.id}
            className={`grief-companion__message grief-companion__message--${msg.role}`}
          >
            {msg.role === 'ai' && (
              <View className='grief-companion__message-avatar'>
                <Text className='grief-companion__message-avatar-emoji'>🤍</Text>
              </View>
            )}
            <View className={`grief-companion__bubble grief-companion__bubble--${msg.role}`}>
              <Text className='grief-companion__bubble-text'>{msg.content}</Text>
              <Text className='grief-companion__bubble-time'>{formatTime(msg.timestamp)}</Text>
            </View>
          </View>
        ))}
        <View id={scrollViewRef.current} />
      </ScrollView>

      <View className='grief-companion__input-bar'>
        <Input
          className='grief-companion__input'
          type='text'
          placeholder='说说你的感受...'
          placeholderClass='grief-companion__input-placeholder'
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          confirmType='send'
          onConfirm={handleSend}
        />
        <View
          className={`grief-companion__send-btn ${inputText.trim() ? 'grief-companion__send-btn--active' : ''}`}
          onClick={handleSend}
        >
          <Text className='grief-companion__send-icon'>➤</Text>
        </View>
      </View>
    </View>
  )
}
