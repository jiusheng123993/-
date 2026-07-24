import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePetStore } from '../../stores/petStore'
import { useAuthStore } from '../../stores/authStore'
import { recommendNames } from '../../services/namingService'
import { CONFIG } from '../../config'
import './index.scss'

interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
  options?: string[]
  card?: CardData
}

interface CardData {
  type: 'checkin_result' | 'food_result' | 'symptom_result' | 'naming_result' | 'naming_cards'
  data: Record<string, unknown>
  // 结构化卡片数据
  title?: string
  score?: number
  maxScore?: number
  stats?: { label: string; value: string; emoji?: string }[]
  safe?: boolean
  risk?: string
  icon?: string
  foodName?: string
  desc?: string
  advice?: string
  names?: NamingResult[]
  riskLevel?: string
  symptomInfo?: { label: string; value: string }[]
  hospitalList?: string[]
}

interface FoodData {
  safe: boolean
  risk: string
  icon: string
  desc: string
  advice: string
}

interface CheckinItem {
  key: string
  emoji: string
  label: string
  question: string
  options: { label: string; score: number }[]
}

interface NamingResult {
  name: string
  meaning: string
  score: number
}

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
function usePetInfo() {
  const pet = usePetStore(s => s.currentPet)
  const pets = usePetStore(s => s.pets)
  const activePet = pet ?? pets[0] ?? null
  return {
    name: activePet?.name || '',
    emoji: activePet?.species === 'cat' ? '🐱' : activePet?.species === 'dog' ? '🐕' : '🐾',
    breed: activePet?.breed || '',
    age: activePet?.birthDate ? calcAge(activePet.birthDate) : '',
    hasPet: pets.length > 0,
    activePet,
  }
}

const CHECKIN_ITEMS: CheckinItem[] = [
  {
    key: 'stool', emoji: '💩', label: '大便情况', question: '{name}今天的大便怎么样？',
    options: [
      { label: '成型正常', score: 5 },
      { label: '偏软但不稀', score: 3 },
      { label: '拉稀/软便', score: 1 },
      { label: '没拉 / 未观察', score: 0 },
    ],
  },
  {
    key: 'pee', emoji: '💧', label: '小便情况', question: '小便颜色和频率正常吗？',
    options: [
      { label: '清亮，次数正常', score: 5 },
      { label: '颜色偏黄', score: 3 },
      { label: '频次异常', score: 1 },
      { label: '没注意', score: 0 },
    ],
  },
  {
    key: 'appetite', emoji: '🍖', label: '食欲状况', question: '{name}今天吃饭怎么样？',
    options: [
      { label: '胃口很好，光盘', score: 5 },
      { label: '正常吃完', score: 4 },
      { label: '吃得比较少', score: 2 },
      { label: '完全不吃', score: 1 },
    ],
  },
  {
    key: 'energy', emoji: '⚡', label: '精神活力', question: '{name}今天精神头怎么样？',
    options: [
      { label: '活力满满，拆家选手', score: 5 },
      { label: '正常活动', score: 4 },
      { label: '有点蔫，不太想动', score: 2 },
      { label: '趴着不动，精神差', score: 1 },
    ],
  },
  {
    key: 'weight', emoji: '⚖', label: '体重确认', question: '体重今天称了吗？（参考：上周28.0kg）',
    options: [
      { label: '28.0kg 左右，稳定', score: 5 },
      { label: '27.5-27.9kg，小幅下降', score: 3 },
      { label: '28.5kg 以上，小幅上升', score: 3 },
      { label: '今天没称', score: 0 },
    ],
  },
]

