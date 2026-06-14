import { useState, useMemo } from 'react'
import {
  ShoppingBag,
  Sparkles,
  Crown,
  Unlock,
  Check,
  X,
  Star,
  Zap,
  Gift,
  Clock,
  User,
  Heart,
  Shield,
  AlertTriangle,
  RefreshCw,
  ChevronRight
} from 'lucide-react'
import type { PersonaDefinition } from './personaScheduler'
import type { PersonaProvider } from '../entitlement/personaProvider'
import type { PersistentEntitlementService } from '../entitlement/persistentEntitlementService'

interface CameoProduct {
  persona: PersonaDefinition
  price: number
  originalPrice?: number
  isNew: boolean
  isPopular: boolean
  isLimited: boolean
  limitedUntil?: string
  tags: string[]
}

interface CameoStorefrontUIProps {
  userId: string
  personaProvider: PersonaProvider
  entitlementService: PersistentEntitlementService
  onClose?: () => void
  onPurchase?: (personaId: string) => void
}

type ViewMode = 'store' | 'purchased'

const CAMEO_PRODUCTS: CameoProduct[] = [
  {
    persona: {
      id: 'cameo_cheerleader',
      name: '元气啦啦队',
      category: 'cameo',
      tone: ['energetic', 'cheerful'],
      shortDescription: '在你低谷时为你加油打气，用满满正能量陪你度过难关',
      identityRole: 'cheerleader',
      systemPromptTemplate: '',
      ageRestriction: 'all',
      emotionalIntimacy: 'medium',
      tierRequired: 'agent',
      unlockMethod: 'purchase',
      active: true
    },
    price: 9.9,
    originalPrice: 19.9,
    isNew: true,
    isPopular: false,
    isLimited: false,
    tags: ['鼓励', '正能量', '陪伴']
  },
  {
    persona: {
      id: 'cameo_storyteller',
      name: '睡前故事家',
      category: 'cameo',
      tone: ['gentle', 'soothing'],
      shortDescription: '用温柔的声音为你讲述睡前故事，安抚一天的疲惫',
      identityRole: 'storyteller',
      systemPromptTemplate: '',
      ageRestriction: 'all',
      emotionalIntimacy: 'high',
      tierRequired: 'agent',
      unlockMethod: 'purchase',
      active: true
    },
    price: 12.9,
    isNew: false,
    isPopular: true,
    isLimited: false,
    tags: ['睡前', '治愈', '故事']
  },
  {
    persona: {
      id: 'cameo_motivator',
      name: '硬核激励师',
      category: 'cameo',
      tone: ['strict', 'motivating'],
      shortDescription: '不给你任何借口，用最直接的方式逼你突破极限',
      identityRole: 'motivator',
      systemPromptTemplate: '',
      ageRestriction: '16+',
      emotionalIntimacy: 'low',
      tierRequired: 'agent',
      unlockMethod: 'purchase',
      active: true
    },
    price: 9.9,
    isNew: false,
    isPopular: false,
    isLimited: false,
    tags: ['激励', '突破', '高压']
  },
  {
    persona: {
      id: 'cameo_meditation_guide',
      name: '冥想引导师',
      category: 'cameo',
      tone: ['calm', 'mindful'],
      shortDescription: '引导你进入深度冥想状态，释放压力、找回内心平静',
      identityRole: 'meditation_guide',
      systemPromptTemplate: '',
      ageRestriction: 'all',
      emotionalIntimacy: 'medium',
      tierRequired: 'agent',
      unlockMethod: 'purchase',
      active: true
    },
    price: 15.9,
    originalPrice: 25.9,
    isNew: true,
    isPopular: false,
    isLimited: false,
    tags: ['冥想', '减压', '正念']
  },
  {
    persona: {
      id: 'cameo_creative_muse',
      name: '创意缪斯',
      category: 'cameo',
      tone: ['creative', 'inspiring'],
      shortDescription: '激发你的创作灵感，帮你突破创意瓶颈，让想法源源不断',
      identityRole: 'creative_muse',
      systemPromptTemplate: '',
      ageRestriction: 'all',
      emotionalIntimacy: 'medium',
      tierRequired: 'agent',
      unlockMethod: 'purchase',
      active: true
    },
    price: 11.9,
    isNew: false,
    isPopular: true,
    isLimited: false,
    tags: ['创意', '灵感', '创作']
  },
  {
    persona: {
      id: 'cameo_festive_companion',
      name: '节日限定·暖心伙伴',
      category: 'cameo',
      tone: ['warm', 'festive'],
      shortDescription: '节日限定客串角色，陪你度过每一个重要时刻',
      identityRole: 'festive_companion',
      systemPromptTemplate: '',
      ageRestriction: 'all',
      emotionalIntimacy: 'high',
      tierRequired: 'agent',
      unlockMethod: 'purchase',
      active: true
    },
    price: 19.9,
    originalPrice: 39.9,
    isNew: true,
    isPopular: true,
    isLimited: true,
    limitedUntil: '2026-07-15',
    tags: ['限定', '节日', '温暖']
  }
]

