import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PaymentSuccess } from './PaymentSuccess'

function renderSuccess(props: Partial<React.ComponentProps<typeof PaymentSuccess>> = {}) {
  return render(
    <PaymentSuccess
      productName="学习会员月卡"
      orderId="order-123"
      onClose={vi.fn()}
      {...props}
    />
  )
}

describe('PaymentSuccess', () => {
  it('renders product name and order ID', () => {
    renderSuccess()

    expect(screen.getByText('您已成功购买 学习会员月卡')).toBeInTheDocument()
    expect(screen.getByText('订单号: order-123')).toBeInTheDocument()
  })

  it('shows study tier unlock message when tier is study', () => {
    renderSuccess({ tier: 'study' })

    expect(screen.getByText('学习会员权益已解锁')).toBeInTheDocument()
    expect(screen.getByText('✓ 高级主题全解锁')).toBeInTheDocument()
    expect(screen.getByText('✓ 云同步')).toBeInTheDocument()
    expect(screen.getByText('✓ AI 40次/月')).toBeInTheDocument()
  })

  it('shows agent tier unlock message when tier is agent', () => {
    renderSuccess({ tier: 'agent' })

    expect(screen.getByText('Agent 会员权益已解锁')).toBeInTheDocument()
    expect(screen.getByText('✓ 长期记忆系统')).toBeInTheDocument()
    expect(screen.getByText('✓ AI 搭子聊天')).toBeInTheDocument()
    expect(screen.getByText('✓ 自我进化机制')).toBeInTheDocument()
    expect(screen.getByText('✓ 角色系统')).toBeInTheDocument()
  })

  it('shows agent_plus tier unlock message when tier is agent_plus', () => {
    renderSuccess({ tier: 'agent_plus' })

    expect(screen.getByText('Agent PLUS 旗舰权益已解锁')).toBeInTheDocument()
    expect(screen.getByText('✓ AI 3D角色生成')).toBeInTheDocument()
    expect(screen.getByText('✓ 实时反思')).toBeInTheDocument()
    expect(screen.getByText('✓ 工具调用')).toBeInTheDocument()
    expect(screen.getByText('✓ 角色进化全解锁')).toBeInTheDocument()
  })

  it('shows default message when no tier provided', () => {
    renderSuccess()

    expect(screen.getByText('支付成功')).toBeInTheDocument()
    expect(screen.queryByText('学习会员权益已解锁')).not.toBeInTheDocument()
    expect(screen.queryByText('Agent 会员权益已解锁')).not.toBeInTheDocument()
    expect(screen.queryByText('Agent PLUS 旗舰权益已解锁')).not.toBeInTheDocument()
  })

  it('calls onClose when clicking complete button', () => {
    const onClose = vi.fn()
    renderSuccess({ onClose })

    fireEvent.click(screen.getByText('完成'))

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onViewMembership when clicking view membership button', () => {
    const onViewMembership = vi.fn()
    renderSuccess({ onViewMembership })

    fireEvent.click(screen.getByText('查看我的会员'))

    expect(onViewMembership).toHaveBeenCalled()
  })

  it('does not show view membership button when onViewMembership is not provided', () => {
    renderSuccess()

    expect(screen.queryByText('查看我的会员')).not.toBeInTheDocument()
  })
})
