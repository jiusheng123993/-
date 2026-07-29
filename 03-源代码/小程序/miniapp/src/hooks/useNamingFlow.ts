import { useCallback, useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { recommendNames, uploadNamingPhoto, interpretName, analyzeNameDetail } from '../services/namingService'
import { usePetStore } from '../stores/petStore'
import { CONFIG } from '../config'
import type { CardData, NamingDetail, NamingResult, PetInfo } from '../types/chatTypes'

// ── 步骤类型 ──────────────────────────────────────────────

type StepType = 'options' | 'text' | 'photo'

interface NamingStepDef {
  key: string
  type: StepType
  question: string
  options?: string[]
  placeholder?: string
  skipLabel?: string
}

type NamingMode = 'recommend' | 'interpret'

// ── 推荐模式步骤 ──────────────────────────────────────────

const MODE_SELECT_STEP: NamingStepDef = {
  key: 'mode',
  type: 'options',
  question: '你好呀！取名有两种方式哦～你想用哪种？',
  options: ['帮我推荐名字 ✨', '帮我解读名字 🔍'],
}

const RECOMMEND_STEPS: NamingStepDef[] = [
  {
    key: 'gender',
    type: 'options',
    question: '宝贝是男生还是女生呀？',
    options: ['男生 ♂', '女生 ♀', '还不知道'],
  },
  {
    key: 'photo',
    type: 'photo',
    question: '有宝贝的照片吗？上传一张让我看看它的样子，名字会更贴切哦～',
    skipLabel: '跳过，不需要',
  },
  {
    key: 'description',
    type: 'text',
    question: '可以描述一下宝贝的特点吗？\n性格、外貌、习惯、小癖好…想到什么说什么～',
    placeholder: '输入描述...',
    skipLabel: '跳过，让AI自由发挥',
  },
  {
    key: 'style',
    type: 'options',
    question: '你喜欢什么风格的名字？',
    options: ['古风诗意', '可爱萌系', '食物系列', '自然元素', '不限风格'],
  },
]

const INTERPRET_STEPS: NamingStepDef[] = [
  {
    key: 'name',
    type: 'text',
    question: '你想解读哪个名字？发给我吧～',
    placeholder: '输入名字...',
  },
]

// ── 本地降级名字库 ────────────────────────────────────────

/** Fisher-Yates 洗牌，让每次降级结果都有变化 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function generateFallbackNames(style: string): NamingResult[] {
  const allNames: Record<string, NamingResult[]> = {
    '古风诗意': [
      { name: '墨韵', source: '《墨池记》"临池学书，池水尽墨"', wuxing: '水', starMansion: '壁水貐', meaning: '墨香氤氲，韵味悠长。适合气质优雅、安静从容的宝贝，寓意腹有诗书气自华。', score: 95 },
      { name: '云栖', source: '贾岛《寻隐者不遇》"只在此山中，云深不知处"', wuxing: '水', starMansion: '箕水豹', meaning: '云深不知处，栖居于心。安静温柔，与世无争，适合性格恬淡的小可爱。', score: 92 },
      { name: '霁月', source: '范仲淹《岳阳楼记》"而或长烟一空，皓月千里"', wuxing: '金', starMansion: '心月狐', meaning: '雨过天晴，月明如洗。寓意拨云见日、好运连连，适合经历坎坷后迎来幸福的宝贝。', score: 88 },
      { name: '青崖', source: '李白《梦游天姥吟留别》"且放白鹿青崖间"', wuxing: '木', starMansion: '角木蛟', meaning: '青崖白鹿，仙气飘飘。寓意自由洒脱、不受拘束，适合活泼好动的毛孩子。', score: 90 },
      { name: '鹿鸣', source: '《诗经·小雅》"呦呦鹿鸣，食野之苹"', wuxing: '木', starMansion: '亢金龙', meaning: '鹿鸣呦呦，嘉宾满堂。寓意宾主尽欢、生活美满，适合给家庭带来欢乐的宝贝。', score: 93 },
    ],
    '可爱萌系': [
      { name: '布丁', source: '源自法式甜点 Pudding，Q弹软糯', wuxing: '木', starMansion: '房日兔', meaning: '甜甜蜜蜜，软软糯糯。让人忍不住想rua，适合圆滚滚、性格软萌的小可爱。', score: 93 },
      { name: '泡芙', source: '源自法式甜点 Puff，外酥内软', wuxing: '水', starMansion: '虚日鼠', meaning: '外表酥脆内心柔软，可爱又有个性。适合外表高冷、内心温柔的反差萌宝贝。', score: 90 },
      { name: '奶糖', source: '源自大白兔奶糖，童年记忆', wuxing: '土', starMansion: '胃土雉', meaning: '奶香四溢，甜而不腻。治愈系首选，适合温柔粘人、给人带来快乐的小天使。', score: 87 },
      { name: '团子', source: '源自日式团子，圆润可爱', wuxing: '火', starMansion: '星日马', meaning: '圆圆滚滚，软糯可爱。适合体型圆润、性格憨厚的小家伙，让人忍不住想抱抱。', score: 89 },
      { name: '糯米', source: '源自传统食材，黏糯香甜', wuxing: '土', starMansion: '柳土獐', meaning: '黏黏糯糯，离不开你。适合特别粘人、走到哪跟到哪的跟屁虫小宝贝。', score: 91 },
    ],
    '食物系列': [
      { name: '年糕', source: '源自传统年节食品，寓意年年高升', wuxing: '土', starMansion: '女土蝠', meaning: '年年高升，黏人暖心。适合粘人的小可爱，也寓意主人的生活步步高升。', score: 94 },
      { name: '汤圆', source: '源自元宵节传统，团团圆圆', wuxing: '水', starMansion: '室火猪', meaning: '团团圆圆，白白胖胖。寓意家庭美满幸福，适合给家庭带来温暖的小宝贝。', score: 91 },
      { name: '麻薯', source: '源自日式点心，Q弹有嚼劲', wuxing: '土', starMansion: '昴日鸡', meaning: 'Q弹软糯，外表朴素内有惊喜。独一无二的小特别，适合低调但有个性的宝贝。', score: 85 },
      { name: '豆沙', source: '源自传统馅料，甜而不腻', wuxing: '火', starMansion: '尾火虎', meaning: '细腻绵密，甜在心头。适合温柔细腻、让人感到温暖治愈的小可爱。', score: 88 },
      { name: '芝麻', source: '《本草纲目》"芝麻，八谷之中，惟此为良"', wuxing: '木', starMansion: '氐土貉', meaning: '小小一粒，能量满满。适合体型小巧但活力十足的小家伙，寓意芝麻开花节节高。', score: 86 },
    ],
    '自然元素': [
      { name: '星河', source: '曹操《观沧海》"星汉灿烂，若出其里"', wuxing: '水', starMansion: '斗木獬', meaning: '璀璨星河，独一无二。愿它成为你生命中最亮的光，适合眼睛特别亮、特别有灵气的宝贝。', score: 96 },
      { name: '山月', source: '王维《山居秋暝》"明月松间照，清泉石上流"', wuxing: '土', starMansion: '牛金牛', meaning: '山间明月，清辉婉转。安静而坚定的陪伴，适合性格沉稳、默默守护主人的宝贝。', score: 90 },
      { name: '朝露', source: '曹操《短歌行》"譬如朝露，去日苦多"', wuxing: '水', starMansion: '参水猿', meaning: '清晨的露珠，纯净珍贵。每一天都是新的开始，适合活泼开朗、给人带来新鲜感的小精灵。', score: 87 },
      { name: '霜华', source: '张继《枫桥夜泊》"月落乌啼霜满天"', wuxing: '金', starMansion: '奎木狼', meaning: '霜华满地，银装素裹。清冷雅致，适合白色或浅色毛发的宝贝，自带仙气。', score: 89 },
      { name: '烟雨', source: '杜牧《江南春》"南朝四百八十寺，多少楼台烟雨中"', wuxing: '水', starMansion: '毕月乌', meaning: '烟雨朦胧，诗意盎然。适合毛色斑驳、花纹特别的小可爱，有一种朦胧美。', score: 92 },
    ],
  }

  const matched = Object.entries(allNames).find(([key]) => style.includes(key))
  if (matched) return shuffle(matched[1]).slice(0, 5)

  // 不限风格 → 混合精选（每次随机顺序）
  return shuffle([
    { name: '星河', source: '曹操《观沧海》"星汉灿烂，若出其里"', wuxing: '水', starMansion: '斗木獬', meaning: '璀璨星河，独一无二。愿它成为你生命中最亮的光。', score: 96 },
    { name: '布丁', source: '源自法式甜点 Pudding', wuxing: '木', starMansion: '房日兔', meaning: '甜甜蜜蜜，软软糯糯。让人忍不住想rua。', score: 93 },
    { name: '墨韵', source: '《墨池记》"临池学书，池水尽墨"', wuxing: '水', starMansion: '壁水貐', meaning: '墨香氤氲，韵味悠长。腹有诗书气自华。', score: 95 },
    { name: '年糕', source: '源自传统年节食品', wuxing: '土', starMansion: '女土蝠', meaning: '年年高升，黏人暖心。', score: 94 },
    { name: '烟雨', source: '杜牧《江南春》"多少楼台烟雨中"', wuxing: '水', starMansion: '毕月乌', meaning: '烟雨朦胧，诗意盎然。适合毛色特别的小可爱。', score: 92 },
  ])
}

// ── 解析 AI 返回的 JSON ───────────────────────────────────

function parseRecommendResult(text: string): NamingResult[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as NamingResult[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5)
      }
    }
  } catch {
    // JSON 解析失败，尝试文本解析
  }

  const results: NamingResult[] = []
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    const nameMatch = line.match(/[「【《]?\s*(.{1,8})\s*[」】》]?[:：\s]+(.+)/)
    if (nameMatch) {
      results.push({
        name: nameMatch[1].replace(/[「」【】《》]/g, '').trim(),
        source: '',
        wuxing: '',
        starMansion: '',
        meaning: nameMatch[2].trim(),
        score: 85,
      })
    }
  }

  if (results.length === 0) {
    const numRegex = /(\d+)[.、]\s*[「【《]?\s*(.{1,8})\s*[」】》]?\s*[:：\s-]+(.+)/g
    let match: RegExpExecArray | null
    while ((match = numRegex.exec(text)) !== null) {
      results.push({
        name: match[2].replace(/[「」【】《》]/g, '').trim(),
        source: '',
        wuxing: '',
        starMansion: '',
        meaning: match[3].trim(),
        score: parseInt(match[1]) * 10,
      })
    }
  }

  return results.slice(0, 5)
}

// ── Hook 接口 ──────────────────────────────────────────────

export interface UseNamingFlowParams {
  addAiMsg: (content: string, options?: string[]) => void
  addUserMsg: (content: string) => void
  addMessage: (msg: { type: 'ai' | 'user'; content: string; card?: CardData; options?: string[] }) => string
  /** 流式输出 AI 回复（打字机效果） */
  streamAiReply: (fullContent: string, onDone?: () => void) => void
  /** 设置打字状态指示器 */
  setIsTyping: (typing: boolean) => void
  /** 更新消息的 card 数据（用于换一批） */
  updateMessageCard: (msgId: string, card: CardData) => void
  petInfo: PetInfo
}

