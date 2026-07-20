import {
  preferenceRepository,
  type Preference,
  type UpdatePreferenceInput
} from '../data/repositories'

export const preferenceService = {
  async getPreferences(userId: string): Promise<Preference> {
    const pref = await preferenceRepository.findByUserId(userId)
    if (pref) return pref

    return preferenceRepository.upsert(userId, {
      themeId: 'minimal-premium',
      themeMode: 'light',
      aiSettings: {},
      syncSettings: {}
    })
  },

  async updatePreferences(userId: string, patch: UpdatePreferenceInput): Promise<Preference> {
    return preferenceRepository.upsert(userId, patch)
  },

  async setTheme(userId: string, themeId: string, themeMode?: string): Promise<Preference> {
    return preferenceRepository.upsert(userId, { themeId, themeMode })
  },

  async setActivePersona(userId: string, personaId: string | null): Promise<Preference> {
    return preferenceRepository.upsert(userId, { activePersona: personaId })
  }
}
