import { useState } from 'react'
import { relationshipService } from './relationshipService'
import type { RelationshipSpace, SpacePrivacyLevel } from './relationshipTypes'
import { SpaceMemberManager } from './SpaceMemberManager'

type SpaceSettingsProps = {
  spaceId: string
  userId: string
  space: RelationshipSpace
  onRefresh: () => void
  onBack: () => void
}

export function SpaceSettings({ spaceId, userId, space, onRefresh, onBack }: SpaceSettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const isOwner = space.ownerId === userId
  const isOwnerOrAdmin = isOwner || space.members.some(
    m => m.userId === userId && m.role === 'admin'
  )

  const handleToggleSetting = (key: keyof RelationshipSpace['settings']) => {
    if (!isOwnerOrAdmin) return
    const newSettings = { ...space.settings, [key]: !space.settings[key] }
    relationshipService.updateSpace(spaceId, userId, { settings: newSettings })
    onRefresh()
  }

  const handlePrivacyChange = (level: SpacePrivacyLevel) => {
    if (!isOwnerOrAdmin) return
    const newSettings = { ...space.settings, privacyLevel: level }
    relationshipService.updateSpace(spaceId, userId, { settings: newSettings })
    onRefresh()
  }

  const handleRename = (name: string) => {
    if (!isOwnerOrAdmin) return
    relationshipService.updateSpace(spaceId, userId, { name })
    onRefresh()
  }

  const handleDeleteSpace = () => {
    relationshipService.deleteSpace(spaceId, userId)
    onBack()
  }

  const handleRecalculate = () => {
    relationshipService.recalculateScores(spaceId)
    onRefresh()
  }

  const settingItems: Array<{ key: keyof RelationshipSpace['settings']; label: string; description: string }> = [
    { key: 'allowTaskPush', label: '互推任务', description: '允许成员之间推送待办任务' },
    { key: 'allowSharedTodo', label: '共享待办', description: '允许共享任务池' },
    { key: 'allowSharedHabits', label: '共享习惯', description: '允许共同打卡目标' },
    { key: 'allowSharedFocus', label: '共享番茄', description: '允许同步专注时段' },
    { key: 'allowRanking', label: '排行榜', description: '允许查看成员排行' }
  ]

  return (
    <div className="space-settings">
      <h3>空间设置</h3>

      <div className="settings-section">
        <h4>空间名称</h4>
        <input
          type="text"
          defaultValue={space.name}
          onBlur={e => {
            if (e.target.value.trim() && e.target.value.trim() !== space.name) {
              handleRename(e.target.value.trim())
            }
          }}
          disabled={!isOwnerOrAdmin}
          maxLength={20}
        />
      </div>

      <div className="settings-section">
        <h4>功能开关</h4>
        {settingItems.map(item => (
          <div key={item.key} className="setting-toggle">
            <div className="setting-info">
              <span className="setting-label">{item.label}</span>
              <span className="setting-desc">{item.description}</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={space.settings[item.key] as boolean}
                onChange={() => handleToggleSetting(item.key)}
                disabled={!isOwnerOrAdmin}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h4>隐私级别</h4>
        <div className="privacy-selector">
          {(['private', 'public', 'secret'] as SpacePrivacyLevel[]).map(level => (
            <button
              key={level}
              className={`privacy-option ${space.settings.privacyLevel === level ? 'active' : ''}`}
              onClick={() => handlePrivacyChange(level)}
              disabled={!isOwnerOrAdmin}
            >
              {level === 'private' && '🔒 私密'}
              {level === 'public' && '🌐 公开'}
              {level === 'secret' && '🤫 隐秘'}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h4>成员管理</h4>
        <button className="btn-secondary" onClick={() => setShowMembers(!showMembers)}>
          {showMembers ? '收起' : '查看成员'}
        </button>
        {showMembers && (
          <SpaceMemberManager
            spaceId={spaceId}
            userId={userId}
            ownerId={space.ownerId}
            members={space.members}
            onRefresh={onRefresh}
          />
        )}
      </div>

      <div className="settings-section">
        <h4>数据</h4>
        <button className="btn-secondary" onClick={handleRecalculate}>
          重新计算亲密度/默契度
        </button>
      </div>

      {isOwner && (
        <div className="settings-section danger-zone">
          <h4>危险操作</h4>
          {!showDeleteConfirm ? (
            <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              解散空间
            </button>
          ) : (
            <div className="delete-confirm">
              <p>确定要解散空间「{space.name}」吗？此操作不可撤销，所有共享数据将被删除。</p>
              <div className="confirm-actions">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  取消
                </button>
                <button className="btn-danger" onClick={handleDeleteSpace}>
                  确认解散
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
