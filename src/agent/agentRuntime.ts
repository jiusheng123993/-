import { createAiPromptDraft, getAiProviderById, type AiProviderId } from '../ai/aiProvider'
import type { PersonaId } from '../personas/personaRegistry'
import type { MemoryProfile, MemoryEvent } from '../memory/memoryTypes'

export interface AgentChatRequest {
  message: string
  personaId?: PersonaId
  providerId?: AiProviderId
  useXFYunCoding?: boolean
  profile?: MemoryProfile
  memoryEvents?: MemoryEvent[]
  conversationHistory?: Array<{ role: 'user' | 'agent'; content: string }>
}

export interface AgentChatStreamRequest extends AgentChatRequest {
  signal?: AbortSignal
  onChunk: (chunk: string) => void
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

function buildChatSystemPrompt(personaId?: PersonaId, profile?: MemoryProfile, memoryEvents?: MemoryEvent[]): string {
  const basePrompt = getPersonaSystemPrompt(personaId)
  
  let profileContext = ''
  if (profile) {
    const parts: string[] = []
    if (profile.identity.nickname) parts.push(`用户昵称：${profile.identity.nickname}`)
    if (profile.identity.role) parts.push(`角色：${profile.identity.role}`)
    if (profile.goals.primaryGoal) parts.push(`主要目标：${profile.goals.primaryGoal}`)
    if (profile.goals.activeGoals && profile.goals.activeGoals.length > 0) {
      parts.push(`当前活跃目标：${profile.goals.activeGoals.join('、')}`)
    }
    if (profile.personality.planningStyle) parts.push(`规划风格：${profile.personality.planningStyle}`)
    if (profile.personality.workRhythm) parts.push(`工作节奏：${profile.personality.workRhythm}`)
    if (profile.preferences.encouragementStyle) parts.push(`鼓励风格：${profile.preferences.encouragementStyle}`)
    if (profile.preferences.communicationStyle) parts.push(`沟通偏好：${profile.preferences.communicationStyle}`)
    if (profile.boundaries.topicsToAvoid && profile.boundaries.topicsToAvoid.length > 0) {
      parts.push(`避免话题：${profile.boundaries.topicsToAvoid.join('、')}`)
    }
    if (profile.learning.preferredMethods && profile.learning.preferredMethods.length > 0) {
      parts.push(`学习偏好：${profile.learning.preferredMethods.join('、')}`)
    }
    
    if (parts.length > 0) {
      profileContext = `\n\n用户画像信息：\n${parts.join('\n')}`
    }
  }

  let memoryContext = ''
  if (memoryEvents && memoryEvents.length > 0) {
    const recentEvents = memoryEvents.slice(-10)
    const eventLines = recentEvents.map(e => {
      const time = new Date(e.timestamp).toLocaleDateString('zh-CN')
      return `- [${time}] ${e.category}: ${e.summary}`
    })
    memoryContext = `\n\n用户近期活动记忆：\n${eventLines.join('\n')}\n\n请基于以上记忆，在对话中自然地引用用户近期的活动和进展，让对话更有连续性和个性化。`
  }
  
  return `${basePrompt}${profileContext}${memoryContext}\n\n请用简洁、友好的方式回复用户的提问。如果用户询问学习相关问题，给出具体可执行的建议。`
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

export async function sendAgentChatMessageStream(request: AgentChatStreamRequest): Promise<void> {
  const { message, personaId, providerId = 'deepseek', useXFYunCoding = true, profile, memoryEvents, conversationHistory, signal, onChunk } = request
  
  const systemPrompt = buildChatSystemPrompt(personaId, profile, memoryEvents)
  const userPrompt = buildChatUserPrompt(message, conversationHistory)
  
  const providers: Array<{ id: AiProviderId; name: string }> = [
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'tongyi', name: '通义千问' },
    { id: 'doubao', name: '豆包' }
  ]
  
  if (useXFYunCoding) {
    try {
      await fetchXFYunCodingCompletionStream(systemPrompt, userPrompt, conversationHistory, onChunk, signal)
      return
    } catch (error) {
      if (signal?.aborted) return
      console.error('XFYun Coding stream error:', error)
    }
  }
  
  const activeProvider = getAiProviderById(providerId)
  
  if (!activeProvider.capabilities.includes('agent-chat')) {
    onChunk('当前 AI Provider 不支持聊天功能，请检查配置。')
    return
  }
  
  const draft = createAiPromptDraft(activeProvider.id, {
    kind: 'agent-chat',
    input: userPrompt,
    context: systemPrompt
  })
  
  try {
    await fetchChatCompletionStream(activeProvider.id, draft.systemPrompt, draft.userPrompt, onChunk, signal)
    return
  } catch (primaryError) {
    if (signal?.aborted) return
    console.error('Primary provider stream failed:', primaryError)
    
    for (const provider of providers) {
      if (provider.id === providerId) continue
      
      const altProvider = getAiProviderById(provider.id)
      if (!altProvider.capabilities.includes('agent-chat')) continue
      
      try {
        const altDraft = createAiPromptDraft(altProvider.id, {
          kind: 'agent-chat',
          input: userPrompt,
          context: systemPrompt
        })
        
        await fetchChatCompletionStream(altProvider.id, altDraft.systemPrompt, altDraft.userPrompt, onChunk, signal)
        return
      } catch (altError) {
        if (signal?.aborted) return
        console.error(`${provider.name} stream failed:`, altError)
      }
    }
    
    console.error('All AI providers failed, using fallback')
    onChunk(getFallbackResponse(userPrompt))
  }
}

export async function sendAgentChatMessage(request: AgentChatRequest): Promise<AgentChatResponse> {
  const { message, personaId, providerId = 'deepseek', useXFYunCoding = true, profile, conversationHistory } = request
  
  const systemPrompt = buildChatSystemPrompt(personaId, profile)
  const userPrompt = buildChatUserPrompt(message, conversationHistory)
  
  const providers: Array<{ id: AiProviderId; name: string }> = [
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'tongyi', name: '通义千问' },
    { id: 'doubao', name: '豆包' }
  ]
  
