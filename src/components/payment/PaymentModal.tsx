import { useState } from 'react'
import { usePayment } from '../../hooks/usePayment'
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'
import styles from './PaymentModal.module.css'

interface PaymentModalProps {
  isOpen: boolean
  productId: string
  productName: string
  amount: number
  userId?: string
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentModal({ 
  isOpen, 
  productId, 
  productName, 
  amount, 
  userId,
  onClose, 
  onSuccess 
}: PaymentModalProps) {
  const [channel, setChannel] = useState<OrderPaymentChannel>('wechat')
  const { status, orderId, error, startPayment, reset } = usePayment(userId)

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
        <div className={`${styles.result} ${styles.success}`}>
          <div className={styles.icon}>✓</div>
          <h2>支付成功</h2>
          <p>您已成功购买 {productName}</p>
          <p className={styles.orderId}>订单号: {orderId}</p>
          <button onClick={handleSuccess}>完成</button>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={styles.overlay}>
        <div className={`${styles.result} ${styles.failed}`}>
          <div className={styles.icon}>✗</div>
          <h2>支付失败</h2>
          <p>{error || '支付过程中出现问题'}</p>
          {orderId && <p className={styles.orderId}>订单号: {orderId}</p>}
          <div className={styles.actions}>
            <button onClick={handleClose}>关闭</button>
            <button onClick={() => reset()}>重试</button>
          </div>
        </div>
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
