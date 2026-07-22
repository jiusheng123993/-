const BLOCKED_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now/i,
  /system\s*:/i,
  /\<\/?system\>/i,
  /\<\/?instruction\>/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
]

export function sanitizePrompt(prompt: string): string {
  let cleaned = prompt

  for (const pattern of BLOCKED_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[filtered]')
  }

  cleaned = cleaned
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s{3,}/g, ' ')
    .trim()

  return cleaned
}

export function isPromptSafe(prompt: string): boolean {
  return BLOCKED_PATTERNS.every((p) => !p.test(prompt))
}
