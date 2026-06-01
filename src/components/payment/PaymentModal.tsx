import { useState } from 'react'
import { usePayment } from '../../hooks/usePayment'
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'

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
      <div className="payment-modal-overlay">
        <div className="payment-result success">
          <div className="icon">✓</div>
          <h2>支付成功</h2>
          <p>您已成功购买 {productName}</p>
          <p className="order-id">订单号: {orderId}</p>
          <button onClick={handleSuccess}>完成</button>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="payment-modal-overlay">
        <div className="payment-result failed">
          <div className="icon">✗</div>
          <h2>支付失败</h2>
          <p>{error || '支付过程中出现问题'}</p>
          {orderId && <p className="order-id">订单号: {orderId}</p>}
          <div className="actions">
            <button onClick={handleClose}>关闭</button>
            <button onClick={() => reset()}>重试</button>
          </div>
        </div>
      </div>
    )
  }

  const isProcessing = status === 'pending' || status === 'processing'

  return (
    <div className="payment-modal-overlay" onClick={handleClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <h2>确认支付</h2>
        <p className="product-name">{productName}</p>
        <p className="amount">¥{(amount / 100).toFixed(2)}</p>

        <div className="channel-select">
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

        <div className="actions">
          <button 
            onClick={handleClose} 
            disabled={isProcessing}
          >
            取消
          </button>
          <button 
            onClick={handlePay} 
            disabled={isProcessing}
            className="pay-button"
          >
            {isProcessing ? '处理中...' : '立即支付'}
          </button>
        </div>
      </div>
    </div>
  )
}
