import { useState, useMemo, useCallback } from 'react'
import { createAgeGateService, type AgeGateService, type AgeGroup, type AgeVerification } from './ageGateService'
import styles from '../components/membership/MembershipPage.module.css'

const ageGateService: AgeGateService = createAgeGateService()

interface AgeGateIntegrationProps {
  userId: string
  onVerified?: (ageGroup: AgeGroup) => void
}

export function AgeGateIntegration({ userId, onVerified }: AgeGateIntegrationProps) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(() => ageGateService.getAgeGroup(userId))
  const [isTimeRestricted, setIsTimeRestricted] = useState(() => ageGateService.isTimeRestricted(userId))
  const [dailyLimit, setDailyLimit] = useState(() => ageGateService.getDailyTimeLimit(userId))

  const handleVerify = useCallback((age: number, method: AgeVerification['method']) => {
    ageGateService.verifyAge(userId, age, method)
    const newAgeGroup = ageGateService.getAgeGroup(userId)
    setAgeGroup(newAgeGroup)
    setIsTimeRestricted(ageGateService.isTimeRestricted(userId))
    setDailyLimit(ageGateService.getDailyTimeLimit(userId))
    onVerified?.(newAgeGroup)
  }, [userId, onVerified])

  const ageGroupInfo = useMemo(() => {
    switch (ageGroup) {
      case 'adult':
        return { label: '成年人', color: '#10b981', icon: '✅' }
      case 'teen':
        return { label: '未成年人', color: '#f59e0b', icon: '⚠️' }
      default:
        return { label: '未实名', color: '#ef4444', icon: '❌' }
    }
  }, [ageGroup])

  return {
    ageGroup,
    isTimeRestricted,
    dailyLimit,
    verifyAge: handleVerify,
    ageGroupInfo,
    canAccessFeature: (feature: string) => ageGateService.canAccessFeature(userId, feature),
    canUsePersona: (personaType: 'learning' | 'emotional' | 'custom') => 
      ageGateService.canUsePersona(userId, personaType)
  }
}

export function AgeVerificationForm({ userId, onVerified }: {
  userId: string
  onVerified?: (ageGroup: AgeGroup) => void
}) {
  const [age, setAge] = useState('')
  const [method, setMethod] = useState<AgeVerification['method']>('id_card')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const ageNum = parseInt(age, 10)
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setError('请输入有效的年龄')
      return
    }

    ageGateService.verifyAge(userId, ageNum, method)
    const newAgeGroup = ageGateService.getAgeGroup(userId)
    onVerified?.(newAgeGroup)
  }

  return (
    <div className={styles.statusCard}>
      <h3>年龄验证</h3>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        根据国家规定，需要进行年龄验证以提供适当的服务
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>年龄</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="请输入年龄"
            min={0}
            max={150}
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

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>验证方式</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as AgeVerification['method'])}
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
            <option value="id_card">身份证认证</option>
            <option value="wechat_realname">微信实名</option>
            <option value="apple_family">Apple Family</option>
          </select>
        </div>

        {error && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <button type="submit" className={styles.purchaseButton} style={{ width: '100%' }}>
          提交验证
        </button>
      </form>

      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        borderRadius: 8, 
        background: 'rgba(245, 158, 11, 0.1)',
        fontSize: 13,
        color: 'var(--muted)'
      }}>
        <strong>提示：</strong>生产环境应接入后端可信实名认证接口，此处为演示版本
      </div>
    </div>
  )
}

export function AgeGateStatusBadge({ userId }: { userId: string }) {
  const ageGroup = useMemo(() => ageGateService.getAgeGroup(userId), [userId])

  const info = useMemo(() => {
    switch (ageGroup) {
      case 'adult':
        return { label: '已实名', color: '#10b981', icon: '✅' }
      case 'teen':
        return { label: '未成年', color: '#f59e0b', icon: '⚠️' }
      default:
        return { label: '未实名', color: '#ef4444', icon: '❌' }
    }
  }, [ageGroup])

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 12,
      background: `${info.color}20`,
      fontSize: 12,
      color: info.color
    }}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </div>
  )
}

export function TimeRestrictionWarning({ userId }: { userId: string }) {
  const isRestricted = useMemo(() => ageGateService.isTimeRestricted(userId), [userId])
  const dailyLimit = useMemo(() => ageGateService.getDailyTimeLimit(userId), [userId])

  if (!isRestricted && dailyLimit === 0) return null

  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      background: 'rgba(245, 158, 11, 0.1)',
      border: '1px solid #f59e0b',
      marginTop: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>⏰</span>
        <strong>使用时间限制</strong>
      </div>
      {isRestricted && (
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          当前时段（22:00-6:00）无法使用 AI 陪伴功能
        </p>
      )}
      {dailyLimit > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          每日使用限制：{dailyLimit} 分钟
        </p>
      )}
    </div>
  )
}

export function AgeGateFeatureGuard({ userId, feature, children, fallback }: {
  userId: string
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const canAccess = useMemo(() => ageGateService.canAccessFeature(userId, feature), [userId, feature])

  if (!canAccess) {
    return fallback || (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)' }}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <p>该功能需要更高级别的会员权限</p>
      </div>
    )
  }

  return <>{children}</>
}

export { ageGateService }
