export type AiProviderId = 'deepseek' | 'openai' | 'tongyi' | 'doubao' | 'local'

export type AiTaskKind =
  | 'daily-plan' | 'task-breakdown' | 'meeting-actions'
  | 'daily-review' | 'weekly-report'
  // 记忆与进化
  | 'memory-reflection'
  | 'agent-chat'
  | 'silent-suggestion'
  | 'avatar-evolution-check'
  // 反思分层
  | 'reflection-l1-teaser'
  | 'reflection-l2-weekly'
  | 'reflection-l4-realtime'
  // Persona 系统
  | 'persona-customize-polish'
  | 'persona-cameo-greeting'

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

const cloudAiCapabilities: AiTaskKind[] = [
  'daily-plan', 'task-breakdown', 'meeting-actions', 'daily-review', 'weekly-report',
  'memory-reflection', 'agent-chat', 'silent-suggestion', 'avatar-evolution-check',
  'reflection-l1-teaser', 'reflection-l2-weekly', 'reflection-l4-realtime',
  'persona-customize-polish', 'persona-cameo-greeting'
]

export const aiProviderRegistry: AiProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    deployment: 'cloud',
    capabilities: cloudAiCapabilities,
    requiresApiKey: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    deployment: 'cloud',
    capabilities: cloudAiCapabilities,
    requiresApiKey: true
  },
  {
    id: 'tongyi',
    name: '通义千问',
    deployment: 'cloud',
    capabilities: cloudAiCapabilities,
    requiresApiKey: true
  },
  {
    id: 'doubao',
    name: '豆包',
    deployment: 'cloud',
    capabilities: cloudAiCapabilities,
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
    'weekly-report': '生成周报素材',
    'memory-reflection': '记忆反思与画像更新',
    'agent-chat': 'Agent 聊天对话',
    'silent-suggestion': '静默建议生成',
    'avatar-evolution-check': '角色进化检查',
    'reflection-l1-teaser': 'L1 半切反思',
    'reflection-l2-weekly': 'L2 完整周反思',
    'reflection-l4-realtime': 'L4 实时反思',
    'persona-customize-polish': 'Persona 润色与安全扫描',
    'persona-cameo-greeting': '客串 Persona 开场白'
  }

  return {
    providerId: provider.id,
    title: titles[request.kind],
    systemPrompt: request.kind === 'memory-reflection'
      ? '你是个人效率与成长工作台的记忆反思引擎，只输出可审计、可解释、可由用户确认后写入长期画像的建议。'
      : '你是个人效率与成长工作台的 AI 行动教练，只输出可执行、可复盘、可确认后写入任务系统的建议。',
    userPrompt: [request.context, request.input].filter(Boolean).join('\n\n')
  }
}
