import { useState, useEffect } from 'react'
import { relationshipService } from './relationshipService'
import type { RelationshipSpace, SpaceActivity } from './relationshipTypes'
import { SPACE_TYPE_LABELS, SPACE_TYPE_ICONS } from './relationshipTypes'
import { SharedTaskBoard } from './SharedTaskBoard'
import { FocusPK } from './FocusPK'
import { SpaceRanking } from './SpaceRanking'
import { AnniversaryManager } from './AnniversaryManager'
import { SpaceSettings } from './SpaceSettings'

type SpaceDetailProps = {
  spaceId: string
  userId: string
  onBack: () => void
}

type DetailTab = 'tasks' | 'habits' | 'focus' | 'ranking' | 'anniversary' | 'settings'

export function SpaceDetail({ spaceId, userId, onBack }: SpaceDetailProps) {
  const [space, setSpace] = useState<RelationshipSpace | null>(null)
  const [activities, setActivities] = useState<SpaceActivity[]>([])
  const [activeTab, setActiveTab] = useState<DetailTab>('tasks')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    const s = relationshipService.getSpaceById(spaceId, userId)
    if (s) {
      setSpace(s)
      setActivities(relationshipService.getActivities(spaceId, userId))
    }
  }, [spaceId, userId])

  if (!space) {
    return (
      <div className="space-detail-empty">
        <p>空间不存在或无权访问</p>
        <button className="btn-secondary" onClick={onBack}>返回</button>
      </div>
    )
  }

  const isOwnerOrAdmin = space.ownerId === userId || space.members.some(
    m => m.userId === userId && (m.role === 'owner' || m.role === 'admin')
  )

  const handleInvite = () => {
    setInviteError('')
    const result = relationshipService.inviteMember(spaceId, userId)
    if (result) {
      setInviteCode(result.code)
    } else {
      setInviteError('无法生成邀请码（可能已达成员上限）')
    }
  }

  const handleRefresh = () => {
    const s = relationshipService.getSpaceById(spaceId, userId)
    if (s) {
      setSpace(s)
      setActivities(relationshipService.getActivities(spaceId, userId))
    }
  }

  const tabs: Array<{ key: DetailTab; label: string; icon: string }> = [
    { key: 'tasks', label: '共享任务', icon: '📋' },
    { key: 'habits', label: '共享习惯', icon: '✅' },
    { key: 'focus', label: '专注PK', icon: '⏱️' },
    { key: 'ranking', label: '排行榜', icon: '🏆' },
    { key: 'anniversary', label: '纪念日', icon: '💝' },
    { key: 'settings', label: '设置', icon: '⚙️' }
  ]

  return (
    <div className="space-detail">
      <div className="space-detail-header">
        <button className="btn-icon" onClick={onBack}>←</button>
        <div className="space-detail-title">
          <span className="space-icon">{SPACE_TYPE_ICONS[space.type]}</span>
          <h2>{space.name}</h2>
          <span className="space-type-badge">{SPACE_TYPE_LABELS[space.type]}</span>
        </div>
      </div>

      <div className="space-detail-stats">
        <div className="stat-item">
          <span className="stat-value">{space.members.length}</span>
          <span className="stat-label">成员</span>
        </div>
        {space.type === 'couple' && (
          <div className="stat-item">
            <span className="stat-value">❤️ {space.stats.intimacyScore}</span>
            <span className="stat-label">亲密度</span>
          </div>
        )}
        {space.type !== 'couple' && (
          <div className="stat-item">
            <span className="stat-value">🤝 {space.stats.synergyScore}</span>
            <span className="stat-label">默契度</span>
          </div>
        )}
        <div className="stat-item">
          <span className="stat-value">🔥 {space.stats.streakDays}</span>
          <span className="stat-label">连续天数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">⏰ {Math.round(space.stats.totalSharedFocus / 60)}h</span>
          <span className="stat-label">共享专注</span>
        </div>
      </div>

      {isOwnerOrAdmin && (
        <div className="invite-section">
          <button className="btn-secondary" onClick={handleInvite}>
            生成邀请码
          </button>
          {inviteCode && (
            <div className="invite-code-display">
              <span className="invite-code">{inviteCode}</span>
              <button
                className="btn-icon"
                onClick={() => navigator.clipboard?.writeText(inviteCode)}
                title="复制"
              >
                📋
              </button>
            </div>
          )}
          {inviteError && <div className="form-error">{inviteError}</div>}
        </div>
      )}

      <div className="space-detail-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="space-detail-content">
        {activeTab === 'tasks' && (
          <SharedTaskBoard
            spaceId={spaceId}
            userId={userId}
            members={space.members}
            activities={activities}
            onRefresh={handleRefresh}
          />
        )}
        {activeTab === 'habits' && (
          <SharedTaskBoard
            spaceId={spaceId}
            userId={userId}
            members={space.members}
            activities={activities}
            onRefresh={handleRefresh}
            mode="habits"
          />
        )}
        {activeTab === 'focus' && (
          <FocusPK
            spaceId={spaceId}
            userId={userId}
            members={space.members}
            activities={activities}
            onRefresh={handleRefresh}
          />
        )}
        {activeTab === 'ranking' && (
          <SpaceRanking
            spaceId={spaceId}
            userId={userId}
          />
        )}
        {activeTab === 'anniversary' && (
          <AnniversaryManager
            spaceId={spaceId}
            userId={userId}
            anniversaries={space.anniversaries}
            sharedGoals={space.sharedGoals}
            onRefresh={handleRefresh}
          />
        )}
        {activeTab === 'settings' && (
          <SpaceSettings
            spaceId={spaceId}
            userId={userId}
            space={space}
            onRefresh={handleRefresh}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  )
}
