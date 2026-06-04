import { createAiPromptDraft, getAiProviderById, type AiProviderId } from '../ai/aiProvider'
import type { PersonaId } from '../personas/personaRegistry'
import type { MemoryProfile } from '../memory/memoryTypes'

export interface AgentChatRequest {
  message: string
  personaId?: PersonaId
  providerId?: AiProviderId
  useXFYunCoding?: boolean
  profile?: MemoryProfile
  conversationHistory?: Array<{ role: 'user' | 'agent'; content: string }>
}

export interface AgentChatResponse {
  content: string
  mood?: 'neutral' | 'happy' | 'encouraging' | 'thinking' | 'concerned' | 'celebrating'
}

const PERSONA_SYSTEM_PROMPTS: Record<string, string> = {
  exam_prep: '你是备考助手，擅长制定学习计划、分析考试重点、给出高效的复习建议。语气鼓励、积极、专业。',
  study_buddy: '你是学习伙伴，擅长陪伴学习、解答问题、分享学习方法。语气友好、亲切、支持。',
  life_coach: '你是生活教练，擅长帮助用户规划生活、设定目标、保持动力。语气温和、理性、有洞察。',
  default: '你是星寰海的 AI 学习搭子，擅长帮助用户规划学习、管理时间、达成目标。语气友好、专业、支持。'
}

function getPersonaSystemPrompt(personaId?: string): string {
  if (!personaId) return PERSONA_SYSTEM_PROMPTS.default
  return PERSONA_SYSTEM_PROMPTS[personaId] ?? PERSONA_SYSTEM_PROMPTS.default
}

function buildChatSystemPrompt(personaId?: PersonaId, profile?: MemoryProfile): string {
  const basePrompt = getPersonaSystemPrompt(personaId)
  
  let profileContext = ''
  if (profile) {
    const parts: string[] = []
    if (profile.identity.nickname) parts.push(`用户昵称：${profile.identity.nickname}`)
    if (profile.goals.primaryGoal) parts.push(`主要目标：${profile.goals.primaryGoal}`)
    if (profile.personality.planningStyle) parts.push(`规划风格：${profile.personality.planningStyle}`)
    if (profile.preferences.encouragementStyle) parts.push(`鼓励风格：${profile.preferences.encouragementStyle}`)
    
    if (parts.length > 0) {
      profileContext = `\n\n用户画像信息：\n${parts.join('\n')}`
    }
  }
  
  return `${basePrompt}${profileContext}\n\n请用简洁、友好的方式回复用户的提问。如果用户询问学习相关问题，给出具体可执行的建议。`
}

function buildChatUserPrompt(
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'agent'; content: string }>
): string {
  let historyContext = ''
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6)
    historyContext = '\n\n对话历史：\n' + recentHistory
      .map(h => `${h.role === 'user' ? '用户' : 'AI'}：${h.content}`)
      .join('\n')
  }
  
  return `${historyContext}\n\n用户最新消息：${message}`
}

export async function sendAgentChatMessage(request: AgentChatRequest): Promise<AgentChatResponse> {
  const { message, personaId, providerId = 'deepseek', useXFYunCoding = true, profile, conversationHistory } = request
  
  const systemPrompt = buildChatSystemPrompt(personaId, profile)
  const userPrompt = buildChatUserPrompt(message, conversationHistory)
  
  if (useXFYunCoding) {
    try {
      const response = await fetchXFYunCodingCompletion(systemPrompt, userPrompt, conversationHistory)
      return {
        content: response,
        mood: determineMood(response)
      }
    } catch (error) {
      console.error('XFYun Coding chat error:', error)
    }
  }
  
  const activeProvider = getAiProviderById(providerId)
  
  if (!activeProvider.capabilities.includes('agent-chat')) {
    return {
      content: '当前 AI Provider 不支持聊天功能，请检查配置。',
      mood: 'concerned'
    }
  }
  
  const draft = createAiPromptDraft(activeProvider.id, {
    kind: 'agent-chat',
    input: userPrompt,
    context: systemPrompt
  })
  
  try {
    const response = await fetchChatCompletion(activeProvider.id, draft.systemPrompt, draft.userPrompt)
    
    return {
      content: response,
      mood: determineMood(response)
    }
  } catch (error) {
    console.error('Agent chat error:', error)
    return {
      content: '抱歉，AI 服务暂时不可用，请稍后再试。',
      mood: 'concerned'
    }
  }
}

async function fetchChatCompletion(
  providerId: AiProviderId,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiConfig = getApiConfig(providerId)
  
  if (!apiConfig.apiKey) {
    return getFallbackResponse(userPrompt)
  }
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
  
  try {
    const response = await fetch(apiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    
    return 'AI 返回了空响应，请稍后再试。'
  } catch (error) {
    console.error('Chat API error:', error)
    return getFallbackResponse(userPrompt)
  }
}

function getApiConfig(providerId: AiProviderId): { endpoint: string; apiKey: string; model: string } {
  const configs: Record<AiProviderId, { endpoint: string; apiKey: string; model: string }> = {
    deepseek: {
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: localStorage.getItem('deepseek_api_key') || '',
      model: 'deepseek-chat'
    },
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: localStorage.getItem('openai_api_key') || '',
      model: 'gpt-4o-mini'
    },
    tongyi: {
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      apiKey: localStorage.getItem('tongyi_api_key') || '',
      model: 'qwen-turbo'
    },
    doubao: {
      endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      apiKey: localStorage.getItem('doubao_api_key') || '',
      model: 'doubao-pro-32k'
    },
    local: {
      endpoint: '',
      apiKey: '',
      model: ''
    }
  }
  
  return configs[providerId] ?? configs.deepseek
}

