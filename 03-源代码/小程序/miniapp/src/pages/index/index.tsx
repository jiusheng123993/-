import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { useChatCore } from '../../hooks/useChatCore'
import { useCheckinFlow } from '../../hooks/useCheckinFlow'
import { useSymptomFlow } from '../../hooks/useSymptomFlow'
import { useNamingFlow } from '../../hooks/useNamingFlow'
import { useFoodFlow } from '../../hooks/useFoodFlow'
import { useMemoryFlow } from '../../hooks/useMemoryFlow'
import { usePetStore } from '../../stores/petStore'
import type { CardData, Message, PetInfo } from '../../types/chatTypes'
import HomeSkeleton from '../../components/HomeSkeleton'
import { suggestQuickActions, type QuickAction } from '../../utils/suggestQuickActions'
import './index.scss'

function calcAge(birthDate: string): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths}月`
  const ageYears = Math.floor(totalMonths / 12)
  const remainingMonths = totalMonths % 12
  if (remainingMonths === 0) return `${ageYears}岁`
  return `${ageYears}岁${remainingMonths}月`
}

// 从真实宠物数据获取信息，而非硬编码
function usePetInfo(): PetInfo {
  const pet = usePetStore(s => s.currentPet)
  const pets = usePetStore(s => s.pets)
  const isLoading = usePetStore(s => s.isLoading)
  const activePet = pet ?? pets[0] ?? null
  return {
    name: activePet?.name || '',
    emoji: activePet?.species === 'cat' ? '🐱' : activePet?.species === 'dog' ? '🐕' : '🐾',
    breed: activePet?.breed || '',
    age: activePet?.birthDate ? calcAge(activePet.birthDate) : '',
    hasPet: pets.length > 0,
    isLoading,
    activePet,
  }
}

const PLUS_MENU_ITEMS = [
  { icon: '📋', label: '健康打卡', sub: '5项日常检查，1分钟完成', bg: 'rgba(232,168,56,0.12)' },
  { icon: '✨', label: 'AI 取名', sub: '智能推荐 + 寓意解读', bg: 'rgba(91,154,155,0.12)' },
  { icon: '📸', label: '记录回忆', sub: '上传照片 + 写一段话', bg: 'rgba(140,173,126,0.12)' },
  { icon: '🐱', label: '品种百科', sub: '40+品种特征和护理要点', bg: 'rgba(166,143,120,0.12)' },
  { icon: '🏠', label: '看家庭', sub: '家人动态 + 家庭周报', bg: 'rgba(224,133,107,0.12)' },
]

export default function Index() {
  const themeClass = useThemeClass()
  const petInfo = usePetInfo()
  const [inputValue, setInputValue] = useState('')
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [showGreetingQuickActions, setShowGreetingQuickActions] = useState(true)
  const [currentQuickActions, setCurrentQuickActions] = useState<QuickAction[]>([
    { action: 'checkin', label: '打卡', emoji: '💩' },
    { action: 'food', label: '查食物', emoji: '🔍' },
    { action: 'symptom', label: '症状初筛', emoji: '💊' },
  ])

  const chat = useChatCore({
    petInfo,
    inputValue,
    setInputValue,
    setPlusMenuOpen,
    setShowGreetingQuickActions,
  })

  const checkin = useCheckinFlow({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    petInfo,
  })

  const symptom = useSymptomFlow({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    petInfo,
  })

  const naming = useNamingFlow({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    petInfo,
  })

  const food = useFoodFlow({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    addMessage: chat.addMessage,
    setIsTyping: chat.setIsTyping,
    petInfo,
  })

  const memory = useMemoryFlow({
    addAiMsg: chat.addAiMsg,
    addUserMsg: chat.addUserMsg,
    setIsTyping: chat.setIsTyping,
    petInfo,
  })

  // 将食物/回忆流程处理器注册到聊天核心，打破循环依赖
  useEffect(() => {
    chat.setFlowHandlers({
      foodActive: food.foodActive,
      selectFood: food.selectFood,
      memoryActive: memory.memoryActive,
      handleMemoryRecord: memory.handleMemoryRecord,
    })
  })

  // 长按消息复制内容
  const handleLongPress = (msg: Message) => {
    if (!msg.content) return
    Taro.setClipboardData({
      data: msg.content,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success', duration: 1500 })
      },
    })
  }

  const handleQuickAction = (action: string) => {
    setShowGreetingQuickActions(false)
    if (action === 'checkin') checkin.startCheckin()
    else if (action === 'food') food.handleFoodQuery()
    else if (action === 'symptom') symptom.startSymptom()
    else if (action === 'naming') naming.startNaming()
    else if (action === 'memory') memory.startMemoryRecord()
  }

  // 用户发送消息后，根据消息内容更新快捷操作推荐
  const handleSendWithSuggestions = () => {
    const text = inputValue.trim()
    if (!text) return
    // 分析用户消息，更新推荐
    const suggestions = suggestQuickActions(text)
    setCurrentQuickActions(suggestions)
    // 调用原始 handleSend
    chat.handleSend()
  }

  const handlePlusMenuItem = (index: number) => {
    setPlusMenuOpen(false)
    switch (index) {
      case 0: checkin.startCheckin(); break
      case 1: naming.startNaming(); break
      case 2: memory.startMemoryRecord(); break
      case 3: Taro.navigateTo({ url: '/pagesPet/breed/index' }); break
      case 4: Taro.switchTab({ url: '/pages/family/index' }); break
    }
  }

  const getCurrentFlowType = (): 'checkin' | 'symptom' | 'naming' | null => {
    if (checkin.checkinStep >= 0) return 'checkin'
    if (symptom.symptomStep >= 0) return 'symptom'
    if (naming.namingStep >= 0) return 'naming'
    return null
  }

  const handleOptionClick = (option: string) => {
    const flowType = getCurrentFlowType()
    if (flowType === 'checkin') checkin.handleCheckinAnswer(option)
    else if (flowType === 'symptom') symptom.handleSymptomAnswer(option)
    else if (flowType === 'naming') naming.handleNamingAnswer(option)
  }

  const renderMessageContent = (msg: Message) => {
    return msg.content.split('\n').map((line, i) => (
      <Text key={i}>
        {line}
        {i < msg.content.split('\n').length - 1 && '\n'}
      </Text>
    ))
  }

  const renderCard = (card: CardData) => {
    switch (card.type) {
      case 'checkin_result': {
        const starCount = card.score !== undefined ? Math.round(card.score / 20) : 0
        return (
          <View className='msg-card'>
            <Text className='msg-card-title'>{card.title}</Text>
            <View className='score-stars'>
              {[1, 2, 3, 4, 5].map(i => (
                <Text key={i}>{i <= starCount ? '★' : '☆'}</Text>
              ))}
            </View>
            <View className='msg-card-stat'>
              <Text className='msg-card-stat-label'>综合评分</Text>
              <Text className='msg-card-stat-val'>{card.score} 分</Text>
            </View>
            {card.stats?.map((stat, si) => (
              <View key={si} className='msg-card-stat'>
                <Text className='msg-card-stat-label'>{stat.emoji || ''} {stat.label}</Text>
                <Text className='msg-card-stat-val'>{stat.value}</Text>
              </View>
            ))}
          </View>
        )
      }
      case 'food_result': {
        const isSafe = card.safe !== false
        return (
          <View className='msg-card'>
            <Text className='msg-card-title'>{card.title}</Text>
            <Text className='msg-card-text'>{card.desc}</Text>
            <View className={`msg-card-alert ${isSafe ? 'msg-card-alert--safe' : 'msg-card-alert--danger'}`}>
              <Text>{isSafe ? '👍 建议：' : '⚠ 建议：'}{card.advice}</Text>
            </View>
            {!isSafe && card.risk === 'P0' && (
              <View className='msg-card-hospital'>
                <Text className='msg-card-hospital-title'>🏥 如果误食，请立即就医</Text>
                <Text className='msg-card-hospital-item'>🏥 瑞鹏宠物医院 · 1.2km</Text>
                <Text className='msg-card-hospital-item'>🏥 美联众合 · 2.5km</Text>
                <Text className='msg-card-hospital-item'>🏥 芭比堂 · 3.1km</Text>
              </View>
            )}
          </View>
        )
      }
      case 'symptom_result': {
        return (
          <View className='msg-card'>
            <Text className='msg-card-title'>{card.title}</Text>
            {card.symptomInfo?.map((info, si) => (
              <View key={si} className='msg-card-stat'>
                <Text className='msg-card-stat-label'>{info.label}</Text>
                <Text className='msg-card-stat-val'>{info.value}</Text>
              </View>
            ))}
            <View className={`msg-card-alert ${card.riskLevel === 'critical' || card.riskLevel === 'high' ? 'msg-card-alert--danger' : 'msg-card-alert--safe'}`}>
              <Text>{card.advice}</Text>
            </View>
            {card.hospitalList && card.hospitalList.length > 0 && (
              <View className='msg-card-hospital'>
                <Text className='msg-card-hospital-title'>🏥 附近的宠物医院</Text>
                {card.hospitalList.map((h, hi) => (
                  <Text key={hi} className='msg-card-hospital-item'>{h}</Text>
                ))}
              </View>
            )}
          </View>
        )
      }
      case 'naming_cards': {
        return (
          <View>
            {card.names?.map((n, ni) => (
              <View key={ni} className='msg-naming-card'>
                {ni === 0 && <View className='msg-naming-badge'><Text>推荐</Text></View>}
                <Text className='msg-naming-name'>{n.name}</Text>
                <View className='score-stars' style={{ marginBottom: '8rpx' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Text key={i}>{i <= Math.round(n.score / 20) ? '★' : '☆'}</Text>
                  ))}
                </View>
                <Text className='msg-naming-meaning'>{n.meaning}</Text>
              </View>
            ))}
          </View>
        )
      }
      default:
        return null
    }
  }

  return (
    <View className={`chat-home-page ${themeClass}`}>

      {/* 爪印粒子装饰 */}
      <View className='chat-paw-particles'>
        <Text className='chat-paw chat-paw--1'>🐾</Text>
        <Text className='chat-paw chat-paw--2'>🐾</Text>
        <Text className='chat-paw chat-paw--3'>🐾</Text>
        <Text className='chat-paw chat-paw--4'>🐾</Text>
        <Text className='chat-paw chat-paw--5'>🐾</Text>
        <Text className='chat-paw chat-paw--6'>🐾</Text>
      </View>

      {/* 星星装饰 */}
      <View className='chat-stars'>
        <Text className='chat-star chat-star--1'>✦</Text>
        <Text className='chat-star chat-star--2'>✧</Text>
        <Text className='chat-star chat-star--3'>✦</Text>
        <Text className='chat-star chat-star--4'>✧</Text>
        <Text className='chat-star chat-star--5'>✦</Text>
        <Text className='chat-star chat-star--6'>✧</Text>
      </View>

      {petInfo.isLoading && !petInfo.hasPet ? (
        /* 加载中：骨架屏 */
        <HomeSkeleton />
      ) : !petInfo.hasPet ? (
        /* 空状态：引导用户添加宠物 */
        <View className='chat-empty'>
          <View className='chat-empty-icon'>🐾</View>
          <Text className='chat-empty-title'>欢迎来到星寰海</Text>
          <Text className='chat-empty-desc'>添加你的第一位宠物伙伴，{'\n'}开始记录温馨的每一天</Text>
          <View className='chat-empty-btn' onClick={() => Taro.navigateTo({ url: '/pagesPet/add/index' })}>
            <Text className='chat-empty-btn-text'>+ 添加宠物</Text>
          </View>
        </View>
      ) : (
        <>
      <View className='chat-top-bar'>
        <View className='chat-top-left'>
          <View className='chat-pet-avatar'>
            <Text>{petInfo.emoji}</Text>
          </View>
          <View className='chat-top-info'>
            <Text className='chat-pet-name'>{petInfo.name}</Text>
            <Text className='chat-pet-detail'>{petInfo.breed} · {petInfo.age}</Text>
          </View>
        </View>
        <View className='chat-switch-btn' onClick={() => Taro.showToast({ title: '切换宠物', icon: 'none' })}>
          <Text>切换</Text>
        </View>
      </View>

      <ScrollView
        className='chat-msg-list'
        scrollY
        scrollWithAnimation
        ref={chat.scrollRef}
      >

        <View className='msg-row ai'>
          <View className='msg-avatar'>
            <Text>🤖</Text>
          </View>
          <View className='msg-bubble-wrap'>
            <View className='msg-bubble'>
              <Text>早安呀！我是{petInfo.name}的AI小助手 ✦{'\n\n'}{petInfo.name}今天怎么样？来打个卡吧～ 或者告诉我你想了解什么？</Text>
            </View>
            {showGreetingQuickActions && checkin.checkinStep < 0 && symptom.symptomStep < 0 && naming.namingStep < 0 && !food.foodActive && !memory.memoryActive && (
              <View className='msg-quick-actions'>
                {currentQuickActions.map(qa => (
                  <View key={qa.action} className='msg-quick-btn' onClick={() => handleQuickAction(qa.action)}>
                    <Text>{qa.emoji} {qa.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {chat.messages.map((msg, idx) => (
          <View key={msg.id} className={`msg-row ${msg.type}`}>
            <View className='msg-avatar'>
              <Text>{msg.type === 'ai' ? '🤖' : '😊'}</Text>
            </View>
            <View className='msg-bubble-wrap'>
              <View
                className={`msg-bubble ${msg.id === chat.streamingId ? 'msg-bubble--streaming' : ''}`}
                onClick={msg.id === chat.streamingId ? chat.skipStream : undefined}
                onLongPress={() => handleLongPress(msg)}
              >
                {renderMessageContent(msg)}
                {msg.id === chat.streamingId && msg.content && (
                  <Text className='streaming-cursor'>▋</Text>
                )}
              </View>
              {msg.id === chat.streamingId && (
                <Text className='streaming-hint'>点击跳过 ↑</Text>
              )}

              {msg.card && renderCard(msg.card)}

              {idx === chat.messages.length - 1 && msg.type === 'ai' && showGreetingQuickActions && checkin.checkinStep < 0 && symptom.symptomStep < 0 && naming.namingStep < 0 && !food.foodActive && !memory.memoryActive && (
                <View className='msg-quick-actions'>
                  {currentQuickActions.map(qa => (
                    <View key={qa.action} className='msg-quick-btn' onClick={() => handleQuickAction(qa.action)}>
                      <Text>{qa.emoji} {qa.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {msg.options && msg.options.length > 0 && (
                <View className='msg-options-list'>
                  {msg.options.map((opt, oi) => (
                    <View
                      key={oi}
                      className='msg-option'
                      onClick={() => handleOptionClick(opt)}
                    >
                      <Text>{opt}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        {chat.isTyping && (
          <View className='msg-row ai'>
            <View className='msg-avatar'>
              <Text>🤖</Text>
            </View>
            <View className='msg-bubble typing-bubble'>
              <View className='typing-dots'>
                <View className='typing-dot' />
                <View className='typing-dot' />
                <View className='typing-dot' />
              </View>
            </View>
          </View>
        )}

        <View className='chat-bottom-spacer' />
      </ScrollView>

      <View className='chat-input-area'>
        {plusMenuOpen && (
          <>
            <View className='chat-plus-overlay' onClick={() => setPlusMenuOpen(false)} />
            <View className='chat-plus-menu'>
              {PLUS_MENU_ITEMS.map((item, idx) => (
                <View key={idx} className='plus-menu-item' onClick={() => handlePlusMenuItem(idx)}>
                  <View className='plus-menu-icon-wrap' style={{ background: item.bg }}>
                    <Text className='plus-menu-icon'>{item.icon}</Text>
                  </View>
                  <View className='plus-menu-text'>
                    <Text className='plus-menu-label'>{item.label}</Text>
                    <Text className='plus-menu-sub'>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
        <View className='chat-input-row'>
          <View
            className='chat-plus-btn'
            onClick={() => setPlusMenuOpen(!plusMenuOpen)}
          >
            <Text className='chat-plus-text'>+</Text>
          </View>
          <Input
            className='chat-input-field'
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleSendWithSuggestions}
            onFocus={() => setPlusMenuOpen(false)}
            placeholder={`说说${petInfo.name}今天的情况...`}
            placeholderStyle='color: #556'
            confirmType='send'
          />
          <View className='chat-send-btn' onClick={handleSendWithSuggestions}>
            <Text className='chat-send-text'>↑</Text>
          </View>
        </View>
        <View className='chat-input-safe' />
        </View>
        </>
      )}
    </View>
  )
}
