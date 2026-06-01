import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentMembershipPage } from './AgentMembershipPage'

describe('AgentMembershipPage', () => {
  it('should render Agent membership features', () => {
    render(<AgentMembershipPage />)

    expect(screen.getByText(/有记忆的 AI 搭子/)).toBeDefined()
    expect(screen.getByText(/自我进化机制/)).toBeDefined()
    expect(screen.getByText(/角色系统/)).toBeDefined()
  })

  it('should show pricing for Agent tiers', () => {
    render(<AgentMembershipPage />)

    expect(screen.getAllByText(/¥/).length).toBeGreaterThan(0)
  })

  it('should render Agent PLUS features', () => {
    render(<AgentMembershipPage />)

    expect(screen.getByText(/AI 3D 角色生成/)).toBeDefined()
    expect(screen.getByText(/实时反思/)).toBeDefined()
  })

  it('should have purchase buttons', () => {
    render(<AgentMembershipPage />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
