import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentModal } from './PaymentModal'
import { usePayment } from '../../hooks/usePayment'

vi.mock('../../hooks/usePayment')

const startPayment = vi.fn()
const reset = vi.fn()

function mockPaymentState(state: Partial<ReturnType<typeof usePayment>> = {}) {
  vi.mocked(usePayment).mockReturnValue({
    status: 'idle',
    orderId: undefined,
    error: undefined,
    startPayment,
    reset,
    ...state
  })
}

function renderModal(props: Partial<React.ComponentProps<typeof PaymentModal>> = {}) {
  return render(
    <PaymentModal
      isOpen
      productId="study_monthly"
      productName="学习会员月卡"
      amount={1800}
      userId="user-1"
      onClose={vi.fn()}
      onSuccess={vi.fn()}
      {...props}
    />
  )
}

describe('PaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPaymentState()
  })

  it('is closed when isOpen is false', () => {
    renderModal({ isOpen: false })

    expect(screen.queryByText('确认支付')).not.toBeInTheDocument()
  })

  it('renders product, amount and payment channels', () => {
    renderModal()

    expect(screen.getByText('确认支付')).toBeInTheDocument()
    expect(screen.getByText('学习会员月卡')).toBeInTheDocument()
    expect(screen.getByText('¥18.00')).toBeInTheDocument()
    expect(screen.getByText('微信支付')).toBeInTheDocument()
    expect(screen.getByText('支付宝')).toBeInTheDocument()
    expect(screen.getByText('Apple Pay')).toBeInTheDocument()
  })

  it('starts payment with default wechat channel', async () => {
    renderModal()

    fireEvent.click(screen.getByText('立即支付'))

    expect(startPayment).toHaveBeenCalledWith('study_monthly', 'wechat')
  })

  it('starts payment with selected alipay channel', () => {
    renderModal()

    fireEvent.click(screen.getByLabelText('支付宝'))
    fireEvent.click(screen.getByText('立即支付'))

    expect(startPayment).toHaveBeenCalledWith('study_monthly', 'alipay')
  })

  it('starts payment with selected apple channel', () => {
    renderModal()

    fireEvent.click(screen.getByLabelText('Apple Pay'))
    fireEvent.click(screen.getByText('立即支付'))

    expect(startPayment).toHaveBeenCalledWith('study_monthly', 'apple')
  })

  it('resets and closes when clicking cancel', () => {
    const onClose = vi.fn()
    renderModal({ onClose })

    fireEvent.click(screen.getByText('取消'))

    expect(reset).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('resets and closes when clicking overlay', () => {
    const onClose = vi.fn()
    const { container } = renderModal({ onClose })

    fireEvent.click(container.firstElementChild!)

    expect(reset).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close when clicking modal content', () => {
    const onClose = vi.fn()
    renderModal({ onClose })

    fireEvent.click(screen.getByText('确认支付'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables actions while processing', () => {
    mockPaymentState({ status: 'processing', orderId: 'order-1' })

    renderModal()

    expect(screen.getByText('处理中...')).toBeDisabled()
    expect(screen.getByText('取消')).toBeDisabled()
    expect(screen.getByLabelText('微信支付')).toBeDisabled()
    expect(screen.getByLabelText('支付宝')).toBeDisabled()
    expect(screen.getByLabelText('Apple Pay')).toBeDisabled()
  })

  it('renders success result and triggers success callbacks', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    mockPaymentState({ status: 'success', orderId: 'order-123' })

    renderModal({ onClose, onSuccess })

    expect(screen.getByText('支付成功')).toBeInTheDocument()
    expect(screen.getByText('您已成功购买 学习会员月卡')).toBeInTheDocument()
    expect(screen.getByText('订单号: order-123')).toBeInTheDocument()

    fireEvent.click(screen.getByText('完成'))

    expect(reset).toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('renders failed result and supports retry', () => {
    mockPaymentState({ status: 'failed', orderId: 'order-123', error: '支付取消' })

    renderModal()

    expect(screen.getByText('支付失败')).toBeInTheDocument()
    expect(screen.getByText('支付取消')).toBeInTheDocument()
    expect(screen.getByText('订单号: order-123')).toBeInTheDocument()

    fireEvent.click(screen.getByText('重试'))

    expect(reset).toHaveBeenCalled()
  })

  it('renders default failed message when error is missing', () => {
    mockPaymentState({ status: 'failed' })

    renderModal()

    expect(screen.getByText('支付过程中出现问题')).toBeInTheDocument()
  })

  it('passes undefined userId to usePayment for login guard compatibility', () => {
    renderModal({ userId: undefined })

    expect(usePayment).toHaveBeenCalledWith(undefined)
  })
})
