export interface User {
  id: string
  nickname: string
  avatar: string
  phone?: string
  createdAt: string
}

export interface Pet {
  id: string
  userId: string
  name: string
  species: 'cat' | 'dog'
  breed: string
  gender: 'male' | 'female'
  birthday: string
  weight: number
  avatar: string
  isDeceased: boolean
  deceasedDate?: string
  createdAt: string
  updatedAt: string
}

export interface Checkin {
  id: string
  petId: string
  userId: string
  date: string
  mood: 'happy' | 'normal' | 'sad'
  appetite: 'good' | 'normal' | 'poor'
  stool: 'normal' | 'loose' | 'hard'
  weight?: number
  temperature?: number
  note?: string
  createdAt: string
}

export interface Membership {
  id: string
  userId: string
  level: 'free' | 'monthly' | 'quarterly' | 'yearly'
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  createdAt: string
}

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

export * from './familyTypes'
export * from './chatTypes'