  if (useXFYunCoding) {
    try {
      const response = await fetchXFYunCodingCompletion(systemPrompt, userPrompt, conversationHistory)
      if (response && !response.includes('AI 服务暂时不可用') && !response.includes('空响应')) {
        return {
          content: response,
          mood: determineMood(response)
        }
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
  } catch (primaryError) {
    console.error('Primary provider failed:', primaryError)
    
    for (const provider of providers) {
      if (provider.id === providerId) continue
      
      const altProvider = getAiProviderById(provider.id)
      if (!altProvider.capabilities.includes('agent-chat')) continue
      
      try {
        const altDraft = createAiPromptDraft(altProvider.id, {
          kind: 'agent-chat',
          input: userPrompt,
          context: systemPrompt
        })
        
        const response = await fetchChatCompletion(altProvider.id, altDraft.systemPrompt, altDraft.userPrompt)
        
        return {
          content: response,
          mood: determineMood(response)
        }
      } catch (altError) {
        console.error(`${provider.name} failed:`, altError)
      }
    }
    
    console.error('All AI providers failed, using fallback')
    return {
      content: getFallbackResponse(userPrompt),
      mood: 'neutral'
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
    throw new Error(`${providerId} API key not configured`)
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
    
    throw new Error('Empty response from AI')
  } catch (error) {
    console.error('Chat API error:', error)
    throw error
  }
}

async function fetchChatCompletionStream(
  providerId: AiProviderId,
  systemPrompt: string,
  userPrompt: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiConfig = getApiConfig(providerId)
  
  if (!apiConfig.apiKey) {
    throw new Error(`${providerId} API key not configured`)
  }
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
  
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
      max_tokens: 1000,
      stream: true
    }),
    signal
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body reader')
  }
  
  const decoder = new TextDecoder()
  let buffer = ''
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        
        const dataStr = trimmed.slice(6)
        if (dataStr === '[DONE]') continue
        