/**
 * AI 取名流程 Hook
 *
 * 支持两种模式：
 * - 推荐模式：性别 → 照片 → 描述 → 风格 → AI 推荐 5 个名字
 * - 解读模式：用户输入名字 → AI 流式深度解读
 *
 * 命理详情通过悬浮弹窗展示，而非内联消息。
 */
export function useNamingFlow(params: UseNamingFlowParams) {
  const { addAiMsg, addUserMsg, addMessage, streamAiReply, setIsTyping, updateMessageCard, petInfo } = params

  const [namingMode, setNamingMode] = useState<NamingMode | null>(null)
  const [namingStep, setNamingStep] = useState(-1)
  const [namingData, setNamingData] = useState<Record<string, string>>({})
  /** 用 ref 避免 setTimeout 闭包陷阱，确保 finishRecommend 读取到最新 namingData */
  const namingDataRef = useRef(namingData)
  useEffect(() => {
    namingDataRef.current = namingData
  }, [namingData])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isAnalyzingDetail, setIsAnalyzingDetail] = useState(false)
  /** 命理详情弹窗数据 */
  const [namingDetailPopup, setNamingDetailPopup] = useState<NamingDetail | null>(null)
  /** 命理详情弹窗是否正在加载 */
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  /** 当前取名卡片的消息 ID（用于换一批时更新卡片） */
  const namingCardMsgIdRef = useRef<string | null>(null)
  /** 是否正在换一批 */
  const [isRefreshing, setIsRefreshing] = useState(false)

  /** 当前步骤是否处于文本输入模式（需要路由聊天输入到取名流程） */
  const isTextInputActive = namingStep >= 0
    && namingMode !== null
    && getCurrentStepDef()?.type === 'text'

  /** 获取当前步骤定义 */
  function getCurrentStepDef(): NamingStepDef | null {
    if (namingStep < 0) return null
    if (namingMode === null) return MODE_SELECT_STEP

    const steps = namingMode === 'recommend' ? RECOMMEND_STEPS : INTERPRET_STEPS
    return steps[namingStep] || null
  }

  /** 获取当前步骤（供 UI 渲染判断） */
  const currentStep = getCurrentStepDef()

  // ── 调用 AI 获取名字推荐（可复用于换一批） ─────────────

  /** 调用 AI 服务获取名字推荐，失败时返回 null */
  const fetchAiNames = useCallback(async (): Promise<NamingResult[] | null> => {
    if (CONFIG.USE_MOCK) {
      console.log('[NamingFlow] USE_MOCK=true，跳过 AI 调用')
      return null
    }

    const currentData = namingDataRef.current
    const style = currentData.style || ''
    const genderText = currentData.gender || ''
    const description = currentData.description || ''

    console.log('[NamingFlow] 开始调用 AI，参数:', { style, genderText, hasDescription: !!description, hasPhoto: !!photoUrl })

    try {
      const pet = usePetStore.getState().currentPet
      const breed = pet?.breed || '未知品种'
      const birthDate = pet?.birthDate || ''
      const gender = genderText.includes('男') ? 'male' : genderText.includes('女') ? 'female' : 'unknown'

      setIsTyping(true)
      console.log('[NamingFlow] 调用 recommendNames...')
      const result = await recommendNames({
        breed,
        birthDate,
        gender,
        style,
        photoUrl: photoUrl || undefined,
        description: description || undefined,
      })
      setIsTyping(false)

      console.log('[NamingFlow] AI 返回结果长度:', result.length, '前200字符:', result.substring(0, 200))

      const parsed = parseRecommendResult(result)
      console.log('[NamingFlow] 解析结果数量:', parsed.length)
      if (parsed.length > 0) {
        return parsed
      }
      console.warn('[NamingFlow] AI 返回了结果但解析失败，原始内容:', result.substring(0, 200))
    } catch (err) {
      setIsTyping(false)
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[NamingFlow] AI 推荐调用失败:', errMsg)
      Taro.showToast({ title: 'AI 服务异常，使用本地推荐', icon: 'none', duration: 2000 })
    }
    return null
  }, [photoUrl, setIsTyping])

  // ── 完成推荐流程 ──────────────────────────────────────

  const finishRecommend = useCallback(async () => {
    setNamingStep(-1)
    // 从 ref 读取最新值，避免 setTimeout 闭包陷阱
    const currentData = namingDataRef.current
    const style = currentData.style || ''

    let names: NamingResult[] = []

    const aiNames = await fetchAiNames()
    if (aiNames && aiNames.length > 0) {
      names = aiNames
    }

    if (names.length === 0) {
      names = generateFallbackNames(style || '不限风格')
    }

    const card: CardData = {
      type: 'naming_cards',
      data: {},
      names,
    }

    // 构建个性化引导语
    const parts: string[] = []
    if (photoUrl) parts.push('照片特征')
    if (currentData.description) parts.push('你的描述')
    parts.push(`「${style || '不限风格'}」风格偏好`)
    const aiLabel = aiNames && aiNames.length > 0 ? '' : '（本地精选）'
    const introText = `综合${parts.join('、')}，为你精心推荐以下 ${names.length} 个名字 ✦${aiLabel}\n\n每个名字都蕴含独特的文化寓意，点击名字卡片可以查看详细的命理解析哦～`

    // 流式输出引导语，完成后展示卡片
    streamAiReply(introText, () => {
      const msgId = addMessage({ type: 'ai', content: '', card })
      namingCardMsgIdRef.current = msgId
    })
  }, [addMessage, photoUrl, setIsTyping, streamAiReply, fetchAiNames])

  // ── 换一批 ──────────────────────────────────────────

  const refreshNaming = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)

    const msgId = namingCardMsgIdRef.current
    if (!msgId) {
      setIsRefreshing(false)
      return
    }

    // 先显示加载态
    updateMessageCard(msgId, {
      type: 'naming_cards',
      data: { refreshing: true },
      names: [],
    })

    let names: NamingResult[] = []
    const aiNames = await fetchAiNames()
    if (aiNames && aiNames.length > 0) {
      names = aiNames
    }

    if (names.length === 0) {
      const currentData = namingDataRef.current
      const style = currentData.style || '不限风格'
      names = generateFallbackNames(style)
    }

    updateMessageCard(msgId, {
      type: 'naming_cards',
      data: {},
      names,
    })
    setIsRefreshing(false)
  }, [isRefreshing, fetchAiNames, updateMessageCard])

  /** 解析 AI 返回的命理详情 JSON */