const FOOD_DATA: Record<string, FoodData> = {
  '巧克力': { safe: false, risk: 'P0', icon: '🍫', desc: '巧克力含有可可碱，对狗有剧毒。即使少量也可能导致呕吐、腹泻、心率异常，严重可致死。', advice: '绝对禁止！如果误食请立即联系兽医。' },
  '葡萄': { safe: false, risk: 'P0', icon: '🍇', desc: '葡萄和葡萄干对犬类有肾毒性，少量即可导致急性肾衰竭。', advice: '绝对禁止！即使是1-2颗也可能造成伤害。' },
  '苹果': { safe: true, risk: 'P4', icon: '🍎', desc: '苹果果肉富含维生素，但要去核去籽（含氰化物），切成小块每次不超过1/4个。', advice: '安全适量，去核切小块作为零食。' },
  '鸡胸肉': { safe: true, risk: 'P4', icon: '🍗', desc: '煮熟的鸡胸肉是优质蛋白质来源，低脂肪，白水煮熟即可。', advice: '安全推荐！煮熟无调味，适量喂食。' },
  '胡萝卜': { safe: true, risk: 'P4', icon: '🥕', desc: '低热量健康零食，富含β-胡萝卜素和纤维，可生吃磨牙或煮熟。', advice: '安全推荐！洗净切小块。' },
  '洋葱': { safe: false, risk: 'P0', icon: '🧅', desc: '洋葱含硫代硫酸盐，破坏红细胞导致溶血性贫血，生熟都有毒。', advice: '绝对禁止！任何形式的洋葱都不能吃。' },
  '西瓜': { safe: true, risk: 'P4', icon: '🍉', desc: '西瓜果肉是安全的水分补充零食（去籽去皮），夏天适量喂食可补水。', advice: '安全适量，去籽去皮。' },
  '牛油果': { safe: false, risk: 'P1', icon: '🥑', desc: '含有persin对狗可能引起呕吐腹泻，果核有窒息风险。', advice: '不推荐！安全起见不要喂。' },
}

const SYMPTOM_STEPS = [
  {
    key: 'symptom', title: '第1步：主要症状', question: '出现了什么症状？',
    options: ['呕吐 / 反胃', '腹泻 / 软便', '食欲不振', '精神萎靡 / 嗜睡', '皮肤瘙痒 / 掉毛', '咳嗽 / 打喷嚏'],
  },
  {
    key: 'duration', title: '第2步：持续时间', question: '这个症状持续多久了？',
    options: ['刚开始，不到半天', '今天一整天了', '2-3天了', '超过3天了'],
  },
  {
    key: 'severity', title: '第3步：严重程度', question: '症状的严重程度如何？',
    options: ['轻微的，不太影响日常', '中等，能看出不舒服', '比较严重，明显异常', '非常严重，需要急救'],
  },
  {
    key: 'other', title: '第4步：其他信息', question: '还有没有其他异常？',
    options: ['没有其他异常', '体温偏高 / 发烧', '有外伤或肿块', '眼睛/鼻子有分泌物'],
  },
]

const NAMING_STEPS = [
  {
    key: 'gender', question: '新宝贝是男生还是女生呀？',
    options: ['男生 ♂', '女生 ♀', '还不知道 / 无所谓'],
  },
  {
    key: 'style', question: '你喜欢什么风格的名字？',
    options: ['古风诗意（如：墨韵、云栖）', '可爱萌系（如：团团、布丁）', '食物系列（如：年糕、汤圆）', '自然元素（如：星河、山月）'],
  },
]

const PLUS_MENU_ITEMS = [
  { icon: '📋', label: '健康打卡', sub: '5项日常检查，1分钟完成', bg: 'rgba(232,168,56,0.12)' },
  { icon: '✨', label: 'AI 取名', sub: '智能推荐 + 寓意解读', bg: 'rgba(91,154,155,0.12)' },
  { icon: '📸', label: '记录回忆', sub: '上传照片 + 写一段话', bg: 'rgba(140,173,126,0.12)' },
  { icon: '🐱', label: '品种百科', sub: '40+品种特征和护理要点', bg: 'rgba(166,143,120,0.12)' },
  { icon: '🏠', label: '看家庭', sub: '家人动态 + 家庭周报', bg: 'rgba(224,133,107,0.12)' },
]

let messageIdCounter = 0
function genId(): string {
  return `msg_${++messageIdCounter}_${Date.now()}`
}

