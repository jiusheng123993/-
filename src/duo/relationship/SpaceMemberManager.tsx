import { useState } from 'react'
import { relationshipService } from './relationshipService'
import type { SpaceMember, SpaceRole } from './relationshipTypes'

type SpaceMemberManagerProps = {
  spaceId: string
  userId: string
  ownerId: string
  members: SpaceMember[]
  onRefresh: () => void
}

export function SpaceMemberManager({ spaceId, userId, ownerId, members, onRefresh }: SpaceMemberManagerProps) {
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null)

  const isOwner = ownerId === userId

  const handleRemoveMember = (targetUserId: string) => {
    if (targetUserId === ownerId) return
    relationshipService.removeMember(spaceId, userId, targetUserId)
    onRefresh()
  }

  const handleUpdateRole = (targetUserId: string, role: SpaceRole) => {
    relationshipService.updateMemberRole(spaceId, userId, targetUserId, role)
    setShowRoleMenu(null)
    onRefresh()
  }

  const handleLeaveSpace = () => {
    relationshipService.removeMember(spaceId, userId, userId)
    onRefresh()
  }

  const roleLabels: Record<SpaceRole, string> = {
    owner: '创建者',
    admin: '管理员',
    member: '成员'
  }

  return (
    <div className="member-manager">
      <h3>成员管理</h3>
      <div className="member-list">
        {members.map(member => (
          <div key={member.userId} className="member-item">
            <div className="member-avatar">
              {member.nickname?.charAt(0) || member.userId.charAt(0)}
            </div>
            <div className="member-info">
              <span className="member-name">
                {member.nickname || member.userId}
              </span>
              <span className="member-role">{roleLabels[member.role]}</span>
            </div>
            {isOwner && member.userId !== ownerId && (
              <div className="member-actions">
                <button
                  className="btn-icon"
                  onClick={() => setShowRoleMenu(
                    showRoleMenu === member.userId ? null : member.userId
                  )}
                >
                  ⋮
                </button>
                {showRoleMenu === member.userId && (
                  <div className="role-menu">
                    <button onClick={() => handleUpdateRole(member.userId, 'admin')}>
                      设为管理员
                    </button>
                    <button onClick={() => handleUpdateRole(member.userId, 'member')}>
                      设为成员
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      移除成员
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {userId !== ownerId && (
        <button className="btn-danger" onClick={handleLeaveSpace}>
          退出空间
        </button>
      )}
    </div>
  )
}
