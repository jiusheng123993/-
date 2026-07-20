import styles from './PaymentSuccess.module.css'

interface PaymentSuccessProps {
  productName: string
  orderId: string
  tier?: 'study' | 'agent' | 'agent_plus'
  onClose: () => void
  onViewMembership?: () => void
}

const tierConfig = {
  study: {
    title: '学习会员权益已解锁',
    items: ['高级主题全解锁', '云同步', 'AI 40次/月']
  },
  agent: {
    title: 'Agent 会员权益已解锁',
    items: ['长期记忆系统', 'AI 搭子聊天', '自我进化机制', '角色系统']
  },
  agent_plus: {
    title: 'Agent PLUS 旗舰权益已解锁',
    items: ['AI 3D角色生成', '实时反思', '工具调用', '角色进化全解锁']
  }
} as const

export function PaymentSuccess({
  productName,
  orderId,
  tier,
  onClose,
  onViewMembership
}: PaymentSuccessProps) {
  const config = tier ? tierConfig[tier] : null

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg
          className={styles.iconCheck}
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="10,20 18,28 30,12" />
        </svg>
      </div>
      <h2 className={styles.title}>支付成功</h2>
      <p className={styles.subtitle}>您已成功购买 {productName}</p>
      <p className={styles.orderId}>订单号: {orderId}</p>

      {config && (
        <div className={styles.unlockSection}>
          <p className={styles.unlockTitle}>{config.title}</p>
          <ul className={styles.unlockList}>
            {config.items.map((item) => (
              <li key={item} className={styles.unlockItem}>
                ✓ {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        {onViewMembership && (
          <button onClick={onViewMembership}>查看我的会员</button>
        )}
        <button onClick={onClose}>完成</button>
      </div>
    </div>
  )
}
