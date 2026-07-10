import { useState, useEffect } from 'react'
import { getActiveProducts } from '../../entitlement/productCatalog'
import { createEntitlementService } from '../../entitlement/entitlementService'
import { adminAuth, type AdminUser } from '../../entitlement/adminAuth'
import { persistentOrderService, type OrderStats } from '../../entitlement/persistentOrderService'
import type { EntitlementCode } from '../../entitlement/entitlementTypes'
import type { Product } from '../../entitlement/productTypes'
import type { Order, OrderStatus } from '../../entitlement/orderTypes'
import { createSafetyIncidentLog } from '../../../ai-partner/personas/safetyIncidentLog'
import { useToast } from '../toast/Toast'
import styles from './MembershipPage.module.css'

const safetyIncidentLog = createSafetyIncidentLog()

interface AdminConsolePageProps {
  onClose?: () => void
}

const entitlementService = createEntitlementService()

const entitlementCodeLabels: Record<string, string> = {
  study: '学习会员',
  agent: 'Agent 会员',
  agent_plus: 'Agent PLUS',
  space: '关系空间',
  ai_quota: 'AI 加油包',
  ai_quota_study: 'AI 学习会员额度',
  ai_quota_agent: 'AI Agent 会员额度',
  ai_quota_free: 'AI 免费额度',
  avatar_rpm: 'RPM 捏脸',
  avatar_ai_gen: 'AI 3D 角色生成',
  memory_sync: '记忆云同步',
  evolution_ritual: '自我进化仪式',
  evolution_realtime: '实时反思',
  avatar_evolution: '角色同步进化',
  agent_tool_call: 'Agent 工具调用',
  persona_preset: '预设 Persona',
  persona_custom_slot: '自定义 Persona 槽位'
}

const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: '待支付', color: '#f59e0b' },
  paid: { label: '已支付', color: '#10b981' },
  refunded: { label: '已退款', color: '#6366f1' },
  failed: { label: '失败', color: '#ef4444' }
}

