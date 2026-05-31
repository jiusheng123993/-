export type AiProviderId = 'deepseek' | 'openai' | 'tongyi' | 'doubao' | 'local'

export type AiTaskKind = 'daily-plan' | 'task-breakdown' | 'meeting-actions' | 'daily-review' | 'weekly-report'

export type AiProvider = {
  id: AiProviderId
  name: string
  deployment: 'cloud' | 'local'
  capabilities: AiTaskKind[]
  requiresApiKey: boolean
}

export type AiPromptRequest = {
  kind: AiTaskKind
  input: string
  context?: string
}

export type AiPromptDraft = {
  providerId: AiProviderId
  title: string
  systemPrompt: string
  userPrompt: string
}

export const aiProviderRegistry: AiProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    deployment: 'cloud',
    capabilities: ['daily-plan', 'task-breakdown', 'meeting-actions', 'daily-review', 'weekly-report'],
    requiresApiKey: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    deployment: 'cloud',
    capabilities: ['daily-plan', 'task-breakdown', 'meeting-actions', 'daily-review', 'weekly-report'],
    requiresApiKey: true
  },
  {
    id: 'tongyi',
    name: '通义千问',
    deployment: 'cloud',
    capabilities: ['daily-plan', 'task-breakdown', 'meeting-actions', 'daily-review', 'weekly-report'],
    requiresApiKey: true
  },
  {
    id: 'doubao',
    name: '豆包',
    deployment: 'cloud',
    capabilities: ['daily-plan', 'task-breakdown', 'meeting-actions', 'daily-review', 'weekly-report'],
    requiresApiKey: true
  },
  {
    id: 'local',
    name: '本地模型',
    deployment: 'local',
    capabilities: ['daily-plan', 'task-breakdown', 'daily-review'],
    requiresApiKey: false
  }
]

export const getAiProviderById = (providerId: string): AiProvider =>
  aiProviderRegistry.find((provider) => provider.id === providerId) ?? aiProviderRegistry[0]

export const createAiPromptDraft = (providerId: AiProviderId, request: AiPromptRequest): AiPromptDraft => {
  const provider = getAiProviderById(providerId)
  const titles: Record<AiTaskKind, string> = {
    'daily-plan': '生成今日行动计划',
    'task-breakdown': '拆解复杂任务',
    'meeting-actions': '会议记录转行动项',
    'daily-review': '生成每日复盘',
    'weekly-report': '生成周报素材'
  }

  return {
    providerId: provider.id,
    title: titles[request.kind],
    systemPrompt: '你是个人效率与成长工作台的 AI 行动教练，只输出可执行、可复盘、可确认后写入任务系统的建议。',
    userPrompt: [request.context, request.input].filter(Boolean).join('\n\n')
  }
}
