export type SidebarPanelModuleId = string

export type SidebarPanelModule = {
  id: SidebarPanelModuleId
  title: string
  icon: string
  description: string
  personaIds: string[]
}

export type SidebarPanelState = {
  activeModuleIds: SidebarPanelModuleId[]
  availableModules: SidebarPanelModule[]
}
