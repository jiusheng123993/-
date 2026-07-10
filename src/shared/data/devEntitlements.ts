import type { EntitlementService } from '../entitlement/entitlementService'

const devUserId = 'dev-user-001'
const devAdminId = 'dev-admin-001'

const devEntitlements: Array<{ code: string; source: string; expireAt: null; remaining?: number }> = [
  { code: 'agent_plus', source: 'early_bird_gift', expireAt: null },
  { code: 'agent', source: 'early_bird_gift', expireAt: null },
  { code: 'study', source: 'early_bird_gift', expireAt: null },
  { code: 'avatar_rpm', source: 'early_bird_gift', expireAt: null },
  { code: 'avatar_ai_gen', source: 'early_bird_gift', expireAt: null, remaining: 999 },
  { code: 'memory_sync', source: 'early_bird_gift', expireAt: null },
  { code: 'evolution_ritual', source: 'early_bird_gift', expireAt: null },
  { code: 'evolution_realtime', source: 'early_bird_gift', expireAt: null },
  { code: 'avatar_evolution', source: 'early_bird_gift', expireAt: null },
  { code: 'agent_tool_call', source: 'early_bird_gift', expireAt: null },
  { code: 'ai_quota', source: 'early_bird_gift', expireAt: null, remaining: 9999 },
  { code: 'persona_cameo', source: 'early_bird_gift', expireAt: null },
  { code: 'persona_custom_slot', source: 'early_bird_gift', expireAt: null },
  { code: 'persona_avatar_ai_gen', source: 'early_bird_gift', expireAt: null, remaining: 999 },
  { code: 'reflection_realtime', source: 'early_bird_gift', expireAt: null },
  { code: 'reflection_weekly', source: 'early_bird_gift', expireAt: null },
  { code: 'reflection_teaser', source: 'early_bird_gift', expireAt: null },
  { code: 'space', source: 'early_bird_gift', expireAt: null },
  { code: 'org', source: 'early_bird_gift', expireAt: null }
]

export function seedDevEntitlements(entitlementService: EntitlementService): void {
  if (!import.meta.env.DEV) return
  for (const userId of [devUserId, devAdminId]) {
    for (const e of devEntitlements) {
      entitlementService.grant(userId, e as Parameters<typeof entitlementService.grant>[1])
    }
  }
}
