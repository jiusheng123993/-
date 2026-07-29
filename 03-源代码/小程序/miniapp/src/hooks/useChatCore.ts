import { useCallback, useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { sendChatMessage, type ChatContext } from '../services/chatService'
import { agentChat, getToolLabel, loadAgentHistory } from '../services/agentService'
import type { CardData, ChatMessage, Message, PetInfo } from '../types/chatTypes'
import { logger } from '../logger'
import { chooseImageWithPrivacy } from '../utils/privacy'

let messageIdCounter = 0

// ========== 语义意图识别：文本归一化 + 正则模式匹配 ==========

/** 归一化文本：去标点、去空格、转小写，用于模糊匹配 */
function normalizeText(text: string): string {
  return text
    .replace(/[，。！？、；：""''「」『』【】（）《》\s\n\r\t]/g, '')
    .toLowerCase()
}

/**
 * 意图模式定义：每个模式包含正则数组和对应的流程动作
 * 正则已归一化（无标点无空格），匹配时对用户输入也做归一化
 */
interface IntentPattern {
  /** 正则模式数组（匹配归一化后的文本） */
  patterns: RegExp[]
  /** 触发动作 */
  action: () => void
}

/** 构建意图匹配器 */
function buildIntentMatcher(handlers: {
  startNaming?: () => void
  startCheckin?: () => void
  startMemory?: () => void
  startSymptom?: () => void
  startFoodQuery?: () => void
  navigateToBreed?: () => void
}): IntentPattern[] {
  return [
    // ===== 取名意图 =====
    {
      patterns: [
        /(?:帮|给|为|替)(?:我|我们|我家|咱|咱们)?(?:宠物|猫|狗|猫咪|狗狗|毛孩子|宝贝|主子|汪星人|喵星人)?(?:取|起|想|推荐|挑|选|改|换|叫)(?:个|什么|啥|一个)?(?:名|名字|名称)/,
        /(?:取|起|想|推荐|挑|选)(?:个|什么|啥|一个)?(?:名|名字|名称)/,
        /(?:名|名字|名称)(?:叫|取|起)(?:什么|啥|个)?/,
        /(?:叫|取|起)(?:什么|啥|个)?(?:名|名字|名称)/,
        /(?:改|换)(?:个|什么|啥)?(?:名|名字|名称)/,
        /(?:有什么|有啥|求|推荐)(?:好|好听|可爱|霸气|特别)?(?:的)?(?:名|名字|名称)/,
        /(?:想不出|不知道|没想好|纠结|没灵感)(?:叫|取|起)?(?:什么|啥)?(?:名|名字|名称)?/,
        /(?:帮忙|帮我|给我|给我家)(?:取|起|想|推荐)(?:个|什么|啥)?/,
        /(?:求|要|来)(?:个|一个|份)?(?:名|名字|名称)/,
        /(?:宠物|猫|狗|猫咪|狗狗)(?:叫|取|起)(?:什么|啥)?(?:名|名字|名称)?/,
        /(?:名字|命名)(?:推荐|建议|生成|创造)/,
        /(?:取|起|想)(?:个|什么|啥)?(?:好听|可爱|霸气|特别|洋气|古风|文艺|有趣)?(?:的)?(?:名|名字|名称)/,
      ],
      action: () => handlers.startNaming?.(),
    },
    // ===== 打卡意图 =====
    {
      patterns: [
        /(?:打卡|签到|记录)(?:一下|今天|今日|现在|啦|吧|吗|了)?/,
        /(?:今天|今日|现在|来|想|要|我要|我想)(?:打卡|签到|记录)(?:一下|啦|吧|吗|了)?/,
        /(?:记录|写|做)(?:一下|个|今天|今日)?(?:记录|状态|情况|打卡)/,
        /(?:今天|今日|最近)(?:状态|情况|身体|精神|食欲|便便|排便)(?:怎么|如何|好|差)?(?:样|吗|呢|呀)?/,
        /(?:记录|汇报|报告)(?:一下|今天|今日)?(?:豆豆|宝贝|毛孩子|主子|宠物|猫|狗)?(?:的)?(?:状态|情况|身体)/,
        /(?:来|做|开始)(?:个|一次|下)?(?:健康|每日|日常|今日)?(?:打卡|记录|检查)/,
        /(?:每日|日常|健康|今日)(?:打卡|记录|签到)/,
        /(?:做个|做个|写个)(?:记录|打卡|健康记录)/,
        /(?:精神状态|食欲|排便|运动)(?:怎么样|如何|好不好|正常吗)/,
      ],
      action: () => handlers.startCheckin?.(),
    },
    // ===== 回忆意图 =====
    {
      patterns: [
        /(?:记录|写|发|添加|保存|留下)(?:回忆|日记|瞬间|时光|美好|记忆|成长)/,
        /(?:回忆|日记|瞬间|时光|记忆)(?:记录|录入|添加|保存)/,
        /(?:记录|保存|留下)(?:今天|今日|昨天|美好|难忘|有趣|开心)?(?:的)?(?:事|事情|时刻|瞬间|经历)/,
        /(?:写|记)(?:个|篇|段)?(?:日记|回忆|日志|记录)/,
        /(?:宠物|猫|狗|猫咪|狗狗)(?:日记|回忆|记录|时光)/,
        /(?:时光|回忆|记忆)(?:记录|保存|留存|珍藏)/,
        /(?:记录|保存)(?:一下|今天|今日)?(?:我们|我和|和)?(?:宠物|猫|狗|豆豆|宝贝)?(?:的)?(?:故事|回忆|经历)/,
        /(?:成长|美好|珍贵)(?:记录|回忆|瞬间|时刻)/,
        /(?:写|记)(?:下|录)(?:今天|今日)?(?:发生|遇到|经历)(?:的)?(?:事|事情)/,
      ],
      action: () => handlers.startMemory?.(),
    },
    // ===== 症状意图 =====
    {
      patterns: [
        /(?:呕吐|吐了|拉稀|拉肚子|腹泻|便血|尿血|便秘|发烧|发热|咳嗽|打喷嚏|流鼻涕|抽搐|昏倒|晕倒|瘫痪|跛行|瘸了|肿胀|出血|流血|不吃|不喝|不吃东西|不吃饭|不吃粮)/,
        /(?:精神|状态|食欲|胃口)(?:不好|很差|差|不好|不太|不佳|不行|不对劲)/,
        /(?:没|没有)(?:精神|食欲|胃口|力气|劲)/,
        /(?:生病|病了|得病|不舒服|难受|不对劲|不对|异常|反常)(?:了|吗|呢|呀)?/,
        /(?:帮|帮|给|帮帮)(?:我|我)?(?:看|看看|检查|诊断)(?:一下|看)?(?:怎么|什么|咋)?(?:了|回事|情况)?/,
        /(?:是不是|好像|感觉|觉得)(?:生病|病了|不舒服|有问题|不对劲)/,
        /(?:症状|健康|身体)(?:检查|初筛|评估|分析|筛查)/,
        /(?:哪里|哪里|什么)(?:不舒服|不对|异常|有问题)/,
        /(?:宠物|猫|狗|猫咪|狗狗|豆豆|宝贝)(?:好像|感觉|是不是)?(?:不舒服|生病|病了|有问题|不对劲)/,
        /(?:怎么|什么|啥)(?:回事|情况|问题)(?:不舒服|生病|病了|不对劲)/,
        /(?:蔫|蔫了|蔫蔫的|没精神|无精打采|萎靡|不振|懒洋洋|不爱动|不想动|嗜睡|老睡觉)/,
        /(?:抓|挠|舔|咬)(?:自己|身上|毛|皮肤|耳朵|爪子|尾巴)(?:不停|一直|总是|频繁|很厉害)/,
        /(?:皮肤|耳朵|眼睛|鼻子|嘴巴|牙齿|爪子|尾巴)(?:有问题|不对劲|异常|发炎|红肿|溃烂|掉毛|脱毛)/,
        /(?:拉|尿|便)(?:不出来|困难|频繁|很多|很少|颜色不对|有血|带血)/,
      ],
      action: () => handlers.startSymptom?.(),
    },
    // ===== 食物查询意图 =====
    {
      patterns: [
        /(?:能|可以|能不能|可不可以|能吗|行吗)(?:吃|喂|给|让)(?:吗|不|呢|呀|啊)?/,
        /(?:吃|喂|给)(?:了|过|点|些)?(?:什么|啥|哪些|哪个|哪种)?(?:好|合适|安全|可以|能)?/,
        /(?:有毒|中毒|有害|安全|危险|不能吃|不可以吃|会死|致命)/,
        /(?:查|查询|搜索|看看|了解)(?:一下|下)?(?:食物|能不能吃|安全|毒性)/,
        /(?:食物|饮食|喂养)(?:安全|查询|建议|指南|推荐|禁忌)/,
        /(?:什么|啥|哪些|哪种)(?:食物|东西|吃的)?(?:能|可以|不能|不可以|适合)(?:吃|喂|给)/,
        /(?:对|对于)(?:宠物|猫|狗|猫咪|狗狗)(?:来说)?(?:有毒|有害|安全|危险|不能吃)/,
        /(?:巧克力|葡萄|洋葱|大蒜|牛奶|鸡骨头|鱼骨头|生肉|生鸡蛋|咖啡|茶|酒精|木糖醇|牛油果|坚果|夏威夷果|蘑菇|韭菜|葱|姜|辣椒|盐|糖|油|肝脏)/,
        /(?:喂|给|让)(?:它|他|她|宠物|猫|狗)?(?:吃|尝|试|舔)(?:了|过|一下)?(?:什么|啥|这个|那个)?/,
        /(?:误食|偷吃|吃了|吞了|咽了)(?:什么|啥|这个|那个)?/,
        /(?:推荐|建议)(?:一下|下)?(?:喂|吃|给)(?:什么|啥|哪些)/,
      ],
      action: () => handlers.startFoodQuery?.(),
    },
    // ===== 品种百科意图 =====
    {
      patterns: [
        /(?:品种|种类)(?:百科|介绍|信息|查询|推荐|大全|列表)/,
        /(?:查|看|搜|了解|介绍)(?:一下|下)?(?:品种|种类|百科)/,
        /(?:什么|啥|哪个|哪种)(?:品种|种类|猫|狗)(?:好|合适|适合|推荐|温顺|聪明|好养|不掉毛|粘人)/,
        /(?:金毛|拉布拉多|柯基|泰迪|比熊|柴犬|哈士奇|边牧|德牧|法斗|英斗|博美|雪纳瑞|萨摩耶|阿拉斯加|松狮|巴哥|贵宾|约克夏|吉娃娃|蝴蝶犬|英短|美短|布偶|暹罗|波斯|加菲|折耳|缅因|橘猫|三花|奶牛猫|蓝猫|金渐层|银渐层|无毛猫|德文|阿比)/,
        /(?:品种)(?:特征|特点|性格|寿命|饲养|护理|健康|遗传病|常见病)/,
        /(?:适合|推荐)(?:新手|家庭|公寓|小孩|老人|上班族)(?:养|饲养)?(?:的)?(?:品种|猫|狗)/,
        /(?:宠物|猫|狗)(?:品种|种类)(?:有哪些|多少种|怎么选|怎么挑)/,
        /(?:百科|图鉴|大全)(?:宠物|猫|狗|品种)/,
      ],
      action: () => handlers.navigateToBreed?.(),
    },
  ]
}

/** 生成唯一消息 ID */
export function genId(): string {
  return `msg_${++messageIdCounter}_${Date.now()}`
}

/** 食物/回忆/取名流程处理器，由主组件注册以打破循环依赖 */
export interface FlowHandlers {
  foodActive: boolean
  selectFood: (text: string) => void | Promise<void>
  memoryActive: boolean
  handleMemoryRecord: (text: string) => void | Promise<void>
  namingTextActive: boolean
  handleNamingText: (text: string) => void | Promise<void>
  /** 启动取名流程 */
  startNaming?: () => void
  /** 启动打卡流程 */
  startCheckin?: () => void
  /** 启动回忆记录流程 */
  startMemory?: () => void
  /** 启动症状初筛流程 */
  startSymptom?: () => void
  /** 启动食物查询流程 */
  startFoodQuery?: () => void
  /** 跳转品种百科 */
  navigateToBreed?: () => void
  /** Agent 工具调用触发的流程动作回调（语义识别第二层） */
  onToolAction?: (action: string) => void
}

export interface UseChatCoreParams {
  petInfo: PetInfo
  /** 输入框当前值 */
  inputValue: string
  /** 清空输入框 */
  setInputValue: (value: string) => void
  /** 关闭加号菜单 */
  setPlusMenuOpen: (open: boolean) => void
  /** 隐藏问候快捷操作 */
  setShowGreetingQuickActions: (show: boolean) => void
}

/**
 * 聊天核心 Hook
 *
 * 管理消息列表、流式输出、打字状态与聊天历史，
 * 并通过 handleSend 编排普通聊天流程与食物/回忆流程的分流。
 */
export function useChatCore(params: UseChatCoreParams) {
  const { petInfo, inputValue, setInputValue, setPlusMenuOpen, setShowGreetingQuickActions } = params

  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [agentToolStatus, setAgentToolStatus] = useState<string | null>(null)

  const streamRef = useRef<{
    timer: ReturnType<typeof setInterval> | null
    fullContent: string
    id: string
  } | null>(null)

  // Agent 流式跳过标记
  const agentSkipRef = useRef(false)

  const scrollRef = useRef<any>(null)

  /** 食物/回忆/取名流程处理器引用，由主组件通过 setFlowHandlers 注册 */
  const flowHandlersRef = useRef<FlowHandlers>({
    foodActive: false,
    selectFood: () => {},
    memoryActive: false,
    handleMemoryRecord: () => {},
    namingTextActive: false,
    handleNamingText: () => {},
  })

  /** 注册食物/回忆流程处理器 */
  const setFlowHandlers = useCallback((handlers: FlowHandlers) => {
    flowHandlersRef.current = handlers
  }, [])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 999999
      }
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // 加载服务端持久化对话历史
  useEffect(() => {
    if (!petInfo.hasPet) return
    loadAgentHistory(petInfo.activePet?.id, 20)
      .then((history) => {
        if (history.length > 0) {
          setChatHistory(
            history.map((h) => ({
              role: h.role,
              content: h.content,
            }))
          )
          logger.info('useChatCore', `Loaded ${history.length} history entries from server`)
        }
      })
      .catch(() => {})
  }, [petInfo.activePet?.id, petInfo.hasPet])

  const addMessage = useCallback((msg: Omit<Message, 'id'>): string => {
    const id = genId()
    const newMsg: Message = { ...msg, id }
    setMessages(prev => [...prev, newMsg])
    return id
  }, [])

  /** 更新指定消息的 card 数据（用于"换一批"等场景） */
  const updateMessageCard = useCallback((msgId: string, card: CardData) => {
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, card } : m))
    )
  }, [])

  const addAiMsg = useCallback(
    (content: string, options?: string[]) => {
      addMessage({ type: 'ai', content, options })
    },
    [addMessage]
  )

  const addUserMsg = useCallback(
    (content: string) => {
      addMessage({ type: 'user', content })
    },
    [addMessage]
  )

  /** 打字机效果逐字输出 AI 回复 */
  const streamAiReply = useCallback((fullContent: string, onDone?: () => void) => {
    const id = genId()
    setMessages(prev => [...prev, { id, type: 'ai', content: '' }])
    setStreamingId(id)

    const chars = Array.from(fullContent)
    let idx = 0

    streamRef.current = { timer: null, fullContent, id }
    streamRef.current.timer = setInterval(() => {
      idx += 2
      if (idx >= chars.length) {
        setMessages(prev =>
          prev.map(m => (m.id === id ? { ...m, content: fullContent } : m))
        )
        if (streamRef.current?.timer) clearInterval(streamRef.current.timer)
        streamRef.current = null
        setStreamingId(null)
        onDone?.()
        return
      }
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, content: chars.slice(0, idx).join('') } : m))
      )
    }, 25)
  }, [])

  /** 跳过流式，立即显示完整内容 */
  const skipStream = useCallback(() => {
    // 旧版流式（timer 模式）
    if (streamRef.current) {
      if (streamRef.current.timer) clearInterval(streamRef.current.timer)
      const { fullContent, id } = streamRef.current
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, content: fullContent } : m))
      )
      streamRef.current = null
      setStreamingId(null)
    }
    // Agent 流式模式
    agentSkipRef.current = true
    setAgentToolStatus(null)
  }, [])

  // 组件卸载时清理流式定时器
  useEffect(() => {
    return () => {
      if (streamRef.current?.timer) clearInterval(streamRef.current.timer)
    }
  }, [])

  /** 发送图片消息 */
  const addImageMsg = useCallback(
    (imageUrl: string, content?: string) => {
      addMessage({ type: 'user', content: content || '', imageUrl })
    },
    [addMessage]
  )

  /** 从相册/相机选择图片并发送 */
  const handleImageSend = useCallback(async () => {
    try {
      const res = await chooseImageWithPrivacy({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      if (!res.tempFilePaths.length) return

      const imageUrl = res.tempFilePaths[0]
      addImageMsg(imageUrl)

      const context: ChatContext = {
        petId: petInfo.activePet?.id,
        petName: petInfo.name,
        petBreed: petInfo.breed,
        petAge: petInfo.age,
      }

      setIsTyping(true)
      try {
        const result = await sendChatMessage(
          '我上传了一张宠物照片，请帮我看看并给出一些建议。',
          context,
          chatHistory
        )
        setIsTyping(false)

        if (result.blocked) {
          addAiMsg(result.reply)
        } else {
          streamAiReply(result.reply, () => {
            setChatHistory(prev => [
              ...prev.slice(-18),
              { role: 'user', content: '[图片]' },
              { role: 'assistant', content: result.reply },
            ])
          })
        }
      } catch (err) {
        setIsTyping(false)
        logger.error('index', 'AI image chat failed', err)
        addAiMsg('图片已收到！虽然我现在无法分析图片内容，但你可以描述一下想了解什么～')
      }
    } catch (err) {
      const errMsg = (err as { errMsg?: string }).errMsg || ''
      if (errMsg.includes('cancel')) {
        return
      }
      // chooseImageWithPrivacy 已处理了 errno 112 和 privacy 拒绝的情况
      // 此处处理其他未预期的错误
      if (errMsg) {
        Taro.showToast({ title: '图片选择失败，请重试', icon: 'none', duration: 2000 })
      }
      logger.error('index', 'chooseImage failed', err)
    }
  }, [petInfo, chatHistory, addImageMsg, addAiMsg, streamAiReply, setIsTyping, setChatHistory])

  /** Agent 模式的发送逻辑 */
  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    setPlusMenuOpen(false)
    setShowGreetingQuickActions(false)

    const handlers = flowHandlersRef.current
    if (handlers.foodActive) {
      handlers.selectFood(text)
      return
    }

    if (handlers.memoryActive) {
      handlers.handleMemoryRecord(text)
      return
    }

    if (handlers.namingTextActive) {
      handlers.handleNamingText(text)
      return
    }

    addUserMsg(text)

    // ========== Layer 1: 语义意图识别 - 正则模式匹配（零延迟） ==========
    // 使用归一化+正则匹配，覆盖更多自然语言表达
    // 例如："帮我想想豆豆叫啥" → 匹配取名意图；"豆豆今天有点蔫" → 匹配症状意图
    const normalized = normalizeText(text)
    const intentMatchers = buildIntentMatcher({
      startNaming: handlers.startNaming,
      startCheckin: handlers.startCheckin,
      startMemory: handlers.startMemory,
      startSymptom: handlers.startSymptom,
      startFoodQuery: handlers.startFoodQuery,
      navigateToBreed: handlers.navigateToBreed,
    })

    for (const matcher of intentMatchers) {
      if (matcher.patterns.some(p => p.test(normalized))) {
        matcher.action()
        return
      }
    }

    // 构建上下文（用于降级方案）
    const context: ChatContext = {
      petId: petInfo.activePet?.id,
      petName: petInfo.name,
      petBreed: petInfo.breed,
      petAge: petInfo.age,
    }

    setIsTyping(true)
    setAgentToolStatus(null)
    agentSkipRef.current = false

    // 创建占位 AI 消息用于流式输出
    const aiMsgId = genId()
    setMessages(prev => [...prev, { id: aiMsgId, type: 'ai', content: '' }])
    setStreamingId(aiMsgId)

    let fullContent = ''
    // Layer 2: Agent 工具调用触发的流程动作（如 start_checkin → checkin_flow）
    let pendingFlowAction: string | null = null

    try {
      for await (const event of agentChat({
        message: text,
        history: chatHistory,
        petId: context.petId,
      })) {
        // 如果用户点击了跳过，直接显示完整内容
        if (agentSkipRef.current) continue

        switch (event.type) {
          case 'thinking':
            setAgentToolStatus('🤔 正在思考...')
            break

          case 'tool_call':
            setAgentToolStatus(`🔍 ${getToolLabel(event.data.name)}...`)
            break

          case 'tool_result': {
            // ========== Layer 2: 检查工具结果是否包含流程触发动作 ==========
            const toolData = event.data.data as Record<string, unknown> | undefined
            if (toolData?.action && typeof toolData.action === 'string') {
              pendingFlowAction = toolData.action
              if (event.data.message) {
                fullContent = event.data.message
              }
              // 跳过后续事件，不再等待 Agent 的文字回复
              agentSkipRef.current = true
              continue
            }
            if (event.data.success) {
              setAgentToolStatus(`✅ ${getToolLabel(event.data.name)} 完成`)
            } else {
              setAgentToolStatus(null)
            }
            break
          }

          case 'token':
            fullContent += event.data.text
            setMessages(prev =>
              prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent } : m)
            )
            break

          case 'done':
            setIsTyping(false)
            setAgentToolStatus(null)
            setStreamingId(null)
            if (!fullContent && event.data.content) {
              fullContent = event.data.content as string
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent } : m)
              )
            }
            setChatHistory(prev => [
              ...prev.slice(-18),
              { role: 'user', content: text },
              { role: 'assistant', content: fullContent },
            ])
            return

          case 'error':
            setIsTyping(false)
            setAgentToolStatus(null)
            setStreamingId(null)
            // Agent 失败时降级到旧版 chatService
            logger.warn('index', 'Agent failed, falling back to legacy chat', event.data)
            try {
              const result = await sendChatMessage(text, context, chatHistory)
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId
                  ? { ...m, content: result.reply }
                  : m
                )
              )
              setChatHistory(prev => [
                ...prev.slice(-18),
                { role: 'user', content: text },
                { role: 'assistant', content: result.reply },
              ])
            } catch {
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId
                  ? { ...m, content: '抱歉，AI 服务暂时不可用，请稍后再试。' }
                  : m
                )
              )
            }
            return
        }
      }

      // ========== 循环结束后处理：Layer 2 流程触发 ==========
      if (pendingFlowAction) {
        // 更新 AI 消息为工具返回的提示语
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent || '好的' } : m)
        )
        setIsTyping(false)
        setAgentToolStatus(null)
        setStreamingId(null)
        setChatHistory(prev => [
          ...prev.slice(-18),
          { role: 'user', content: text },
          { role: 'assistant', content: fullContent },
        ])
        // 触发前端流程
        flowHandlersRef.current.onToolAction?.(pendingFlowAction)
        return
      }
    } catch (err) {
      setIsTyping(false)
      setAgentToolStatus(null)
      setStreamingId(null)
      logger.error('index', 'Agent chat failed', err)
      setMessages(prev =>
        prev.map(m => m.id === aiMsgId
          ? { ...m, content: '抱歉，我现在有点走神了…请稍后再试。' }
          : m
        )
      )
    }

    // 正常结束（无 done 事件的情况，兜底）
    setIsTyping(false)
    setAgentToolStatus(null)
    setStreamingId(null)
  }

  return {
    messages,
    isTyping,
    setIsTyping,
    chatHistory,
    setChatHistory,
    streamingId,
    scrollRef,
    addMessage,
    addAiMsg,
    addUserMsg,
    addImageMsg,
    streamAiReply,
    skipStream,
    scrollToBottom,
    handleSend,
    handleImageSend,
    setFlowHandlers,
    updateMessageCard,
    agentToolStatus,
  }
}

export type UseChatCoreReturn = ReturnType<typeof useChatCore>
