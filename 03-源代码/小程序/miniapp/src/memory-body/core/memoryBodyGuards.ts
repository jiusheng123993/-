// 星寰海 v2.0 - memory-body 输入验证与清理
import type { MoodTag, EmotionIntensity } from '../types/memoryBodyTypes';

/** 验证结果接口 */
export interface GuardResult<T> {
  valid: boolean;
  data?: T;
  errors: string[];
}

/** 情绪标签白名单 */
const VALID_MOOD_TAGS: MoodTag[] = [
  'sad', 'anxious', 'tired', 'lonely', 'unclear',
  'happy', 'calm', 'angry', 'fearful', 'joyful',
  'stressed', 'relaxed', 'frustrated', 'hopeful',
  'guilty', 'ashamed', 'grateful', 'disappointed',
  'nervous', 'confident', 'lonely_deep', 'empty',
  'overwhelmed'
];

/** 情境标签白名单 */
const VALID_CONTEXT_TAGS = ['work', 'family', 'relationship', 'health', 'finance', 'social', 'self_growth', 'other'];

/** 急救触发类型白名单 */
const VALID_TRIGGER_TYPES = ['sad', 'anxious', 'tired', 'lonely', 'unclear'];

/** 危险关键词（用于检测潜在风险） */
const DANGEROUS_PATTERNS = [
  /自杀|想死|不想活了|结束生命/i,
  /伤害自己|自残|割腕/i,
  /站在天台|跳楼|跳下去/i,
];

/** 验证情绪条目 */
export function validateMoodEntry(entry: {
  mood: string;
  intensity: number;
  context?: string[];
  note?: string;
}): GuardResult<{
  mood: MoodTag;
  intensity: EmotionIntensity;
  context: string[];
  note: string;
}> {
  const errors: string[] = [];

  // 验证情绪标签
  if (!VALID_MOOD_TAGS.includes(entry.mood as MoodTag)) {
    errors.push(`无效的情绪标签: ${entry.mood}`);
  }

  // 验证强度范围
  if (entry.intensity < 1 || entry.intensity > 10) {
    errors.push(`情绪强度必须在1-10之间: ${entry.intensity}`);
  }

  // 验证情境标签
  const context = entry.context || [];
  for (const c of context) {
    if (!VALID_CONTEXT_TAGS.includes(c)) {
      errors.push(`无效的情境标签: ${c}`);
    }
  }

  // 验证备注长度
  if (entry.note && entry.note.length > 500) {
    errors.push('备注内容不能超过500字');
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? {
      mood: entry.mood as MoodTag,
      intensity: entry.intensity as EmotionIntensity,
      context,
      note: entry.note || '',
    } : undefined,
    errors,
  };
}

/** 验证急救会话 */
export function validateEmergencySession(session: {
  triggerType: string;
  preIntensity: number;
  content?: Record<string, unknown>;
}): GuardResult<{
  triggerType: string;
  preIntensity: number;
  content: Record<string, unknown>;
}> {
  const errors: string[] = [];

  // 验证触发类型
  if (!VALID_TRIGGER_TYPES.includes(session.triggerType)) {
    errors.push(`无效的触发类型: ${session.triggerType}`);
  }

  // 验证前置强度
  if (session.preIntensity < 1 || session.preIntensity > 10) {
    errors.push(`前置情绪强度必须在1-10之间: ${session.preIntensity}`);
  }

  // 验证内容大小
  if (session.content) {
    const contentSize = JSON.stringify(session.content).length;
    if (contentSize > 10000) {
      errors.push('会话内容过大，请精简后重试');
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? {
      triggerType: session.triggerType,
      preIntensity: session.preIntensity,
      content: session.content || {},
    } : undefined,
    errors,
  };
}

/** 清理文本内容，移除敏感模式 */
export function sanitizeText(text: string): string {
  let cleaned = text;

  // 移除HTML标签
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 移除特殊字符（保留中文、英文、数字、基本标点）
  cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\n\r\t，。！？、；：""''（）【】《》—…·\-_.,!?;:()\[\]{}]/g, '');

  // 移除连续空格
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 限制长度
  if (cleaned.length > 1000) {
    cleaned = cleaned.substring(0, 1000);
  }

  return cleaned;
}

/** 检测文本中的危险内容 */
export function detectDangerousContent(text: string): {
  detected: boolean;
  patterns: string[];
} {
  const matchedPatterns: string[] = [];

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      matchedPatterns.push(pattern.source);
    }
  }

  return {
    detected: matchedPatterns.length > 0,
    patterns: matchedPatterns,
  };
}

/** 验证树洞帖子 */
export function validateTreeholePost(post: {
  content: string;
}): GuardResult<{ content: string }> {
  const errors: string[] = [];

  // 验证内容长度
  if (!post.content || post.content.trim().length === 0) {
    errors.push('内容不能为空');
  } else if (post.content.length > 500) {
    errors.push('内容不能超过500字');
  }

  // 检测危险内容
  const dangerCheck = detectDangerousContent(post.content);
  if (dangerCheck.detected) {
    errors.push('内容包含敏感信息，请修改后重试');
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? { content: sanitizeText(post.content) } : undefined,
    errors,
  };
}
