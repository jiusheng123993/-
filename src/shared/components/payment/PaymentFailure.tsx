import styles from './PaymentFailure.module.css'

interface PaymentFailureProps {
  error?: string
  orderId?: string
  onRetry: () => void
  onClose: () => void
  onContactSupport?: () => void
}

function categorizeError(error?: string) {
  const msg = (error || '').toLowerCase()
  if (msg.includes('取消') || msg.includes('cancel')) {
    return { title: '支付已取消', subtitle: '您可以随时重新发起支付' }
  }
  if (msg.includes('网络') || msg.includes('network') || msg.includes('timeout')) {
    return { title: '网络连接失败', subtitle: '请检查网络后重试' }
  }
  if (msg.includes('余额') || msg.includes('balance')) {
    return { title: '余额不足', subtitle: '请更换支付方式或充值后重试' }
  }
  return { title: '支付失败', subtitle: '支付过程中出现问题，请稍后重试' }
}

export function PaymentFailure({
  error,
  orderId,
  onRetry,
  onClose,
  onContactSupport
}: PaymentFailureProps) {
  const { title, subtitle } = categorizeError(error)

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg
          className={styles.iconX}
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <line x1="12" y1="12" x2="28" y2="28" />
          <line x1="28" y1="12" x2="12" y2="28" />
        </svg>
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
      {orderId && <p className={styles.orderId}>订单号: {orderId}</p>}
      {error && title === '支付失败' && (
        <div className={styles.errorDetail}>{error}</div>
      )}
      <div className={styles.actions}>
        <button className={styles.closeButton} onClick={onClose}>关闭</button>
        <button className={styles.retryButton} onClick={onRetry}>重试</button>
      </div>
      {onContactSupport && (
        <button className={styles.supportButton} onClick={onContactSupport}>联系客服</button>
      )}
    </div>
  )
}
