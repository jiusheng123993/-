import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useChat } from '../../hooks/useChat'
import { useChatStore } from '../../stores/chatStore'
import './index.scss'

export default function ChatPage() {
  const { messages, isLoading, send } = useChat()
  const { activePetName } = useChatStore()
  const [inputText, setInputText] = useState('')
  const [showFuncMenu, setShowFuncMenu] = useState(false)
  const scrollRef = useRef<any>(null)

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = 99999
      }, 100)
    }
  }, [messages])

  const handleSend = () => {
    if (!inputText.trim()) return
    send(inputText)
    setInputText('')
  }

  const quickActions = [
    { label: '打卡', icon: '\uD83D\uDCA9', action: () => send('给青橘打卡') },
    { label: '查食物', icon: '\uD83D\uDD0D', action: () => send('查食物') },
    { label: '症状初筛', icon: '\uD83D\uDC8A', action: () => send('症状初筛') },
  ]

  return (
    <View className='chat-container'>
      <View className='chat-header'>
        <View className='pet-avatar'>青</View>
        <Text
          style={{
            color: '#E8DFD5',
            fontSize: '16px',
            marginLeft: '10px',
            flex: 1,
            fontFamily: 'serif',
          }}
        >
          {activePetName}
        </Text>
        <View style={{ color: '#8899AA', fontSize: '18px', padding: '0 8px' }}>&lt;</View>
        <View style={{ color: '#E8A838', fontSize: '20px' }}>✦</View>
      </View>

      <ScrollView
        className='msg-list'
        scrollY
        scrollWithAnimation
        ref={scrollRef}
      >
        {messages.map((msg, idx) => (
          <View key={idx} className={`msg-row ${msg.role}`}>
            <View className={`msg-bubble ${msg.role}`}>
              <Text>{msg.content}</Text>
            </View>
          </View>
        ))}

        {messages.length <= 1 && (
          <View className='quick-actions'>
            {quickActions.map((qa, idx) => (
              <View key={idx} className='quick-btn' onClick={qa.action}>
                <Text>{qa.icon} {qa.label}</Text>
              </View>
            ))}
          </View>
        )}

        {isLoading && (
          <View className='typing-indicator'>
            <View className='typing-bubble'>
              <Text>思考中...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View className='input-area'>
        <View className='plus-btn' onClick={() => setShowFuncMenu(!showFuncMenu)}>
          <Text style={{ color: '#E8A838', fontSize: '22px', lineHeight: '22px' }}>+</Text>
        </View>

        <Input
          className='chat-input'
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          onConfirm={handleSend}
          placeholder='和AI聊聊...'
          placeholderStyle='color: #556; font-size: 13px'
          confirmType='send'
        />

        <View className='send-btn' onClick={handleSend}>
          <Text style={{ color: '#0F1724', fontSize: '18px', fontWeight: 700 }}>↑</Text>
        </View>
      </View>

      {showFuncMenu && (
        <View className='func-menu'>
          {[
            { label: '打卡', icon: '\uD83D\uDCA9', action: () => { send('打卡'); setShowFuncMenu(false) } },
            { label: '取名', icon: '✨', action: () => { send('给宠物取名'); setShowFuncMenu(false) } },
            { label: '记录回忆', icon: '\uD83D\uDCF8', action: () => { send('帮我记录一段回忆'); setShowFuncMenu(false) } },
            { label: '看家庭', icon: '\uD83C\uDFE0', action: () => { setShowFuncMenu(false) } },
          ].map((item, idx) => (
            <View key={idx} className='func-menu-item' onClick={item.action}>
              <Text style={{ fontSize: '28px' }}>{item.icon}</Text>
              <Text style={{ color: '#8899AA', fontSize: '11px' }}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
