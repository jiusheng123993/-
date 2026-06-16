import type { FC } from 'react'
import type { MembershipFlowState } from '../../hooks/useMembershipFlow'
import { entitlementService } from '../../services/instances'
import { CouponRedeemInput } from './CouponRedeemInput'

interface MembershipModalProps {
  flow: MembershipFlowState
  userId: string
  inviteRewards: Array<{ inviteeName: string; status: string; rewardDays: number }>
  addToast: (toast: { type: string; title: string; message?: string }) => void
  onClose: () => void
}

export const MembershipModal: FC<MembershipModalProps> = ({ flow, userId, inviteRewards, addToast, onClose }) => {
  const {
    quotaStatus,
    totalQuota,
    currentTier,
    studyProducts,
    agentProducts,
    agentPlusProducts,
    userOrders,
    userTrials,
    userCoupons,
    hasActiveTrial,
    handleStartTrial,
    handleSubscribe,
    handleRedeemCoupon,
    getProductName,
    getChannelLabel,
    getStatusLabel,
    getStatusColor,
    formatPrice,
    getPeriodLabel,
    getTierInfo,
    getGrantLabel,
    setSelectedOrder
  } = flow

  return (
    <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
      <section
        aria-modal="true"
        className="membership-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="会员中心"
      >
        <header className="membership-modal-hero">
          <div className="membership-modal-hero-text">
            <p className="eyebrow">Membership · 会员中心</p>
            <h2>升级会员，解锁更多能力</h2>
            <small>
              当前 <strong style={{ color: currentTier.color }}>{currentTier.label}</strong> · AI 额度 {totalQuota} 次
            </small>
          </div>
          <button className="membership-modal-close" onClick={onClose} type="button" aria-label="关闭会员中心">
            ×
          </button>
        </header>

        <div className="membership-modal-content">
          <section className="membership-quota-section">
            <h3>AI 额度</h3>
            <div className="membership-quota-grid">
              <div className="membership-quota-card">
                <span className="membership-quota-label">免费额度</span>
                <span className="membership-quota-value">{quotaStatus.free?.remaining ?? 0}</span>
              </div>
              <div className="membership-quota-card">
                <span className="membership-quota-label">会员额度</span>
                <span className="membership-quota-value">{(quotaStatus.study?.remaining ?? 0) + (quotaStatus.agent?.remaining ?? 0)}</span>
              </div>
              <div className="membership-quota-card">
                <span className="membership-quota-label">加油包</span>
                <span className="membership-quota-value">{quotaStatus.pack?.remaining ?? 0}</span>
              </div>
            </div>
          </section>

          <section className="membership-trial-section">
            <h3>免费试用</h3>
            <p className="membership-trial-desc">先体验再决定，开启会员试用</p>
            <div className="membership-trial-grid">
              {!entitlementService.has(userId, 'study') && !hasActiveTrial('study') && (
                <div className="membership-trial-card">
                  <div className="membership-trial-header">
                    <span className="membership-trial-name">学习会员试用</span>
                    <span className="membership-trial-badge">3天</span>
                  </div>
                  <ul className="membership-trial-features">
                    <li>高级主题全解锁</li>
                    <li>云同步功能</li>
                    <li>50次AI额度</li>
                  </ul>
                  <button className="membership-trial-button" style={{ background: '#10b981' }} onClick={() => handleStartTrial('study', 3)}>立即试用</button>
                </div>
              )}
              {!entitlementService.has(userId, 'agent') && !hasActiveTrial('agent') && (
                <div className="membership-trial-card">
                  <div className="membership-trial-header">
                    <span className="membership-trial-name">Agent 会员试用</span>
                    <span className="membership-trial-badge">7天</span>
                  </div>
                  <ul className="membership-trial-features">
                    <li>有记忆的AI搭子</li>
                    <li>自我进化机制</li>
                    <li>200次AI额度</li>
                  </ul>
                  <button className="membership-trial-button" style={{ background: '#6366f1' }} onClick={() => handleStartTrial('agent', 7)}>立即试用</button>
                </div>
              )}
              {!entitlementService.has(userId, 'agent_plus') && !hasActiveTrial('agent_plus') && (
                <div className="membership-trial-card featured">
                  <div className="membership-trial-header">
                    <span className="membership-trial-name">Agent PLUS 试用</span>
                    <span className="membership-trial-badge">5天</span>
                  </div>
                  <ul className="membership-trial-features">
                    <li>AI 3D角色生成</li>
                    <li>无限AI额度</li>
                    <li>全部进阶功能</li>
                  </ul>
                  <button className="membership-trial-button" style={{ background: '#8b5cf6' }} onClick={() => handleStartTrial('agent_plus', 5)}>立即试用</button>
                </div>
              )}
              {userTrials.length > 0 && (
                <div className="membership-trial-status">
                  <h4>您的试用</h4>
                  {userTrials.filter(t => !t.used).map((trial, i) => (
                    <div key={i} className="membership-trial-active">
                      <span>{trial.code === 'study' ? '学习会员' : trial.code === 'agent' ? 'Agent 会员' : 'Agent PLUS'}</span>
                      <span className="membership-trial-expire">有效期至 {new Date(trial.expireAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="membership-tiers-section">
            <h3>会员套餐</h3>
            
            {(['study', 'agent', 'agent_plus'] as const).map((tier) => {
              const tierProducts = tier === 'study' ? studyProducts : tier === 'agent' ? agentProducts : agentPlusProducts
              const tierInfo = getTierInfo(tier)
              return (
                <div className={`membership-tier-group ${tier === 'agent' ? 'featured' : ''}`} key={tier}>
                  <div className="membership-tier-group-header">
                    <span className="membership-tier-name">{tierInfo.name}</span>
                    <span className="membership-tier-badge" style={{ background: tierInfo.color }}>{tierInfo.badge}</span>
                  </div>
                  <div className="membership-period-grid">
                    {tierProducts.map((product) => (
                      <div className="membership-period-card" key={product.id}>
                        <div className="membership-period-header">
                          <span className="membership-period-label">{getPeriodLabel(product.period || '')}付</span>
                          {product.originalPrice && (
                            <span className="membership-period-save">省{formatPrice(product.originalPrice - product.price)}</span>
                          )}
                        </div>
                        <div className="membership-period-price">
                          {product.originalPrice && (
                            <span className="original-price">{formatPrice(product.originalPrice)}</span>
                          )}
                          <span className="price">{formatPrice(product.price)}</span>
                        </div>
                        <ul className="membership-period-grants">
                          {product.grants.slice(0, 4).map((grant, idx) => (
                            <li key={idx}>{getGrantLabel(grant.code)}</li>
                          ))}
                          {product.grants.length > 4 && (
                            <li className="more">+{product.grants.length - 4} 更多</li>
                          )}
                        </ul>
                        <button className="membership-period-button" style={{ background: tierInfo.color }} onClick={() => handleSubscribe(product)}>
                          立即订阅
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>

          <section className="membership-benefits-section">
            <h3>权益对比</h3>
            <div className="table-responsive">
            <table className="membership-benefits-table data-table">
              <thead>
                <tr>
                  <th>权益项目</th>
                  <th>免费</th>
                  <th>学习会员</th>
                  <th>Agent</th>
                  <th>Agent PLUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI 额度</td>
                  <td>5次/天</td>
                  <td>50次/月</td>
                  <td>200次/月</td>
                  <td>无限</td>
                </tr>
                <tr>
                  <td>主题</td>
                  <td>3款</td>
                  <td>全部</td>
                  <td>全部</td>
                  <td>全部</td>
                </tr>
                <tr>
                  <td>云同步</td>
                  <td>❌</td>
                  <td>✅</td>
                  <td>✅</td>
                  <td>✅</td>
                </tr>
                <tr>
                  <td>AI 角色</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>✅</td>
                  <td>✅</td>
                </tr>
                <tr>
                  <td>记忆系统</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>✅</td>
                  <td>✅</td>
                </tr>
                <tr>
                  <td>自我进化</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>✅</td>
                  <td>✅</td>
                </tr>
                <tr>
                  <td>3D角色生成</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>10次/月</td>
                </tr>
                <tr>
                  <td>工具调用</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>✅</td>
                </tr>
              </tbody>
            </table>
            </div>
          </section>

          <section className="membership-dynamic-benefits-section">
            <h3>您的专属权益</h3>
            <div className="membership-dynamic-benefits">
              {entitlementService.has(userId, 'study') || hasActiveTrial('study') ? (
                <div className="membership-dynamic-benefit unlocked">
                  <span className="benefit-icon">✅</span>
                  <div className="benefit-content">
                    <span className="benefit-title">学习会员</span>
                    <span className="benefit-desc">高级主题全解锁 · 云同步 · 50次AI额度/月</span>
                  </div>
                </div>
              ) : (
                <div className="membership-dynamic-benefit locked">
                  <span className="benefit-icon">🔒</span>
                  <div className="benefit-content">
                    <span className="benefit-title">学习会员</span>
                    <span className="benefit-desc">开通后解锁高级主题、云同步、50次AI额度</span>
                  </div>
                </div>
              )}
              {entitlementService.has(userId, 'agent') || hasActiveTrial('agent') ? (
                <div className="membership-dynamic-benefit unlocked">
                  <span className="benefit-icon">✅</span>
                  <div className="benefit-content">
                    <span className="benefit-title">Agent 会员</span>
                    <span className="benefit-desc">有记忆的AI搭子 · 自我进化 · 角色系统 · 200次AI额度</span>
                  </div>
                </div>
              ) : (
                <div className="membership-dynamic-benefit locked">
                  <span className="benefit-icon">🔒</span>
                  <div className="benefit-content">
                    <span className="benefit-title">Agent 会员</span>
                    <span className="benefit-desc">开通后解锁AI搭子、记忆系统、自我进化</span>
                  </div>
                </div>
              )}
              {entitlementService.has(userId, 'agent_plus') || hasActiveTrial('agent_plus') ? (
                <div className="membership-dynamic-benefit unlocked">
                  <span className="benefit-icon">✅</span>
                  <div className="benefit-content">
                    <span className="benefit-title">Agent PLUS</span>
                    <span className="benefit-desc">AI 3D角色生成 · 无限AI额度 · 工具调用能力</span>
                  </div>
                </div>
              ) : (
                <div className="membership-dynamic-benefit locked">
                  <span className="benefit-icon">🔒</span>
                  <div className="benefit-content">
                    <span className="benefit-title">Agent PLUS</span>
                    <span className="benefit-desc">开通后解锁AI 3D角色、无限额度、工具调用</span>
                  </div>
                </div>
              )}
              {entitlementService.has(userId, 'avatar_rpm') && (
                <div className="membership-dynamic-benefit unlocked">
                  <span className="benefit-icon">🎭</span>
                  <div className="benefit-content">
                    <span className="benefit-title">RPM 捏脸</span>
                    <span className="benefit-desc">Ready Player Me 3D角色定制</span>
                  </div>
                </div>
              )}
              {entitlementService.has(userId, 'memory_sync') && (
                <div className="membership-dynamic-benefit unlocked">
                  <span className="benefit-icon">☁️</span>
                  <div className="benefit-content">
                    <span className="benefit-title">记忆云同步</span>
                    <span className="benefit-desc">多设备同步记忆画像</span>
                  </div>
                </div>
              )}
              {entitlementService.has(userId, 'avatar_ai_gen') && (
                <div className="membership-dynamic-benefit unlocked">
                  <span className="benefit-icon">🎨</span>
                  <div className="benefit-content">
                    <span className="benefit-title">AI 3D角色生成</span>
                    <span className="benefit-desc">输入描述生成专属3D角色</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="membership-invite-section">
            <h3>邀请好友</h3>
            <p className="membership-invite-desc">邀请好友注册，双方都可获得奖励</p>
            <div className="membership-invite-card">
              <div className="membership-invite-info">
                <div className="membership-invite-reward">
                  <span className="reward-icon">🎁</span>
                  <div className="reward-details">
                    <span className="reward-title">邀请奖励</span>
                    <span className="reward-value">成功邀请 1 人，双方各得 <strong>7 天会员</strong></span>
                  </div>
                </div>
                <div className="membership-invite-reward">
                  <span className="reward-icon">👥</span>
                  <div className="reward-details">
                    <span className="reward-title">邀请人数</span>
                    <span className="reward-value">已邀请 <strong>{inviteRewards.length}</strong> 人</span>
                  </div>
                </div>
              </div>
              <div className="membership-invite-actions">
                <button className="membership-invite-copy" onClick={() => {
                  const inviteLink = `${window.location.origin}?invite=${userId}`
                  navigator.clipboard.writeText(inviteLink)
                  addToast({ type: 'info', title: '已复制', message: '邀请链接已复制到剪贴板！' })
                }}>
                  复制邀请链接
                </button>
              </div>
              {inviteRewards.length > 0 && (
                <div className="membership-invite-list">
                  <h4>邀请记录</h4>
                  {inviteRewards.map((reward, i) => (
                    <div key={i} className="membership-invite-item">
                      <span className="invitee-name">{reward.inviteeName}</span>
                      <span className={`invite-status ${reward.status}`}>{reward.status === 'active' ? '已激活' : '待激活'}</span>
                      <span className="invite-reward">{reward.rewardDays}天</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="membership-coupon-section">
            <h3>优惠券</h3>
            <p className="membership-coupon-desc">输入优惠券码，享受专属折扣</p>
            <CouponRedeemInput onRedeem={handleRedeemCoupon} />
            {userCoupons.length > 0 && (
              <div className="membership-coupon-list">
                <h4>我的优惠券</h4>
                {userCoupons.filter(c => !c.used).map((coupon, i) => (
                  <div key={i} className="membership-coupon-card">
                    <span className="coupon-discount">{coupon.type === 'percent' ? `${coupon.discount}% 折扣` : `¥${coupon.discount} 减免`}</span>
                    <span className="coupon-code">{coupon.code}</span>
                    <span className="coupon-status">未使用</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="membership-renewal-section">
            <h3>续费优惠</h3>
            <p className="membership-renewal-desc">会员到期前续费，享受专属折扣</p>
            {(() => {
              const membershipExpireDays = Math.floor(Math.random() * 30) + 1
              const hasActiveMembership = entitlementService.has(userId, 'study') || entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
              if (!hasActiveMembership) {
                return (
                  <div className="membership-renewal-empty">
                    <span>暂无续费优惠</span>
                    <small>开通会员后可享受续费优惠</small>
                  </div>
                )
              }
              return (
                <div className="membership-renewal-card">
                  <div className="membership-renewal-info">
                    <div className="renewal-status">
                      {membershipExpireDays <= 7 ? (
                        <span className="renewal-urgent">即将到期 · 还剩 {membershipExpireDays} 天</span>
                      ) : membershipExpireDays <= 14 ? (
                        <span className="renewal-soon">即将到期 · 还剩 {membershipExpireDays} 天</span>
                      ) : (
                        <span className="renewal-normal">会员有效 · 还剩 {membershipExpireDays} 天</span>
                      )}
                    </div>
                    <div className="renewal-discount">
                      <span className="discount-badge">限时优惠</span>
                      <span className="discount-text">续费享 <strong>8折</strong> 优惠</span>
                    </div>
                  </div>
                  <button className="membership-renewal-button" onClick={() => {
                    const renewalProduct = products.find(p => p.period === 'year' && p.id.startsWith('agent'))
                    if (renewalProduct) handleSubscribe(renewalProduct)
                  }}>
                    立即续费
                  </button>
                </div>
              )
            })()}
          </section>

          <section className="membership-badge-section">
            <h3>会员等级</h3>
            <div className="membership-badge-display">
              <div className="membership-badge-card">
                <div className="badge-icon">
                  {entitlementService.has(userId, 'agent_plus') ? '👑' : entitlementService.has(userId, 'agent') ? '⭐' : entitlementService.has(userId, 'study') ? '🌟' : '🎯'}
                </div>
                <div className="badge-info">
                  <span className="badge-level">
                    {entitlementService.has(userId, 'agent_plus') ? 'Agent PLUS' : entitlementService.has(userId, 'agent') ? 'Agent 会员' : entitlementService.has(userId, 'study') ? '学习会员' : '免费用户'}
                  </span>
                  <span className="badge-desc">
                    {entitlementService.has(userId, 'agent_plus') ? '尊享全部功能' : entitlementService.has(userId, 'agent') ? '解锁AI搭子' : entitlementService.has(userId, 'study') ? '基础会员' : '体验基础功能'}
                  </span>
                </div>
              </div>
              <div className="membership-badge-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: entitlementService.has(userId, 'agent_plus') ? '100%' : entitlementService.has(userId, 'agent') ? '66%' : entitlementService.has(userId, 'study') ? '33%' : '10%' }}></div>
                </div>
                <div className="progress-labels">
                  <span>免费</span>
                  <span>学习</span>
                  <span>Agent</span>
                  <span>PLUS</span>
                </div>
              </div>
            </div>
          </section>

          <section className="membership-activity-section">
            <h3>会员专属活动</h3>
            <div className="membership-activity-grid">
              <div className="membership-activity-card">
                <span className="activity-tag">限时</span>
                <span className="activity-title">新用户专享</span>
                <span className="activity-desc">首月订阅享5折优惠</span>
                <button className="activity-button">立即参与</button>
              </div>
              <div className="membership-activity-card">
                <span className="activity-tag">热卖</span>
                <span className="activity-title">年度套餐特惠</span>
                <span className="activity-desc">年付低至6折起</span>
                <button className="activity-button">查看详情</button>
              </div>
              <div className="membership-activity-card">
                <span className="activity-tag">新品</span>
                <span className="activity-title">邀请返利</span>
                <span className="activity-desc">邀请好友得30天会员</span>
                <button className="activity-button">邀请好友</button>
              </div>
            </div>
          </section>

          <section className="membership-service-section">
            <h3>会员客服</h3>
            <div className="membership-service-grid">
              <button className="membership-service-item">
                <span className="service-icon">💬</span>
                <span className="service-label">在线客服</span>
                <span className="service-desc">工作日 9:00-18:00</span>
              </button>
              <button className="membership-service-item">
                <span className="service-icon">📧</span>
                <span className="service-label">邮件支持</span>
                <span className="service-desc">24小时内回复</span>
              </button>
              <button className="membership-service-item">
                <span className="service-icon">📱</span>
                <span className="service-label">微信客服</span>
                <span className="service-desc">添加微信咨询</span>
              </button>
              <button className="membership-service-item">
                <span className="service-icon">❓</span>
                <span className="service-label">常见问题</span>
                <span className="service-desc">快速解答</span>
              </button>
            </div>
          </section>

          <section className="membership-orders-section">
            <h3>订单记录</h3>
            {userOrders.length === 0 ? (
              <p className="membership-orders-empty">暂无订单记录</p>
            ) : (
              <div className="membership-orders-list">
                {userOrders.map((order) => (
                  <div 
                    className="membership-order-item" 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="membership-order-info">
                      <span className="membership-order-product">{getProductName(order.productId)}</span>
                      <span className="membership-order-date">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div className="membership-order-meta">
                      <span className="membership-order-amount">{formatPrice(order.amount)}</span>
                      <span className="membership-order-channel">{getChannelLabel(order.channel)}</span>
                      <span className="membership-order-status" style={{ color: getStatusColor(order.status) }}>{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}
