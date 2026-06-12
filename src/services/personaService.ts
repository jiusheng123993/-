import {
  personaRepository,
  type CustomPersona,
  type CreatePersonaInput,
  type UpdatePersonaInput
} from '../data/repositories'

const MAX_PERSONAS_PER_USER = 10

export const personaService = {
  async createPersona(userId: string, input: Omit<CreatePersonaInput, 'userId'>): Promise<CustomPersona> {
    if (!input.name.trim()) throw new Error('人格名称不能为空')

    const existing = await personaRepository.findByUserId(userId)
    if (existing.length >= MAX_PERSONAS_PER_USER) {
      throw new Error(`最多创建 ${MAX_PERSONAS_PER_USER} 个人格`)
    }

    return personaRepository.create({ ...input, userId })
  },

  async updatePersona(personaId: string, patch: UpdatePersonaInput): Promise<CustomPersona> {
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new Error('人格名称不能为空')
    }
    return personaRepository.update(personaId, patch)
  },

  async publishPersona(personaId: string): Promise<CustomPersona> {
    return personaRepository.update(personaId, {
      isPublished: true,
      safetyStatus: 'pending'
    })
  },

  async getMyPersonas(userId: string): Promise<CustomPersona[]> {
    return personaRepository.findByUserId(userId)
  },

  async deletePersona(personaId: string): Promise<void> {
    return personaRepository.delete(personaId)
  }
}
