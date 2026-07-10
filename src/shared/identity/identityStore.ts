import type { IdentityState } from './types'

const STORAGE_KEY = 'xinghuanhai_identities'

export const createIdentityStore = () => {
  const load = (): IdentityState => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return createDefaultState()
      return JSON.parse(raw)
    } catch {
      return createDefaultState()
    }
  }

  const save = (state: IdentityState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return { load, save }
}

const createDefaultState = (): IdentityState => ({
  identities: [],
  activeIdentityId: null,
  isCreating: false
})
