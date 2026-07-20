import type { FC } from 'react'
import type { MembershipFlowState } from '../../hooks/useMembershipFlow'
import { AdaptiveModal } from '../../platforms/AdaptiveModal'

interface PaymentModalProps {
  isOpen: boolean
  flow: MembershipFlowState
  onClose: () => void
}

export const PaymentModal: FC<PaymentModalProps> = ({ isOpen, flow, onClose }) => {
  const { selectedProduct, formatPrice, handlePayment } = flow

  if (!selectedProduct) return null

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="选择支付方式"
      ariaLabel="选择支付方式"
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'var(--bg-secondary, #f8f9fa)',
          borderRadius: 12,
          marginBottom: 20
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text, #1a1a2e)' }}>
            {selectedProduct.name}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary, #6366f1)' }}>
            {formatPrice(selectedProduct.price)}/{selectedProduct.period}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handlePayment('wechat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: 'var(--bg-secondary, #f8f9fa)',
              border: '2px solid var(--border, #e2e8f0)',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--text, #1a1a2e)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>💬</span>
            <span>微信支付</span>
          </button>
          <button
            onClick={() => handlePayment('alipay')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: 'var(--bg-secondary, #f8f9fa)',
              border: '2px solid var(--border, #e2e8f0)',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--text, #1a1a2e)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>💳</span>
            <span>支付宝</span>
          </button>
          <button
            onClick={() => handlePayment('apple')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: 'var(--bg-secondary, #f8f9fa)',
              border: '2px solid var(--border, #e2e8f0)',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--text, #1a1a2e)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🍎</span>
            <span>Apple Pay</span>
          </button>
        </div>

        <p style={{
          fontSize: 13,
          color: 'var(--muted, #94a3b8)',
          textAlign: 'center',
          marginTop: 16,
          marginBottom: 0
        }}>
          点击上方按钮将跳转到对应支付平台完成付款
        </p>
      </div>
    </AdaptiveModal>
  )
}
