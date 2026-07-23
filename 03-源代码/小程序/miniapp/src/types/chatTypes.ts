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
