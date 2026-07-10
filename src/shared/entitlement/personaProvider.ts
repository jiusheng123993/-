export interface EntitlementService {
  has(userId: string, feature: string): boolean
  consume(userId: string, feature: string, amount: number): { ok: boolean }
}

export interface PersonaProvider {
  canUsePreset(userId: string, personaId: string): boolean
  canUseCameo(userId: string, cameoId: string): boolean
  canCreateCustom(userId: string): boolean
  getCustomSlotCount(userId: string): number
  canGenerateAvatar(userId: string): boolean
  getAvailablePresets(userId: string): string[]
}

export function createPersonaProvider(entitlementService: EntitlementService): PersonaProvider {
  return {
    canUsePreset(userId: string, personaId: string): boolean {
      if (entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')) {
        return true
      }
      return entitlementService.has(userId, `persona_preset_${personaId}`)
    },

    canUseCameo(userId: string, cameoId: string): boolean {
      return entitlementService.has(userId, `persona_cameo_${cameoId}`) ||
             entitlementService.has(userId, 'agent_plus')
    },

    canCreateCustom(userId: string): boolean {
      return entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
    },

    getCustomSlotCount(userId: string): number {
      if (entitlementService.has(userId, 'agent_plus')) return 3
      if (entitlementService.has(userId, 'agent')) return 1
      return 0
    },

    canGenerateAvatar(userId: string): boolean {
      if (!entitlementService.has(userId, 'agent_plus')) return false
      const result = entitlementService.consume(userId, 'avatar_ai_gen', 1)
      return result.ok
    },

    getAvailablePresets(userId: string): string[] {
      if (!this.canUsePreset(userId, '')) return []

      return [
        'senior_buddy',
        'gentle_sister',
        'strict_coach',
        'wise_elder',
        'energetic_pal',
        'pro_secretary'
      ]
    }
  }
}
