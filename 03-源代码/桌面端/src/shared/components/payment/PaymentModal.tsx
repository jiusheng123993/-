import { useMemo, useState } from 'react'
import { usePayment } from '../../hooks/usePayment'
import type { DevAuthSession } from '../../auth/devAuthSession'
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'
import { PaymentSuccess } from './PaymentSuccess'
import { PaymentFailure } from './PaymentFailure'
import { AdaptiveModal } from '../../platforms/AdaptiveModal'

interface PaymentModalProps {
  isOpen: boolean
  productId: string
  productName: string
  amount: number
  authSession?: DevAuthSession
  userId?: string
  tier?: 'study' | 'agent' | 'agent_plus'
  onClose: () => void
  onSuccess?: () => void
  onViewMembership?: () => void
  onContactSupport?: () => void
}

function resolveTierFromProductId(productId: string): 'study' | 'agent' | 'agent_plus' | undefined {
  if (productId.startsWith('agent_plus')) return 'agent_plus'
  if (productId.startsWith('agent')) return 'agent'
  if (productId.startsWith('study')) return 'study'
  return undefined
}

export function PaymentModal({ 
  isOpen, 
  productId, 
  productName, 
  amount, 
  authSession,
  userId,
  tier,
  onClose, 
  onSuccess,
  onViewMembership,
  onContactSupport
}: PaymentModalProps) {
  const [channel, setChannel] = useState<OrderPaymentChannel>('wechat')
  const resolvedAuthSession = useMemo<DevAuthSession | undefined>(() => {
    if (authSession) return authSession
    if (!userId) return undefined
    return {
      userId,
      role: 'user',
      displayName: userId
    }
  }, [authSession, userId])
  const { status, orderId, error, startPayment, reset } = usePayment(resolvedAuthSession)
  const resolvedTier = tier ?? resolveTierFromProductId(productId)

  const handlePay = async () => {
    await startPayment(productId, channel)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSuccess = () => {
    reset()
    onSuccess?.()
    onClose()
  }

  if (status === 'success' && orderId) {
    return (
      <AdaptiveModal
        isOpen={isOpen}
        onClose={handleSuccess}
        title="支付成功"
        ariaLabel="支付成功"
      >
        <PaymentSuccess
          productName={productName}
          orderId={orderId}
          tier={resolvedTier}
          onClose={handleSuccess}
          onViewMembership={onViewMembership}
        />
      </AdaptiveModal>
    )
  }

  if (status === 'failed') {
    return (
      <AdaptiveModal
        isOpen={isOpen}
        onClose={handleClose}
        title="支付失败"
        ariaLabel="支付失败"
      >
        <PaymentFailure
          error={error}
          orderId={orderId}
          onRetry={() => reset()}
          onClose={handleClose}
          onContactSupport={onContactSupport}
        />
      </AdaptiveModal>
    )
  }

  const isProcessing = status === 'pending' || status === 'processing'

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="确认支付"
      subtitle={productName}
      ariaLabel="确认支付"
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{
          fontSize: 36,
          fontWeight: 800,
          color: 'var(--primary, #6366f1)',
          margin: 0
        }}>
          ¥{(amount / 100).toFixed(2)}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--bg-secondary, #f8f9fa)',
          border: `2px solid ${channel === 'wechat' ? 'var(--primary, #6366f1)' : 'var(--border, #e2e8f0)'}`,
          borderRadius: 12,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.6 : 1
        }}>
          <input
            type="radio"
            name="channel"
            value="wechat"
            checked={channel === 'wechat'}
            onChange={() => setChannel('wechat')}
            disabled={isProcessing}
            style={{ width: 20, height: 20, accentColor: 'var(--primary, #6366f1)' }}
          />
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text, #1a1a2e)' }}>微信支付</span>
        </label>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--bg-secondary, #f8f9fa)',
          border: `2px solid ${channel === 'alipay' ? 'var(--primary, #6366f1)' : 'var(--border, #e2e8f0)'}`,
          borderRadius: 12,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.6 : 1
        }}>
          <input
            type="radio"
            name="channel"
            value="alipay"
            checked={channel === 'alipay'}
            onChange={() => setChannel('alipay')}
            disabled={isProcessing}
            style={{ width: 20, height: 20, accentColor: 'var(--primary, #6366f1)' }}
          />
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text, #1a1a2e)' }}>支付宝</span>
        </label>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--bg-secondary, #f8f9fa)',
          border: `2px solid ${channel === 'apple' ? 'var(--primary, #6366f1)' : 'var(--border, #e2e8f0)'}`,
          borderRadius: 12,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.6 : 1
        }}>
          <input
            type="radio"
            name="channel"
            value="apple"
            checked={channel === 'apple'}
            onChange={() => setChannel('apple')}
            disabled={isProcessing}
            style={{ width: 20, height: 20, accentColor: 'var(--primary, #6366f1)' }}
          />
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text, #1a1a2e)' }}>Apple Pay</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={handleClose} 
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            background: 'var(--bg-secondary, #f1f5f9)',
            border: '1px solid var(--border, #e2e8f0)',
            color: 'var(--text, #1a1a2e)',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          取消
        </button>
        <button 
          onClick={handlePay} 
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            color: 'white',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          {isProcessing ? '处理中...' : '立即支付'}
        </button>
      </div>
    </AdaptiveModal>
  )
}
