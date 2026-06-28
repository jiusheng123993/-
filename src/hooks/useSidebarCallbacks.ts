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

  const onOpenKnowledgeGraph = useCallback(() => {
    closeAllSidebarPanels('knowledgeGraph')
  }, [closeAllSidebarPanels])

  const onOpenMembership = useCallback(() => {
    closeAllSidebarPanels('membership')
  }, [closeAllSidebarPanels])

  const onOpenDataBackup = useCallback(() => {
    closeAllSidebarPanels('dataBackup')
  }, [closeAllSidebarPanels])

  const onOpenApiKeySettings = useCallback(() => {
    closeAllSidebarPanels('apiKeySettings')
  }, [closeAllSidebarPanels])

  const onOpenSupabaseConfig = useCallback(() => {
    closeAllSidebarPanels('supabaseConfig')
  }, [closeAllSidebarPanels])

  const onOpenMigration = useCallback(() => {
    closeAllSidebarPanels('migration')
  }, [closeAllSidebarPanels])

  const onOpenMemoryStarMap = useCallback(() => {
    closeAllSidebarPanels('memoryStarMap')
  }, [closeAllSidebarPanels])

  const onOpenMetricsDashboard = useCallback(() => {
    closeAllSidebarPanels('metricsDashboard')
  }, [closeAllSidebarPanels])

  return {
    onOpenModuleStore,
    onOpenThemePicker,
    onOpenIdentitySelector,
    onOpenPersonaSelector,
    onOpenRelationshipSpace,
    onOpenAgentChat,
    onOpenSettings,
    onOpenKnowledgeGraph,
    onOpenMembership,
    onOpenDataBackup,
    onOpenApiKeySettings,
    onOpenSupabaseConfig,
    onOpenMigration,
    onOpenMemoryStarMap,
    onOpenMetricsDashboard
  }
}
