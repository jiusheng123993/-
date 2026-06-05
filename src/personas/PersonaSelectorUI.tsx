/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react'
import { createPersonaProvider, type PersonaProvider } from '../entitlement/personaProvider'
import { createEntitlementService } from '../entitlement/entitlementService'
import { PRESET_PERSONAS, type PersonaDefinition } from './personaScheduler'
import { addCustomPersona, type CustomPersonaInput } from './customPersona'
import { X } from 'lucide-react'
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
  const [showCreator, setShowCreator] = useState(false)

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
      return { label: '预设', color: 'var(--primary, #6366f1)' }
    }
    if (persona.category === 'cameo') {
      return { label: '客串', color: '#f59e0b' }
    }
    if (persona.category === 'custom') {
      return { label: '自定义', color: 'var(--success, #10b981)' }
    }
    return { label: persona.category, color: 'var(--muted, #94a3b8)' }
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
              <span className={styles.quotaValue} style={{ color: availablePresets.length > 0 ? 'var(--success, #10b981)' : 'var(--muted, #94a3b8)' }}>
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
              onClick={() => setShowCreator(true)}
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
        <div className="table-responsive">
        <table className="membership-benefits-table data-table">
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
        </div>
      </section>

      {showCreator && (
        <CustomPersonaCreatorModal
          onClose={() => setShowCreator(false)}
          onCreate={() => setShowCreator(false)}
        />
      )}
    </div>
  )
}

function CustomPersonaCreatorModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [formData, setFormData] = useState<CustomPersonaInput>({
    name: '',
    targetUser: '',
    painPoint: '',
    primaryFlow: '',
    hero: '',
    mainModuleTitle: '',
    sideModuleTitle: '',
    aiRole: '',
    keyMetrics: ['', '', '', ''],
    modules: [
      { id: 'mod-1', title: '', description: '', signal: '' },
      { id: 'mod-2', title: '', description: '', signal: '' },
      { id: 'mod-3', title: '', description: '', signal: '' },
      { id: 'mod-4', title: '', description: '', signal: '' }
    ],
    aiActions: ['daily-plan', 'task-breakdown', 'daily-review'],
    recommendedThemeId: 'minimal-premium'
  })

  const [step, setStep] = useState(1)
  const totalSteps = 3

  const updateField = <K extends keyof CustomPersonaInput>(field: K, value: CustomPersonaInput[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateModule = (index: number, field: 'title' | 'description' | 'signal', value: string) => {
    setFormData((prev) => {
      const modules = [...prev.modules]
      modules[index] = { ...modules[index], [field]: value }
      return { ...prev, modules }
    })
  }

  const handleSubmit = () => {
    addCustomPersona(formData)
    onCreate()
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!formData.name && !!formData.targetUser && !!formData.painPoint && !!formData.primaryFlow
      case 2:
        return !!formData.mainModuleTitle && !!formData.sideModuleTitle && !!formData.aiRole
      case 3:
        return formData.modules.every((m) => !!m.title && !!m.description)
      default:
        return false
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={{
          background: 'var(--bg-primary, #1a1a2e)',
          borderRadius: 16,
          padding: 32,
          width: '90vw',
          maxWidth: 560,
          maxHeight: '85vh',
          overflow: 'auto',
          border: '1px solid var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="创建自定义角色"
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>创建自定义角色</h3>
          <button
            onClick={onClose}
            type="button"
            aria-label="关闭"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </header>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{ height: '100%', background: 'var(--accent, #6366f1)', borderRadius: 2, transition: 'width 0.3s', width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>步骤 {step}/{totalSteps}</span>
        </div>

        {step === 1 && (
          <div>
            <h4 style={{ margin: '0 0 16px' }}>基本信息</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>角色名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="例如：考研冲刺"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>目标用户</label>
              <input
                type="text"
                value={formData.targetUser}
                onChange={(e) => updateField('targetUser', e.target.value)}
                placeholder="例如：考研学生"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>核心痛点</label>
              <input
                type="text"
                value={formData.painPoint}
                onChange={(e) => updateField('painPoint', e.target.value)}
                placeholder="例如：复习效率低、缺乏规划"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>主要流程</label>
              <input
                type="text"
                value={formData.primaryFlow}
                onChange={(e) => updateField('primaryFlow', e.target.value)}
                placeholder="例如：每日计划 → 学习 → 复盘"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 style={{ margin: '0 0 16px' }}>模块与角色</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>主模块标题</label>
              <input
                type="text"
                value={formData.mainModuleTitle}
                onChange={(e) => updateField('mainModuleTitle', e.target.value)}
                placeholder="例如：今日学习计划"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>副模块标题</label>
              <input
                type="text"
                value={formData.sideModuleTitle}
                onChange={(e) => updateField('sideModuleTitle', e.target.value)}
                placeholder="例如：学习统计"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>AI 角色</label>
              <input
                type="text"
                value={formData.aiRole}
                onChange={(e) => updateField('aiRole', e.target.value)}
                placeholder="例如：学习教练"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>角色形象</label>
              <input
                type="text"
                value={formData.hero}
                onChange={(e) => updateField('hero', e.target.value)}
                placeholder="例如：经验丰富的导师"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 style={{ margin: '0 0 16px' }}>模块配置</h4>
            {formData.modules.map((mod, index) => (
              <div key={mod.id} style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>模块 {index + 1}</span>
                <input
                  type="text"
                  value={mod.title}
                  onChange={(e) => updateModule(index, 'title', e.target.value)}
                  placeholder="模块标题"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 6, boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  value={mod.description}
                  onChange={(e) => updateModule(index, 'description', e.target.value)}
                  placeholder="模块描述"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 6, boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            type="button"
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: step === 1 ? 'var(--border)' : 'var(--text-primary)',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            上一步
          </button>
          {step < totalSteps ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!isStepValid()}
              type="button"
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: !isStepValid() ? 'var(--border)' : 'var(--accent, #6366f1)',
                color: 'white',
                cursor: !isStepValid() ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid()}
              type="button"
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: !isStepValid() ? 'var(--border)' : 'var(--success, #10b981)',
                color: 'white',
                cursor: !isStepValid() ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              创建角色
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { personaProvider }
