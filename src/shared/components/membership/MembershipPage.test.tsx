import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MembershipPage } from './MembershipPage'

describe('MembershipPage', () => {
  it('should render membership tiers', () => {
    render(<MembershipPage />)

    // 使用 getAllByText 因为多个地方可能显示相同文本
    expect(screen.getAllByText(/学习会员/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Agent 会员/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Agent PLUS/).length).toBeGreaterThan(0)
  })

  it('should show current membership status section', () => {
    render(<MembershipPage />)

    expect(screen.getByText(/当前会员/)).toBeDefined()
  })

  it('should display pricing for subscription products', () => {
    render(<MembershipPage />)

    // 价格显示为 "¥XX" 格式
    const priceElements = document.querySelectorAll('span[class*="price"]')
    expect(priceElements.length).toBeGreaterThan(0)
  })

  it('should render product cards with purchase buttons', () => {
    render(<MembershipPage />)

    // 按钮文本可能是 "立即订阅" 或 "购买" 或 "当前套餐"
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should show quota display section', () => {
    render(<MembershipPage />)

    // 配额部分显示 "AI 额度" 标题
    const headings = screen.getAllByRole('heading')
    const hasQuotaHeading = headings.some((h) => h.textContent?.includes('额度'))
    expect(hasQuotaHeading).toBe(true)
  })
})
