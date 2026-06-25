import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import type { ModuleStoreState } from '../module-store/types'

interface SidebarCallbacksDeps {
  closeAllSidebarPanels: (except?: string) => void
  openThemePicker: () => void
  setModuleStoreState: (v: ModuleStoreState | ((prev: ModuleStoreState) => ModuleStoreState)) => void
  setIsIdentitySelectorOpen: (open: boolean) => void
  setIsPersonaSelectorOpen: (open: boolean) => void
  setIsRelationshipSpaceOpen: (open: boolean) => void
  setIsAgentChatOpen: (open: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  setIsKnowledgeGraphOpen: (open: boolean) => void
  setIsMembershipOpen: (open: boolean) => void
  setIsDataBackupOpen: (open: boolean) => void
  setIsApiKeySettingsOpen: (open: boolean) => void
  setIsSupabaseConfigOpen: (open: boolean) => void
  setIsMigrationOpen: (open: boolean) => void
  setIsMemoryStarMapOpen: (open: boolean) => void
  setIsMetricsDashboardOpen: (open: boolean) => void
}

export function useSidebarCallbacks(deps: SidebarCallbacksDeps) {
  const {
    closeAllSidebarPanels,
    openThemePicker,
    setModuleStoreState,
    setIsIdentitySelectorOpen,
    setIsPersonaSelectorOpen,
    setIsRelationshipSpaceOpen,
    setIsAgentChatOpen,
    setIsSettingsOpen,
    setIsKnowledgeGraphOpen,
    setIsMembershipOpen,
    setIsDataBackupOpen,
    setIsApiKeySettingsOpen,
    setIsSupabaseConfigOpen,
    setIsMigrationOpen,
    setIsMemoryStarMapOpen,
    setIsMetricsDashboardOpen
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
    closeAllSidebarPanels()
    flushSync(() => {
      setIsIdentitySelectorOpen(true)
    })
  }, [closeAllSidebarPanels, setIsIdentitySelectorOpen])

  const onOpenPersonaSelector = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsPersonaSelectorOpen(true)
    })
  }, [closeAllSidebarPanels, setIsPersonaSelectorOpen])

  const onOpenRelationshipSpace = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsRelationshipSpaceOpen(true)
    })
  }, [closeAllSidebarPanels, setIsRelationshipSpaceOpen])

  const onOpenAgentChat = useCallback(() => {
    closeAllSidebarPanels('agentChat')
    flushSync(() => {
      setIsAgentChatOpen(true)
    })
  }, [closeAllSidebarPanels, setIsAgentChatOpen])

  const onOpenSettings = useCallback(() => {
    closeAllSidebarPanels()
    setIsSettingsOpen(true)
  }, [closeAllSidebarPanels, setIsSettingsOpen])

  const onOpenKnowledgeGraph = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsKnowledgeGraphOpen(true)
    })
  }, [closeAllSidebarPanels, setIsKnowledgeGraphOpen])

  const onOpenMembership = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsMembershipOpen(true)
    })
  }, [closeAllSidebarPanels, setIsMembershipOpen])

  const onOpenDataBackup = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsDataBackupOpen(true)
    })
  }, [closeAllSidebarPanels, setIsDataBackupOpen])

  const onOpenApiKeySettings = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsApiKeySettingsOpen(true)
    })
  }, [closeAllSidebarPanels, setIsApiKeySettingsOpen])

  const onOpenSupabaseConfig = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsSupabaseConfigOpen(true)
    })
  }, [closeAllSidebarPanels, setIsSupabaseConfigOpen])

  const onOpenMigration = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsMigrationOpen(true)
    })
  }, [closeAllSidebarPanels, setIsMigrationOpen])

  const onOpenMemoryStarMap = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsMemoryStarMapOpen(true)
    })
  }, [closeAllSidebarPanels, setIsMemoryStarMapOpen])

  const onOpenMetricsDashboard = useCallback(() => {
    closeAllSidebarPanels()
    flushSync(() => {
      setIsMetricsDashboardOpen(true)
    })
  }, [closeAllSidebarPanels, setIsMetricsDashboardOpen])

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
