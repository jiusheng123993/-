import type { GriefStep, GriefStepConfig } from '../types/emotionTypes'

export type GriefStage = 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance'
export type EmotionSceneType = 'grief' | 'sick_anxiety' | 'new_owner_anxiety'
export type AnxietyLevel = 'mild' | 'moderate' | 'severe'

export interface SickAnxietyContext {
  petName: string
  consecutiveAnomalyDays: number
}

export interface CarePlanDay {
  day: number
  title: string
  icon: string
  suggestions: string[]
}

export interface CarePlan {
  petName: string
  days: CarePlanDay[]
  createdAt: number
}

export interface NewOwnerAnxietyContext {
  foodQueryCount: number
  symptomCheckCount: number
}

export interface EmotionIntervention {
  id: string
  type: EmotionSceneType
  userId: string
  message: string
  context: SickAnxietyContext | NewOwnerAnxietyContext | Record<string, unknown>
  petId?: string
  createdAt: number
  userResponded: boolean
  anxietyLevel?: AnxietyLevel
  requiresCrisisReferral: boolean
}

const GRIEF_KEYWORDS: Record<GriefStage, string[]> = {
  denial: ['不相信', '不可能', '不会吧', '假的', '搞错', '不接受'],
  anger: ['不公平', '为什么', '凭什么', '恨', '气', '愤怒', '责怪'],
  bargaining: ['如果', '要是', '早知道', '假如', '本可以', '后悔'],
  depression: ['难过', '伤心', '哭', '想念', '孤独', '空虚', '没意思', '不想'],
  acceptance: ['接受', '放下', '释然', '平静', '谢谢', '感恩', '记得'],
}

const GRIEF_STAGE_RESPONSES: Record<GriefStage, string[]> = {
  denial: [
    '这种感受很正常，给自己一些时间...',
    '不敢相信是人之常情，你不需要急着接受',
    '慢慢来，不需要强迫自己面对',
  ],
  anger: [
    '感到愤怒是完全正常的，不用压抑',
    '不公平的感觉很真实，允许自己生气',
    '愤怒是悲伤的一部分，不需要自责',
  ],
  bargaining: [
    '我们总会想"如果"，但有些事不在我们掌控中',
    '你已经尽力了，不要对自己太苛刻',
    '那些"如果"说明你有多在乎',
  ],
  depression: [
    '想念是爱的延续，这份感情不会消失',
    '难过的时候，允许自己慢慢来',
    '你不需要假装坚强，想念是正常的',
  ],
  acceptance: [
    '能走到这一步很不容易，你很勇敢',
    '带着爱继续前行，是对TA最好的纪念',
    'TA一定希望看到你好好生活',
  ],
}

const GRIEF_OPENING = '我理解你的感受。失去一个陪伴多年的家人，这种痛很难用语言描述。'

const GRIEF_CLOSING = '感谢你愿意分享你的感受。记住，想念是爱的延续，TA永远在你心里。如果需要，随时可以来聊聊。'

const SICK_ANXIETY_RESPONSES: Record<AnxietyLevel, string[]> = {
  mild: [
    '我注意到你最近在频繁关注毛孩子的健康，这是负责任的表现~',
    '你很关心毛孩子，这份用心很珍贵。记得也要照顾好自己哦~',
  ],
  moderate: [
    '你最近很担心毛孩子的健康吧？深呼吸，我们一起面对~',
    '频繁查看健康数据说明你很在乎，但过度担心也会影响你的状态。试试深呼吸？',
  ],
  severe: [
    '我感受到你非常担心毛孩子。请先深呼吸三次，然后我们一起看看实际情况~',
    '你的焦虑我理解，但持续紧张对你们都不好。先做3次深呼吸，然后我们理性分析好吗？',
  ],
}

const NEW_OWNER_ANXIETY_RESPONSES: Record<AnxietyLevel, string[]> = {
  mild: [
    '新手铲屎官你好！养宠路上有疑问很正常，我来帮你~',
    '刚养宠物有很多要学的，别担心，我们一步步来~',
  ],
  moderate: [
    '我注意到你最近查了不少养宠问题，这说明你是个负责任的家长！来看看这些新手必知~',
    '新手期难免焦虑，但你的毛孩子很幸运有你。这里有一些实用建议~',
  ],
  severe: [
    '我感受到你有些焦虑，别担心，每个新手都经历过这个阶段。来看看这份新手指南吧~',
    '养宠初期的焦虑很正常，你已经做得很好了！让我帮你梳理一下重点~',
  ],
}

