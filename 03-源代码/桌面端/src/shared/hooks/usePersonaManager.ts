import { useCallback, useMemo } from 'react'
import { createAiPromptDraft, getAiProviderById } from '../../ai-partner/ai/aiProvider'
import { getPersonaById, type PersonaId } from '../../ai-partner/personas/personaRegistry'
import { getPersonaTemplateById } from '../../ai-partner/personas/personaTemplates'
import type { WorkspaceState, WorkspaceType } from '../data/workspaceStore'

const personaWorkspaceMap: Record<PersonaId, WorkspaceType> = {
  'exam-student': 'study',
  'office-worker': 'work',
  creator: 'growth',
  'self-growth': 'growth',
  'grad-exam': 'study',
  'civil-service': 'study',
  'cert-exam': 'study',
  'english-cet': 'study'
}

export interface PersonaManagerState {
  activePersona: ReturnType<typeof getPersonaById>
  activeTemplate: ReturnType<typeof getPersonaTemplateById>
  activeWorkspaceType: WorkspaceType
  visibleTasks: WorkspaceState['tasks']
  todoTasks: WorkspaceState['tasks']
  completedTasks: WorkspaceState['tasks']
  nextFocusTask: WorkspaceState['tasks'][0] | undefined
  activeProvider: ReturnType<typeof getAiProviderById>
  promptDraft: ReturnType<typeof createAiPromptDraft>
  weeklyProgress: number
  switchPersona: (personaId: PersonaId) => void
}

export interface UsePersonaManagerParams {
  workspaceState: WorkspaceState
  setWorkspaceState: React.Dispatch<React.SetStateAction<WorkspaceState>>
}

export function usePersonaManager({
  workspaceState,
  setWorkspaceState
}: UsePersonaManagerParams): PersonaManagerState {
  const activePersona = getPersonaById(workspaceState.preferences.activePersona)
  const activeTemplate = getPersonaTemplateById(activePersona.id)
  const activeWorkspaceType = personaWorkspaceMap[activePersona.id]
  const visibleTasks = workspaceState.tasks.filter((task) => task.workspaceType === activeWorkspaceType)
  const todoTasks = visibleTasks.filter((task) => task.status === 'todo')
  const completedTasks = visibleTasks.filter((task) => task.status === 'done')
  const nextFocusTask = todoTasks[0]
  const activeProvider = getAiProviderById(workspaceState.integrations.ai.providerId)
  const promptDraft = useMemo(() => createAiPromptDraft(activeProvider.id, {
    kind: activePersona.aiActions[0],
    input: activePersona.primaryFlow,
    context: `${activePersona.name}：${activePersona.painPoint}`
  }), [activeProvider.id, activePersona])
  const weeklyProgress = visibleTasks.length === 0 ? 0 : Math.round((completedTasks.length / visibleTasks.length) * 100)

  const switchPersona = useCallback((personaId: PersonaId) => {
    setWorkspaceState((current) => {
      const nextPersona = getPersonaById(personaId)
      const shouldUseRecommendedTheme = current.preferences.themeMode === 'persona-recommended'

      return {
        ...current,
        preferences: {
          ...current.preferences,
          activePersona: personaId,
          activeWorkspace: personaWorkspaceMap[personaId],
          themeId: shouldUseRecommendedTheme ? nextPersona.recommendedThemeId : current.preferences.themeId
        }
      }
    })
  }, [setWorkspaceState])

  return {
    activePersona,
    activeTemplate,
    activeWorkspaceType,
    visibleTasks,
    todoTasks,
    completedTasks,
    nextFocusTask,
    activeProvider,
    promptDraft,
    weeklyProgress,
    switchPersona
  }
}
