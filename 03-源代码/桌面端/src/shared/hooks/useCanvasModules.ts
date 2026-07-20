import { useCallback } from 'react'
import {
  addModuleToLayout,
  exportModuleLayout,
  importModuleLayout,
  removeModuleFromLayout,
  upsertCustomModule
} from '../module-store/moduleStoreLogic'
import type { CanvasItem, ModuleStoreState } from '../module-store/types'
import { defaultModules } from '../module-store/ModuleRegistry'

export interface CanvasModulesActions {
  addCanvasModule: (moduleId: string) => void
  removeCanvasModule: (moduleId: string, deleteCustomModule?: boolean) => void
  updateCanvasItems: (items: CanvasItem[]) => void
  createCustomCanvasModule: (module: ModuleStoreState['availableModules'][number]) => void
  applyRecommendedModules: (moduleIds: string[]) => void
  importLayout: (value: string) => void
  moveWorkbenchItem: (moduleId: string, position: { x: number; y: number }) => void
}

export interface UseCanvasModulesParams {
  moduleStoreState: ModuleStoreState
  setModuleStoreState: React.Dispatch<React.SetStateAction<ModuleStoreState>>
  setLayoutImportError: (error: string | null) => void
}

export function useCanvasModules({
  _moduleStoreState,
  setModuleStoreState,
  setLayoutImportError
}: UseCanvasModulesParams): CanvasModulesActions {
  const addCanvasModule = useCallback((moduleId: string) => {
    setModuleStoreState((current) => addModuleToLayout(current, moduleId))
  }, [setModuleStoreState])

  const removeCanvasModule = useCallback((moduleId: string, deleteCustomModule = false) => {
    setModuleStoreState((current) => removeModuleFromLayout(current, moduleId, { deleteCustomModule }))
  }, [setModuleStoreState])

  const updateCanvasItems = useCallback((items: CanvasItem[]) => {
    setModuleStoreState((current) => ({ ...current, activeModules: items }))
  }, [setModuleStoreState])

  const createCustomCanvasModule = useCallback((module: ModuleStoreState['availableModules'][number]) => {
    setModuleStoreState((current) => upsertCustomModule(current, module))
  }, [setModuleStoreState])

  const applyRecommendedModules = useCallback((moduleIds: string[]) => {
    setModuleStoreState((current) => moduleIds.reduce((state, moduleId) => addModuleToLayout(state, moduleId), current))
  }, [setModuleStoreState])

  const importLayout = useCallback((value: string) => {
    try {
      setModuleStoreState(importModuleLayout(value, defaultModules))
      setLayoutImportError(null)
    } catch (error) {
      setLayoutImportError(error instanceof Error ? error.message : '布局导入失败')
    }
  }, [setModuleStoreState, setLayoutImportError])

  const moveWorkbenchItem = useCallback((moduleId: string, position: { x: number; y: number }) => {
    setModuleStoreState((current) => {
      const target = current.activeModules.find((item) => item.moduleId === moduleId)
      if (!target) return current
      const next = importModuleLayout(exportModuleLayout(current), current.availableModules)
      return {
        ...next,
        activeModules: next.activeModules.map((item) =>
          item.moduleId === moduleId ? { ...item, position } : item
        )
      }
    })
  }, [setModuleStoreState])

  return {
    addCanvasModule,
    removeCanvasModule,
    updateCanvasItems,
    createCustomCanvasModule,
    applyRecommendedModules,
    importLayout,
    moveWorkbenchItem
  }
}
