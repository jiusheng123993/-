import type { ComponentType } from 'react'
import type { ThemeAesthetic, ThemeMaterial } from '../../themes/themeRegistry'

export type FocusBriefStyleId = 'minimal-arc' | 'stat-bar' | 'half-gauge'

export interface FocusBriefData {
  progress: number
  todoCount: number
  totalMinutes: number
  completedCount: number
}

export interface FocusBriefRenderContext {
  aesthetic: ThemeAesthetic
  material: ThemeMaterial
}

export interface FocusBriefStyleProps {
  data: FocusBriefData
  context: FocusBriefRenderContext
}

export interface FocusBriefStyleDefinition {
  id: FocusBriefStyleId
  name: string
  description: string
  Component: ComponentType<FocusBriefStyleProps>
}
