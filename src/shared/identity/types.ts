export type IdentityId = string

export type IdentityTag =
  | 'student' | 'worker' | 'parent' | 'creator'
  | 'freelancer' | 'entrepreneur' | 'retiree' | 'other'

export type Identity = {
  id: IdentityId
  name: string
  description: string
  tags: IdentityTag[]
  createdAt: string
  updatedAt: string
}

export type IdentityState = {
  identities: Identity[]
  activeIdentityId: IdentityId | null
  isCreating: boolean
}

export type IdentityAction =
  | { type: 'CREATE_IDENTITY'; payload: Omit<Identity, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_IDENTITY'; payload: Identity }
  | { type: 'DELETE_IDENTITY'; payload: IdentityId }
  | { type: 'SET_ACTIVE_IDENTITY'; payload: IdentityId }
  | { type: 'SET_CREATING'; payload: boolean }
