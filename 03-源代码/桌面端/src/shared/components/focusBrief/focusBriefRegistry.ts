import { MinimalArcStyle } from './MinimalArcStyle'
import { StatBarStyle } from './StatBarStyle'
import { HalfGaugeStyle } from './HalfGaugeStyle'
import type { FocusBriefStyleDefinition, FocusBriefStyleId } from './types'

export const focusBriefStyles: FocusBriefStyleDefinition[] = [
  {
    id: 'minimal-arc',
    name: '极简刻度环',
    description: '细环 + 刻度点，低噪音、长期耐看',
    Component: MinimalArcStyle
  },
  {
    id: 'stat-bar',
    name: '水平进度条',
    description: '横向进度 + 数据三件套，信息密度高',
    Component: StatBarStyle
  },
  {
    id: 'half-gauge',
    name: '半圆仪表盘',
    description: '分段仪表 + 状态文案，强化达成感',
    Component: HalfGaugeStyle
  }
]

export const DEFAULT_FOCUS_BRIEF_STYLE_ID: FocusBriefStyleId = 'minimal-arc'

export function getFocusBriefStyleById(
  id: FocusBriefStyleId | undefined | null
): FocusBriefStyleDefinition {
  if (!id) return focusBriefStyles[0]
  return focusBriefStyles.find((style) => style.id === id) ?? focusBriefStyles[0]
}

export function isValidFocusBriefStyleId(value: unknown): value is FocusBriefStyleId {
  return (
    typeof value === 'string' &&
    focusBriefStyles.some((style) => style.id === value)
  )
}

export type { FocusBriefStyleDefinition, FocusBriefStyleId } from './types'
