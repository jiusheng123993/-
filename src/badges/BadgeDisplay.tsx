import { useMemo } from 'react'
import type { Badge, BadgeCollection } from './badgeTypes'
import { TIER_COLORS, TIER_LABELS } from './badgeTypes'
import { evaluateBadges, type BadgeProgressInput } from './badgeEngine'
import './badges.css'

interface BadgeDisplayProps {
  progress: BadgeProgressInput
  onClose?: () => void
  compact?: boolean
}

export function BadgeDisplay({ progress, onClose, compact = false }: BadgeDisplayProps) {
  const collection = useMemo(() => evaluateBadges(progress), [progress])

  if (compact) {
    return <CompactBadgeView collection={collection} />
  }

  return (
    <div className="badge-display" role="region" aria-label="成就徽章">
      <div className="badge-display-header">
        <div>
          <p className="eyebrow">Achievement Badges · 成就徽章</p>
          <h2>我的徽章</h2>
        </div>
        <div className="badge-display-stats">
          <span className="badge-stat">
            {collection.totalUnlocked}/{collection.totalCount}
          </span>
          <span className="badge-stat-label">已解锁</span>
        </div>
      </div>

      {collection.recentlyUnlocked.length > 0 && (
        <div className="badge-recent-section">
          <h3>最近获得</h3>
          <div className="badge-recent-grid">
            {collection.recentlyUnlocked.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} size="large" />
            ))}
          </div>
        </div>
      )}

      <div className="badge-categories">
        {(['milestone', 'streak', 'skill', 'special'] as const).map((category) => {
          const categoryBadges = collection.badges.filter((b) => b.category === category)
          if (categoryBadges.length === 0) return null
          const categoryLabels: Record<string, string> = {
            milestone: '里程碑',
            streak: '连续坚持',
            skill: '技能达人',
            special: '特殊成就'
          }
          return (
            <div key={category} className="badge-category-section">
              <h3>{categoryLabels[category]}</h3>
              <div className="badge-grid">
                {categoryBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {onClose && (
        <div className="badge-display-footer">
          <button className="badge-close-btn" onClick={onClose} type="button">
            关闭
          </button>
        </div>
      )}
    </div>
  )
}

function BadgeCard({ badge, size = 'normal' }: { badge: Badge; size?: 'normal' | 'large' }) {
  const tierColor = TIER_COLORS[badge.tier]
  const progressPercent = Math.min(100, Math.round((badge.progress / badge.target) * 100))

  return (
    <div
      className={`badge-card ${badge.isUnlocked ? 'unlocked' : 'locked'} ${size}`}
      style={{
        borderColor: badge.isUnlocked ? tierColor : 'var(--border)',
        opacity: badge.isUnlocked ? 1 : 0.6
      }}
    >
      <div className="badge-icon" style={{ fontSize: size === 'large' ? 36 : 28 }}>
        {badge.icon}
      </div>
      <div className="badge-info">
        <strong className="badge-name">{badge.name}</strong>
        <small className="badge-desc">{badge.description}</small>
        <span
          className="badge-tier"
          style={{ color: tierColor, fontWeight: 600 }}
        >
          {TIER_LABELS[badge.tier]}
        </span>
        {!badge.isUnlocked && (
          <div className="badge-progress-bar">
            <div
              className="badge-progress-fill"
              style={{ width: `${progressPercent}%`, background: tierColor }}
            />
            <span className="badge-progress-text">
              {badge.progress}/{badge.target}
            </span>
          </div>
        )}
        {badge.isUnlocked && (
          <span className="badge-unlocked-mark" style={{ color: tierColor }}>
            ✓ 已获得
          </span>
        )}
      </div>
    </div>
  )
}

function CompactBadgeView({ collection }: { collection: BadgeCollection }) {
  const unlockedBadges = collection.badges.filter((b) => b.isUnlocked)

  return (
    <div className="badge-compact" role="region" aria-label="成就徽章概览">
      <div className="badge-compact-header">
        <strong>成就徽章</strong>
        <span className="badge-stat">
          {collection.totalUnlocked}/{collection.totalCount}
        </span>
      </div>
      {unlockedBadges.length === 0 ? (
        <p className="empty-state">完成专注和任务来解锁徽章吧！</p>
      ) : (
        <div className="badge-compact-grid">
          {unlockedBadges.slice(0, 6).map((badge) => (
            <span
              key={badge.id}
              className="badge-compact-icon"
              title={`${badge.name} - ${TIER_LABELS[badge.tier]}`}
              style={{ fontSize: 24 }}
            >
              {badge.icon}
            </span>
          ))}
          {unlockedBadges.length > 6 && (
            <span className="badge-compact-more">+{unlockedBadges.length - 6}</span>
          )}
        </div>
      )}
    </div>
  )
}