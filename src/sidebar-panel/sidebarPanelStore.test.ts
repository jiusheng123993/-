import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SIDEBAR_PANEL_MODULES,
  PERSONA_DEFAULT_SIDEBAR_MODULES,
  loadSidebarPanelState,
  saveSidebarPanelState
} from './sidebarPanelStore'

describe('sidebarPanelStore', () => {
  beforeEach(() => {
    vi.stubGlobal('window', undefined)
  })

  describe('SIDEBAR_PANEL_MODULES', () => {
    it('contains all 6 module types', () => {
      expect(SIDEBAR_PANEL_MODULES).toHaveLength(6)
    })

    it('focus-dashboard module is available for all personas', () => {
      const mod = SIDEBAR_PANEL_MODULES.find(m => m.id === 'side-focus-dashboard')
      expect(mod).toBeDefined()
      expect(mod!.personaIds).toContain('exam-student')
      expect(mod!.personaIds).toContain('office-worker')
      expect(mod!.personaIds).toContain('creator')
      expect(mod!.personaIds).toContain('self-growth')
    })

    it('habits module is only for self-growth', () => {
      const mod = SIDEBAR_PANEL_MODULES.find(m => m.id === 'side-habits')
      expect(mod).toBeDefined()
      expect(mod!.personaIds).toEqual(['self-growth'])
    })

    it('quick-notes module is only for creator', () => {
      const mod = SIDEBAR_PANEL_MODULES.find(m => m.id === 'side-quick-notes')
      expect(mod).toBeDefined()
      expect(mod!.personaIds).toEqual(['creator'])
    })
  })

  describe('PERSONA_DEFAULT_SIDEBAR_MODULES', () => {
    it('exam-student has 3 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['exam-student']).toHaveLength(3)
    })

    it('office-worker has 3 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['office-worker']).toHaveLength(3)
    })

    it('creator has 4 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['creator']).toHaveLength(4)
    })

    it('self-growth has 4 default modules', () => {
      expect(PERSONA_DEFAULT_SIDEBAR_MODULES['self-growth']).toHaveLength(4)
    })
  })

  describe('loadSidebarPanelState', () => {
    it('returns default modules for exam-student', () => {
      const ids = loadSidebarPanelState('exam-student')
      expect(ids).toEqual(PERSONA_DEFAULT_SIDEBAR_MODULES['exam-student'])
    })

    it('returns default modules for office-worker', () => {
      const ids = loadSidebarPanelState('office-worker')
      expect(ids).toEqual(PERSONA_DEFAULT_SIDEBAR_MODULES['office-worker'])
    })

    it('returns fallback for unknown persona', () => {
      const ids = loadSidebarPanelState('unknown-persona')
      expect(ids).toEqual(['side-focus-dashboard', 'side-daily-pulse'])
    })
  })

  describe('saveSidebarPanelState', () => {
    it('does not throw when window is undefined', () => {
      expect(() => saveSidebarPanelState('exam-student', ['side-focus-dashboard'])).not.toThrow()
    })
  })
})
