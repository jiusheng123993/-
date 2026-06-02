import { useMemo, useState } from 'react'
import { usePayment } from '../../hooks/usePayment'
import type { DevAuthSession } from '../../auth/devAuthSession'
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'
import { PaymentSuccess } from './PaymentSuccess'
import { PaymentFailure } from './PaymentFailure'
import styles from './PaymentModal.module.css'

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

  if (!isOpen) return null

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
      <div className={styles.overlay}>
        <PaymentSuccess
          productName={productName}
          orderId={orderId}
          tier={resolvedTier}
          onClose={handleSuccess}
          onViewMembership={onViewMembership}
        />
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={styles.overlay}>
        <PaymentFailure
          error={error}
          orderId={orderId}
          onRetry={() => reset()}
          onClose={handleClose}
          onContactSupport={onContactSupport}
        />
      </div>
    )
  }

  const isProcessing = status === 'pending' || status === 'processing'

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>确认支付</h2>
        <p className={styles.productName}>{productName}</p>
        <p className={styles.amount}>¥{(amount / 100).toFixed(2)}</p>

        <div className={styles.channelSelect}>
          <label>
            <input
              type="radio"
              name="channel"
              value="wechat"
              checked={channel === 'wechat'}
              onChange={() => setChannel('wechat')}
              disabled={isProcessing}
            />
            <span>微信支付</span>
          </label>
          <label>
            <input
              type="radio"
              name="channel"
              value="alipay"
              checked={channel === 'alipay'}
              onChange={() => setChannel('alipay')}
              disabled={isProcessing}
            />
            <span>支付宝</span>
          </label>
          <label>
            <input
              type="radio"
              name="channel"
              value="apple"
              checked={channel === 'apple'}
              onChange={() => setChannel('apple')}
              disabled={isProcessing}
            />
            <span>Apple Pay</span>
          </label>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={handleClose} 
            disabled={isProcessing}
          >
            取消
          </button>
          <button 
            onClick={handlePay} 
            disabled={isProcessing}
          >
            {isProcessing ? '处理中...' : '立即支付'}
          </button>
        </div>
      </div>
    </div>
  )
}