function generateNames(style: string): NamingResult[] {
  if (style.includes('古风')) return [
    { name: '墨韵', meaning: '墨香氤氲，韵味悠长。适合气质优雅的宝贝', score: 95 },
    { name: '云栖', meaning: '云深不知处，栖居于心。安静温柔的好名字', score: 92 },
    { name: '霁月', meaning: '雨过天晴，月明如洗。寓意拨云见日，好运连连', score: 88 },
  ]
  if (style.includes('可爱')) return [
    { name: '布丁', meaning: '甜甜蜜蜜，软软糯糯。让人忍不住想rua', score: 93 },
    { name: '泡芙', meaning: '外表酥脆内心柔软，可爱又有个性', score: 90 },
    { name: '奶糖', meaning: '奶香四溢，甜而不腻。治愈系首选', score: 87 },
  ]
  if (style.includes('食物')) return [
    { name: '年糕', meaning: '年年高升，黏人暖心。适合粘人的小可爱', score: 94 },
    { name: '汤圆', meaning: '团团圆圆，白白胖胖。寓意家庭美满幸福', score: 91 },
    { name: '麻薯', meaning: 'Q弹软糯，外表朴素内有惊喜。独一无二的小特别', score: 85 },
  ]
  return [
    { name: '星河', meaning: '璀璨星河，独一无二。愿它成为你生命中最亮的光', score: 96 },
    { name: '山月', meaning: '山间明月，清辉婉转。安静而坚定的陪伴', score: 90 },
    { name: '朝露', meaning: '清晨的露珠，纯净珍贵。每一天都是新的开始', score: 87 },
  ]
}

function parseRecommendResult(text: string): NamingResult[] {
  const results: NamingResult[] = []
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    const scoreMatch = line.match(/(\d{1,3})\s*分/)
    const nameMatch = line.match(/[「【《]?\s*(.{1,8})\s*[」】》]?[:：\s]+(.+)/)
    if (nameMatch) {
      results.push({
        name: nameMatch[1].replace(/[「」【】《》]/g, '').trim(),
        meaning: nameMatch[2].trim(),
        score: scoreMatch ? parseInt(scoreMatch[1]) : 85,
      })
    }
  }
  if (results.length === 0) {
    const nameRegex = /(\d+)[.、]\s*[「【《]?\s*(.{1,8})\s*[」】》]?\s*[:：\s-]+(.+)/g
    let match: RegExpExecArray | null
    while ((match = nameRegex.exec(text)) !== null) {
      results.push({
        name: match[2].replace(/[「」【】《》]/g, '').trim(),
        meaning: match[3].trim(),
        score: parseInt(match[1]) * 10,
      })
    }
  }
  return results.slice(0, 5)
}