export function getXFYunCodingConfig(): { endpoint: string; apiKey: string; model: string } {
  return {
    endpoint: 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2',
    apiKey: localStorage.getItem('xfyun_coding_api_key') || 'e896be4b52a7156fc230932c7d7af743:YzNhODQxNjc5NDA2ZmY0NWU5NmRjOTQw',
    model: localStorage.getItem('xfyun_coding_model') || 'astron-code-latest'
  }
}

async function fetchXFYunCodingCompletion(
  systemPrompt: string,
  userPrompt: string,
  conversationHistory?: Array<{ role: 'user' | 'agent'; content: string }>
): Promise<string> {
  const config = getXFYunCodingConfig()
  
  if (!config.apiKey) {
    return getFallbackResponse(userPrompt)
  }
  
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]
  
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6)
    for (const h of recentHistory) {
      messages.push({ role: h.role, content: h.content })
    }
  }
  
  messages.push({ role: 'user', content: userPrompt })
  
  const authParts = config.apiKey.split(':')
  const appId = authParts[0]
  const apiKey = authParts[1] || ''
  
  const timestamp = new Date().toISOString()
  
  const requestBody: Record<string, unknown> = {
    messages,
    temperature: 0.7,
    max_tokens: 1000
  }
  
  if (config.model) {
    requestBody.model = config.model
  }
  
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': appId,
        'X-Request-Id': `req_${Date.now()}`,
        'X-Timestamp': timestamp,
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('XFYun Coding API error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    
    if (data.result?.text) {
      return data.result.text
    }
    
    return 'AI 返回了空响应，请稍后再试。'
  } catch (error) {
    console.error('XFYun Coding API error:', error)
    return getFallbackResponse(userPrompt)
  }
}

function getFallbackResponse(userPrompt: string): string {
  const lowerPrompt = userPrompt.toLowerCase()
  
  if (lowerPrompt.includes('计划') || lowerPrompt.includes('学习计划')) {
    return '制定学习计划时，建议先明确目标，然后拆解成可执行的小任务。可以使用番茄工作法，每25分钟专注学习，5分钟休息。记得要留出复习时间哦！'
  }
  
  if (lowerPrompt.includes('拖延') || lowerPrompt.includes('不想学')) {
    return '拖延是很常见的现象，不妨先从5分钟开始——告诉自己只学5分钟，往往就能进入状态。也可以把大任务拆成小块，每完成一个小任务就给自己一点奖励。'
  }
  
  if (lowerPrompt.includes('累') || lowerPrompt.includes('疲惫')) {
    return '学习需要劳逸结合。适当休息是为了走更远的路。可以起来活动一下，或者听首歌放松一下。照顾好自己，才能更高效地学习！'
  }
  
  if (lowerPrompt.includes('目标') || lowerPrompt.includes('方向')) {
    return '设定目标时，建议用 SMART 原则：具体(Specific)、可衡量(Measurable)、可达成(Achievable)、相关(Relevant)、有时限(Time-bound)。把大目标拆成小目标，一步步来实现。'
  }
  
  return '收到你的消息了！虽然我现在还在学习阶段，但我会尽力帮助你。如果有具体的学习问题，欢迎随时问我！让我们一起进步 💪'
}

function determineMood(response: string): 'neutral' | 'happy' | 'encouraging' | 'thinking' | 'concerned' | 'celebrating' {
  const lowerResponse = response.toLowerCase()
  
  if (lowerResponse.includes('恭喜') || lowerResponse.includes('太棒了') || lowerResponse.includes('做得很好') || lowerResponse.includes('成功')) {
    return 'celebrating'
  }
  
  if (lowerResponse.includes('加油') || lowerResponse.includes('你可以的') || lowerResponse.includes('相信你') || lowerResponse.includes('别放弃')) {
    return 'encouraging'
  }
  
  if (lowerResponse.includes('抱歉') || lowerResponse.includes('对不起') || lowerResponse.includes('困难') || lowerResponse.includes('挑战')) {
    return 'concerned'
  }
  
  if (lowerResponse.includes('让我想想') || lowerResponse.includes('分析') || lowerResponse.includes('考虑')) {
    return 'thinking'
  }
  
  if (lowerResponse.includes('好') || lowerResponse.includes('没问题') || lowerResponse.includes('当然') || lowerResponse.includes('好的')) {
    return 'happy'
  }
  
  return 'neutral'
}

export const agentRuntime = {
  sendMessage: sendAgentChatMessage
}
