import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentModal } from './PaymentModal'
import { defaultDevUserSession } from '../../auth/devAuthSession'
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
      authSession={defaultDevUserSession}
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

  it('renders success result via PaymentSuccess and triggers success callbacks', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    mockPaymentState({ status: 'success', orderId: 'order-123' })

    renderModal({ onClose, onSuccess })

    expect(screen.getAllByText('支付成功').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('您已成功购买 学习会员月卡')).toBeInTheDocument()
    expect(screen.getByText('订单号: order-123')).toBeInTheDocument()
    expect(screen.getByText('学习会员权益已解锁')).toBeInTheDocument()

    fireEvent.click(screen.getByText('完成'))

    expect(reset).toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('renders agent_plus tier success with unlock items', () => {
    mockPaymentState({ status: 'success', orderId: 'order-ap' })

    renderModal({ productId: 'agent_plus_monthly', productName: 'Agent PLUS 月卡' })

    expect(screen.getByText('Agent PLUS 旗舰权益已解锁')).toBeInTheDocument()
    expect(screen.getByText('✓ AI 3D角色生成')).toBeInTheDocument()
  })

  it('renders failed result via PaymentFailure and supports retry', () => {
    mockPaymentState({ status: 'failed', orderId: 'order-123', error: '支付取消' })

    renderModal()

    expect(screen.getByText('支付已取消')).toBeInTheDocument()
    expect(screen.getByText('订单号: order-123')).toBeInTheDocument()

    fireEvent.click(screen.getByText('重试'))

    expect(reset).toHaveBeenCalled()
  })

  it('renders default failed message when error is missing', () => {
    mockPaymentState({ status: 'failed' })

    renderModal()

    expect(screen.getAllByText('支付失败').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('支付过程中出现问题，请稍后重试')).toBeInTheDocument()
  })

  it('shows contact support button when onContactSupport is provided', () => {
    const onContactSupport = vi.fn()
    mockPaymentState({ status: 'failed', error: '系统错误' })

    renderModal({ onContactSupport })

    fireEvent.click(screen.getByText('联系客服'))

    expect(onContactSupport).toHaveBeenCalled()
  })

  it('shows view membership button on success when onViewMembership is provided', () => {
    const onViewMembership = vi.fn()
    mockPaymentState({ status: 'success', orderId: 'order-1' })

    renderModal({ onViewMembership })

    fireEvent.click(screen.getByText('查看我的会员'))

    expect(onViewMembership).toHaveBeenCalled()
  })

  it('passes undefined authSession to usePayment for login guard compatibility', () => {
    renderModal({ authSession: undefined })

    expect(usePayment).toHaveBeenCalledWith(undefined)
  })

})
