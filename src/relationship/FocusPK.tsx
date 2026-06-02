import { useState, useEffect, useRef } from 'react'
import { relationshipService } from './relationshipService'
import type { SpaceActivity, SpaceMember } from './relationshipTypes'

type FocusPKProps = {
  spaceId: string
  userId: string
  members: SpaceMember[]
  activities: SpaceActivity[]
  onRefresh: () => void
}

type PKState = 'idle' | 'inviting' | 'waiting' | 'focusing' | 'completed'

export function FocusPK({ spaceId, userId, members, activities, onRefresh }: FocusPKProps) {
  const [pkState, setPkState] = useState<PKState>('idle')
  const [duration, setDuration] = useState(25)
  const [targetUserId, setTargetUserId] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [myMinutes, setMyMinutes] = useState(0)
  const [opponentMinutes] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const otherMembers = members.filter(m => m.userId !== userId)

  const pkInvites = activities.filter(a => a.type === 'focus_pk_invite')
  const pendingInvites = pkInvites.filter(
    a => a.targetId === userId &&
    !activities.some(r => r.type === 'focus_pk_accept' && r.targetId === a.id)
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleInvitePK = () => {
    if (!targetUserId) return
    relationshipService.startFocusPK(spaceId, userId, targetUserId, duration)
    setPkState('waiting')
    onRefresh()
  }

  const handleAcceptPK = (activityId: string) => {
    relationshipService.acceptFocusPK(spaceId, userId, activityId)
    setPkState('focusing')
    setRemainingSeconds(duration * 60)
    startTimer()
    onRefresh()
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setPkState('completed')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleStartSolo = () => {
    relationshipService.startFocus(spaceId, userId, duration)
    setPkState('focusing')
    setRemainingSeconds(duration * 60)
    startTimer()
  }

  const handleCompleteFocus = () => {
    const actualMinutes = duration - Math.floor(remainingSeconds / 60)
    relationshipService.endFocus(spaceId, userId, actualMinutes)
    setMyMinutes(actualMinutes)
    setPkState('completed')
    onRefresh()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="focus-pk">
      <h3>专注PK</h3>

      {pkState === 'idle' && (
        <div className="pk-setup">
          {pendingInvites.length > 0 && (
            <div className="pk-invites">
              <h4>待接受的PK邀请</h4>
              {pendingInvites.map(inv => (
                <div key={inv.id} className="pk-invite-item">
                  <span>{inv.actorId} 邀请你PK {inv.payload.durationMinutes as number}分钟</span>
                  <button className="btn-primary" onClick={() => handleAcceptPK(inv.id)}>
                    接受
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pk-form">
            <div className="form-group">
              <label>专注时长（分钟）</label>
              <div className="duration-selector">
                {[15, 25, 45, 60].map(d => (
                  <button
                    key={d}
                    className={`duration-option ${duration === d ? 'active' : ''}`}
                    onClick={() => setDuration(d)}
                  >
                    {d}min
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>PK对手</label>
              <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)}>
                <option value="">选择对手</option>
                {otherMembers.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.nickname || m.userId}
                  </option>
                ))}
              </select>
            </div>

            <div className="pk-actions">
              {targetUserId ? (
                <button className="btn-primary" onClick={handleInvitePK}>
                  发起PK挑战
                </button>
              ) : (
                <button className="btn-secondary" onClick={handleStartSolo}>
                  开始专注
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {pkState === 'waiting' && (
        <div className="pk-waiting">
          <p>等待对手接受挑战...</p>
          <button className="btn-secondary" onClick={() => setPkState('idle')}>
            取消
          </button>
        </div>
      )}

      {pkState === 'focusing' && (
        <div className="pk-focusing">
          <div className="focus-timer">{formatTime(remainingSeconds)}</div>
          <button className="btn-danger" onClick={handleCompleteFocus}>
            结束专注
          </button>
        </div>
      )}

      {pkState === 'completed' && (
        <div className="pk-completed">
          <h4>专注完成！</h4>
          <div className="pk-result">
            <div className="result-item">
              <span>我的专注</span>
              <span>{myMinutes} 分钟</span>
            </div>
            {opponentMinutes > 0 && (
              <div className="result-item">
                <span>对手专注</span>
                <span>{opponentMinutes} 分钟</span>
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={() => setPkState('idle')}>
            再来一次
          </button>
        </div>
      )}
    </div>
  )
}
