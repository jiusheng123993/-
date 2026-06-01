import { getActiveProducts } from '../../entitlement/productCatalog'
import styles from './MembershipPage.module.css'

interface AgentMembershipPageProps {
  onPurchase?: (productId: string) => void
}

export function AgentMembershipPage({ onPurchase }: AgentMembershipPageProps) {
  const products = getActiveProducts()
  const agentProducts = products.filter((p) => p.id.startsWith('agent'))

  const handlePurchase = (productId: string) => {
    onPurchase?.(productId)
  }

  const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(0)}`

  const agentFeatures = [
    '长期记忆系统：行为观察 + 对话提取 + 手动填写',
    '有记忆的 AI 搭子：聊天模式 + 静默建议双模式',
    '自我进化机制：每周反思 + 事件驱动双触发',
    '角色系统：内置 3-5 个 2D/3D 角色 + Ready Player Me 捏脸',
    '角色同步进化：画像变化驱动角色外观/装饰解锁',
    '记忆云同步：多设备同步你的记忆画像'
  ]

  const plusFeatures = [
    'AI 3D 角色生成：输入描述生成专属 3D 角色（每月 10 次额度）',
    '实时反思：重要事件实时触发自我进化',
    '工具调用能力：Agent 可自动创建模块、编排计划',
    '角色进化全解锁：所有进化装饰/特效/动画'
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Agent 智能体会员</h1>
        <p className={styles.subtitle}>长跟你成长的 AI 搭子</p>
      </header>

      <section className={styles.statusSection}>
        <h2>Agent 会员权益</h2>
        <ul className={styles.featureList}>
          {agentFeatures.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className={styles.statusSection}>
        <h2>Agent PLUS 旗舰权益</h2>
        <ul className={styles.featureList}>
          {plusFeatures.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className={styles.productsSection}>
        <h2>选择套餐</h2>
        <div className={styles.productGrid}>
          {agentProducts.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.cardHeader}>
                <span className={styles.tierLabel}>
                  {product.id.includes('plus') ? 'Agent PLUS' : 'Agent 会员'}
                </span>
                {product.period && <span className={styles.periodLabel}>{product.period}</span>}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
                  )}
                </div>
                <ul className={styles.featureList}>
                  {product.grants.slice(0, 3).map((grant, i) => (
                    <li key={i}>• {grant.code.replace(/_/g, ' ')}</li>
                  ))}
                  {product.grants.length > 3 && <li>• 还有 {product.grants.length - 3} 项权益</li>}
                </ul>
              </div>
              <button className={styles.purchaseButton} onClick={() => handlePurchase(product.id)}>
                立即订阅
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
