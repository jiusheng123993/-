export type AgeGroup = 'minor' | 'teen' | 'adult'

export interface AgeVerification {
  userId: string
  verifiedAge: number
  verifiedAt: string
  method: 'id_card' | 'wechat_realname' | 'apple_family'
}

export interface AgeGateService {
  verifyAge(userId: string, age: number, method: AgeVerification['method']): void
  getAgeGroup(userId: string): AgeGroup
  canAccessFeature(userId: string, feature: string): boolean
  canUsePersona(userId: string, personaType: 'learning' | 'emotional' | 'custom'): boolean
  isTimeRestricted(userId: string): boolean
  getDailyTimeLimit(userId: string): number
}

const verifications = new Map<string, AgeVerification>()

export function createAgeGateService(): AgeGateService {
  return {
    verifyAge(userId: string, age: number, method: AgeVerification['method']): void {
      const verification: AgeVerification = {
        userId,
        verifiedAge: age,
        verifiedAt: new Date().toISOString(),
        method
      }
      verifications.set(userId, verification)
    },

    getAgeGroup(userId: string): AgeGroup {
      const verification = verifications.get(userId)
      if (!verification) return 'minor'

      const age = verification.verifiedAge
      if (age < 16) return 'minor'
      if (age < 18) return 'teen'
      return 'adult'
    },

    canAccessFeature(userId: string, feature: string): boolean {
      const ageGroup = this.getAgeGroup(userId)

      if (feature === 'learning') return true

      if (feature === 'agent') return ageGroup !== 'minor'

      if (feature === 'custom_persona') return ageGroup === 'adult'

      if (feature === 'emotional_persona') return ageGroup === 'adult'

      return true
    },

    canUsePersona(userId: string, personaType: 'learning' | 'emotional' | 'custom'): boolean {
      const ageGroup = this.getAgeGroup(userId)

      if (personaType === 'learning') return true
      if (personaType === 'emotional') return ageGroup === 'adult'
      if (personaType === 'custom') return ageGroup === 'adult'

      return false
    },

    isTimeRestricted(userId: string): boolean {
      const ageGroup = this.getAgeGroup(userId)
      if (ageGroup === 'adult') return false

      if (ageGroup === 'teen') {
        const hour = new Date().getHours()
        return hour >= 22 || hour < 6
      }

      return true
    },

    getDailyTimeLimit(userId: string): number {
      const ageGroup = this.getAgeGroup(userId)

      if (ageGroup === 'adult') return 0
      if (ageGroup === 'teen') return 60
      return 0
    }
  }
}