function AdminLogin({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = adminAuth.login(username, password)
    if (result.success) {
      const user = adminAuth.getCurrentUser()
      if (user) onLogin(user)
    } else {
      setError(result.error || '登录失败')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div style={{ 
        maxWidth: 400, 
        margin: '80px auto', 
        padding: 40, 
        borderRadius: 16, 
        background: 'var(--surface)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 8px' }}>管理员登录</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>请输入管理员账号密码</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin 或 superadmin"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--app-background)',
                color: 'var(--text)',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--app-background)',
                color: 'var(--text)',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.purchaseButton}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          borderRadius: 8, 
          background: 'rgba(245, 158, 11, 0.1)',
          fontSize: 13,
          color: 'var(--muted)'
        }}>
          <strong>测试账号：</strong><br />
          admin / admin123<br />
          superadmin / super123
        </div>
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
      <section
        aria-modal="true"
        className="membership-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="订单详情"
        style={{ maxWidth: 500 }}
      >
        <header className="membership-modal-hero">
          <div className="membership-modal-hero-text">
            <p className="eyebrow">Order Detail · 订单详情</p>
            <h2>订单 #{order.id.slice(0, 12)}...</h2>
          </div>
          <button className="membership-modal-close" onClick={onClose} type="button">×</button>
        </header>
        <div className="membership-modal-content">
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <strong>订单 ID</strong>
              <code style={{ display: 'block', marginTop: 4, fontSize: 12 }}>{order.id}</code>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>用户 ID</strong>
                <p style={{ margin: '4px 0 0' }}>{order.userId}</p>
              </div>
              <div>
                <strong>商品 ID</strong>
                <p style={{ margin: '4px 0 0' }}>{order.productId}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>金额</strong>
                <p style={{ margin: '4px 0 0', color: '#10b981', fontWeight: 'bold' }}>
                  ¥{(order.amount / 100).toFixed(0)}
                </p>
              </div>
              <div>
                <strong>状态</strong>
                <p style={{ margin: '4px 0 0', color: statusLabels[order.status].color }}>
                  {statusLabels[order.status].label}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>支付渠道</strong>
                <p style={{ margin: '4px 0 0' }}>{order.channel}</p>
              </div>
              <div>
                <strong>渠道订单号</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>{order.channelTradeNo || '-'}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>创建时间</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {new Date(order.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <strong>支付时间</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '-'}
                </p>
              </div>
            </div>
            {order.rawReceipt && (
              <div>
                <strong>支付回执</strong>
                <pre style={{ 
                  margin: '8px 0 0', 
                  padding: 12, 
                  borderRadius: 8, 
                  background: 'var(--app-background)',
                  fontSize: 11,
                  overflow: 'auto',
                  maxHeight: 150
                }}>
                  {order.rawReceipt}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export function AdminConsolePage({ onClose }: AdminConsolePageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => adminAuth.isAuthenticated())
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => adminAuth.getCurrentUser())
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'products' | 'grants' | 'users' | 'orders' | 'stats' | 'safety'>('products')
  const [products] = useState(() => getActiveProducts())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [grantUserId, setGrantUserId] = useState('')
  const [grantCode, setGrantCode] = useState<string>('study')
  const [grantDays, setGrantDays] = useState(30)
  const [grantMessage, setGrantMessage] = useState('')
  const [queryUserId, setQueryUserId] = useState('')
  const [queryResult, setQueryResult] = useState<{ code: string; label: string; has: boolean }[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all')

  useEffect(() => {
    if (isLoggedIn) {
      persistentOrderService.loadFromStorage().then(() => {
        setOrderStats(persistentOrderService.getStats())
        setOrders(persistentOrderService.getAllOrders().sort((a, b) => 
          b.createdAt.localeCompare(a.createdAt)
        ))
      })
    }
  }, [isLoggedIn])

  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    adminAuth.logout()
    setCurrentUser(null)
    setIsLoggedIn(false)
  }

  const handleGrant = () => {
    if (!grantUserId.trim()) {
      setGrantMessage('请输入用户 ID')
      return
    }

    try {
      entitlementService.grant(grantUserId.trim(), {
        code: grantCode as EntitlementCode,
        source: 'monthly_grant',
        expireAt: new Date(Date.now() + grantDays * 24 * 60 * 60 * 1000).toISOString()
      })
      setGrantMessage(`成功授予 ${entitlementCodeLabels[grantCode]} ${grantDays} 天`)
      setGrantUserId('')
    } catch (e) {
      setGrantMessage(`授予失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  const handleQueryUser = () => {
    if (!queryUserId.trim()) return

    const codes = [
      'study', 'agent', 'agent_plus', 'space',
      'ai_quota', 'ai_quota_study', 'ai_quota_agent', 'ai_quota_free',
      'avatar_rpm', 'avatar_ai_gen', 'memory_sync',
      'evolution_ritual', 'evolution_realtime', 'avatar_evolution', 'agent_tool_call'
    ] as const

    const results = codes.map(code => ({
      code,
      label: entitlementCodeLabels[code] || code,
      has: entitlementService.has(queryUserId.trim(), code)
    }))

    setQueryResult(results)
  }

  const handleRefundOrder = (orderId: string) => {
    try {
      persistentOrderService.markAsRefunded(orderId)
      setOrders(persistentOrderService.getAllOrders().sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      ))
      setOrderStats(persistentOrderService.getStats())
      addToast({ type: 'success', title: '退款成功' })
    } catch (e) {
      addToast({ type: 'error', title: '退款失败', message: e instanceof Error ? e.message : '未知错误' })
    }
  }

  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === orderFilter)

  const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(0)}`

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>管理后台</h1>
          <p className={styles.subtitle}>商品配置与权益管理</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            欢迎，{currentUser?.username} ({currentUser?.role})
          </span>
          <button 
            className={styles.purchaseButton}
            onClick={handleLogout}
            style={{ background: 'var(--border)', fontSize: 12 }}
          >
            退出登录
          </button>
          {onClose && (
            <button className={styles.purchaseButton} onClick={onClose} style={{ fontSize: 12 }}>
              关闭
            </button>
          )}
        </div>
      </header>

      <nav className="theme-modal-toolbar" style={{ marginBottom: 24 }}>
        <button
          className={activeTab === 'products' ? 'theme-family-chip active' : 'theme-family-chip'}
          onClick={() => setActiveTab('products')}
          type="button"
        >
          商品配置
        </button>
        <button
          className={activeTab === 'grants' ? 'theme-family-chip active' : 'theme-family-chip'}
          onClick={() => setActiveTab('grants')}
          type="button"
        >
          赠送发放
        </button>
        <button
          className={activeTab === 'users' ? 'theme-family-chip active' : 'theme-family-chip'}
          onClick={() => setActiveTab('users')}
          type="button"
        >
          用户查询
        </button>
        <button
          className={activeTab === 'orders' ? 'theme-family-chip active' : 'theme-family-chip'}
          onClick={() => setActiveTab('orders')}
          type="button"
        >
          订单管理
        </button>
        <button
          className={activeTab === 'stats' ? 'theme-family-chip active' : 'theme-family-chip'}
          onClick={() => setActiveTab('stats')}
          type="button"
        >
          数据统计
        </button>
        <button
          className={activeTab === 'safety' ? 'theme-family-chip active' : 'theme-family-chip'}
          onClick={() => setActiveTab('safety')}
          type="button"
        >
          安全日志
        </button>
      </nav>

      {activeTab === 'products' && (
        <section className={styles.statusSection}>
          <h2>商品目录</h2>
          <div className={styles.productGrid}>
            {products.map((product) => (
              <div
                key={product.id}
                className={`${styles.productCard} ${selectedProduct?.id === product.id ? styles.current : ''}`}
                onClick={() => setSelectedProduct(product)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.tierLabel}>{product.name}</span>
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
                      <li key={i}>• {entitlementCodeLabels[grant.code as EntitlementCode] || grant.code}</li>
                    ))}
                    {product.grants.length > 3 && <li>• 还有 {product.grants.length - 3} 项</li>}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {selectedProduct && (
            <div className={styles.statusCard} style={{ marginTop: 24 }}>
              <h3>商品详情: {selectedProduct.name}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div>
                  <strong>ID:</strong> <code>{selectedProduct.id}</code>
                </div>
                <div>
                  <strong>类型:</strong> {selectedProduct.type}
                </div>
                <div>
                  <strong>价格:</strong> {formatPrice(selectedProduct.price)}
                </div>
                <div>
                  <strong>周期:</strong> {selectedProduct.period || '-'}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>权益授予:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                    {selectedProduct.grants.map((grant, i) => (
                      <li key={i}>
                        {entitlementCodeLabels[grant.code as EntitlementCode] || grant.code}
                        {grant.durationDays && ` (${grant.durationDays}天)`}
                        {grant.quantity && ` (${grant.quantity}次)`}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>渠道:</strong> {selectedProduct.channel.join(', ')}
                </div>
                <div>
                  <strong>状态:</strong> {selectedProduct.active ? '✅ 活跃' : '❌ 停用'}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'grants' && (
        <section className={styles.statusSection}>
          <h2>赠送名额发放</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            为用户发放试用、赠送或活动权益
          </p>

          <div className={styles.statusCard}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>用户 ID</label>
                <input
                  type="text"
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  placeholder="输入用户 ID"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>权益类型</label>
                <select
                  value={grantCode}
                  onChange={(e) => setGrantCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="study">学习会员</option>
                  <option value="agent">Agent 会员</option>
                  <option value="agent_plus">Agent PLUS</option>
                  <option value="ai_quota">AI 加油包 (100次)</option>
                  <option value="ai_quota_study">AI 学习会员额度 (40次)</option>
                  <option value="ai_quota_agent">AI Agent 会员额度 (100次)</option>
                  <option value="memory_sync">记忆云同步</option>
                  <option value="avatar_rpm">RPM 捏脸</option>
                  <option value="avatar_ai_gen">AI 3D 角色生成</option>
                  <option value="evolution_ritual">自我进化仪式</option>
                  <option value="reflection_l1_monthly">L1 半切反思</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>有效期 (天)</label>
                <input
                  type="number"
                  value={grantDays}
                  onChange={(e) => setGrantDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                className={styles.purchaseButton}
                onClick={handleGrant}
                style={{ marginTop: 8 }}
              >
                确认发放
              </button>

              {grantMessage && (
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  background: grantMessage.includes('成功') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: grantMessage.includes('成功') ? '#10b981' : '#ef4444',
                  marginTop: 8
                }}>
                  {grantMessage}
                </div>
              )}
            </div>
          </div>

          <div className={styles.statusCard} style={{ marginTop: 24 }}>
            <h3>快速发放模板</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
              <button
                className={styles.purchaseButton}
                onClick={() => {
                  setGrantCode('study')
                  setGrantDays(7)
                  setGrantMessage('已选择: 学习会员 7天试用')
                }}
              >
                新人 7 天试用
              </button>
              <button
                className={styles.purchaseButton}
                onClick={() => {
                  setGrantCode('agent')
                  setGrantDays(7)
                  setGrantMessage('已选择: Agent 会员 7天试用')
                }}
              >
                Agent 7 天试用
              </button>
              <button
                className={styles.purchaseButton}
                onClick={() => {
                  setGrantCode('ai_quota')
                  setGrantDays(365)
                  setGrantMessage('已选择: AI 加油包 100次 (永不过期)')
                }}
              >
                邀请奖励 100 次
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section className={styles.statusSection}>
          <h2>用户权益查询</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            查询指定用户的权益状态
          </p>

          <div className={styles.statusCard}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={queryUserId}
                onChange={(e) => setQueryUserId(e.target.value)}
                placeholder="输入用户 ID"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
              <button className={styles.purchaseButton} onClick={handleQueryUser}>
                查询
              </button>
            </div>
          </div>

          {queryResult.length > 0 && (
            <div className={styles.statusCard} style={{ marginTop: 24 }}>
              <h3>查询结果: {queryUserId}</h3>
              <div className="table-responsive">
              <table className="membership-benefits-table data-table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>权益代码</th>
                    <th>权益名称</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {queryResult.map((item) => (
                    <tr key={item.code}>
                      <td><code>{item.code}</code></td>
                      <td>{item.label}</td>
                      <td style={{ color: item.has ? '#10b981' : '#94a3b8' }}>
                        {item.has ? '✅ 已拥有' : '❌ 未拥有'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'orders' && (
        <section className={styles.statusSection}>
          <h2>订单管理</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            查看和管理所有订单
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              className={orderFilter === 'all' ? 'theme-family-chip active' : 'theme-family-chip'}
              onClick={() => setOrderFilter('all')}
              type="button"
            >
              全部 ({orders.length})
            </button>
            <button
              className={orderFilter === 'pending' ? 'theme-family-chip active' : 'theme-family-chip'}
              onClick={() => setOrderFilter('pending')}
              type="button"
            >
              待支付 ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              className={orderFilter === 'paid' ? 'theme-family-chip active' : 'theme-family-chip'}
              onClick={() => setOrderFilter('paid')}
              type="button"
            >
              已支付 ({orders.filter(o => o.status === 'paid').length})
            </button>
            <button
              className={orderFilter === 'refunded' ? 'theme-family-chip active' : 'theme-family-chip'}
              onClick={() => setOrderFilter('refunded')}
              type="button"
            >
              已退款 ({orders.filter(o => o.status === 'refunded').length})
            </button>
          </div>

          <div className={styles.statusCard}>
            {filteredOrders.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
                暂无订单数据
              </p>
            ) : (
              <div className="table-responsive">
              <table className="membership-benefits-table data-table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>用户</th>
                    <th>商品</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td><code style={{ fontSize: 11 }}>{order.id.slice(0, 16)}...</code></td>
                      <td>{order.userId}</td>
                      <td>{order.productId}</td>
                      <td style={{ color: '#10b981', fontWeight: 'bold' }}>
                        {formatPrice(order.amount)}
                      </td>
                      <td>
                        <span style={{ 
                          color: statusLabels[order.status].color,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: `${statusLabels[order.status].color}20`,
                          fontSize: 12
                        }}>
                          {statusLabels[order.status].label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className={styles.purchaseButton}
                            onClick={() => setSelectedOrder(order)}
                            style={{ padding: '4px 12px', fontSize: 11 }}
                          >
                            详情
                          </button>
                          {order.status === 'paid' && (
                            <button
                              className={styles.purchaseButton}
                              onClick={() => handleRefundOrder(order.id)}
                              style={{ padding: '4px 12px', fontSize: 11, background: '#ef4444' }}
                            >
                              退款
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'stats' && (
        <section className={styles.statusSection}>
          <h2>数据统计</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            订单与收入统计概览
          </p>

          {orderStats && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                <div className={styles.statusCard}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--primary)' }}>
                      {orderStats.totalOrders}
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>总订单数</p>
                  </div>
                </div>
                <div className={styles.statusCard}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 'bold', color: '#10b981' }}>
                      {formatPrice(orderStats.totalRevenue)}
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>总收入</p>
                  </div>
                </div>
                <div className={styles.statusCard}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 'bold', color: '#f59e0b' }}>
                      {orderStats.pendingCount}
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>待支付</p>
                  </div>
                </div>
                <div className={styles.statusCard}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 'bold', color: '#10b981' }}>
                      {orderStats.paidCount}
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>已支付</p>
                  </div>
                </div>
              </div>

              <div className={styles.statusCard}>
                <h3>订单状态分布</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
                  <div style={{ 
                    padding: 20, 
                    borderRadius: 12, 
                    background: 'rgba(245, 158, 11, 0.1)',
                    textAlign: 'center'
                  }}>
                    <strong style={{ fontSize: 24, color: '#f59e0b' }}>{orderStats.pendingCount}</strong>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>待支付</p>
                  </div>
                  <div style={{ 
                    padding: 20, 
                    borderRadius: 12, 
                    background: 'rgba(16, 185, 129, 0.1)',
                    textAlign: 'center'
                  }}>
                    <strong style={{ fontSize: 24, color: '#10b981' }}>{orderStats.paidCount}</strong>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>已支付</p>
                  </div>
                  <div style={{ 
                    padding: 20, 
                    borderRadius: 12, 
                    background: 'rgba(99, 102, 241, 0.1)',
                    textAlign: 'center'
                  }}>
                    <strong style={{ fontSize: 24, color: '#6366f1' }}>{orderStats.refundedCount}</strong>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>已退款</p>
                  </div>
                  <div style={{ 
                    padding: 20, 
                    borderRadius: 12, 
                    background: 'rgba(239, 68, 68, 0.1)',
                    textAlign: 'center'
                  }}>
                    <strong style={{ fontSize: 24, color: '#ef4444' }}>{orderStats.failedCount}</strong>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>失败</p>
                  </div>
                </div>
              </div>

              {orderStats.totalOrders > 0 && (
                <div className={styles.statusCard} style={{ marginTop: 24 }}>
                  <h3>转化率分析</h3>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ 
                      display: 'flex', 
                      height: 24, 
                      borderRadius: 12, 
                      overflow: 'hidden',
                      background: 'var(--surface)'
                    }}>
                      <div style={{ 
                        width: `${(orderStats.paidCount / orderStats.totalOrders) * 100}%`,
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11
                      }}>
                        {orderStats.paidCount > 0 && `支付 ${((orderStats.paidCount / orderStats.totalOrders) * 100).toFixed(1)}%`}
                      </div>
                      <div style={{ 
                        width: `${(orderStats.pendingCount / orderStats.totalOrders) * 100}%`,
                        background: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11
                      }}>
                        {orderStats.pendingCount > 0 && `待付 ${((orderStats.pendingCount / orderStats.totalOrders) * 100).toFixed(1)}%`}
                      </div>
                      <div style={{ 
                        width: `${(orderStats.refundedCount / orderStats.totalOrders) * 100}%`,
                        background: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11
                      }}>
                        {orderStats.refundedCount > 0 && `退款 ${((orderStats.refundedCount / orderStats.totalOrders) * 100).toFixed(1)}%`}
                      </div>
                      <div style={{ 
                        width: `${(orderStats.failedCount / orderStats.totalOrders) * 100}%`,
                        background: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11
                      }}>
                        {orderStats.failedCount > 0 && `失败 ${((orderStats.failedCount / orderStats.totalOrders) * 100).toFixed(1)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {activeTab === 'safety' && (
        <section className={styles.statusSection}>
          <h2>安全事件日志</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            查看系统安全拦截记录和内容审核日志
          </p>

          <div className={styles.statusCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>最近安全事件</h3>
              <button
                className={styles.purchaseButton}
                onClick={() => safetyIncidentLog.clear()}
                style={{ background: '#ef4444', fontSize: 12 }}
              >
                清空日志
              </button>
            </div>

            {(() => {
              const recentIncidents = safetyIncidentLog.getRecent(50)
              if (recentIncidents.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    <span style={{ fontSize: 32 }}>🛡️</span>
                    <p style={{ margin: '12px 0 0' }}>暂无安全事件记录</p>
                  </div>
                )
              }

              const categoryStats = {
                content_violation: 0,
                jailbreak_attempt: 0,
                age_restriction: 0,
                user_report: 0,
                system_block: 0
              }

              recentIncidents.forEach(i => {
                if (categoryStats[i.category as keyof typeof categoryStats] !== undefined) {
                  categoryStats[i.category as keyof typeof categoryStats]++
                }
              })

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                    <div style={{ padding: 16, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>
                      <strong style={{ fontSize: 24, color: '#ef4444' }}>{categoryStats.content_violation}</strong>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>内容违规</p>
                    </div>
                    <div style={{ padding: 16, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', textAlign: 'center' }}>
                      <strong style={{ fontSize: 24, color: '#f59e0b' }}>{categoryStats.jailbreak_attempt}</strong>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>越狱攻击</p>
                    </div>
                    <div style={{ padding: 16, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', textAlign: 'center' }}>
                      <strong style={{ fontSize: 24, color: '#6366f1' }}>{categoryStats.age_restriction}</strong>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>年龄限制</p>
                    </div>
                    <div style={{ padding: 16, borderRadius: 8, background: 'rgba(139, 92, 246, 0.1)', textAlign: 'center' }}>
                      <strong style={{ fontSize: 24, color: '#8b5cf6' }}>{categoryStats.user_report}</strong>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>用户举报</p>
                    </div>
                    <div style={{ padding: 16, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
                      <strong style={{ fontSize: 24, color: '#10b981' }}>{categoryStats.system_block}</strong>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>系统拦截</p>
                    </div>
                  </div>

                  <div className="table-responsive">
                  <table className="membership-benefits-table data-table">
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>用户</th>
                        <th>类型</th>
                        <th>严重程度</th>
                        <th>描述</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentIncidents.map((incident) => (
                        <tr key={incident.id}>
                          <td style={{ fontSize: 12 }}>
                            {new Date(incident.createdAt).toLocaleString('zh-CN', { 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td><code style={{ fontSize: 11 }}>{incident.userId}</code></td>
                          <td>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 4, 
                              fontSize: 11,
                              background: incident.category === 'content_violation' ? 'rgba(239, 68, 68, 0.1)' :
                                         incident.category === 'jailbreak_attempt' ? 'rgba(245, 158, 11, 0.1)' :
                                         'rgba(99, 102, 241, 0.1)',
                              color: incident.category === 'content_violation' ? '#ef4444' :
                                     incident.category === 'jailbreak_attempt' ? '#f59e0b' : '#6366f1'
                            }}>
                              {incident.category === 'content_violation' ? '内容违规' :
                               incident.category === 'jailbreak_attempt' ? '越狱攻击' :
                               incident.category === 'age_restriction' ? '年龄限制' :
                               incident.category === 'user_report' ? '用户举报' : '系统拦截'}
                            </span>
                          </td>
                          <td>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 4, 
                              fontSize: 11,
                              background: incident.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                                         incident.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' :
                                         incident.severity === 'medium' ? 'rgba(245, 158, 11, 0.1)' :
                                         'rgba(148, 163, 184, 0.1)',
                              color: incident.severity === 'critical' ? '#ef4444' :
                                     incident.severity === 'high' ? '#ef4444' :
                                     incident.severity === 'medium' ? '#f59e0b' : '#94a3b8'
                            }}>
                              {incident.severity === 'critical' ? '严重' :
                               incident.severity === 'high' ? '高' :
                               incident.severity === 'medium' ? '中' : '低'}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {incident.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )
            })()}
          </div>
        </section>
      )}
    </div>
  )
}