function parseDetailResult(text: string): NamingDetail | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as NamingDetail
    }
  } catch {
    // fall through
  }
  return null
}

/** 生成命理分析降级数据 */
function generateFallbackDetail(name: string, wuxing: string, starMansion: string): NamingDetail {
  return {
    name,
    bazi: `「${name}」二字与出生时令相应，八字中${wuxing}气充盈，天地人三才和谐。此名暗合五行生克之道，${wuxing}主运，得${starMansion}守护，命格中正平和。`,
    fortune: `从整体运势来看，「${name}」这个名字自带祥瑞之气。${wuxing}行当令，${starMansion}护佑，运势如春日之苗，虽不见其增，日有所长。一生平安顺遂，福泽绵长。`,
    careerFortune: `得${starMansion}星辉照耀，在生活与玩乐中表现出色。${wuxing}行旺盛，精力充沛，活力四射。日常中总能成为焦点，带给家人无限欢乐。`,
    loveFortune: `${starMansion}主掌情缘，与主人缘分深厚。${wuxing}行相生，彼此之间气场相合，相处融洽。此名有助于增进与家人、其他宠物之间的感情纽带。`,
    healthFortune: `五行${wuxing}平衡，${starMansion}守护，身体根基稳固。注意根据季节变化适当调理，${wuxing}旺之时注意互补，整体健康运势良好。`,
    personality: `「${name}」这个名字赋予的气质是温润中带着灵动。${wuxing}行特质明显，${starMansion}加持，性格中既有沉稳的一面，又有活泼的天性，内外兼修。`,
    strokes: `经传统姓名学笔画推算，「${name}」二字笔画数合于吉数，数理通达。笔画结构匀称，书写流畅，寓意吉祥如意，福寿安康。`,
    luckyDirection: wuxing === '木' ? '东方' : wuxing === '火' ? '南方' : wuxing === '金' ? '西方' : wuxing === '水' ? '北方' : '中央',
    luckyColor: wuxing === '木' ? '青色、绿色' : wuxing === '火' ? '红色、紫色' : wuxing === '金' ? '白色、金色' : wuxing === '水' ? '黑色、蓝色' : '黄色、棕色',
    luckyNumber: wuxing === '木' ? '3、8' : wuxing === '火' ? '2、7' : wuxing === '金' ? '4、9' : wuxing === '水' ? '1、6' : '5、0',
    karmaWithOwner: `「${name}」这个名字与主人的气场天然契合。${starMansion}星辉与主人命格相呼应，彼此的缘分如同${wuxing}行相生，绵延不绝。此名将成为连接主人与宠物之间的情感纽带。`,
    summary: `「${name}」是一个充满文化底蕴和吉祥寓意的名字。${starMansion}守护，${wuxing}行调和，运势亨通。愿这个名字陪伴宝贝度过平安喜乐的每一天，也愿主人与宝贝之间的缘分如同星河流转，生生不息。`,
  }
}

