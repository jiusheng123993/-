import { useState, useEffect } from 'react'
import { relationshipService } from './relationshipService'
import type { RelationshipSpace, SpaceType } from './relationshipTypes'
import { SPACE_TYPE_LABELS, SPACE_TYPE_ICONS } from './relationshipTypes'

type SpaceListProps = {
  userId: string
  onSelectSpace: (spaceId: string) => void
  onCreateSpace: () => void
}

export function SpaceList({ userId, onSelectSpace, onCreateSpace }: SpaceListProps) {
  const [spaces, setSpaces] = useState<RelationshipSpace[]>([])

  useEffect(() => {
    const userSpaces = relationshipService.getSpaces(userId)
    setSpaces(userSpaces)
  }, [userId])

  const canCreate = relationshipService.canUseFeature(userId, 'space')

  return (
    <div className="space-list">
      <div className="space-list-header">
        <h2>关系空间</h2>
        {canCreate && (
          <button className="btn-primary" onClick={onCreateSpace}>
            + 创建空间
          </button>
        )}
      </div>

      {spaces.length === 0 ? (
        <div className="space-list-empty">
          <p>还没有关系空间</p>
          {canCreate && (
            <button className="btn-secondary" onClick={onCreateSpace}>
              创建第一个空间
            </button>
          )}
        </div>
      ) : (
        <div className="space-list-grid">
          {spaces.map(space => (
            <div
              key={space.id}
              className="space-card"
              onClick={() => onSelectSpace(space.id)}
            >
              <div className="space-card-icon">
                {SPACE_TYPE_ICONS[space.type]}
              </div>
              <div className="space-card-info">
                <h3>{space.name}</h3>
                <span className="space-type-badge">
                  {SPACE_TYPE_LABELS[space.type]}
                </span>
                <div className="space-card-stats">
                  <span>{space.members.length} 成员</span>
                  {space.type === 'couple' && (
                    <span>❤️ {space.stats.intimacyScore}</span>
                  )}
                  {space.type !== 'couple' && (
                    <span>🤝 {space.stats.synergyScore}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type CreateSpaceFormProps = {
  userId: string
  onCreated: (spaceId: string) => void
  onCancel: () => void
}

export function CreateSpaceForm({ userId, onCreated, onCancel }: CreateSpaceFormProps) {
  const [spaceType, setSpaceType] = useState<SpaceType>('couple')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入空间名称')
      return
    }
    try {
      const space = relationshipService.createSpace(spaceType, name.trim(), userId)
      onCreated(space.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    }
  }

  return (
    <div className="create-space-form">
      <h2>创建关系空间</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>空间类型</label>
          <div className="space-type-selector">
            {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map(type => (
              <button
                key={type}
                type="button"
                className={`space-type-option ${spaceType === type ? 'active' : ''}`}
                onClick={() => setSpaceType(type)}
              >
                <span className="type-icon">{SPACE_TYPE_ICONS[type]}</span>
                <span className="type-label">{SPACE_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="space-name">空间名称</label>
          <input
            id="space-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="给空间起个名字"
            maxLength={20}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn-primary">
            创建
          </button>
        </div>
      </form>
    </div>
  )
}

type JoinSpaceFormProps = {
  userId: string
  onJoined: (spaceId: string) => void
  onCancel: () => void
}

export function JoinSpaceForm({ userId, onJoined, onCancel }: JoinSpaceFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('请输入邀请码')
      return
    }
    const space = relationshipService.joinSpace(code.trim().toUpperCase(), userId)
    if (space) {
      onJoined(space.id)
    } else {
      setError('邀请码无效或已过期')
    }
  }

  return (
    <div className="join-space-form">
      <h2>加入空间</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="invite-code">邀请码</label>
          <input
            id="invite-code"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="输入邀请码"
            maxLength={8}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn-primary">
            加入
          </button>
        </div>
      </form>
    </div>
  )
}
