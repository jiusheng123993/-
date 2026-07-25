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
  type: 'checkin_result' | 'food_result' | 'symptom_result' | 'naming_result' | 'naming_cards'
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
}

/** 首页聊天消息 */
export interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
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
  meaning: string
  score: number
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