// ── 完成解读流程 ──────────────────────────────────────

  const finishInterpret = useCallback(async (name: string) => {
    setNamingStep(-1)

    if (!CONFIG.USE_MOCK) {
      try {
        const pet = usePetStore.getState().currentPet
        const breed = pet?.breed || '未知品种'
        const birthDate = pet?.birthDate || ''

        setIsTyping(true)
        const result = await interpretName(name, breed, birthDate)
        setIsTyping(false)

        if (result && !result.startsWith('AI服务暂不可用') && !result.startsWith('网络异常')) {
          streamAiReply(result)
          return
        }
      } catch (err) {
        setIsTyping(false)
        console.error('[NamingFlow] AI 解读调用失败:', err)
      }
    }

    // 本地降级解读
    const fallbackText =
      `「${name}」这个名字很有韵味呢！\n\n` +
      `寓意：名字寓意美好，寄托了主人对宝贝的深厚感情。\n` +
      `建议：名字朗朗上口，适合日常呼唤，是一个不错的选择～`
    streamAiReply(fallbackText)
  }, [setIsTyping, streamAiReply])

  // ── 点击名字卡片查看命理详情（弹出悬浮卡片）──────────

  const handleNamingDetail = useCallback(
    async (nameResult: NamingResult) => {
      if (isAnalyzingDetail) return
      setIsAnalyzingDetail(true)

      // 从 ref 读取最新数据
      const currentData = namingDataRef.current

      // 立即弹出悬浮卡片，显示加载态
      const loadingDetail: NamingDetail = {
        name: nameResult.name,
        bazi: '',
        fortune: '',
        careerFortune: '',
        loveFortune: '',
        healthFortune: '',
        personality: '',
        strokes: '',
        luckyDirection: '',
        luckyColor: '',
        luckyNumber: '',
        karmaWithOwner: '',
        summary: '',
      }
      setNamingDetailPopup(loadingDetail)
      setIsDetailLoading(true)

      let detail: NamingDetail | null = null

      if (!CONFIG.USE_MOCK) {
        try {
          const pet = usePetStore.getState().currentPet
          const breed = pet?.breed || '未知品种'
          const birthDate = pet?.birthDate || ''
          const gender = currentData.gender?.includes('男') ? 'male'
            : currentData.gender?.includes('女') ? 'female' : 'unknown'

          const result = await analyzeNameDetail({
            name: nameResult.name,
            breed,
            birthDate,
            gender,
            wuxing: nameResult.wuxing,
            starMansion: nameResult.starMansion,
            description: currentData.description,
          })

          if (result) {
            detail = parseDetailResult(result)
          }
        } catch {
          // AI 不可用时降级
        }
      }

      if (!detail) {
        detail = generateFallbackDetail(nameResult.name, nameResult.wuxing, nameResult.starMansion)
      }

      detail.name = nameResult.name

      // 更新弹窗数据，结束加载
      setNamingDetailPopup(detail)
      setIsDetailLoading(false)
      setIsAnalyzingDetail(false)
    },
    [isAnalyzingDetail]
  )

  /** 关闭命理详情弹窗 */
  const closeNamingDetail = useCallback(() => {
    setNamingDetailPopup(null)
  }, [])

  // ── 步骤推进 ──────────────────────────────────────────

  const askNextStep = useCallback(
    (step: number) => {
      setNamingStep(step)

      if (namingMode === 'recommend' && step >= RECOMMEND_STEPS.length) {
        finishRecommend()
        return
      }
      if (namingMode === 'interpret' && step >= INTERPRET_STEPS.length) {
        return
      }

      const steps = namingMode === 'recommend' ? RECOMMEND_STEPS : INTERPRET_STEPS
      const s = steps[step]
      if (!s) return

      if (s.type === 'options') {
        addAiMsg(s.question, s.options)
      } else if (s.type === 'text') {
        addAiMsg(s.question)
      } else if (s.type === 'photo') {
        addAiMsg(s.question)
      }
    },
    [addAiMsg, finishRecommend, namingMode]
  )

  // ── 公开方法 ──────────────────────────────────────────

  /** 开始取名流程（显示模式选择） */
  const startNaming = useCallback(() => {
    setNamingData({})
    setNamingMode(null)
    setNamingStep(0)
    setPhotoUrl(null)
    setNamingDetailPopup(null)
    addAiMsg('要给宝贝取名字吗？太开心了！让我来帮你 ✦\n\n你想怎么用呢？', MODE_SELECT_STEP.options)
  }, [addAiMsg])

  /** 处理用户选项点击 */
  const handleNamingAnswer = useCallback(
    (text: string) => {
      addUserMsg(text)

      // 模式选择
      if (namingMode === null && namingStep === 0) {
        if (text.includes('推荐')) {
          setNamingMode('recommend')
          setNamingData({})
          setNamingStep(0)
          setTimeout(() => {
            const s = RECOMMEND_STEPS[0]
            addAiMsg(s.question, s.options)
          }, 400)
        } else if (text.includes('解读')) {
          setNamingMode('interpret')
          setNamingData({})
          setNamingStep(0)
          setTimeout(() => {
            const s = INTERPRET_STEPS[0]
            addAiMsg(s.question)
          }, 400)
        }
        return
      }

      // 推荐/解读模式的选项步骤
      const steps = namingMode === 'recommend' ? RECOMMEND_STEPS : INTERPRET_STEPS
      const s = steps[namingStep]
      if (!s || s.type !== 'options') return

      setNamingData(prev => ({ ...prev, [s.key]: text }))
      const next = namingStep + 1
      setTimeout(() => askNextStep(next), 400)
    },
    [addUserMsg, askNextStep, namingMode, namingStep, addAiMsg]
  )

  /** 处理文本输入（text 步骤） */
  const handleNamingText = useCallback(
    (text: string) => {
      addUserMsg(text)

      if (namingMode === 'interpret') {
        // 解读模式：用户输入名字 → 直接解读
        finishInterpret(text)
        return
      }

      // 推荐模式：description 步骤
      const steps = RECOMMEND_STEPS
      const s = steps[namingStep]
      if (!s || s.type !== 'text') return

      setNamingData(prev => ({ ...prev, [s.key]: text }))
      const next = namingStep + 1
      setTimeout(() => askNextStep(next), 400)
    },
    [addUserMsg, askNextStep, finishInterpret, namingMode, namingStep]
  )

  /** 跳过描述步骤 */
  const skipNamingDesc = useCallback(() => {
    const steps = RECOMMEND_STEPS
    const s = steps[namingStep]
    if (!s || s.key !== 'description') return

    addUserMsg('跳过')
    const next = namingStep + 1
    setTimeout(() => askNextStep(next), 400)
  }, [addUserMsg, askNextStep, namingStep])

  /** 上传照片 */
  const handleNamingPhoto = useCallback(async (tempFilePath: string): Promise<boolean> => {
    setIsUploadingPhoto(true)
    try {
      const url = await uploadNamingPhoto(tempFilePath)
      if (url) {
        setPhotoUrl(url)
        setNamingData(prev => ({ ...prev, photo: url }))
        addUserMsg('[上传了照片]')
        const next = namingStep + 1
        setTimeout(() => askNextStep(next), 400)
        return true
      }
      addAiMsg('照片上传失败，我们跳过这一步继续吧～')
      const next = namingStep + 1
      setTimeout(() => askNextStep(next), 400)
      return false
    } catch {
      addAiMsg('照片上传失败，我们跳过这一步继续吧～')
      const next = namingStep + 1
      setTimeout(() => askNextStep(next), 400)
      return false
    } finally {
      setIsUploadingPhoto(false)
    }
  }, [addUserMsg, addAiMsg, askNextStep, namingStep])

  /** 跳过照片步骤 */
  const skipNamingPhoto = useCallback(() => {
    const steps = RECOMMEND_STEPS
    const s = steps[namingStep]
    if (!s || s.key !== 'photo') return

    addUserMsg('跳过')
    const next = namingStep + 1
    setTimeout(() => askNextStep(next), 400)
  }, [addUserMsg, askNextStep, namingStep])

  return {
    namingMode,
    namingStep,
    namingData,
    currentStep,
    photoUrl,
    isUploadingPhoto,
    isAnalyzingDetail,
    isTextInputActive,
    namingDetailPopup,
    isDetailLoading,
    isRefreshing,
    startNaming,
    handleNamingAnswer,
    handleNamingText,
    handleNamingPhoto,
    skipNamingPhoto,
    skipNamingDesc,
    handleNamingDetail,
    closeNamingDetail,
    refreshNaming,
  }
}

export type UseNamingFlowReturn = ReturnType<typeof useNamingFlow>