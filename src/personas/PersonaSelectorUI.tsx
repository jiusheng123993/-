import { useMemo, useState } from 'react'
import { createPersonaProvider, type PersonaProvider } from '../entitlement/personaProvider'
import { createEntitlementService } from '../entitlement/entitlementService'
import { PRESET_PERSONAS, type PersonaDefinition } from './personaScheduler'
import styles from '../components/membership/MembershipPage.module.css'

const entitlementService = createEntitlementService()
const personaProvider: PersonaProvider = createPersonaProvider(entitlementService)

interface PersonaSelectorUIProps {
  userId: string
  currentPersonaId?: string
  onSelect?: (personaId: string) => void
}

export function PersonaSelectorUI({ userId, currentPersonaId, onSelect }: PersonaSelectorUIProps) {
  const [selectedId, setSelectedId] = useState(currentPersonaId || 'senior_buddy')

  const availablePresets = useMemo(() => {
    return personaProvider.getAvailablePresets(userId)
  }, [userId])

  const customSlotCount = useMemo(() => {
    return personaProvider.getCustomSlotCount(userId)
  }, [userId])

  const canCreateCustom = useMemo(() => {
    return personaProvider.canCreateCustom(userId)
  }, [userId])

  const handleSelect = (personaId: string) => {
    setSelectedId(personaId)
    onSelect?.(personaId)
  }

  const getPersonaBadge = (persona: PersonaDefinition) => {
    if (persona.category === 'preset') {
      return { label: '预设', color: '#6366f1' }
    }
    if (persona.category === 'cameo') {
      return { label: '客串', color: '#f59e0b' }
    }
    if (persona.category === 'custom') {
      return { label: '自定义', color: '#10b981' }
    }
    return { label: persona.category, color: '#94a3b8' }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>选择你的 AI 角色</h1>
        <p className={styles.subtitle}>每个角色都有独特的性格和交流方式</p>
      </header>

      <section className={styles.statusSection}>
        <h2>你的权益</h2>
        <div className={styles.statusCard}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span className={styles.quotaLabel}>预设角色</span>
              <span className={styles.quotaValue} style={{ color: availablePresets.length > 0 ? '#10b981' : '#94a3b8' }}>
                {availablePresets.length > 0 ? `${availablePresets.length} 个可用` : '需开通 Agent 会员'}
              </span>
            </div>
            <div>
              <span className={styles.quotaLabel}>自定义槽位</span>
              <span className={styles.quotaValue} style={{ color: customSlotCount > 0 ? '#10b981' : '#94a3b8' }}>
                {customSlotCount > 0 ? `${customSlotCount} 个槽位` : '暂无可用'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.productsSection}>
        <h2>选择角色</h2>
        <div className={styles.productGrid}>
          {PRESET_PERSONAS.map((persona) => {
            const isAvailable = availablePresets.includes(persona.id)
            const isSelected = selectedId === persona.id
            const badge = getPersonaBadge(persona)

            return (
              <div
                key={persona.id}
                className={`${styles.productCard} ${isSelected ? styles.current : ''} ${!isAvailable ? 'disabled' : ''}`}
                onClick={() => isAvailable && handleSelect(persona.id)}
                style={{
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  opacity: isAvailable ? 1 : 0.5
                }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.tierLabel}>{persona.name}</span>
                  <span
                    className={styles.periodLabel}
                    style={{ background: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14 }}>
                    {persona.shortDescription}
                  </p>
                  <ul className={styles.featureList}>
                    <li>• 角色: {persona.identityRole}</li>
                    <li>• 风格: {persona.tone.join(', ')}</li>
                    <li>• 情感: {persona.emotionalIntimacy}</li>
                  </ul>
                </div>
                {!isAvailable && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    fontSize: 11
                  }}>
                    需开通会员
                  </div>
                )}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 20
                  }}>
                    ✓
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {canCreateCustom && customSlotCount > 0 && (
        <section className={styles.packsSection}>
          <h2>自定义角色</h2>
          <div className={styles.packGrid}>
            <div
              className={styles.productCard}
              style={{
                cursor: 'pointer',
                border: '2px dashed var(--border)',
                background: 'transparent'
              }}
              onClick={() => {
                alert('自定义角色创建功能开发中...')}
              }
            >
              <div className={styles.cardHeader}>
                <span className={styles.tierLabel}>创建新角色</span>
              </div>
              <div className={styles.cardBody}>
                <p style={{ color: 'var(--muted)', margin: 0 }}>
                  剩余 {customSlotCount} 个槽位
                </p>
                <button
                  className={styles.purchaseButton}
                  style={{ marginTop: 16 }}
                >
                  + 创建自定义角色
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={styles.quotaSection}>
        <h2>角色权限说明</h2>
        <table className="membership-benefits-table">
          <thead>
            <tr>
              <th>角色</th>
              <th>免费用户</th>
              <th>Agent 会员</th>
              <th>Agent PLUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>预设角色</td>
              <td>❌</td>
              <td>✅ 6个</td>
              <td>✅ 6个</td>
            </tr>
            <tr>
              <td>自定义角色</td>
              <td>❌</td>
              <td>✅ 1个</td>
              <td>✅ 3个</td>
            </tr>
            <tr>
              <td>客串角色</td>
              <td>❌</td>
              <td>✅ 限免</td>
              <td>✅ 限免</td>
            </tr>
            <tr>
              <td>AI 头像生成</td>
              <td>❌</td>
              <td>❌</td>
              <td>✅ 10次/月</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}

export { personaProvider }