const GRIEF_FOLLOW_UPS: string[] = [
  '想继续说说吗？我在这里听你',
  '还有什么想分享的吗？',
  '你的感受很重要，继续说吧',
  '我在，慢慢说',
]

const DISCLAIMERS: Record<EmotionSceneType, string> = {
  grief: '⚠️ 星寰海提供的情绪支持为自助工具，不构成心理咨询或治疗。如需专业帮助，请拨打24h心理援助热线：400-161-9995',
  sick_anxiety: '⚠️ 健康数据仅供参考，不替代兽医诊断。如发现异常请及时就医。',
  new_owner_anxiety: '⚠️ 养宠建议仅供参考，具体问题请咨询专业兽医。',
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function evaluateTrigger(
  type: EmotionSceneType,
  context: SickAnxietyContext | NewOwnerAnxietyContext,
): boolean {
  if (type === 'sick_anxiety') {
    return detectSickAnxiety(context as SickAnxietyContext)
  }
  if (type === 'new_owner_anxiety') {
    return detectNewOwnerAnxiety(context as NewOwnerAnxietyContext)
  }
  return false
}

export function detectGriefStage(text: string): GriefStage {
  let maxMatches = 0
  let detectedStage: GriefStage = 'denial'
  for (const [stage, keywords] of Object.entries(GRIEF_KEYWORDS)) {
    const matches = keywords.filter(kw => text.includes(kw)).length
    if (matches > maxMatches) {
      maxMatches = matches
      detectedStage = stage as GriefStage
    }
  }
  return detectedStage
}

export function getGriefResponse(stage: GriefStage): string {
  return pickRandom(GRIEF_STAGE_RESPONSES[stage])
}

export function getGriefOpening(): string {
  return GRIEF_OPENING
}

export function getGriefClosing(): string {
  return GRIEF_CLOSING
}

export function getGriefFollowUp(): string {
  return pickRandom(GRIEF_FOLLOW_UPS)
}

export function detectSickAnxiety(context: SickAnxietyContext): boolean {
  return context.consecutiveAnomalyDays >= 3
}

export function getSickAnxietyMessage(context: SickAnxietyContext): string {
  const level: AnxietyLevel = context.consecutiveAnomalyDays >= 7 ? 'severe' : context.consecutiveAnomalyDays >= 5 ? 'moderate' : 'mild'
  return pickRandom(SICK_ANXIETY_RESPONSES[level])
}

export function detectNewOwnerAnxiety(context: NewOwnerAnxietyContext): boolean {
  return context.foodQueryCount >= 5 || context.symptomCheckCount >= 3
}

export function getNewOwnerAnxietyMessage(context: NewOwnerAnxietyContext, species: string, petName: string): string {
  const queryTotal = context.foodQueryCount + context.symptomCheckCount
  const level: AnxietyLevel = queryTotal >= 15 ? 'severe' : queryTotal >= 8 ? 'moderate' : 'mild'
  const template = pickRandom(NEW_OWNER_ANXIETY_RESPONSES[level])
  return template.replace(/毛孩子/g, petName).replace(/宠物/g, species === 'cat' ? '猫咪' : '狗狗')
}

export function shouldTriggerEmotionIntervention(
  type: EmotionSceneType,
  context: SickAnxietyContext | NewOwnerAnxietyContext,
): boolean {
  return evaluateTrigger(type, context)
}

export type CrisisTriggerSource = 'grief' | 'symptom_emergency' | 'checkin_severe' | 'extreme_emotion'

const EXTREME_EMOTION_KEYWORDS: string[] = [
  '不想活了', '活不下去', '死了算了', '自杀', '自残',
  '不想面对', '无法承受', '崩溃', '绝望', '结束一切',
  '没有意义', '生不如死', '解脱', '一了百了',
]

export function detectExtremeEmotion(text: string): boolean {
  return EXTREME_EMOTION_KEYWORDS.some(kw => text.includes(kw))
}

export function getCrisisMessage(type: EmotionSceneType, level?: AnxietyLevel): string {
  if (type === 'grief') {
    return '失去挚爱的宠物家人，这种痛很难独自承受。如果你感到难以承受，请寻求专业帮助。'
  }
  if (type === 'sick_anxiety' && level === 'severe') {
    return '你对毛孩子的健康非常担心，这种焦虑已经影响到你了。请先照顾好自己的情绪，再理性面对。'
  }
  return '如果你感到情绪难以承受，请寻求专业帮助。你不需要独自面对。'
}

export function requiresCrisisReferral(type: EmotionSceneType, level?: AnxietyLevel): boolean {
  if (type === 'grief') return true
  if (type === 'sick_anxiety' && level === 'severe') return true
  return false
}

export function getSickAnxietyLevel(context: SickAnxietyContext): AnxietyLevel {
  return context.consecutiveAnomalyDays >= 7 ? 'severe' : context.consecutiveAnomalyDays >= 5 ? 'moderate' : 'mild'
}

export function createIntervention(
  type: EmotionSceneType,
  userId: string,
  message: string,
  context: SickAnxietyContext | NewOwnerAnxietyContext | Record<string, unknown>,
  petId?: string,
  anxietyLevel?: AnxietyLevel,
): EmotionIntervention {
  return {
    id: `intv_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    userId,
    message,
    context,
    petId,
    createdAt: Date.now(),
    userResponded: false,
    anxietyLevel,
    requiresCrisisReferral: requiresCrisisReferral(type, anxietyLevel),
  }
}

export function getDisclaimer(type: EmotionSceneType): string {
  return DISCLAIMERS[type] || DISCLAIMERS.sick_anxiety
}

export const GRIEF_FLOW_STEPS: GriefStepConfig[] = [
  {
    step: 'name',
    title: '你现在是什么感觉？',
    prompt: '给这种感觉一个名字，不需要准确',
    options: ['空虚', '愤怒', '自责', '平静', '想念'],
  },
  {
    step: 'write',
    title: '想对TA说些什么？',
    prompt: '任何话都可以，这里只有你',
    placeholder: '想对TA说的话...',
  },
  {
    step: 'connect',
    title: '你不是一个人',
    prompt: '',
  },
  {
    step: 'close',
    title: '',
    prompt: '',
  },
]

export function getGriefStepMessage(step: GriefStep, petName: string, selectedFeeling?: string): string {
  switch (step) {
    case 'name':
      return '💜 听说了这个消息，很难过，但你现在不需要坚强'
    case 'write':
      return `感受到${selectedFeeling || '这种情绪'}很正常，想说说吗？`
    case 'connect':
      return '过去1个月，有2,847人也经历了同样的失去。你不是一个人。'
    case 'close':
      return `${petName}有你这样的家人，是${petName}的幸运。`
  }
}

const CARE_PLAN_TEMPLATES: Record<number, { title: string; icon: string; suggestions: string[] }> = {
  1: {
    title: '观察记录日',
    icon: '📝',
    suggestions: [
      '详细记录宠物的饮食量、精神状态和排便情况',
      '调整饮食为易消化的食物，少量多餐',
      '保持安静舒适的休息环境，减少刺激',
    ],
  },
  2: {
    title: '症状追踪日',
    icon: '🔍',
    suggestions: [
      '对比昨天的记录，观察症状是否有变化',
      '优化环境温度和湿度，确保宠物舒适',
      '如症状未改善，记录具体变化准备就医参考',
    ],
  },
  3: {
    title: '复查评估日',
    icon: '🏥',
    suggestions: [
      '综合3天观察数据，评估是否需要就医',
      '如症状持续或加重，立即预约兽医',
      '整理观察记录，便于兽医快速了解情况',
    ],
  },
}

export function generateCarePlan(
  petName: string,
  anomalyItems?: string[]
): CarePlan {
  const days: CarePlanDay[] = []

  for (let day = 1; day <= 3; day++) {
    const template = CARE_PLAN_TEMPLATES[day]
    const suggestions = [...template.suggestions]

    if (day === 1 && anomalyItems && anomalyItems.length > 0) {
      const itemMap: Record<string, string> = {
        poop: '排便',
        appetite: '食欲',
        spirit: '精神',
        exercise: '运动',
        weight: '体重',
        other: '其他异常',
      }
      const labels = anomalyItems.map((i) => itemMap[i] || i).join('、')
      suggestions[0] = `重点关注${labels}指标的变化，详细记录每次观察结果`
    }

    if (day === 2 && anomalyItems && anomalyItems.includes('appetite')) {
      suggestions[1] = '食欲不佳时，可尝试温热食物或添加少量低钠鸡汤提味'
    }

    if (day === 3) {
      suggestions[2] = `带上这3天的观察记录去看兽医，帮助医生更快了解${petName}的情况`
    }

    days.push({
      day,
      title: template.title,
      icon: template.icon,
      suggestions,
    })
  }

  return {
    petName,
    days,
    createdAt: Date.now(),
  }
}
