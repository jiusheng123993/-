import type { FC } from 'react'
import type { MembershipFlowState } from '../../hooks/useMembershipFlow'

interface PaymentModalProps {
  flow: MembershipFlowState
  onClose: () => void
}

export const PaymentModal: FC<PaymentModalProps> = ({ flow, onClose }) => {
  const { selectedProduct, formatPrice, handlePayment } = flow

  if (!selectedProduct) return null

  return (
    <div className="payment-modal-backdrop" onClick={onClose} role="presentation">
      <section
        aria-modal="true"
        className="payment-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="选择支付方式"
      >
        <header className="payment-modal-header">
          <h3>选择支付方式</h3>
          <button className="payment-modal-close" onClick={onClose} type="button">×</button>
        </header>
        <div className="payment-modal-content">
          <div className="payment-product-summary">
            <span className="payment-product-name">{selectedProduct.name}</span>
            <span className="payment-product-price">{formatPrice(selectedProduct.price)}/{selectedProduct.period}</span>
          </div>
          
          <div className="payment-channels">
            <button className="payment-channel-button" onClick={() => handlePayment('wechat')}>
              <span className="payment-channel-icon">💬</span>
              <span>微信支付</span>
            </button>
            <button className="payment-channel-button" onClick={() => handlePayment('alipay')}>
              <span className="payment-channel-icon">💳</span>
              <span>支付宝</span>
            </button>
            <button className="payment-channel-button" onClick={() => handlePayment('apple')}>
              <span className="payment-channel-icon">🍎</span>
              <span>Apple Pay</span>
            </button>
          </div>
          
          <p className="payment-note">点击上方按钮将跳转到对应支付平台完成付款</p>
        </div>
      </section>
    </div>
  )
}
