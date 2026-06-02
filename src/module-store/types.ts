export type ModuleId = string

export type ModuleSize = 'small' | 'medium' | 'large' | 'full-width'

export type ModuleCategory = 'productivity' | 'learning' | 'health' | 'life' | 'custom'

export type Module = {
  id: ModuleId
  title: string
  description: string
  icon: string
  category: ModuleCategory
  size: ModuleSize
  isDefault: boolean
  isCustom: boolean
}

export type CanvasItem = {
  moduleId: ModuleId
  position: { x: number; y: number }
  size: ModuleSize
}

export type ModuleStoreState = {
  availableModules: Module[]
  activeModules: CanvasItem[]
  isStoreOpen: boolean
}

export type ModuleStoreAction =
  | { type: 'ADD_MODULE'; payload: ModuleId }
  | { type: 'REMOVE_MODULE'; payload: ModuleId }
  | { type: 'UPDATE_MODULE_POSITION'; payload: { moduleId: ModuleId; position: { x: number; y: number } } }
  | { type: 'UPDATE_MODULE_SIZE'; payload: { moduleId: ModuleId; size: ModuleSize } }
  | { type: 'TOGGLE_STORE'; payload: boolean }
  | { type: 'CREATE_CUSTOM_MODULE'; payload: Omit<Module, 'id' | 'isDefault'> }
