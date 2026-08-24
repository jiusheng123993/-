/**
 * Mock 数据服务
 *
 * 提供开发/测试阶段的模拟数据，涵盖宠物、打卡、趋势、家庭、动态等场景
 */
import type { User, Pet, Checkin, Membership } from '../types'
import type { PetFamily, PetFamilyMember, PetLineage, PetMoment, FamilyPhoto, LineageResponse } from '../types/familyTypes'
import type { PetHealthEntry } from '../memory-body/types/memoryBodyTypes'
import type { MemoryEntry, MemoryUpdateResult } from '../types/memoryTypes'

const mockUsers: User[] = [
  { id: 'user_001', nickname: '宠物家长', avatar: 'https://via.placeholder.com/100', phone: '13800138000', createdAt: '2024-01-01T00:00:00Z' },
]

const mockPets: Pet[] = [
  { id: 'pet_001', userId: 'user_001', name: '小橘', species: 'cat', breed: '橘猫', gender: 'male', birthday: '2023-06-15', weight: 5.2, avatar: 'https://via.placeholder.com/100', isDeceased: false, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
  { id: 'pet_002', userId: 'user_001', name: '旺财', species: 'dog', breed: '金毛', gender: 'male', birthday: '2022-03-10', weight: 28.5, avatar: 'https://via.placeholder.com/100', isDeceased: false, createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
]

const mockCheckins: Checkin[] = [
  { id: 'ck_001', petId: 'pet_001', userId: 'user_001', date: '2024-07-22', mood: 'happy', appetite: 'good', stool: 'normal', weight: 5.2, note: '今天精神很好', createdAt: '2024-07-22T08:00:00Z' },
  { id: 'ck_002', petId: 'pet_001', userId: 'user_001', date: '2024-07-21', mood: 'normal', appetite: 'normal', stool: 'normal', createdAt: '2024-07-21T08:00:00Z' },
  { id: 'ck_003', petId: 'pet_002', userId: 'user_001', date: '2024-07-22', mood: 'happy', appetite: 'good', stool: 'normal', weight: 28.5, createdAt: '2024-07-22T08:00:00Z' },
]

/** 生成 60 天的模拟健康数据（含异常/风险标记） */
function generateMockHealthEntries(): PetHealthEntry[] {
  const now = new Date()
  const entries: PetHealthEntry[] = []
  const petId = 'pet_001'

  for (let i = 0; i < 60; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const appetiteLevel = (i % 10 === 0 ? 1 : i % 8 === 0 ? 6 : i % 5 === 0 ? 2 : 3) as PetHealthEntry['appetiteLevel']
    const spiritLevel = (i % 12 === 0 ? 1 : i % 7 === 0 ? 2 : i % 6 === 0 ? 5 : 4) as PetHealthEntry['spiritLevel']
    const poopLevel = (i % 15 === 0 ? 1 : i % 10 === 0 ? 2 : i % 7 === 0 ? 4 : 3) as PetHealthEntry['poopLevel']
    const exerciseLevel = (i % 5 === 0 ? 1 : i % 4 === 0 ? 3 : 2) as PetHealthEntry['exerciseLevel']

    const weightBase = 5.2
    const weightVariation = Math.sin(i * 0.3) * 0.15 + (i < 30 ? 0 : (i - 30) * 0.01)
    const weight = parseFloat((weightBase + weightVariation).toFixed(2))

    const hasAnomaly = appetiteLevel <= 2 || spiritLevel <= 2 || poopLevel <= 2
    const anomalyItems: PetHealthEntry['anomalyItems'] = []
    if (appetiteLevel <= 2) anomalyItems.push('appetite')
    if (spiritLevel <= 2) anomalyItems.push('spirit')
    if (poopLevel <= 2) anomalyItems.push('poop')

    let riskLevel: PetHealthEntry['riskLevel'] = 'low'
    if (poopLevel === 1 || appetiteLevel === 6 || (appetiteLevel === 1 && spiritLevel === 1)) {
      riskLevel = 'emergency'
    } else if (appetiteLevel <= 2 && spiritLevel <= 2) {
      riskLevel = 'high'
    } else if (appetiteLevel <= 2 || poopLevel <= 2 || hasAnomaly) {
      riskLevel = 'medium'
    }

    entries.push({
      id: `he_${String(i).padStart(3, '0')}`,
      petId,
      userId: 'user_001',
      appetiteLevel,
      spiritLevel,
      poopLevel,
      exerciseLevel,
      weight,
      hasAnomaly,
      anomalyItems,
      riskLevel,
      note: i % 5 === 0 ? '今日状态记录' : undefined,
      createdAt: date,
    })
  }

  return entries
}

const mockHealthEntries: PetHealthEntry[] = generateMockHealthEntries()

const mockMemberships: Membership[] = [
  { id: 'mem_001', userId: 'user_001', level: 'free', status: 'active', startDate: '2024-01-01', endDate: '2099-12-31', createdAt: '2024-01-01T00:00:00Z' },
]

const mockFamilies: PetFamily[] = [
  { id: 'fam_001', userId: 'user_001', name: '星澜小筑', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
]

const mockFamilyMembers: PetFamilyMember[] = [
  { id: 'fmem_001', familyId: 'fam_001', petId: 'pet_001', role: '老大', joinedAt: '2024-01-01T00:00:00Z' },
  { id: 'fmem_002', familyId: 'fam_001', petId: 'pet_002', role: '团宠', joinedAt: '2024-02-01T00:00:00Z' },
]

const mockFamilyPhotos: FamilyPhoto[] = [
  {
    id: 'fph_001',
    familyId: 'fam_001',
    userId: 'user_001',
    photoUrl: '',
    photoType: 'generated',
    memberCount: 2,
    memberNames: ['小橘', '旺财'],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'fph_002',
    familyId: 'fam_001',
    userId: 'user_001',
    photoUrl: '',
    photoType: 'uploaded',
    description: '小橘第一次洗澡的搞笑瞬间',
    memberCount: 1,
    memberNames: ['小橘'],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
]

const mockLineages: PetLineage[] = []

/** 生成模拟的宠物动态数据（打卡/里程碑/照片/回忆） */
function generateMockMoments(): PetMoment[] {
  const now = new Date()
  const moments: PetMoment[] = [
    {
      id: 'mom_001',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_001',
      type: 'checkin',
      content: { petName: '小橘', petEmoji: '🐱', action: '完成了今日健康打卡', appetite: '胃口很好', mood: '精神饱满', score: 95 },
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
    {
      id: 'mom_002',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_002',
      type: 'checkin',
      content: { petName: '旺财', petEmoji: '🐕', action: '完成了今日健康打卡', appetite: '正常', mood: '活泼', score: 88 },
      createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
    },
    {
      id: 'mom_003',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_001',
      type: 'milestone',
      content: { petName: '小橘', petEmoji: '🐱', title: '小橘满1岁了！', description: '从一只小奶猫成长为亭亭玉立的大猫咪' },
      photos: ['https://via.placeholder.com/400x300/FFE4C4/333?text=小橘1岁'],
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
    },
    {
      id: 'mom_004',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_002',
      type: 'photo',
      content: { petName: '旺财', petEmoji: '🐕', description: '带旺财去公园散步，遇到了好多小伙伴' },
      photos: ['https://via.placeholder.com/400x300/98FB98/333?text=公园散步'],
      createdAt: new Date(now.getTime() - 36 * 3600000).toISOString(),
    },
    {
      id: 'mom_005',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_001',
      type: 'memory',
      content: { petName: '小橘', petEmoji: '🐱', description: '一年前的今天，小橘第一次来到家里，躲在沙发下面不敢出来' },
      createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
    },
    {
      id: 'mom_006',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_002',
      type: 'milestone',
      content: { petName: '旺财', petEmoji: '🐕', title: '学会新技能：握手', description: '旺财今天学会了握手，聪明的小家伙！' },
      createdAt: new Date(now.getTime() - 60 * 3600000).toISOString(),
    },
    {
      id: 'mom_007',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_001',
      type: 'checkin',
      content: { petName: '小橘', petEmoji: '🐱', action: '体重突破5kg', appetite: '吃得有点多', mood: '懒洋洋', score: 78 },
      createdAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
    },
    {
      id: 'mom_008',
      userId: 'user_001',
      familyId: 'fam_001',
      petId: 'pet_002',
      type: 'photo',
      content: { petName: '旺财', petEmoji: '🐕', description: '旺财的新玩具，玩得不亦乐乎' },
      photos: ['https://via.placeholder.com/400x300/FFD700/333?text=新玩具'],
      createdAt: new Date(now.getTime() - 96 * 3600000).toISOString(),
    },
  ]
  return moments
}

const mockMoments = generateMockMoments()

let delay = 300

function wait(ms?: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms ?? delay))
}

/** Mock API 实例 - 模拟全部后端接口响应 */
export const mockApi = {
  /** 模拟微信登录 */
  login: async (code: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    await wait()
    return { user: mockUsers[0], token: 'mock_token_' + Date.now(), refreshToken: 'mock_refresh_' + Date.now() }
  },
  getUser: async (): Promise<User> => {
    await wait()
    return mockUsers[0]
  },
  updateProfile: async (nickname: string, avatarUrl: string): Promise<User> => {
    // Mock 模式：直接更新第一个用户，模拟服务端行为
    await wait()
    mockUsers[0] = { ...mockUsers[0], nickname, avatar: avatarUrl }
    return mockUsers[0]
  },
  getPets: async (userId: string): Promise<Pet[]> => {
    await wait()
    return mockPets.filter(p => p.userId === userId)
  },
  getPet: async (petId: string): Promise<Pet | null> => {
    await wait()
    return mockPets.find(p => p.id === petId) || null
  },
  createPet: async (data: Partial<Pet>): Promise<Pet> => {
    await wait()
    const pet: Pet = { id: 'pet_' + Date.now(), userId: 'user_001', name: data.name || '', species: data.species || 'cat', breed: data.breed || '', gender: data.gender || 'male', birthday: data.birthday || '', weight: data.weight || 0, avatar: data.avatar || '', isDeceased: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    mockPets.push(pet)
    return pet
  },
  updatePet: async (petId: string, data: Partial<Pet>): Promise<Pet> => {
    await wait()
    const idx = mockPets.findIndex(p => p.id === petId)
    if (idx === -1) throw new Error('Pet not found')
    mockPets[idx] = { ...mockPets[idx], ...data, updatedAt: new Date().toISOString() }
    return mockPets[idx]
  },
  deletePet: async (petId: string): Promise<void> => {
    await wait()
    const idx = mockPets.findIndex(p => p.id === petId)
    if (idx !== -1) mockPets.splice(idx, 1)
  },
  getCheckins: async (petId: string): Promise<Checkin[]> => {
    await wait()
    return mockCheckins.filter(c => c.petId === petId).sort((a, b) => b.date.localeCompare(a.date))
  },
  createCheckin: async (data: Partial<Checkin>): Promise<Checkin> => {
    await wait()
    const checkin: Checkin = { id: 'ck_' + Date.now(), petId: data.petId || '', userId: 'user_001', date: data.date || new Date().toISOString().split('T')[0], mood: data.mood || 'normal', appetite: data.appetite || 'normal', stool: data.stool || 'normal', weight: data.weight, temperature: data.temperature, note: data.note, createdAt: new Date().toISOString() }
    mockCheckins.push(checkin)
    return checkin
  },
  getMembership: async (userId: string): Promise<Membership | null> => {
    await wait()
    return mockMemberships.find(m => m.userId === userId) || null
  },

  // --- Family mock APIs ---
  getFamilies: async (): Promise<PetFamily[]> => {
    await wait()
    return [...mockFamilies]
  },
  createFamily: async (name: string): Promise<PetFamily> => {
    await wait()
    const family: PetFamily = {
      id: 'fam_' + Date.now(),
      userId: 'user_001',
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockFamilies.push(family)
    return family
  },
  getMembers: async (familyId: string): Promise<PetFamilyMember[]> => {
    await wait()
    return mockFamilyMembers.filter(m => m.familyId === familyId)
  },
  addMember: async (familyId: string, petId: string, role?: string): Promise<void> => {
    await wait()
    const member: PetFamilyMember = {
      id: 'fmem_' + Date.now(),
      familyId,
      petId,
      role,
      joinedAt: new Date().toISOString(),
    }
    mockFamilyMembers.push(member)
  },
  removeMember: async (familyId: string, memberId: string): Promise<void> => {
    await wait()
    const idx = mockFamilyMembers.findIndex(m => m.familyId === familyId && m.id === memberId)
    if (idx !== -1) mockFamilyMembers.splice(idx, 1)
  },
  updateMemberRole: async (familyId: string, memberId: string, role: string): Promise<void> => {
    await wait()
    const member = mockFamilyMembers.find(m => m.familyId === familyId && m.id === memberId)
    if (member) member.role = role
  },
  getLineage: async (petId: string): Promise<LineageResponse> => {
    await wait()
    const parents = mockLineages.filter(l => l.childId === petId)
    const children = mockLineages.filter(l => l.parentId === petId)
    return {
      pet: { id: petId, name: 'Mock Pet', avatarUrl: null, species: null },
      ancestorsLevels: [],
      descendantsLevels: [],
      parents,
      children,
      siblings: [],
      mates: [],
    }
  },
  addLineage: async (parentId: string, childId: string, litterDate?: string): Promise<void> => {
    await wait()
    mockLineages.push({
      id: 'lin_' + Date.now(),
      familyId: 'mock_family',
      parentId,
      childId,
      litterDate,
    })
  },
  removeLineage: async (lineageId: string): Promise<void> => {
    await wait()
    const idx = mockLineages.findIndex(l => l.id === lineageId)
    if (idx !== -1) mockLineages.splice(idx, 1)
  },
  createRelationship: async (): Promise<void> => {
    await wait()
  },
  deleteRelationship: async (relationshipId: string): Promise<void> => {
    await wait()
  },

  getFamilyPhotos: async (familyId: string): Promise<FamilyPhoto[]> => {
    await wait()
    return mockFamilyPhotos.filter(p => p.familyId === familyId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  saveFamilyPhoto: async (familyId: string, photoUrl: string, memberCount: number, memberNames: string[], photoType: 'canvas_fallback' | 'uploaded' = 'canvas_fallback', description?: string): Promise<FamilyPhoto> => {
    await wait()
    const photo: FamilyPhoto = {
      id: 'fph_' + Date.now(),
      familyId,
      userId: 'user_001',
      photoUrl,
      photoType,
      description,
      memberCount,
      memberNames,
      createdAt: new Date().toISOString(),
    }
    mockFamilyPhotos.push(photo)
    return photo
  },
  deleteFamilyPhoto: async (photoId: string): Promise<void> => {
    await wait()
    const idx = mockFamilyPhotos.findIndex(p => p.id === photoId)
    if (idx !== -1) mockFamilyPhotos.splice(idx, 1)
  },

  getHealthCheckinsByDateRange: async (petId: string, startDate: string, endDate: string): Promise<PetHealthEntry[]> => {
    await wait()
    return mockHealthEntries.filter(e => {
      const dateStr = e.createdAt instanceof Date ? e.createdAt.toISOString().slice(0, 10) : String(e.createdAt).slice(0, 10)
      return e.petId === petId && dateStr >= startDate && dateStr <= endDate
    })
  },

  getTrendData: async (petId: string, startDate: string, endDate: string): Promise<any[]> => {
    await wait(200)
    const entries = mockHealthEntries.filter(e => {
      const dateStr = e.createdAt instanceof Date ? e.createdAt.toISOString().slice(0, 10) : String(e.createdAt).slice(0, 10)
      return e.petId === petId && dateStr >= startDate && dateStr <= endDate
    })

    return entries.map(e => ({
      date: e.createdAt instanceof Date ? e.createdAt.toISOString().slice(0, 10) : String(e.createdAt).slice(0, 10),
      weight: e.weight,
      appetite: e.appetiteLevel === 1 ? 'none' : e.appetiteLevel === 2 ? 'decreased' : e.appetiteLevel === 3 ? 'normal' : e.appetiteLevel === 4 ? 'increased' : e.appetiteLevel === 5 ? 'increased' : 'vomiting' as const,
      energy: e.spiritLevel === 1 ? 'lethargic' : e.spiritLevel === 2 ? 'low' : e.spiritLevel === 3 ? 'normal' : e.spiritLevel === 4 ? 'normal' : 'high' as const,
      stool: e.poopLevel === 1 ? 'bloody' : e.poopLevel === 2 ? 'diarrhea' : e.poopLevel === 3 ? 'normal' : e.poopLevel === 4 ? 'soft' : 'constipation' as const,
      vomiting: e.appetiteLevel === 6,
      riskLevel: e.riskLevel,
      hasAbnormal: e.riskLevel !== 'low',
    }))
  },

  getTrendSummary: async (petId: string, period: string): Promise<any> => {
    await wait(300)
    const now = new Date()
    let days = 7
    if (period === 'month') days = 30
    else if (period === 'quarter') days = 90

    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().slice(0, 10)
    const endStr = now.toISOString().slice(0, 10)

    const dataPoints = await mockApi.getTrendData(petId, startStr, endStr)
    const withWeight = dataPoints.filter((d: any) => d.weight !== undefined && d.weight !== null)
    const sorted = [...withWeight].sort((a: any, b: any) => a.date.localeCompare(b.date))
    const weightChange = sorted.length >= 2 ? sorted[sorted.length - 1].weight - sorted[0].weight : 0
    const weightChangePercent = sorted.length >= 2 && sorted[0].weight !== 0 ? (weightChange / sorted[0].weight) * 100 : 0

    let weightTrend: string = 'stable'
    if (weightChangePercent > 5) weightTrend = 'increasing'
    else if (weightChangePercent < -5) weightTrend = 'decreasing'

    const appetiteStats: Record<string, number> = { normal: 0, decreased: 0, increased: 0, none: 0 }
    const stoolStats: Record<string, number> = { normal: 0, soft: 0, diarrhea: 0, constipation: 0, bloody: 0 }
    for (const dp of dataPoints) {
      if (dp.appetite) appetiteStats[dp.appetite] = (appetiteStats[dp.appetite] || 0) + 1
      if (dp.stool) stoolStats[dp.stool] = (stoolStats[dp.stool] || 0) + 1
    }

    const abnormalDays = dataPoints.filter((d: any) => d.hasAbnormal).length
    const totalDays = dataPoints.length

    const aiParts: string[] = []
    if (weightTrend === 'stable') aiParts.push('体重保持稳定，这是健康的好迹象。')
    else if (weightTrend === 'increasing') aiParts.push(`体重增长${weightChangePercent.toFixed(1)}%，建议关注饮食和运动量。`)
    else aiParts.push(`体重下降${Math.abs(weightChangePercent).toFixed(1)}%，建议密切观察。`)
    aiParts.push('食欲整体正常，饮食状况良好。')
    aiParts.push('排便情况整体正常。')
    if (abnormalDays / totalDays < 0.1) aiParts.push('整体健康状况良好，继续保持！')

    return {
      petId,
      period,
      weightTrend,
      weightChange: parseFloat(weightChange.toFixed(2)),
      weightChangePercent: parseFloat(weightChangePercent.toFixed(1)),
      appetiteStats,
      stoolStats,
      abnormalDays,
      totalDays,
      aiAnalysis: aiParts.join(''),
    }
  },

  getMonthlyReport: async (petId: string, month: string): Promise<any> => {
    await wait(300)
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const summary = await mockApi.getTrendSummary(petId, 'month')
    return {
      petId,
      month,
      summary,
      highlights: ['体重保持稳定', '食欲整体良好', '排便情况正常'],
      concerns: [],
      recommendations: ['建议定期进行年度体检'],
    }
  },

  getMoments: async (familyId: string, limit?: number): Promise<PetMoment[]> => {
    await wait(200)
    let result = mockMoments.filter(m => m.familyId === familyId)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (limit && limit > 0) {
      result = result.slice(0, limit)
    }
    return result
  },

  getNewMoments: async (familyId: string, since: string): Promise<PetMoment[]> => {
    await wait(150)
    const sinceTime = new Date(since).getTime()
    const result = mockMoments.filter(
      m => m.familyId === familyId && new Date(m.createdAt).getTime() > sinceTime
    )
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return result
  },

  /** Mock：AI 记忆列表（空） */
  listMemories: async (_petId?: string): Promise<MemoryEntry[]> => {
    await wait(200)
    return []
  },

  /** Mock：修正记忆 */
  updateMemory: async (memoryId: number, content: string): Promise<MemoryUpdateResult> => {
    await wait(200)
    return { id: memoryId, content }
  },
}
