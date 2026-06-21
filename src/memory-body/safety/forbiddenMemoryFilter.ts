export interface ForbiddenMemoryResult {
  forbidden: boolean
  reason?: 'user_requested_no_memory' | 'forbidden_secret'
}

const noMemoryPatterns = [
  /不要记/i,
  /别记/i,
  /不要保存/i,
  /不要写入记忆/i,
  /这段别记/i,
  /临时聊天/i
]

export function detectForbiddenMemoryInstruction(content: string): ForbiddenMemoryResult {
  if (noMemoryPatterns.some(pattern => pattern.test(content))) {
    return { forbidden: true, reason: 'user_requested_no_memory' }
  }
  return { forbidden: false }
}
