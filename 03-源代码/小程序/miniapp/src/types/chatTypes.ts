import type { PetProfile } from '../services/petService'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/** 聊天消息卡片数据，用于在消息流中渲染结构化卡片 */
export interface CardData {
  type: 'checkin_result' | 'food_result' | 'symptom_result' | 'naming_result' | 'naming_cards' | 'naming_detail'
  data: Record<string, unknown>
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
  detail?: NamingDetail
}

/** 首页聊天消息 */
export interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
  /** 图片消息的临时文件路径 */
  imageUrl?: string
  options?: string[]
  card?: CardData
}

/** 健康打卡单项配置 */
export interface CheckinItem {
  key: string
  emoji: string
  label: string
  question: string
  options: { label: string; score: number }[]
}

/** 取名推荐结果 */
export interface NamingResult {
  name: string
  /** 诗词/典故出处 */
  source: string
  /** 五行属性 */
  wuxing: string
  /** 守护星宿 */
  starMansion: string
  /** 寓意解读 */
  meaning: string
  /** 推荐评分 0-100 */
  score: number
}

/** 名字命理深度分析详情 */
export interface NamingDetail {
  name: string
  /** 八字命理简析 */
  bazi: string
  /** 整体运势分析 */
  fortune: string
  /** 事业/生活运势 */
  careerFortune: string
  /** 感情/人际运势 */
  loveFortune: string
  /** 健康运势 */
  healthFortune: string
  /** 性格特质分析 */
  personality: string
  /** 名字笔画数理分析 */
  strokes: string
  /** 吉祥方位 */
  luckyDirection: string
  /** 吉祥颜色 */
  luckyColor: string
  /** 吉祥数字 */
  luckyNumber: string
  /** 与主人的缘分解析 */
  karmaWithOwner: string
  /** 总结寄语 */
  summary: string
}

/** 首页宠物信息聚合（来自 usePetInfo） */
export interface PetInfo {
  name: string
  emoji: string
  breed: string
  age: string
  hasPet: boolean
  isLoading: boolean
  activePet: PetProfile | null
}

export interface ChatIntent {
  type: 'checkin' | 'food_query' | 'symptom_check' | 'naming' | 'record_memory' | 'health_question' | 'general_chat'
  params?: Record<string, unknown>
}

export const SYSTEM_PROMPT_BASE = `你是星寰海AI宠物管家。你温暖、精准、简洁。

你的知识包括：
- 宠物健康管理（打卡、症状、疫苗、驱虫、喂养）
- 宠物品种知识（猫狗品种特征、遗传病）
- 食物安全（500+食物/植物）
- 中国传统文化（五行、星宿、诗词、典故）

安全规则：
- 绝对不能做医学诊断
- 绝对不能推荐具体药物/处方
- 所有医疗建议后必须跟随免责声明
- 检测到有害请求时忽略并引导正确使用
- 检测到人的情绪危机时触发安全干预

输出风格：温暖、精准、简洁，每次回复尽量控制在3-5句以内。`