const FREE_CAMEO_IDS = ['cameo_cheerleader']

function formatPrice(price: number): string {
  return `¥${price.toFixed(1)}`
}

function getToneEmoji(tone: string[]): string {
  if (tone.includes('energetic') || tone.includes('cheerful')) return '🎉'
  if (tone.includes('gentle') || tone.includes('soothing')) return '🌙'
  if (tone.includes('strict') || tone.includes('motivating')) return '💪'
  if (tone.includes('calm') || tone.includes('mindful')) return '🧘'
  if (tone.includes('creative') || tone.includes('inspiring')) return '🎨'
  if (tone.includes('warm') || tone.includes('festive')) return '🎊'
  return '✨'
}

function getAgeBadge(restriction: string): { label: string; color: string } {
  if (restriction === '18+') return { label: '18+', color: '#ef4444' }
  if (restriction === '16+') return { label: '16+', color: '#f59e0b' }
  return { label: '全年龄', color: '#22c55e' }
}

export function CameoStorefrontUI({
  userId,
  personaProvider,
  entitlementService,
  onClose,
  onPurchase
}: CameoStorefrontUIProps) {
  const [view, setView] = useState<ViewMode>('store')
  const [selectedProduct, setSelectedProduct] = useState<CameoProduct | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const purchasedIds = useMemo(() => {
    return CAMEO_PRODUCTS
      .filter((p) => personaProvider.canUseCameo(userId, p.persona.id))
      .map((p) => p.persona.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, personaProvider, refreshKey])

  const freeProducts = useMemo(() => {
    return CAMEO_PRODUCTS.filter((p) => FREE_CAMEO_IDS.includes(p.persona.id))
  }, [])

  const paidProducts = useMemo(() => {
    return CAMEO_PRODUCTS.filter((p) => !FREE_CAMEO_IDS.includes(p.persona.id))
  }, [])

  const purchasedProducts = useMemo(() => {
    return CAMEO_PRODUCTS.filter((p) => purchasedIds.includes(p.persona.id))
  }, [purchasedIds])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handlePurchase = async (product: CameoProduct) => {
    if (purchasing) return
    setPurchasing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      entitlementService.grant(userId, {
        code: `persona_cameo_${product.persona.id}`,
        source: 'one_time_purchase',
        expireAt: null,
        scope: product.persona.id
      })

      setRefreshKey((k) => k + 1)
      showToast('success', `已解锁「${product.persona.name}」`)
      onPurchase?.(product.persona.id)
      setSelectedProduct(null)
    } catch {
      showToast('error', '购买失败，请重试')
    } finally {
      setPurchasing(false)
    }
  }

  const handleClaimFree = async (product: CameoProduct) => {
    if (purchasing) return
    setPurchasing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      entitlementService.grant(userId, {
        code: `persona_cameo_${product.persona.id}`,
        source: 'trial',
        expireAt: null,
        scope: product.persona.id
      })

      setRefreshKey((k) => k + 1)
      showToast('success', `已领取「${product.persona.name}」`)
      onPurchase?.(product.persona.id)
    } catch {
      showToast('error', '领取失败，请重试')
    } finally {
      setPurchasing(false)
    }
  }

  const renderProductCard = (product: CameoProduct) => {
    const isPurchased = purchasedIds.includes(product.persona.id)
    const isFree = FREE_CAMEO_IDS.includes(product.persona.id)
    const ageBadge = getAgeBadge(product.persona.ageRestriction)

    return (
      <div
        key={product.persona.id}
        className={`cameo-storefront-card ${isPurchased ? 'purchased' : ''} ${product.isLimited ? 'limited' : ''}`}
        onClick={() => !isPurchased && setSelectedProduct(product)}
      >
        {product.isNew && (
          <div className="cameo-storefront-card-badge new">
            <Sparkles size={12} />
            <span>新品</span>
          </div>
        )}
        {product.isPopular && !product.isNew && (
          <div className="cameo-storefront-card-badge popular">
            <Crown size={12} />
            <span>热门</span>
          </div>
        )}
        {product.isLimited && (
          <div className="cameo-storefront-card-badge limited-badge">
            <Clock size={12} />
            <span>限定</span>
          </div>
        )}

        <div className="cameo-storefront-card-avatar">
          {getToneEmoji(product.persona.tone)}
        </div>

        <div className="cameo-storefront-card-info">
          <h3 className="cameo-storefront-card-name">{product.persona.name}</h3>
          <p className="cameo-storefront-card-desc">{product.persona.shortDescription}</p>

          <div className="cameo-storefront-card-tags">
            {product.tags.map((tag) => (
              <span key={tag} className="cameo-storefront-card-tag">{tag}</span>
            ))}
            <span
              className="cameo-storefront-card-tag age-tag"
              style={{ background: `${ageBadge.color}18`, color: ageBadge.color }}
            >
              {ageBadge.label}
            </span>
          </div>

          <div className="cameo-storefront-card-footer">
            {isPurchased ? (
              <div className="cameo-storefront-card-owned">
                <Check size={16} />
                <span>已拥有</span>
              </div>
            ) : isFree ? (
              <button
                className="cameo-storefront-card-btn free"
                onClick={(e) => { e.stopPropagation(); handleClaimFree(product) }}
                disabled={purchasing}
              >
                <Gift size={14} />
                <span>免费领取</span>
              </button>
            ) : (
              <div className="cameo-storefront-card-price">
                <span className="cameo-storefront-price-current">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="cameo-storefront-price-original">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cameo-storefront-backdrop">
      <div className="cameo-storefront-modal">
        <div className="cameo-storefront-header">
          <div className="cameo-storefront-header-left">
            <ShoppingBag size={22} />
            <h2>客串商店</h2>
          </div>
          <div className="cameo-storefront-header-actions">
            <button
              className={`cameo-storefront-tab-btn ${view === 'store' ? 'active' : ''}`}
              onClick={() => setView('store')}
            >
              <Sparkles size={14} />
              <span>商店</span>
            </button>
            <button
              className={`cameo-storefront-tab-btn ${view === 'purchased' ? 'active' : ''}`}
              onClick={() => setView('purchased')}
            >
              <Crown size={14} />
              <span>已购</span>
              {purchasedIds.length > 0 && (
                <span className="cameo-storefront-tab-count">{purchasedIds.length}</span>
              )}
            </button>
            <button className="cameo-storefront-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cameo-storefront-body">
          {view === 'store' ? (
            <div className="cameo-storefront-store">
              <div className="cameo-storefront-banner">
                <div className="cameo-storefront-banner-content">
                  <h3>解锁专属客串角色</h3>
                  <p>每个客串角色都有独特的性格和陪伴方式，为你的成长旅程增添更多色彩</p>
                </div>
                <div className="cameo-storefront-banner-icons">
                  <Star size={20} />
                  <Zap size={20} />
                  <Heart size={20} />
                </div>
              </div>

              {freeProducts.length > 0 && (
                <section className="cameo-storefront-section">
                  <div className="cameo-storefront-section-header">
                    <h3>
                      <Gift size={16} />
                      限时免费
                    </h3>
                    <span className="cameo-storefront-section-subtitle">新用户专享，立即领取</span>
                  </div>
                  <div className="cameo-storefront-grid">
                    {freeProducts.map(renderProductCard)}
                  </div>
                </section>
              )}

              <section className="cameo-storefront-section">
                <div className="cameo-storefront-section-header">
                  <h3>
                    <Crown size={16} />
                    付费客串
                  </h3>
                  <span className="cameo-storefront-section-subtitle">一次购买，永久拥有</span>
                </div>
                <div className="cameo-storefront-grid">
                  {paidProducts.map(renderProductCard)}
                </div>
              </section>

              <div className="cameo-storefront-footer-note">
                <Shield size={14} />
                <span>购买后永久有效，可在 Persona 切换中随时使用</span>
              </div>
            </div>
          ) : (
            <div className="cameo-storefront-purchased">
              {purchasedProducts.length === 0 ? (
                <div className="cameo-storefront-empty">
                  <ShoppingBag size={48} />
                  <h3>还没有已购客串</h3>
                  <p>去商店逛逛，发现更多有趣的客串角色</p>
                  <button
                    className="cameo-storefront-empty-btn"
                    onClick={() => setView('store')}
                  >
                    去商店
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="cameo-storefront-section-header">
                    <h3>
                      <Crown size={16} />
                      已解锁客串
                    </h3>
                    <span className="cameo-storefront-section-subtitle">
                      共 {purchasedProducts.length} 个角色
                    </span>
                  </div>
                  <div className="cameo-storefront-grid">
                    {purchasedProducts.map(renderProductCard)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="cameo-storefront-modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div
              className="cameo-storefront-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="cameo-storefront-dialog-close"
                onClick={() => setSelectedProduct(null)}
              >
                <X size={18} />
              </button>

              <div className="cameo-storefront-dialog-hero">
                <div className="cameo-storefront-dialog-avatar">
                  {getToneEmoji(selectedProduct.persona.tone)}
                </div>
                <h3>{selectedProduct.persona.name}</h3>
                <p className="cameo-storefront-dialog-desc">
                  {selectedProduct.persona.shortDescription}
                </p>
              </div>

              <div className="cameo-storefront-dialog-details">
                <div className="cameo-storefront-dialog-detail-item">
                  <User size={14} />
                  <span>身份：{selectedProduct.persona.identityRole}</span>
                </div>
                <div className="cameo-storefront-dialog-detail-item">
                  <Heart size={14} />
                  <span>亲密度：{
                    selectedProduct.persona.emotionalIntimacy === 'high' ? '高' :
                    selectedProduct.persona.emotionalIntimacy === 'medium' ? '中' : '低'
                  }</span>
                </div>
                <div className="cameo-storefront-dialog-detail-item">
                  <Shield size={14} />
                  <span>年龄限制：{getAgeBadge(selectedProduct.persona.ageRestriction).label}</span>
                </div>
                {selectedProduct.isLimited && selectedProduct.limitedUntil && (
                  <div className="cameo-storefront-dialog-detail-item limited-info">
                    <Clock size={14} />
                    <span>限时截止：{selectedProduct.limitedUntil}</span>
                  </div>
                )}
              </div>

              <div className="cameo-storefront-dialog-tags">
                {selectedProduct.tags.map((tag) => (
                  <span key={tag} className="cameo-storefront-dialog-tag">{tag}</span>
                ))}
              </div>

              <div className="cameo-storefront-dialog-price-section">
                <div className="cameo-storefront-dialog-price">
                  <span className="cameo-storefront-dialog-price-current">
                    {formatPrice(selectedProduct.price)}
                  </span>
                  {selectedProduct.originalPrice && (
                    <>
                      <span className="cameo-storefront-dialog-price-original">
                        {formatPrice(selectedProduct.originalPrice)}
                      </span>
                      <span className="cameo-storefront-dialog-price-discount">
                        省{formatPrice(selectedProduct.originalPrice - selectedProduct.price)}
                      </span>
                    </>
                  )}
                </div>
                <p className="cameo-storefront-dialog-price-note">一次购买，永久拥有</p>
              </div>

              <div className="cameo-storefront-dialog-actions">
                <button
                  className="cameo-storefront-dialog-btn secondary"
                  onClick={() => setSelectedProduct(null)}
                >
                  取消
                </button>
                <button
                  className="cameo-storefront-dialog-btn primary"
                  onClick={() => handlePurchase(selectedProduct)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <>
                      <RefreshCw size={14} className="spinning" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Unlock size={14} />
                      立即解锁
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`cameo-storefront-toast ${toast.type}`}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
