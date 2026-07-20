import { useCallback } from 'react'
import type { ModuleStoreState } from '../module-store/types'

interface SidebarCallbacksDeps {
  closeAllSidebarPanels: (except?: string) => void
  openThemePicker: () => void
  setModuleStoreState: (v: ModuleStoreState | ((prev: ModuleStoreState) => ModuleStoreState)) => void
}

export function useSidebarCallbacks(deps: SidebarCallbacksDeps) {
  const {
    closeAllSidebarPanels,
    openThemePicker,
    setModuleStoreState
  } = deps

  const onOpenModuleStore = useCallback(() => {
    closeAllSidebarPanels()
    setModuleStoreState((current) => ({ ...current, isStoreOpen: true }))
  }, [closeAllSidebarPanels, setModuleStoreState])

  const onOpenThemePicker = useCallback(() => {
    closeAllSidebarPanels()
    openThemePicker()
  }, [closeAllSidebarPanels, openThemePicker])

  const onOpenIdentitySelector = useCallback(() => {
    closeAllSidebarPanels('identitySelector')
  }, [closeAllSidebarPanels])

  const onOpenPersonaSelector = useCallback(() => {
    closeAllSidebarPanels('personaSelector')
  }, [closeAllSidebarPanels])

  const onOpenRelationshipSpace = useCallback(() => {
    closeAllSidebarPanels('relationshipSpace')
  }, [closeAllSidebarPanels])

  const onOpenAgentChat = useCallback(() => {
    closeAllSidebarPanels('agentChat')
  }, [closeAllSidebarPanels])

  const onOpenSettings = useCallback(() => {
    closeAllSidebarPanels('settings')
  }, [closeAllSidebarPanels])

  const onOpenMembership = useCallback(() => {
    closeAllSidebarPanels('membership')
  }, [closeAllSidebarPanels])

  const onOpenMemoryStarMap = useCallback(() => {
    closeAllSidebarPanels('memoryStarMap')
  }, [closeAllSidebarPanels])

  return {
    onOpenModuleStore,
    onOpenThemePicker,
    onOpenIdentitySelector,
    onOpenPersonaSelector,
    onOpenRelationshipSpace,
    onOpenAgentChat,
    onOpenSettings,
    onOpenMembership,
    onOpenMemoryStarMap
  }
}
