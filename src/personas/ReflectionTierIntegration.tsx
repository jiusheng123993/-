/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { createReflectionTierProvider, type ReflectionTierProvider } from '../entitlement/reflectionTierProvider'
import { createEntitlementService } from '../entitlement/entitlementService'
import styles from '../components/membership/MembershipPage.module.css'

const entitlementService = createEntitlementService()
const reflectionTierProvider: ReflectionTierProvider = createReflectionTierProvider(entitlementService)

interface ReflectionTierBadgeProps {
  userId: string
}

export function ReflectionTierBadge({ userId }: ReflectionTierBadgeProps) {
  const tier = useMemo(() => {
    return reflectionTierProvider.getReflectionTier(userId)
  }, [userId])

  const tierInfo = useMemo(() => {
    switch (tier) {
      case 'l4_realtime':
        return { label: '实时反思', color: '#8b5cf6', desc: '重要事件实时触发自我进化' }
      case 'l2_weekly':
        return { label: '每周反思', color: '#6366f1', desc: '每周触发自我进化仪式' }
      case 'l1_teaser':
        return { label: '体验版', color: '#10b981', desc: '基础反思功能' }
      default:
        return { label: '未开通', color: '#94a3b8', desc: '开通 Agent 会员解锁' }
    }
  }, [tier])

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 20,
      background: `${tierInfo.color}20`,
      border: `1px solid ${tierInfo.color}`
    }}>
      <span style={{ fontSize: 14 }}>🧠</span>
      <span style={{ color: tierInfo.color, fontWeight: 'bold', fontSize: 13 }}>
        {tierInfo.label}
      </span>
    </div>
  )
}

export function ReflectionAccessChecker({ userId, children, fallback }: {
  userId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const canAccess = useMemo(() => {
    return reflectionTierProvider.canAccessSelfEvolution(userId)
  }, [userId])

  if (!canAccess) {
    return fallback || (
      <div className={styles.statusCard} style={{ textAlign: 'center', padding: 32 }}>
        <span style={{ fontSize: 32 }}>🔒</span>
        <h3 style={{ margin: '12px 0 8px' }}>自我进化未开通</h3>
        <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>
          {tierInfo.desc}
        </p>
        <button className={styles.purchaseButton}>
          开通 Agent 会员
        </button>
      </div>
    )
  }

  return <>{children}</>
}

export function ReflectionFrequencyIndicator({ userId }: { userId: string }) {
  const frequency = useMemo(() => {
    return reflectionTierProvider.getReflectionFrequency(userId)
  }, [userId])

  const freqInfo = useMemo(() => {
    switch (frequency) {
      case 'realtime':
        return { label: '实时', icon: '⚡', color: '#8b5cf6' }
      case 'weekly':
        return { label: '每周', icon: '📅', color: '#6366f1' }
      default:
        return { label: '未开通', icon: '❌', color: '#94a3b8' }
    }
  }, [frequency])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: freqInfo.color
    }}>
      <span>{freqInfo.icon}</span>
      <span>{freqInfo.label}</span>
    </div>
  )
}

export function EvolutionRitualAccessButton({ userId, onClick }: {
  userId: string
  onClick?: () => void
}) {
  const canAccess = useMemo(() => {
    return reflectionTierProvider.canAccessSelfEvolution(userId)
  }, [userId])

  const tier = useMemo(() => {
    return reflectionTierProvider.getReflectionTier(userId)
  }, [userId])

  const tierLabel = useMemo(() => {
    switch (tier) {
      case 'l4_realtime':
        return '实时反思'
      case 'l2_weekly':
        return '每周反思'
      case 'l1_teaser':
        return '体验版'
      default:
        return '未开通'
    }
  }, [tier])

  return (
    <button
      className={styles.purchaseButton}
      onClick={onClick}
      disabled={!canAccess}
      style={{
        background: canAccess ? '#6366f1' : 'var(--border)',
        cursor: canAccess ? 'pointer' : 'not-allowed'
      }}
    >
      {canAccess ? `🧠 启动${tierLabel}` : '🔒 开通会员解锁'}
    </button>
  )
}

const tierInfo = {
  desc: '开通 Agent 会员解锁自我进化功能'
}

export { reflectionTierProvider }
