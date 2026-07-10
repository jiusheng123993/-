import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import type { MembershipFlowState } from '../../hooks/useMembershipFlow'
import { entitlementService } from '../../services/instances'
import { CouponRedeemInput } from './CouponRedeemInput'

interface MembershipModalProps {
  isOpen: boolean
  flow: MembershipFlowState
  userId: string
  inviteRewards: Array<{ inviteeName: string; status: string; rewardDays: number }>
  addToast: (toast: { type: string; title: string; message?: string }) => void
  onClose: () => void
}

export const MembershipModal: FC<MembershipModalProps> = ({ isOpen, flow, userId, inviteRewards, addToast, onClose }) => {
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
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="升级会员，解锁更多能力"
      subtitle={`Membership · 会员中心 · 当前 ${currentTier.label} · AI 额度 ${totalQuota} 次`}
      ariaLabel="会员中心"
    >
      <div className="membership-modal-content">
      <section className="membership-quota-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>AI 额度</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface-elevated)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>免费额度</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{quotaStatus.free?.remaining ?? 0}</span>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface-elevated)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>会员额度</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{(quotaStatus.study?.remaining ?? 0) + (quotaStatus.agent?.remaining ?? 0)}</span>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface-elevated)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>加油包</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{quotaStatus.pack?.remaining ?? 0}</span>
          </div>
        </div>
      </section>

      <section className="membership-trial-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>免费试用</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>先体验再决定，开启会员试用</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {!entitlementService.has(userId, 'study') && !hasActiveTrial('study') && (
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>学习会员试用</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, background: '#10b981', color: '#fff', fontSize: 12 }}>3天</span>
              </div>
              <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, color: 'var(--muted)' }}>
                <li>高级主题全解锁</li>
                <li>云同步功能</li>
                <li>50次AI额度</li>
              </ul>
              <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStartTrial('study', 3)}>立即试用</button>
            </div>
          )}
          {!entitlementService.has(userId, 'agent') && !hasActiveTrial('agent') && (
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Agent 会员试用</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, background: '#6366f1', color: '#fff', fontSize: 12 }}>7天</span>
              </div>
              <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, color: 'var(--muted)' }}>
                <li>有记忆的AI搭子</li>
                <li>自我进化机制</li>
                <li>200次AI额度</li>
              </ul>
              <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStartTrial('agent', 7)}>立即试用</button>
            </div>
          )}
          {!entitlementService.has(userId, 'agent_plus') && !hasActiveTrial('agent_plus') && (
            <div style={{ padding: 16, borderRadius: 12, border: '2px solid #8b5cf6', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Agent PLUS 试用</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, background: '#8b5cf6', color: '#fff', fontSize: 12 }}>5天</span>
              </div>
              <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, color: 'var(--muted)' }}>
                <li>AI 3D角色生成</li>
                <li>无限AI额度</li>
                <li>全部进阶功能</li>
              </ul>
              <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStartTrial('agent_plus', 5)}>立即试用</button>
            </div>
          )}
          {userTrials.length > 0 && (
            <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface-elevated)', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>您的试用</h4>
              {userTrials.filter(t => !t.used).map((trial, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{trial.code === 'study' ? '学习会员' : trial.code === 'agent' ? 'Agent 会员' : 'Agent PLUS'}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>有效期至 {new Date(trial.expireAt).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="membership-tiers-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>会员套餐</h3>
        {(['study', 'agent', 'agent_plus'] as const).map((tier) => {
          const tierProducts = tier === 'study' ? studyProducts : tier === 'agent' ? agentProducts : agentPlusProducts
          const tierInfo = getTierInfo(tier)
          return (
            <div key={tier} style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: tier === 'agent' ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{tierInfo.name}</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, background: tierInfo.color, color: '#fff', fontSize: 12 }}>{tierInfo.badge}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {tierProducts.map((product) => (
                  <div key={product.id} style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-elevated)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>{getPeriodLabel(product.period || '')}付</span>
                      {product.originalPrice && (
                        <span style={{ fontSize: 12, color: '#10b981' }}>省{formatPrice(product.originalPrice - product.price)}</span>
                      )}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      {product.originalPrice && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: 13, marginRight: 8 }}>{formatPrice(product.originalPrice)}</span>
                      )}
                      <span style={{ fontSize: 20, fontWeight: 700 }}>{formatPrice(product.price)}</span>
                    </div>
                    <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, color: 'var(--muted)' }}>
                      {product.grants.slice(0, 4).map((grant, idx) => (
                        <li key={idx}>{getGrantLabel(grant.code)}</li>
                      ))}
                      {product.grants.length > 4 && (
                        <li>+{product.grants.length - 4} 更多</li>
                      )}
                    </ul>
                    <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: tierInfo.color, color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSubscribe(product)}>
                      立即订阅
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <section className="membership-benefits-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>权益对比</h3>
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>权益项目</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>免费</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>学习会员</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Agent</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Agent PLUS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>AI 额度</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>5次/天</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>50次/月</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>200次/月</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>无限</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>主题</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>3款</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>全部</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>全部</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>全部</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>云同步</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>AI 角色</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>记忆系统</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>自我进化</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>3D角色生成</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>10次/月</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px' }}>工具调用</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>❌</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="membership-dynamic-benefits-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>您的专属权益</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entitlementService.has(userId, 'study') || hasActiveTrial('study') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)' }}>
              <span>✅</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>学习会员</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>高级主题全解锁 · 云同步 · 50次AI额度/月</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', opacity: 0.6 }}>
              <span>🔒</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>学习会员</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>开通后解锁高级主题、云同步、50次AI额度</span>
              </div>
            </div>
          )}
          {entitlementService.has(userId, 'agent') || hasActiveTrial('agent') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)' }}>
              <span>✅</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>Agent 会员</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>有记忆的AI搭子 · 自我进化 · 角色系统 · 200次AI额度</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', opacity: 0.6 }}>
              <span>🔒</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>Agent 会员</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>开通后解锁AI搭子、记忆系统、自我进化</span>
              </div>
            </div>
          )}
          {entitlementService.has(userId, 'agent_plus') || hasActiveTrial('agent_plus') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)' }}>
              <span>✅</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>Agent PLUS</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>AI 3D角色生成 · 无限AI额度 · 工具调用能力</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', opacity: 0.6 }}>
              <span>🔒</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>Agent PLUS</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>开通后解锁AI 3D角色、无限额度、工具调用</span>
              </div>
            </div>
          )}
          {entitlementService.has(userId, 'avatar_rpm') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)' }}>
              <span>🎭</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>RPM 捏脸</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Ready Player Me 3D角色定制</span>
              </div>
            </div>
          )}
          {entitlementService.has(userId, 'memory_sync') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)' }}>
              <span>☁️</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>记忆云同步</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>多设备同步记忆画像</span>
              </div>
            </div>
          )}
          {entitlementService.has(userId, 'avatar_ai_gen') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)' }}>
              <span>🎨</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600 }}>AI 3D角色生成</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>输入描述生成专属3D角色</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="membership-invite-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>邀请好友</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>邀请好友注册，双方都可获得奖励</p>
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎁</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>邀请奖励</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>成功邀请 1 人，双方各得 <strong>7 天会员</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👥</span>
              <div>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>邀请人数</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>已邀请 <strong>{inviteRewards.length}</strong> 人</span>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <button style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--primary)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => {
              const inviteLink = `${window.location.origin}?invite=${userId}`
              navigator.clipboard.writeText(inviteLink)
              addToast({ type: 'info', title: '已复制', message: '邀请链接已复制到剪贴板！' })
            }}>
              复制邀请链接
            </button>
          </div>
          {inviteRewards.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>邀请记录</h4>
              {inviteRewards.map((reward, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{reward.inviteeName}</span>
                  <span style={{ color: reward.status === 'active' ? '#10b981' : 'var(--muted)' }}>{reward.status === 'active' ? '已激活' : '待激活'}</span>
                  <span>{reward.rewardDays}天</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="membership-coupon-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>优惠券</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>输入优惠券码，享受专属折扣</p>
        <CouponRedeemInput onRedeem={handleRedeemCoupon} />
        {userCoupons.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>我的优惠券</h4>
            {userCoupons.filter(c => !c.used).map((coupon, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>{coupon.type === 'percent' ? `${coupon.discount}% 折扣` : `¥${coupon.discount} 减免`}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{coupon.code}</span>
                <span style={{ fontSize: 13, color: '#10b981' }}>未使用</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="membership-renewal-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>续费优惠</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>会员到期前续费，享受专属折扣</p>
        {(() => {
          const membershipExpireDays = Math.floor(Math.random() * 30) + 1
          const hasActiveMembership = entitlementService.has(userId, 'study') || entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
          if (!hasActiveMembership) {
            return (
              <div style={{ padding: 24, borderRadius: 12, background: 'var(--surface-elevated)', textAlign: 'center', color: 'var(--muted)' }}>
                <span style={{ display: 'block' }}>暂无续费优惠</span>
                <small style={{ display: 'block', marginTop: 4 }}>开通会员后可享受续费优惠</small>
              </div>
            )
          }
          return (
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 8 }}>
                  {membershipExpireDays <= 7 ? (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>即将到期 · 还剩 {membershipExpireDays} 天</span>
                  ) : membershipExpireDays <= 14 ? (
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>即将到期 · 还剩 {membershipExpireDays} 天</span>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>会员有效 · 还剩 {membershipExpireDays} 天</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#d97706', fontSize: 12 }}>限时优惠</span>
                  <span style={{ fontSize: 13 }}>续费享 <strong>8折</strong> 优惠</span>
                </div>
              </div>
              <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => {
                const renewalProduct = products.find(p => p.period === 'year' && p.id.startsWith('agent'))
                if (renewalProduct) handleSubscribe(renewalProduct)
              }}>
                立即续费
              </button>
            </div>
          )
        })()}
      </section>

      <section className="membership-badge-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>会员等级</h3>
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32 }}>
              {entitlementService.has(userId, 'agent_plus') ? '👑' : entitlementService.has(userId, 'agent') ? '⭐' : entitlementService.has(userId, 'study') ? '🌟' : '🎯'}
            </span>
            <div>
              <span style={{ display: 'block', fontWeight: 600 }}>
                {entitlementService.has(userId, 'agent_plus') ? 'Agent PLUS' : entitlementService.has(userId, 'agent') ? 'Agent 会员' : entitlementService.has(userId, 'study') ? '学习会员' : '免费用户'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {entitlementService.has(userId, 'agent_plus') ? '尊享全部功能' : entitlementService.has(userId, 'agent') ? '解锁AI搭子' : entitlementService.has(userId, 'study') ? '基础会员' : '体验基础功能'}
              </span>
            </div>
          </div>
          <div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'var(--primary)', width: entitlementService.has(userId, 'agent_plus') ? '100%' : entitlementService.has(userId, 'agent') ? '66%' : entitlementService.has(userId, 'study') ? '33%' : '10%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
              <span>免费</span>
              <span>学习</span>
              <span>Agent</span>
              <span>PLUS</span>
            </div>
          </div>
        </div>
      </section>

      <section className="membership-activity-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>会员专属活动</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#d97706', fontSize: 12, marginBottom: 8 }}>限时</span>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>新用户专享</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>首月订阅享5折优惠</span>
            <button style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>立即参与</button>
          </div>
          <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: '#fee2e2', color: '#ef4444', fontSize: 12, marginBottom: 8 }}>热卖</span>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>年度套餐特惠</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>年付低至6折起</span>
            <button style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>查看详情</button>
          </div>
          <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: '#dbeafe', color: '#3b82f6', fontSize: 12, marginBottom: 8 }}>新品</span>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>邀请返利</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>邀请好友得30天会员</span>
            <button style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>邀请好友</button>
          </div>
        </div>
      </section>

      <section className="membership-service-section" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>会员客服</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          <button style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ display: 'block', fontSize: 24, marginBottom: 4 }}>💬</span>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>在线客服</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>工作日 9:00-18:00</span>
          </button>
          <button style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ display: 'block', fontSize: 24, marginBottom: 4 }}>📧</span>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>邮件支持</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>24小时内回复</span>
          </button>
          <button style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ display: 'block', fontSize: 24, marginBottom: 4 }}>📱</span>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>微信客服</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>添加微信咨询</span>
          </button>
          <button style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ display: 'block', fontSize: 24, marginBottom: 4 }}>❓</span>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>常见问题</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>快速解答</span>
          </button>
        </div>
      </section>

      <section className="membership-orders-section">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>订单记录</h3>
        {userOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>暂无订单记录</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <span style={{ display: 'block', fontWeight: 600 }}>{getProductName(order.productId)}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600 }}>{formatPrice(order.amount)}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{getChannelLabel(order.channel)}</span>
                  <span style={{ fontSize: 13, color: getStatusColor(order.status) }}>{getStatusLabel(order.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </AdaptiveModal>
  )
}
