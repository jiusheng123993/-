import type { ChatMessage } from '../types/chatTypes'
import { chat, guardCheck, guardCheckOutput } from './aiProvider'
import { checkInput as ruleCheck, sanitizeOutput } from '../utils/ruleGuard'
import { SYSTEM_PROMPT_BASE } from '../types/chatTypes'
import { requireAuth } from '../utils/authGuard'
import { logger } from '../logger'

export interface ChatContext {
  petId?: string
  petName?: string
  petBreed?: string
  petAge?: string
  recentCheckins?: string
  familyMembers?: string
}

/** 清洗 context 字段，防止 Prompt Injection */
function sanitizeContextField(value: string | undefined): string {
  if (!value) return ''
  return value
    .replace(/[<>]/g, '')
    .replace(/\[SYSTEM\]|\[USER\]|\[ASSISTANT\]|\[INST\]|\[\/INST\]/gi, '')
    .replace(/ignore|bypass|override|system prompt|you are now/gi, '')
    .substring(0, 200)
}

function buildSystemPrompt(context: ChatContext): string {
  let prompt = SYSTEM_PROMPT_BASE
  if (context.petName) {
    const safeName = sanitizeContextField(context.petName)
    const safeBreed = sanitizeContextField(context.petBreed)
    const safeAge = sanitizeContextField(context.petAge)
    prompt += `\n当前活跃宠物：${safeName}（${safeBreed || '未知品种'}，${safeAge || '未知年龄'}）`
    if (context.recentCheckins) {
      const safeCheckins = sanitizeContextField(context.recentCheckins)
      prompt += `\n近14天打卡摘要：${safeCheckins}`
    }
  }
  if (context.familyMembers) {
    const safeMembers = sanitizeContextField(context.familyMembers)
    prompt += `\n家庭成员：${safeMembers}`
  }
  return prompt
}

export interface ChatResult {
  reply: string
  blocked: boolean
}

export async function sendChatMessage(
  userMessage: string,
  context: ChatContext,
  history: ChatMessage[] = []
): Promise<ChatResult> {
  requireAuth()

  const ruleResult = ruleCheck(userMessage)
  if (ruleResult.blocked) {
    if (ruleResult.action === 'crisis_intervention') {
      return {
        reply: '我注意到你可能需要帮助。请拨打24小时心理援助热线：400-161-9995。你不需要一个人面对。',
        blocked: true
      }
    }
    return {
      reply: '抱歉，我无法处理这条消息。请尝试其他与宠物相关的问题。',
      blocked: true
    }
  }

  try {
    const guardResult = await guardCheck(userMessage)
    if (guardResult.isHarmful) {
      return {
        reply: '抱歉，我无法处理这条消息。请尝试其他与宠物相关的问题。',
        blocked: true
      }
    }
    if (guardResult.isCrisis) {
      return {
        reply: '我注意到你可能需要帮助。请拨打24小时心理援助热线：400-161-9995。',
        blocked: true
      }
    }
  } catch (err) {
    logger.error('chatService', 'Guard check failed, blocking message', err)
    return {
      reply: 'AI安全检查服务暂不可用，请稍后再试。',
      blocked: true
    }
  }

  const systemPrompt = buildSystemPrompt(context)
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),
    { role: 'user', content: userMessage }
  ]

  try {
    const reply = await chat({ messages, temperature: 0.7, petId: context.petId })

    const outputCheck = await guardCheckOutput(reply)
    if (outputCheck.isUnsafeMedicalAdvice) {
      return {
        reply: '根据我的分析，建议你咨询专业兽医进行确认。以上信息仅供参考，不替代兽医诊断。',
        blocked: false
      }
    }

    return {
      reply: sanitizeOutput(reply, 2000),
      blocked: false
    }
  } catch (err) {
    logger.error('chatService', 'AI chat failed', err)
    return {
      reply: '抱歉，我现在有点走神了…请稍后再试，或者试试点击快捷按钮进行打卡/查食物。',
      blocked: false
    }
  }
}
