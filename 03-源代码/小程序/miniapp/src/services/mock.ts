import type { User, Pet, Checkin, Membership } from '../types'

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

const mockMemberships: Membership[] = [
  { id: 'mem_001', userId: 'user_001', level: 'free', status: 'active', startDate: '2024-01-01', endDate: '2099-12-31', createdAt: '2024-01-01T00:00:00Z' },
]

let delay = 300

function wait(ms?: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms ?? delay))
}

export const mockApi = {
  login: async (code: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    await wait()
    return { user: mockUsers[0], token: 'mock_token_' + Date.now(), refreshToken: 'mock_refresh_' + Date.now() }
  },
  getUser: async (): Promise<User> => {
    await wait()
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
}