export default function Index() {
  const themeClass = useThemeClass()
  const petInfo = usePetInfo()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [checkinStep, setCheckinStep] = useState(-1)
  const [checkinData, setCheckinData] = useState<Record<string, { label: string; score: number }>>({})
  const [symptomStep, setSymptomStep] = useState(-1)
  const [symptomData, setSymptomData] = useState<Record<string, string>>({})
  const [namingStep, setNamingStep] = useState(-1)
  const [namingData, setNamingData] = useState<Record<string, string>>({})
  const [foodActive, setFoodActive] = useState(false)
  const [showGreetingQuickActions, setShowGreetingQuickActions] = useState(true)

  const scrollRef = useRef<any>(null)

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

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    const newMsg: Message = { ...msg, id: genId() }
    setMessages(prev => [...prev, newMsg])
  }, [])

  const addAiMsg = useCallback((content: string, options?: string[]) => {
    addMessage({ type: 'ai', content, options })
  }, [addMessage])

  const addUserMsg = useCallback((content: string) => {
    addMessage({ type: 'user', content })
  }, [addMessage])

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    setPlusMenuOpen(false)
    setShowGreetingQuickActions(false)
    addUserMsg(text)

    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)

      if (text.includes('打卡') || text.includes('健康')) {
        startCheckin()
      } else if (text.includes('食物') || text.includes('能不能吃') || text.includes('可以吃')) {
        startFoodCheck()
      } else if (text.includes('症状') || text.includes('不舒服') || text.includes('生病')) {
        startSymptomCheck()
      } else if (text.includes('取名') || text.includes('名字')) {
        startNaming()
      } else if (text.includes('趋势') || text.includes('报告')) {
        addAiMsg('想要查看健康趋势吗？\n\n可以跳转到健康趋势页面查看完整的健康数据图表和历史记录～')
      } else {
        addAiMsg('收到啦！我记下了 ✦\n\n你还可以试试：\n· 💩 打卡记录今天的健康状况\n· 🔍 查询某种食物能不能吃\n· 💊 做一次症状初筛评估\n· ✨ 让我帮新宠物取个好名字')
      }
    }, 800)
  }

  const handleQuickAction = (action: string) => {
    setShowGreetingQuickActions(false)
    if (action === 'checkin') startCheckin()
    else if (action === 'food') startFoodCheck()
    else if (action === 'symptom') startSymptomCheck()
  }

  const handlePlusMenuItem = (index: number) => {
    setPlusMenuOpen(false)
    switch (index) {
      case 0: startCheckin(); break
      case 1: startNaming(); break
      case 2: addAiMsg('要记录一段回忆吗？在输入框写下这个值得记住的瞬间～'); break
      case 3: Taro.navigateTo({ url: '/pagesPet/breed/index' }); break
      case 4: Taro.switchTab({ url: '/pages/family/index' }); break
    }
  }

  const startCheckin = () => {
    setCheckinData({})
    setCheckinStep(0)
    addAiMsg('好的！让我们来做个快速打卡 ✦\n\n一共5项，大概1分钟完成～我们从第一项开始：')
    setTimeout(() => askCheckinItem(0), 600)
  }

  const askCheckinItem = (step: number) => {
    setCheckinStep(step)
    if (step >= CHECKIN_ITEMS.length) {
      finishCheckin()
      return
    }
    const item = CHECKIN_ITEMS[step]
    const progress = `${step + 1}/5`
    addAiMsg(`${item.emoji} ${progress} ${item.label}\n${item.question.replace(/\{name\}/g, petInfo.name)}`, item.options.map(o => o.label))
  }

  const selectCheckinOption = (label: string) => {
    const item = CHECKIN_ITEMS[checkinStep]
    const option = item.options.find(o => o.label === label)
    if (!option) return
    addUserMsg(label)
    setCheckinData(prev => ({ ...prev, [item.key]: { label, score: option.score } }))
    const next = checkinStep + 1
    setCheckinStep(next)
    setTimeout(() => askCheckinItem(next), 400)
  }

  const finishCheckin = () => {
    const entries = Object.entries(checkinData)
    const total = entries.reduce((s, [, v]) => s + v.score, 0)
    const maxScore = entries.length * 5
    const rate = Math.round((total / maxScore) * 100)
    setCheckinStep(-1)

    const stats = entries.map(([k, v]) => {
      const item = CHECKIN_ITEMS.find(it => it.key === k)
      return { label: item?.label || k, value: v.label, emoji: item?.emoji }
    })
    const card: CardData = {
      type: 'checkin_result',
      data: {},
      title: '📊 今日健康报告',
      score: rate,
      maxScore: 100,
      stats,
    }
    let summary = '打卡完成！健康报告出炉 ✦'
    if (rate >= 90) summary += '\n\n太棒了！状态满分 ✦ 继续保持！'
    else if (rate >= 70) summary += '\n\n整体还不错！有些项目需要注意一下～'
    else summary += '\n\n状态不太理想，建议多观察。可以做个症状初筛看看。'
    addMessage({ type: 'ai', content: summary, card })
  }

  const startFoodCheck = () => {
    setFoodActive(true)
    const foodList = Object.keys(FOOD_DATA)
    addAiMsg('请选择你想查询的食物，我来帮你分析：', foodList)
  }

  const selectFood = (foodName: string) => {
    addUserMsg(`查一下「${foodName}」`)
    setFoodActive(false)
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const d = FOOD_DATA[foodName]
      if (!d) { addAiMsg('抱歉，我暂时没有这种食物的数据。'); return }
      const verdict = d.safe ? '✅ 可以吃（适量）' : '🚫 不能吃'
      const card: CardData = {
        type: 'food_result',
        data: {},
        title: '📋 分析结果',
        safe: d.safe,
        risk: d.risk,
        icon: d.icon,
        foodName,
        desc: d.desc,
        advice: d.advice,
      }
      let summary = `${d.icon} ${foodName} ${verdict}`
      if (d.risk === 'P0') {
        summary += '\n\n🚨 这是高风险食物，请务必远离！'
      }
      addMessage({ type: 'ai', content: summary, card })
    }, 700)
  }

  const startSymptomCheck = () => {
    setSymptomData({})
    setSymptomStep(0)
    addAiMsg('了解！让我做一个症状初筛 ✦\n\n⚠ 这是AI预评估，不能替代专业兽医诊断。如果情况紧急请直接就医。\n\n一共4个问题：')
    setTimeout(() => askSymptomItem(0), 600)
  }

  const askSymptomItem = (step: number) => {
    setSymptomStep(step)
    if (step >= SYMPTOM_STEPS.length) {
      finishSymptomCheck()
      return
    }
    const s = SYMPTOM_STEPS[step]
    addAiMsg(`${s.title}\n${s.question.replace(/\{name\}/g, petInfo.name)}`, s.options)
  }

  const selectSymptomOption = (text: string) => {
    const s = SYMPTOM_STEPS[symptomStep]
    addUserMsg(text)
    setSymptomData(prev => ({ ...prev, [s.key]: text }))
    const next = symptomStep + 1
    setSymptomStep(next)
    setTimeout(() => askSymptomItem(next), 400)
  }

  const finishSymptomCheck = () => {
    setSymptomStep(-1)
    const severity = symptomData.severity || ''
    let riskLevel = 'low'
    let riskLabel = '暂不严重'
    let riskColor = '#8CAD7E'
    let advice = '👍 看起来暂时不严重，继续观察即可。保持正常饮食和作息。'

    if (severity.includes('非常严重')) {
      riskLevel = 'critical'
      riskLabel = '紧急'
      riskColor = '#E04040'
      advice = '🚨 症状紧急！建议立即带它前往最近的宠物医院。不要等待，不要自行用药。'
    } else if (severity.includes('比较严重')) {
      riskLevel = 'high'
      riskLabel = '建议尽快就医'
      riskColor = '#E0856B'
      advice = '⚠ 症状比较明显，建议24小时内去看兽医。暂时保持安静，提供充足的清水。'
    } else if (severity.includes('中等')) {
      riskLevel = 'mid'
      riskLabel = '可先观察'
      riskColor = '#E8A838'
      advice = '⚡ 可以先在家观察1-2天。如果症状加重再考虑就医。'
    }

    const symptomInfo = [
      { label: '主要症状', value: symptomData.symptom || '-' },
      { label: '持续时间', value: symptomData.duration || '-' },
      { label: '严重程度', value: severity || '-' },
      { label: '其他', value: symptomData.other || '-' },
    ]
    const card: CardData = {
      type: 'symptom_result',
      data: {},
      title: '📋 症状评估报告',
      riskLevel,
      risk: riskLabel,
      symptomInfo,
      advice,
      hospitalList: riskLevel === 'critical' || riskLevel === 'high'
        ? ['🏥 瑞鹏宠物医院 · 1.2km', '🏥 美联众合 · 2.5km', '🏥 芭比堂 · 3.1km']
        : undefined,
    }
    const summary = `初筛完成 ✦\n\n风险等级：${riskLabel}`
    addMessage({ type: 'ai', content: summary, card })
  }

  const startNaming = () => {
    setNamingData({})
    setNamingStep(0)
    addAiMsg('要给新宝贝取名字吗？太开心了！让我来帮你 ✦\n\n请先告诉我一些基本信息～')
    setTimeout(() => askNamingItem(0), 500)
  }

  const askNamingItem = (step: number) => {
    setNamingStep(step)
    if (step >= NAMING_STEPS.length) {
      finishNaming()
      return
    }
    const s = NAMING_STEPS[step]
    addAiMsg(s.question.replace(/\{name\}/g, petInfo.name), s.options)
  }

  const selectNamingOption = (text: string) => {
    const s = NAMING_STEPS[namingStep]
    addUserMsg(text)
    setNamingData(prev => ({ ...prev, [s.key]: text }))
    const next = namingStep + 1
    setNamingStep(next)
    setTimeout(() => askNamingItem(next), 400)
  }

  const finishNaming = async () => {
    setNamingStep(-1)
    const style = namingData.style || ''
    const genderText = namingData.gender || ''

    let names: NamingResult[] = []

    if (!CONFIG.USE_MOCK) {
      try {
        const pet = usePetStore.getState().currentPet
        const breed = pet?.breed || '未知品种'
        const birthDate = pet?.birthDate || ''
        const gender = genderText.includes('男') ? 'male' : genderText.includes('女') ? 'female' : 'unknown'

        const result = await recommendNames(breed, birthDate, gender)
        const parsed = parseRecommendResult(result)
        if (parsed.length > 0) {
          names = parsed
        }
      } catch {
        // true AI API不可用时降级到本地生成
      }
    }

    if (names.length === 0) {
      names = generateNames(style)
    }

    const card: CardData = {
      type: 'naming_cards',
      data: {},
      names,
    }
    addMessage({ type: 'ai', content: '基于你的偏好，我为你推荐以下名字 ✦', card })
  }

  const getCurrentFlowType = (): 'checkin' | 'symptom' | 'naming' | null => {
    if (checkinStep >= 0) return 'checkin'
    if (symptomStep >= 0) return 'symptom'
    if (namingStep >= 0) return 'naming'
    return null
  }

  const handleOptionClick = (option: string) => {
    const flowType = getCurrentFlowType()
    if (flowType === 'checkin') selectCheckinOption(option)
    else if (flowType === 'symptom') selectSymptomOption(option)
    else if (flowType === 'naming') selectNamingOption(option)
    else if (foodActive) selectFood(option)
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

      {!petInfo.hasPet ? (
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
        ref={scrollRef}
      >

        <View className='msg-row ai'>
          <View className='msg-avatar'>
            <Text>🤖</Text>
          </View>
          <View className='msg-bubble-wrap'>
            <View className='msg-bubble'>
              <Text>早安呀！我是{petInfo.name}的AI小助手 ✦{'\n\n'}{petInfo.name}今天怎么样？来打个卡吧～ 或者告诉我你想了解什么？</Text>
            </View>
            {showGreetingQuickActions && checkinStep < 0 && symptomStep < 0 && namingStep < 0 && (
              <View className='msg-quick-actions'>
                <View className='msg-quick-btn' onClick={() => handleQuickAction('checkin')}>
                  <Text>💩 打卡</Text>
                </View>
                <View className='msg-quick-btn' onClick={() => handleQuickAction('food')}>
                  <Text>🔍 查食物</Text>
                </View>
                <View className='msg-quick-btn' onClick={() => handleQuickAction('symptom')}>
                  <Text>💊 症状初筛</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {messages.map((msg, idx) => (
          <View key={msg.id} className={`msg-row ${msg.type}`}>
            <View className='msg-avatar'>
              <Text>{msg.type === 'ai' ? '🤖' : '😊'}</Text>
            </View>
            <View className='msg-bubble-wrap'>
              <View className='msg-bubble'>
                {renderMessageContent(msg)}
              </View>

              {msg.card && renderCard(msg.card)}

              {idx === messages.length - 1 && msg.type === 'ai' && showGreetingQuickActions && checkinStep < 0 && symptomStep < 0 && namingStep < 0 && !foodActive && (
                <View className='msg-quick-actions'>
                  <View className='msg-quick-btn' onClick={() => handleQuickAction('checkin')}>
                    <Text>💩 打卡</Text>
                  </View>
                  <View className='msg-quick-btn' onClick={() => handleQuickAction('food')}>
                    <Text>🔍 查食物</Text>
                  </View>
                  <View className='msg-quick-btn' onClick={() => handleQuickAction('symptom')}>
                    <Text>💊 症状初筛</Text>
                  </View>
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

        {isTyping && (
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
            onConfirm={handleSend}
            onFocus={() => setPlusMenuOpen(false)}
            placeholder={`说说${petInfo.name}今天的情况...`}
            placeholderStyle='color: #556'
            confirmType='send'
          />
          <View className='chat-send-btn' onClick={handleSend}>
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
