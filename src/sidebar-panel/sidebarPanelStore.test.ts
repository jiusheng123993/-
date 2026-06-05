import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  SIDEBAR_PANEL_MODULES,
  PERSONA_DEFAULT_SIDEBAR_MODULES,
  loadSidebarPanelState,
  saveSidebarPanelState
} from './sidebarPanelStore'

describe('sidebarPanelStore', () => {
  describe('SIDEBAR_PANEL_MODULES', () => {
    it('contains all 12 module types', () => {
      expect(SIDEBAR_PANEL_MODULES).toHaveLength(12)
    })

    it('each module has required fields', () => {
      for (const mod of SIDEBAR_PANEL_MODULES) {
        expect(mod.id).toBeTruthy()
        expect(mod.title).toBeTruthy()
        expect(mod.icon).toBeTruthy()
        expect(mod.description).toBeTruthy()
        expect(Array.isArray(mod.personaIds)).toBe(true)
        expect(mod.personaIds.length).toBeGreaterThan(0)
      }
    })

    it('all module ids are unique', () => {
      const ids = SIDEBAR_PANEL_MODULES.map((m) => m.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('pomodoro module is available for all personas', () => {
      const pomodoro = SIDEBAR_PANEL_MODULES.find((m) => m.id === 'side-pomodoro')
      expect(pomodoro).toBeDefined()
      expect(pomodoro!.personaIds).toContain('exam-student')
      expect(pomodoro!.personaIds).toContain('office-worker')
      expect(pomodoro!.personaIds).toContain('creator')
      expect(pomodoro!.personaIds).toContain('self-growth')
    })

    it('meeting-actions module is only for office-worker', () => {
      const meeting = SIDEBAR_PANEL_MODULES.find((m) => m.id === 'side-meeting-actions')
      expect(meeting).toBeDefined()
      expect(meeting!.personaIds).toEqual(['office-worker'])
    })

    it('idea-inbox module is only for creator', () => {
      const idea = SIDEBAR_PANEL_MODULES.find((m) => m.id === 'side-idea-inbox')
      expect(idea).toBeDefined()
      expect(idea!.personaIds).toEqual(['creator'])
    })
  })

  describe('PERSONA_DEFAULT_SIDEBAR_MODULES', () => {
    it('exam-student has 4 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['exam-student']).toHaveLength(4)
    })

    it('office-worker has 4 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['office-worker']).toHaveLength(4)
    })

    it('creator has 4 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['creator']).toHaveLength(4)
    })

    it('self-growth has 4 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['self-growth']).toHaveLength(4)
    })

    it('all default module ids exist in SIDEBAR_PANEL_MODULES', () => {
      const allModuleIds = new Set(SIDEBAR_PANEL_MODULES.map((m) => m.id))
      for (const ids of Object.values(PERSONA_DEFAULT_SIDEBAR_MODULES)) {
        for (const id of ids) {
          expect(allModuleIds.has(id)).toBe(true)
        }
      }
    })
  })

  describe('loadSidebarPanelState', () => {
    beforeEach(() => {
      vi.stubGlobal('window', undefined)
    })

    it('returns default modules for known persona when no localStorage', () => {
      const ids = loadSidebarPanelState('exam-student')
      expect(ids).toEqual(PERSONA_DEFAULT_SIDEBAR_MODULES['exam-student'])
    })

    it('returns fallback for unknown persona', () => {
      const ids = loadSidebarPanelState('unknown-persona')
      expect(ids).toEqual(['side-pomodoro', 'side-todo'])
    })

    it('returns from localStorage when available', () => {
      const mockStorage: Record<string, string> = {}
      vi.stubGlobal('window', {
        localStorage: {
          getItem: (key: string) => mockStorage[key] ?? null,
          setItem: (key: string, value: string) => { mockStorage[key] = value }
        }
      })

      saveSidebarPanelState('exam-student', ['side-pomodoro', 'side-todo'])
      const ids = loadSidebarPanelState('exam-student')
      expect(ids).toEqual(['side-pomodoro', 'side-todo'])
    })

    it('falls back to default when localStorage has empty array', () => {
      vi.stubGlobal('window', {
        localStorage: {
          getItem: () => '[]',
          setItem: () => {}
        }
      })

      const ids = loadSidebarPanelState('exam-student')
      expect(ids).toEqual(PERSONA_DEFAULT_SIDEBAR_MODULES['exam-student'])
    })

    it('handles corrupted localStorage gracefully', () => {
      vi.stubGlobal('window', {
        localStorage: {
          getItem: () => '{invalid-json',
          setItem: () => {}
        }
      })

      const ids = loadSidebarPanelState('exam-student')
      expect(ids).toEqual(PERSONA_DEFAULT_SIDEBAR_MODULES['exam-student'])
    })
  })

  describe('saveSidebarPanelState', () => {
    it('does not throw when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(() => saveSidebarPanelState('exam-student', ['side-pomodoro'])).not.toThrow()
    })

    it('saves to localStorage with persona-scoped key', () => {
      const mockStorage: Record<string, string> = {}
      vi.stubGlobal('window', {
        localStorage: {
          setItem: (key: string, value: string) => { mockStorage[key] = value },
          getItem: (key: string) => mockStorage[key] ?? null
        }
      })

      saveSidebarPanelState('exam-student', ['side-pomodoro', 'side-countdown'])
      const key = 'xinghuanhai-sidebar-panel-exam-student'
      expect(mockStorage[key]).toBe(JSON.stringify(['side-pomodoro', 'side-countdown']))
    })

    it('saves different personas to different keys', () => {
      const mockStorage: Record<string, string> = {}
      vi.stubGlobal('window', {
        localStorage: {
          setItem: (key: string, value: string) => { mockStorage[key] = value },
          getItem: (key: string) => mockStorage[key] ?? null
        }
      })

      saveSidebarPanelState('exam-student', ['side-pomodoro'])
      saveSidebarPanelState('office-worker', ['side-todo'])

      expect(mockStorage['xinghuanhai-sidebar-panel-exam-student']).toBe(JSON.stringify(['side-pomodoro']))
      expect(mockStorage['xinghuanhai-sidebar-panel-office-worker']).toBe(JSON.stringify(['side-todo']))
    })
  })
})
