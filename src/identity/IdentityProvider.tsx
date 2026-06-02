import { createContext, useContext, useReducer, useEffect } from 'react'
import type { IdentityState, IdentityAction } from './types'
import { createIdentityStore } from './identityStore'

const IdentityContext = createContext<{
  state: IdentityState
  dispatch: React.Dispatch<IdentityAction>
} | null>(null)

const identityReducer = (state: IdentityState, action: IdentityAction): IdentityState => {
  switch (action.type) {
    case 'CREATE_IDENTITY': {
      const newIdentity = {
        ...action.payload,
        id: `identity-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return {
        ...state,
        identities: [...state.identities, newIdentity],
        activeIdentityId: newIdentity.id,
        isCreating: false
      }
    }
    case 'UPDATE_IDENTITY':
      return {
        ...state,
        identities: state.identities.map(i =>
          i.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : i
        )
      }
    case 'DELETE_IDENTITY':
      return {
        ...state,
        identities: state.identities.filter(i => i.id !== action.payload),
        activeIdentityId: state.activeIdentityId === action.payload
          ? state.identities.find(i => i.id !== action.payload)?.id ?? null
          : state.activeIdentityId
      }
    case 'SET_ACTIVE_IDENTITY':
      return { ...state, activeIdentityId: action.payload }
    case 'SET_CREATING':
      return { ...state, isCreating: action.payload }
    default:
      return state
  }
}

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createIdentityStore()
  const [state, dispatch] = useReducer(identityReducer, store.load())

  useEffect(() => {
    store.save(state)
  }, [state])

  return (
    <IdentityContext.Provider value={{ state, dispatch }}>
      {children}
    </IdentityContext.Provider>
  )
}

export const useIdentity = () => {
  const context = useContext(IdentityContext)
  if (!context) throw new Error('useIdentity must be used within IdentityProvider')
  return context
}
