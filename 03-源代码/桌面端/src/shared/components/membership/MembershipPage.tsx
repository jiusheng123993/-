/**
 * MembershipPage - 会员中心页面
 *
 * 职责：
 * - 展示会员等级（学习会员/Agent会员/Agent PLUS）
 * - 展示商品卡片和价格
 * - 显示当前会员状态和 AI 配额
 * - 提供购买入口（点击后调用支付流程）
 *
 * 设计要点：
 * - 从 productCatalog 动态加载商品数据
 * - 从 entitlementService 查询用户当前权益状态
 * - 响应式布局，支持移动端和桌面端
 */

import { useState, useMemo } from 'react'
import { getActiveProducts } from '../../entitlement/productCatalog'
import type { Product } from '../../entitlement/productTypes'
import { PaymentModal } from '../payment/PaymentModal'
import { createEntitlementService } from '../../entitlement/entitlementService'
import { createAiQuotaProvider } from '../../entitlement/aiQuotaProvider'
import styles from './MembershipPage.module.css'

interface MembershipPageProps {
  userId?: string
  onPurchase?: (productId: string) => void
}

export function MembershipPage({ userId, onPurchase }: MembershipPageProps) {
  const [products] = useState(() => getActiveProducts())
  const [currentTier] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const entitlementService = useMemo(() => createEntitlementService(), [])
  const aiQuotaProvider = useMemo(() => createAiQuotaProvider(entitlementService), [entitlementService])

  const subscriptionProducts = products.filter((p) => p.type === 'subscription')
  const packProducts = products.filter((p) => p.type === 'pack')

  const formatPrice = (cents: number) => {
    return `¥${(cents / 100).toFixed(0)}`
  }

  const getTierLabel = (productId: string) => {
    if (productId.includes('agent_plus')) return 'Agent PLUS'
    if (productId.includes('agent')) return 'Agent 会员'
    return '学习会员'
  }

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product)
    setShowPaymentModal(true)
    onPurchase?.(product.id)
  }

  const handlePaymentSuccess = () => {
    setSelectedProduct(null)
    setShowPaymentModal(false)
  }

  const handlePaymentClose = () => {
    setSelectedProduct(null)
    setShowPaymentModal(false)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>会员中心</h1>
        <p className={styles.subtitle}>升级会员，解锁更多能力</p>
      </header>

      <section className={styles.statusSection}>
        <h2>当前会员</h2>
        <div className={styles.statusCard}>
          {currentTier ? (
            <>
              <span className={styles.tierBadge}>{getTierLabel(currentTier)}</span>
              <span className={styles.statusText}>已开通</span>
            </>
          ) : (
            <span className={styles.statusText}>未开通会员</span>
          )}
        </div>
      </section>

      <section className={styles.productsSection}>
        <h2>会员订阅</h2>
        <div className={styles.productGrid}>
          {subscriptionProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currentTier={currentTier}
              onPurchase={handlePurchase}
              formatPrice={formatPrice}
              getTierLabel={getTierLabel}
            />
          ))}
        </div>
      </section>

      <section className={styles.packsSection}>
        <h2>增值包</h2>
        <div className={styles.packGrid}>
          {packProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currentTier={currentTier}
              onPurchase={handlePurchase}
              formatPrice={formatPrice}
              getTierLabel={getTierLabel}
            />
          ))}
        </div>
      </section>

      <QuotaDisplay userId={userId} aiQuotaProvider={aiQuotaProvider} />

      {selectedProduct && (
        <PaymentModal
          isOpen={showPaymentModal}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          amount={selectedProduct.price}
          userId={userId}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

interface ProductCardProps {
  product: Product
  currentTier: string | null
  onPurchase: (product: Product) => void
  formatPrice: (cents: number) => string
  getTierLabel: (productId: string) => string
}

function ProductCard({ product, currentTier, onPurchase, formatPrice, getTierLabel }: ProductCardProps) {
  const isCurrent = product.id.includes(currentTier || '')
  const tierLabel = getTierLabel(product.id)

  return (
    <div className={`${styles.productCard} ${isCurrent ? styles.current : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.tierLabel}>{tierLabel}</span>
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
      <button
        className={styles.purchaseButton}
        onClick={() => onPurchase(product)}
        disabled={isCurrent}
      >
        {isCurrent ? '当前套餐' : product.period ? '立即订阅' : '购买'}
      </button>
    </div>
  )
}

function QuotaDisplay({ userId, aiQuotaProvider }: { userId?: string; aiQuotaProvider: ReturnType<typeof createAiQuotaProvider> }) {
  const quotaStatus = useMemo(() => {
    if (!userId) return null
    return aiQuotaProvider.getQuotaStatus(userId)
  }, [userId, aiQuotaProvider])

  const quota = {
    free: quotaStatus?.free?.remaining ?? 0,
    study: quotaStatus?.study?.remaining ?? 0,
    agent: quotaStatus?.agent?.remaining ?? 0,
    pack: quotaStatus?.pack?.remaining ?? 0
  }

  const activeSourceLabel: Record<string, string> = {
    ai_quota_free: '免费额度',
    ai_quota_study: '学习会员',
    ai_quota_agent: 'Agent 会员',
    ai_quota: '加油包'
  }

  return (
    <section className={styles.quotaSection}>
      <h2>AI 额度</h2>
      <div className={styles.quotaGrid}>
        <div className={`${styles.quotaCard} ${quotaStatus?.activeSource === 'ai_quota_free' ? styles.activeQuota : ''}`}>
          <span className={styles.quotaLabel}>免费额度</span>
          <span className={styles.quotaValue}>{quota.free}</span>
        </div>
        <div className={`${styles.quotaCard} ${quotaStatus?.activeSource === 'ai_quota_study' ? styles.activeQuota : ''}`}>
          <span className={styles.quotaLabel}>学习会员</span>
          <span className={styles.quotaValue}>{quota.study}</span>
        </div>
        <div className={`${styles.quotaCard} ${quotaStatus?.activeSource === 'ai_quota_agent' ? styles.activeQuota : ''}`}>
          <span className={styles.quotaLabel}>Agent 会员</span>
          <span className={styles.quotaValue}>{quota.agent}</span>
        </div>
        <div className={`${styles.quotaCard} ${quotaStatus?.activeSource === 'ai_quota' ? styles.activeQuota : ''}`}>
          <span className={styles.quotaLabel}>加油包</span>
          <span className={styles.quotaValue}>{quota.pack}</span>
        </div>
      </div>
      {quotaStatus?.activeSource && (
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
          当前使用: {activeSourceLabel[quotaStatus.activeSource] || quotaStatus.activeSource}
        </p>
      )}
    </section>
  )
}