        try {
          const data = JSON.parse(dataStr)
          const content = data.choices?.[0]?.delta?.content
          if (content) {
            onChunk(content)
          }
        } catch {
          // skip unparseable chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function getApiConfig(providerId: AiProviderId): { endpoint: string; apiKey: string; model: string } {
  const isDev = import.meta.env.DEV
  
  const configs: Record<AiProviderId, { endpoint: string; apiKey: string; model: string }> = {
    deepseek: {
      endpoint: isDev ? '/api/deepseek' : 'https://api.deepseek.com/v1/chat/completions',
      apiKey: localStorage.getItem('deepseek_api_key') || '',
      model: 'deepseek-chat'
    },
    openai: {
      endpoint: isDev ? '/api/openai' : 'https://api.openai.com/v1/chat/completions',
      apiKey: localStorage.getItem('openai_api_key') || '',
      model: 'gpt-4o-mini'
    },
    tongyi: {
      endpoint: isDev ? '/api/tongyi' : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      apiKey: localStorage.getItem('tongyi_api_key') || '',
      model: 'qwen-turbo'
    },
    doubao: {
      endpoint: isDev ? '/api/doubao' : 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
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
  const fullKey = localStorage.getItem('xfyun_coding_api_key') || 'e896be4b52a7156fc230932c7d7af743:YzNhODQxNzc5NDA2ZmY0NWU5NmRjOTQw'
  const isDev = import.meta.env.DEV
  return {
    endpoint: isDev ? '/api/xfyun' : 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/chat/completions',
    apiKey: fullKey,
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
    throw new Error('XFYun API key not configured')
  }
  
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]
  
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6)
    for (const h of recentHistory) {
      messages.push({ role: h.role === 'agent' ? 'assistant' : h.role, content: h.content })
    }
  }
  
  messages.push({ role: 'user', content: userPrompt })
  
  const timestamp = new Date().toISOString()
  
  const requestBody: Record<string, unknown> = {
    messages,
    temperature: 0.7,
    max_tokens: 1000
  }
  
  if (config.model) {
    requestBody.model = config.model
  }
  
  const bodyString = JSON.stringify(requestBody)
  
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: bodyString
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
    
    if (data.content) {
      return data.content
    }
    
    return 'AI 返回了空响应，请稍后再试。'
  } catch (error) {
    console.error('XFYun Coding API error:', error)
    throw error
  }
}

async function fetchXFYunCodingCompletionStream(
  systemPrompt: string,
  userPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'agent'; content: string }> | undefined,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const config = getXFYunCodingConfig()
  
  if (!config.apiKey) {
    throw new Error('XFYun API key not configured')
  }
  
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]
  
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6)
    for (const h of recentHistory) {
      messages.push({ role: h.role === 'agent' ? 'assistant' : h.role, content: h.content })
    }
  }
  
  messages.push({ role: 'user', content: userPrompt })
  
  const requestBody: Record<string, unknown> = {
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true
  }
  
  if (config.model) {
    requestBody.model = config.model
  }
  
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody),
    signal
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('XFYun Coding API stream error:', response.status, errorText)
    throw new Error(`API error: ${response.status}`)
  }
  
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body reader')
  }
  
  const decoder = new TextDecoder()
  let buffer = ''
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        
        const dataStr = trimmed.slice(6)
        if (dataStr === '[DONE]') continue
        
        try {
          const data = JSON.parse(dataStr)
          const content = data.choices?.[0]?.delta?.content
          if (content) {
            onChunk(content)
          }
        } catch {
          // skip unparseable chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

async function generateHMACSignature(
  url: string,
  method: string,
  body: string,
  timestamp: string,
  appId: string,
  apiSecret: string
): Promise<string> {
  const urlObj = new URL(url)
  const pathAndQuery = urlObj.pathname + (urlObj.search || '')
  
  const signatureString = `${method}\n${pathAndQuery}\n${timestamp}\n${body}`
  
  const encoder = new TextEncoder()
  const keyData = encoder.encode(apiSecret)
  const messageData = encoder.encode(signatureString)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${appId}:${hashHex}`
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
  sendMessage: sendAgentChatMessage,
  sendMessageStream: sendAgentChatMessageStream
}
