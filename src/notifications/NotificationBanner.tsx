import { useState, useEffect } from 'react'
import type { AppNotification, NotificationService } from './notificationService'
import './notification.css'

interface NotificationBannerProps {
  service: NotificationService
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ service }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => service.getUnread())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const unsub = service.subscribe(() => {
      setNotifications(service.getUnread())
    })
    const interval = setInterval(() => {
      setNotifications(service.getUnread())
    }, 30000)
    return () => {
      unsub()
      clearInterval(interval)
    }
  }, [service])

  const unreadCount = notifications.length

  return (
    <>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="通知"
        type="button"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-backdrop" onClick={() => setIsOpen(false)} role="presentation">
          <div className="notification-dropdown" onClick={e => e.stopPropagation()}>
            <div className="notification-dropdown-header">
              <h3>通知</h3>
              {unreadCount > 0 && (
                <button
                  className="notification-dismiss-all"
                  onClick={() => {
                    service.dismissAll()
                    setNotifications([])
                  }}
                  type="button"
                >
                  全部已读
                </button>
              )}
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">暂无新通知</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notification-item ${n.read ? 'read' : 'unread'}`}
                    onClick={() => {
                      service.markRead(n.id)
                      service.dismiss(n.id)
                    }}
                  >
                    <span className="notification-icon">{n.icon || '📌'}</span>
                    <div className="notification-content">
                      <div className="notification-title">{n.title}</div>
                      <div className="notification-body">{n.body}</div>
                      <div className="notification-time">
                        {new Date(n.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
