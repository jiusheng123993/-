import type { PersonaScenario, PersonaId as PresetPersonaId } from './personaRegistry'

export type CustomPersonaId = `custom-${string}`
export type AnyPersonaId = PresetPersonaId | CustomPersonaId

export type CustomPersona = Omit<PersonaScenario, 'id'> & {
  id: CustomPersonaId
  createdAt: string
  updatedAt: string
}

export type CustomPersonaInput = {
  name: string
  targetUser: string
  painPoint: string
  primaryFlow: string
  hero: string
  mainModuleTitle: string
  sideModuleTitle: string
  aiRole: string
  keyMetrics: string[]
  modules: PersonaScenario['modules']
  aiActions: PersonaScenario['aiActions']
  recommendedThemeId: PersonaScenario['recommendedThemeId']
}

const STORAGE_KEY = 'growth-workbench-custom-personas'

export const createCustomPersonaId = (): CustomPersonaId => `custom-${crypto.randomUUID()}`

export const createCustomPersona = (input: CustomPersonaInput): CustomPersona => ({
  ...input,
  id: createCustomPersonaId(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

export const loadCustomPersonas = (): CustomPersona[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as CustomPersona[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveCustomPersonas = (personas: CustomPersona[]): void => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(personas))
}

export const addCustomPersona = (input: CustomPersonaInput): CustomPersona => {
  const persona = createCustomPersona(input)
  const existing = loadCustomPersonas()
  saveCustomPersonas([...existing, persona])
  return persona
}

export const updateCustomPersona = (id: CustomPersonaId, updates: Partial<CustomPersonaInput>): CustomPersona | null => {
  const existing = loadCustomPersonas()
  const index = existing.findIndex((p) => p.id === id)
  if (index === -1) return null
  const updated: CustomPersona = { ...existing[index], ...updates, updatedAt: new Date().toISOString() }
  existing[index] = updated
  saveCustomPersonas(existing)
  return updated
}

export const deleteCustomPersona = (id: CustomPersonaId): boolean => {
  const existing = loadCustomPersonas()
  const filtered = existing.filter((p) => p.id !== id)
  if (filtered.length === existing.length) return false
  saveCustomPersonas(filtered)
  return true
}
