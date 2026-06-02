import { createContext, useContext, type ReactNode } from 'react'
import { relationshipService } from './relationshipService'
import { realtimeProvider } from './realtimeProvider'
import type { RelationshipService } from './relationshipService'
import type { IRealtimeProvider } from './realtimeProvider'

interface RelationshipContextValue {
  service: RelationshipService
  realtime: IRealtimeProvider
}

const RelationshipContext = createContext<RelationshipContextValue | null>(null)

export function RelationshipSpaceProvider({ children }: { children: ReactNode }) {
  return (
    <RelationshipContext.Provider value={{ service: relationshipService, realtime: realtimeProvider }}>
      {children}
    </RelationshipContext.Provider>
  )
}

export function useRelationship() {
  const context = useContext(RelationshipContext)
  if (!context) {
    throw new Error('useRelationship must be used within RelationshipSpaceProvider')
  }
  return context
}
