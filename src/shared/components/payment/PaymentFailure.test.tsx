import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PaymentFailure } from './PaymentFailure'

function renderFailure(props: Partial<React.ComponentProps<typeof PaymentFailure>> = {}) {
  return render(
    <PaymentFailure
      onRetry={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />
  )
}

describe('PaymentFailure', () => {
  it('renders default error message when no error provided', () => {
    renderFailure()

    expect(screen.getByText('支付失败')).toBeInTheDocument()
    expect(screen.getByText('支付过程中出现问题，请稍后重试')).toBeInTheDocument()
  })

  it('renders custom error message when provided', () => {
    renderFailure({ error: '银行卡验证失败' })

    expect(screen.getByText('支付失败')).toBeInTheDocument()
    expect(screen.getByText('支付过程中出现问题，请稍后重试')).toBeInTheDocument()
    expect(screen.getByText('银行卡验证失败')).toBeInTheDocument()
  })

  it('shows "支付已取消" for cancel-related errors', () => {
    renderFailure({ error: '用户取消了支付' })

    expect(screen.getByText('支付已取消')).toBeInTheDocument()
    expect(screen.getByText('您可以随时重新发起支付')).toBeInTheDocument()
  })

  it('shows "支付已取消" for cancel keyword in English', () => {
    renderFailure({ error: 'Payment was cancel by user' })

    expect(screen.getByText('支付已取消')).toBeInTheDocument()
  })

  it('shows "网络连接失败" for network-related errors', () => {
    renderFailure({ error: '网络连接异常' })

    expect(screen.getByText('网络连接失败')).toBeInTheDocument()
    expect(screen.getByText('请检查网络后重试')).toBeInTheDocument()
  })

  it('shows "网络连接失败" for network keyword in English', () => {
    renderFailure({ error: 'Network error occurred' })

    expect(screen.getByText('网络连接失败')).toBeInTheDocument()
  })

  it('shows "网络连接失败" for timeout errors', () => {
    renderFailure({ error: 'Request timeout' })

    expect(screen.getByText('网络连接失败')).toBeInTheDocument()
  })

  it('shows "余额不足" for balance-related errors', () => {
    renderFailure({ error: '账户余额不足' })

    expect(screen.getByText('余额不足')).toBeInTheDocument()
    expect(screen.getByText('请更换支付方式或充值后重试')).toBeInTheDocument()
  })

  it('shows "余额不足" for balance keyword in English', () => {
    renderFailure({ error: 'Insufficient balance' })

    expect(screen.getByText('余额不足')).toBeInTheDocument()
  })

  it('shows order ID when provided', () => {
    renderFailure({ orderId: 'order-456' })

    expect(screen.getByText('订单号: order-456')).toBeInTheDocument()
  })

  it('does not show order ID when not provided', () => {
    renderFailure()

    expect(screen.queryByText(/订单号:/)).not.toBeInTheDocument()
  })

  it('calls onRetry when clicking retry button', () => {
    const onRetry = vi.fn()
    renderFailure({ onRetry })

    fireEvent.click(screen.getByText('重试'))

    expect(onRetry).toHaveBeenCalled()
  })

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn()
    renderFailure({ onClose })

    fireEvent.click(screen.getByText('关闭'))

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onContactSupport when clicking support button', () => {
    const onContactSupport = vi.fn()
    renderFailure({ onContactSupport })

    fireEvent.click(screen.getByText('联系客服'))

    expect(onContactSupport).toHaveBeenCalled()
  })

  it('does not show support button when onContactSupport is not provided', () => {
    renderFailure()

    expect(screen.queryByText('联系客服')).not.toBeInTheDocument()
  })
})
