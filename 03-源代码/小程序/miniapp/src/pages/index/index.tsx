import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCallback, useEffect, useState } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { useChatCore } from '../../hooks/useChatCore'
import { useCheckinFlow } from '../../hooks/useCheckinFlow'
import { useSymptomFlow } from '../../hooks/useSymptomFlow'
import { useNamingFlow } from '../../hooks/useNamingFlow'
import { useFoodFlow } from '../../hooks/useFoodFlow'
import { useMemoryFlow } from '../../hooks/useMemoryFlow'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { usePetStore } from '../../stores/petStore'
import type { CardData, Message, NamingDetail, PetInfo } from '../../types/chatTypes'
import HomeSkeleton from '../../components/HomeSkeleton'
import { suggestQuickActions, type QuickAction } from '../../utils/suggestQuickActions'
import { chooseImageWithPrivacy } from '../../utils/privacy'
import { uploadVoiceForTranscription } from '../../services/voiceService'
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
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [plusPanelOpen, setPlusPanelOpen] = useState(false)
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
    setPlusMenuOpen: setPlusPanelOpen,
    setShowGreetingQuickActions,
  })

  const { agentToolStatus } = chat

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
    streamAiReply: chat.streamAiReply,
    setIsTyping: chat.setIsTyping,
    updateMessageCard: chat.updateMessageCard,
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

  // 语音转文字处理中标记
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false)

  /** 语音录制完成后的处理：上传转文字 → 处理打卡或发送消息 */
  const handleVoiceComplete = useCallback(async (tempFilePath: string) => {
    setIsVoiceProcessing(true)
    try {
      const text = await uploadVoiceForTranscription(tempFilePath)
      if (!text || text === '无法识别语音内容') {
        Taro.showToast({ title: '未识别到语音内容，请重试', icon: 'none' })
        return
      }

      // 如果在打卡流程中，将语音转文字结果作为打卡答案处理
      const flowType = getCurrentFlowType()
      if (flowType === 'checkin' && checkin.checkinStep >= -2) {
        const matched = checkin.handleCheckinAnswer(text)
        if (matched) return
      }

      // 如果不在打卡流程中或匹配失败，将语音内容作为文本消息发送
      setInputValue(text)
      // 使用 setTimeout 确保 setInputValue 已生效
      setTimeout(() => {
        chat.handleSend()
      }, 50)
    } catch (err) {
      console.error('[VoiceComplete] Error:', err)
      Taro.showToast({ title: '语音处理失败，请重试', icon: 'none' })
    } finally {
      setIsVoiceProcessing(false)
    }
  }, [checkin, chat, setInputValue])

  const voice = useVoiceInput({
    onRecordComplete: handleVoiceComplete,
    maxDuration: 60,
  })

  // 将食物/回忆/取名流程处理器注册到聊天核心，打破循环依赖
  useEffect(() => {
    chat.setFlowHandlers({
      foodActive: food.foodActive,
      selectFood: food.selectFood,
      memoryActive: memory.memoryActive,
      handleMemoryRecord: memory.handleMemoryRecord,
      namingTextActive: naming.isTextInputActive,
      handleNamingText: naming.handleNamingText,
      startNaming: naming.startNaming,
      startCheckin: checkin.startCheckin,
      startMemory: memory.startMemoryRecord,
      startSymptom: symptom.startSymptom,
      startFoodQuery: food.handleFoodQuery,
      navigateToBreed: () => Taro.navigateTo({ url: '/pagesPet/breed/index' }),
      // Layer 2: Agent 工具调用触发的流程动作映射
      onToolAction: (action: string) => {
        switch (action) {
          case 'naming_flow': naming.startNaming(); break
          case 'checkin_flow': checkin.startCheckin(); break
          case 'memory_flow': memory.startMemoryRecord(); break
          case 'symptom_flow': symptom.startSymptom(); break
        }
      },
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

  /** 取名流程 - 选择照片上传 */
  const handleNamingPhotoChoose = async () => {
    if (naming.isUploadingPhoto) return
    try {
      const res = await chooseImageWithPrivacy({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      if (!res.tempFilePaths.length) return
      await naming.handleNamingPhoto(res.tempFilePaths[0])
    } catch (err: any) {
      const errMsg = err?.errMsg || err?.message || ''
      if (errMsg.includes('cancel')) {
        return
      }
      console.error('[NamingPhotoChoose] Error:', errMsg, err)
      // 根据错误类型给出更具体的提示
      if (errMsg.includes('auth deny') || errMsg.includes('authorize')) {
        Taro.showToast({ title: '需要相册/相机权限，请在设置中开启', icon: 'none', duration: 2500 })
      } else if (errMsg.includes('api scope is not declared')) {
        Taro.showToast({ title: '隐私协议未授权，请重新进入小程序', icon: 'none', duration: 2500 })
      } else {
        Taro.showToast({ title: '选择照片失败，请重试', icon: 'none' })
      }
    }
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
    setPlusPanelOpen(false)
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
    return (
      <View>
        {msg.imageUrl && (
          <Image
            className='msg-image'
            src={msg.imageUrl}
            mode='widthFix'
            style={{ maxWidth: '360rpx', borderRadius: '12rpx', marginBottom: msg.content ? '12rpx' : '0' }}
            onClick={() => {
              Taro.previewImage({ urls: [msg.imageUrl!], current: msg.imageUrl })
            }}
          />
        )}
        {msg.content.split('\n').map((line, i) => (
          <Text key={i}>
            {line}
            {i < msg.content.split('\n').length - 1 && '\n'}
          </Text>
        ))}
      </View>
    )
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
        const isRefreshing = card.data?.refreshing === true
        return (
          <View>
            {isRefreshing ? (
              <View className='msg-naming-refreshing'>
                <Text className='msg-naming-refreshing-text'>AI 正在为你重新推荐...</Text>
                <View className='msg-naming-refreshing-dots'>
                  <View className='msg-naming-dot' />
                  <View className='msg-naming-dot' />
                  <View className='msg-naming-dot' />
                </View>
              </View>
            ) : (
              <>
                {card.names?.map((n, ni) => (
                  <View
                    key={ni}
                    className='msg-naming-card msg-naming-card--clickable'
                    onClick={() => naming.handleNamingDetail(n)}
                    hoverClass='msg-naming-card--hover'
                  >
                    {ni === 0 && <View className='msg-naming-badge'><Text>推荐</Text></View>}
                    <View className='msg-naming-header'>
                      <Text className='msg-naming-name'>{n.name}</Text>
                      <View className='score-stars' style={{ marginBottom: '4rpx' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <Text key={i}>{i <= Math.round(n.score / 20) ? '★' : '☆'}</Text>
                        ))}
                      </View>
                    </View>
                    {n.wuxing && (
                      <View className='msg-naming-tags'>
                        <Text className='msg-naming-tag msg-naming-tag--wuxing'>五行：{n.wuxing}</Text>
                        {n.starMansion && <Text className='msg-naming-tag msg-naming-tag--star'>星宿：{n.starMansion}</Text>}
                      </View>
                    )}
                    {n.source && (
                      <Text className='msg-naming-source'>{n.source}</Text>
                    )}
                    <Text className='msg-naming-meaning'>{n.meaning}</Text>
                    <View className='msg-naming-detail-hint'>
                      <Text>点击查看命理详情 →</Text>
                    </View>
                  </View>
                ))}
                <View
                  className='msg-naming-refresh-btn'
                  onClick={() => naming.refreshNaming()}
                  hoverClass='msg-naming-refresh-btn--hover'
                >
                  <Text className='msg-naming-refresh-icon'>🔄</Text>
                  <Text className='msg-naming-refresh-label'>不满意？换一批</Text>
                </View>
              </>
            )}
          </View>
        )
      }
      case 'naming_detail': {
        const d = card.detail as NamingDetail | undefined
        if (!d) return null
        return (
          <View className='msg-naming-detail'>
            {/* 头部 */}
            <View className='msg-naming-detail-header'>
              <Text className='msg-naming-detail-name'>{d.name}</Text>
              <Text className='msg-naming-detail-subtitle'>命理深度分析</Text>
            </View>

            {/* 八字命理 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>☯</Text>
                <Text>八字命理</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.bazi}</Text>
            </View>

            {/* 整体运势 */}
            <View className='msg-naming-detail-section msg-naming-detail-section--fortune'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>⭐</Text>
                <Text>整体运势</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.fortune}</Text>
            </View>

            {/* 事业/生活运势 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>🌟</Text>
                <Text>事业/生活运势</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.careerFortune}</Text>
            </View>

            {/* 感情/人际运势 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>💕</Text>
                <Text>感情/人际运势</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.loveFortune}</Text>
            </View>

            {/* 健康运势 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>🍀</Text>
                <Text>健康运势</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.healthFortune}</Text>
            </View>

            {/* 性格特质 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>🎭</Text>
                <Text>性格特质</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.personality}</Text>
            </View>

            {/* 笔画数理 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>✍</Text>
                <Text>笔画数理</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.strokes}</Text>
            </View>

            {/* 吉祥三宝 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>🔮</Text>
                <Text>吉祥三宝</Text>
              </View>
              <View className='msg-naming-detail-lucky'>
                <View className='msg-naming-detail-lucky-item'>
                  <Text className='msg-naming-detail-lucky-label'>方位</Text>
                  <Text className='msg-naming-detail-lucky-val'>{d.luckyDirection}</Text>
                </View>
                <View className='msg-naming-detail-lucky-item'>
                  <Text className='msg-naming-detail-lucky-label'>颜色</Text>
                  <Text className='msg-naming-detail-lucky-val'>{d.luckyColor}</Text>
                </View>
                <View className='msg-naming-detail-lucky-item'>
                  <Text className='msg-naming-detail-lucky-label'>数字</Text>
                  <Text className='msg-naming-detail-lucky-val'>{d.luckyNumber}</Text>
                </View>
              </View>
            </View>

            {/* 与主人缘分 */}
            <View className='msg-naming-detail-section'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>🤝</Text>
                <Text>与主人缘分</Text>
              </View>
              <Text className='msg-naming-detail-text'>{d.karmaWithOwner}</Text>
            </View>

            {/* 总结寄语 */}
            <View className='msg-naming-detail-section msg-naming-detail-section--summary'>
              <View className='msg-naming-detail-section-title'>
                <Text className='msg-naming-detail-icon'>✨</Text>
                <Text>总结寄语</Text>
              </View>
              <Text className='msg-naming-detail-text msg-naming-detail-text--summary'>{d.summary}</Text>
            </View>
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
            <Text>🐾</Text>
          </View>
          <View className='chat-top-info'>
            <Text className='chat-pet-name'>星寰海</Text>
            <Text className='chat-pet-detail'>AI 宠物管家</Text>
          </View>
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
              <Text>早安呀！我是星寰海的AI小助手 ✦{'\n\n'}今天有什么可以帮你的？来打个卡吧～ 或者告诉我你想了解什么？</Text>
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
                {msg.id === chat.streamingId && (
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

              {/* 取名流程 - 照片上传步骤 */}
              {idx === chat.messages.length - 1 && naming.currentStep?.type === 'photo' && naming.namingStep >= 0 && (
                <View className='msg-naming-actions'>
                  <View className='msg-naming-action-btn msg-naming-action-btn--upload' onClick={handleNamingPhotoChoose}>
                    <Text>{naming.isUploadingPhoto ? '上传中...' : '📷 上传照片'}</Text>
                  </View>
                  <View className='msg-naming-action-btn msg-naming-action-btn--skip' onClick={naming.skipNamingPhoto}>
                    <Text>{naming.currentStep?.skipLabel || '跳过'}</Text>
                  </View>
                </View>
              )}

              {/* 取名流程 - 描述步骤跳过按钮 */}
              {idx === chat.messages.length - 1 && naming.currentStep?.type === 'text' && naming.currentStep?.key === 'description' && naming.namingStep >= 0 && (
                <View className='msg-naming-actions'>
                  <View className='msg-naming-action-btn msg-naming-action-btn--skip' onClick={naming.skipNamingDesc}>
                    <Text>{naming.currentStep?.skipLabel || '跳过'}</Text>
                  </View>
                </View>
              )}

              {/* 回忆流程 - 照片上传按钮 */}
              {idx === chat.messages.length - 1 && memory.memoryActive && (
                <View className='msg-naming-actions'>
                  {memory.memoryPhoto ? (
                    <View className='msg-memory-photo-preview'>
                      <Image
                        className='msg-memory-photo-img'
                        src={memory.memoryPhoto}
                        mode='aspectFill'
                      />
                      <View className='msg-memory-photo-info'>
                        <Text className='msg-memory-photo-label'>照片已选择</Text>
                        <View className='msg-memory-photo-actions'>
                          <View className='msg-naming-action-btn msg-naming-action-btn--upload' onClick={memory.handleMemoryPhoto}>
                            <Text>更换</Text>
                          </View>
                          <View className='msg-naming-action-btn msg-naming-action-btn--skip' onClick={memory.clearMemoryPhoto}>
                            <Text>删除</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className='msg-naming-action-btn msg-naming-action-btn--upload' onClick={memory.handleMemoryPhoto}>
                      <Text>{memory.isUploadingPhoto ? '上传中...' : '📷 拍照/上传照片'}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        ))}

        {agentToolStatus && (
          <View className='msg-row ai'>
            <View className='msg-avatar'>
              <Text>🤖</Text>
            </View>
            <View className='msg-bubble agent-status-bubble'>
              <Text className='agent-status-text'>{agentToolStatus}</Text>
            </View>
          </View>
        )}

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
        {/* + 功能面板 */}
        {plusPanelOpen && (
          <>
            <View
              className='chat-plus-overlay'
              catchMove
              onClick={() => setPlusPanelOpen(false)}
            />
            <View className='chat-plus-panel' catchMove>
              <View className='chat-plus-panel-grid'>
                {PLUS_MENU_ITEMS.map((item, idx) => (
                  <View
                    key={idx}
                    className='plus-panel-item'
                    hoverClass='plus-panel-item--hover'
                    hoverStayTime={80}
                    onClick={() => handlePlusMenuItem(idx)}
                  >
                    <View className='plus-panel-icon-wrap' style={{ background: item.bg }}>
                      <Text className='plus-panel-icon'>{item.icon}</Text>
                    </View>
                    <Text className='plus-panel-label'>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* 微信风格输入行 */}
        <View className='chat-input-row'>
          {/* 语音/文字切换 */}
          <View
            className={`wx-toggle-btn ${inputMode === 'voice' ? 'wx-toggle-btn--active' : ''}`}
            onClick={() => {
              setInputMode(inputMode === 'text' ? 'voice' : 'text')
              setPlusPanelOpen(false)
            }}
          >
            <Text className='wx-toggle-icon'>{inputMode === 'text' ? '🎤' : '⌨️'}</Text>
          </View>

          {/* 文字模式：输入框 */}
          {inputMode === 'text' && (
            <Input
              className='chat-input-field'
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              onConfirm={handleSendWithSuggestions}
              onFocus={() => setPlusPanelOpen(false)}
              placeholder={naming.isTextInputActive && naming.currentStep?.placeholder
                ? naming.currentStep.placeholder
                : '说说宠物今天的情况...'}
              placeholderStyle='color: #556'
              confirmType='send'
            />
          )}

          {/* 语音模式：按住说话 */}
          {inputMode === 'voice' && (
            <View
              className={`wx-hold-talk ${voice.isRecording ? 'wx-hold-talk--recording' : ''} ${isVoiceProcessing ? 'wx-hold-talk--processing' : ''}`}
              onTouchStart={voice.startRecord}
              onTouchEnd={voice.stopRecord}
              onTouchCancel={voice.stopRecord}
            >
              {isVoiceProcessing ? (
                <Text className='wx-hold-talk-text'>识别中...</Text>
              ) : voice.isRecording ? (
                <View className='wx-hold-talk-recording'>
                  <View className='wx-hold-talk-wave'>
                    <View className='wx-hold-talk-wave-bar' />
                    <View className='wx-hold-talk-wave-bar' />
                    <View className='wx-hold-talk-wave-bar' />
                  </View>
                  <Text className='wx-hold-talk-duration'>{voice.recordDuration}s 松开结束</Text>
                </View>
              ) : (
                <Text className='wx-hold-talk-text'>按住 说话</Text>
              )}
            </View>
          )}

          {/* 照片按钮 */}
          <View className='wx-icon-btn' onClick={chat.handleImageSend}>
            <Text className='wx-icon-text'>📷</Text>
          </View>

          {/* + 按钮 / 发送按钮 */}
          {inputValue.trim() ? (
            <View className='wx-send-btn' onClick={handleSendWithSuggestions}>
              <Text className='wx-send-text'>↑</Text>
            </View>
          ) : (
            <View
              className={`wx-plus-btn ${plusPanelOpen ? 'wx-plus-btn--active' : ''}`}
              onClick={() => {
                setPlusPanelOpen(!plusPanelOpen)
                setInputMode('text')
              }}
            >
              <Text className='wx-plus-text'>+</Text>
            </View>
          )}
        </View>
        <View className='chat-input-safe' />
        </View>
        </>
      )}

      {/* 命理详情悬浮弹窗 */}
      {naming.namingDetailPopup && (
        <View className='naming-popup-overlay' onClick={naming.closeNamingDetail}>
          <View className='naming-popup-card' onClick={(e: any) => e.stopPropagation()}>
            {/* 关闭按钮 */}
            <View className='naming-popup-close' onClick={naming.closeNamingDetail}>
              <Text>✕</Text>
            </View>

            {/* 头部 */}
            <View className='msg-naming-detail-header'>
              <Text className='msg-naming-detail-name'>{naming.namingDetailPopup.name}</Text>
              <Text className='msg-naming-detail-subtitle'>命理深度分析</Text>
            </View>

            <ScrollView className='naming-popup-body' scrollY enhanced showScrollbar={false}>
              {naming.isDetailLoading ? (
                /* 加载骨架屏 */
                <View className='naming-popup-loading'>
                  <View className='naming-popup-spinner'>
                    <Text className='naming-popup-spinner-icon'>☯</Text>
                  </View>
                  <Text className='naming-popup-loading-text'>
                    正在深度解析「{naming.namingDetailPopup.name}」的命理运势...
                  </Text>
                  <View className='naming-popup-skeleton'>
                    {[1, 2, 3, 4, 5].map(i => (
                      <View key={i} className='naming-popup-skeleton-line' style={{ width: `${85 + Math.random() * 15}%` }} />
                    ))}
                  </View>
                </View>
              ) : (
                <>
              {/* 八字命理 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>☯</Text>
                  <Text>八字命理</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.bazi}</Text>
              </View>

              {/* 整体运势 */}
              <View className='msg-naming-detail-section msg-naming-detail-section--fortune'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>⭐</Text>
                  <Text>整体运势</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.fortune}</Text>
              </View>

              {/* 事业/生活运势 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>🌟</Text>
                  <Text>事业/生活运势</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.careerFortune}</Text>
              </View>

              {/* 感情/人际运势 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>💕</Text>
                  <Text>感情/人际运势</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.loveFortune}</Text>
              </View>

              {/* 健康运势 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>🍀</Text>
                  <Text>健康运势</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.healthFortune}</Text>
              </View>

              {/* 性格特质 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>🎭</Text>
                  <Text>性格特质</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.personality}</Text>
              </View>

              {/* 笔画数理 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>✍</Text>
                  <Text>笔画数理</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.strokes}</Text>
              </View>

              {/* 吉祥三宝 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>🔮</Text>
                  <Text>吉祥三宝</Text>
                </View>
                <View className='msg-naming-detail-lucky'>
                  <View className='msg-naming-detail-lucky-item'>
                    <Text className='msg-naming-detail-lucky-label'>方位</Text>
                    <Text className='msg-naming-detail-lucky-val'>{naming.namingDetailPopup.luckyDirection}</Text>
                  </View>
                  <View className='msg-naming-detail-lucky-item'>
                    <Text className='msg-naming-detail-lucky-label'>颜色</Text>
                    <Text className='msg-naming-detail-lucky-val'>{naming.namingDetailPopup.luckyColor}</Text>
                  </View>
                  <View className='msg-naming-detail-lucky-item'>
                    <Text className='msg-naming-detail-lucky-label'>数字</Text>
                    <Text className='msg-naming-detail-lucky-val'>{naming.namingDetailPopup.luckyNumber}</Text>
                  </View>
                </View>
              </View>

              {/* 与主人缘分 */}
              <View className='msg-naming-detail-section'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>🤝</Text>
                  <Text>与主人缘分</Text>
                </View>
                <Text className='msg-naming-detail-text'>{naming.namingDetailPopup.karmaWithOwner}</Text>
              </View>

              {/* 总结寄语 */}
              <View className='msg-naming-detail-section msg-naming-detail-section--summary'>
                <View className='msg-naming-detail-section-title'>
                  <Text className='msg-naming-detail-icon'>✨</Text>
                  <Text>总结寄语</Text>
                </View>
                <Text className='msg-naming-detail-text msg-naming-detail-text--summary'>{naming.namingDetailPopup.summary}</Text>
              </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
