import { useState, useMemo, useReducer } from 'react'
import {
  Calendar, Clock, Plus, X, ChevronLeft, ChevronRight,
  Bell, Repeat, Palette, CheckCircle, Circle, Trash2, Edit3,
  AlertCircle
} from 'lucide-react'
import {
  createScheduleService,
  REPEAT_LABELS,
  REMINDER_OPTIONS,
  formatTime,
  getWeekdayLabel,
  isToday,
  type ScheduleEvent,
  type ScheduleService
} from './scheduleService'

interface ScheduleUIProps {
  compact?: boolean
  onClose?: () => void
}

const colors = {
  bg: 'linear-gradient(135deg, #f8f7f4 0%, #f0efe9 100%)',
  cardBg: '#ffffff',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  text: '#2d2d2d',
  textSecondary: '#6b6b6b',
  textMuted: '#9ca3af',
  accent: '#6366f1',
  accentLight: '#eef2ff',
  accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  inputBg: '#fafafa',
  inputBorder: '#e5e5e5',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.08)',
}

const EVENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6'
]

export function ScheduleUI({ compact = false, onClose }: ScheduleUIProps) {
  const [service] = useState<ScheduleService>(() => createScheduleService())
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [, refresh] = useReducer((x: number) => x + 1, 0)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    endTime: '',
    repeat: 'none' as ScheduleEvent['repeat'],
    reminderMinutes: 15,
    color: EVENT_COLORS[0]
  })

  const todayEvents = useMemo(() => service.getTodayEvents(), [service])
  const upcomingEvents = useMemo(() => service.getUpcomingEvents(7), [service])
  const selectedEvents = useMemo(() => service.getEventsByDate(selectedDate), [selectedDate, service])
  const stats = useMemo(() => service.getStats(), [service])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const days: { date: number; dateStr: string; isCurrentMonth: boolean }[] = []

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({
        date: d.getDate(),
        dateStr: d.toISOString().slice(0, 10),
        isCurrentMonth: false
      })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i)
      days.push({
        date: i,
        dateStr: d.toISOString().slice(0, 10),
        isCurrentMonth: true
      })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: i,
        dateStr: d.toISOString().slice(0, 10),
        isCurrentMonth: false
      })
    }

    return days
  }, [year, month])

  const monthEvents = useMemo(() => service.getEventsForMonth(year, month + 1), [year, month, service])

  const getEventsForDate = (dateStr: string) => {
    return monthEvents.filter(e => e.date === dateStr)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      time: '09:00',
      endTime: '',
      repeat: 'none',
      reminderMinutes: 15,
      color: EVENT_COLORS[0]
    })
    setEditingEvent(null)
    setShowAddForm(false)
  }

  const handleSubmit = () => {
    if (!formData.title.trim()) return

    if (editingEvent) {
      service.updateEvent(editingEvent.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        endTime: formData.endTime || undefined,
        repeat: formData.repeat,
        reminderMinutes: formData.reminderMinutes,
        color: formData.color
      })
    } else {
      service.addEvent({
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        endTime: formData.endTime || undefined,
        repeat: formData.repeat,
        reminderMinutes: formData.reminderMinutes,
        color: formData.color
      })
    }
    resetForm()
    refresh()
  }

  const handleEdit = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      endTime: event.endTime || '',
      repeat: event.repeat,
      reminderMinutes: event.reminderMinutes,
      color: event.color
    })
    setShowAddForm(true)
  }

  const handleDelete = (id: string) => {
    service.deleteEvent(id)
    refresh()
  }

  const handleToggleComplete = (id: string) => {
    service.toggleComplete(id)
    refresh()
  }

  const handleGoToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today.toISOString().slice(0, 10))
  }

  if (compact) {
    return (
      <div style={{
        background: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 16,
        padding: 16,
        width: 280,
        color: colors.text,
        fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
        boxShadow: colors.shadow
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Calendar size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14, fontWeight: 600 }}>今日日程</strong>
        </div>
        {todayEvents.length === 0 ? (
          <div style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', padding: '12px 0' }}>
            今日暂无日程
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todayEvents.slice(0, 3).map(event => (
              <div key={event.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: colors.inputBg,
                fontSize: 12,
                borderLeft: `3px solid ${event.color}`
              }}>
                <span style={{ fontWeight: 500, color: colors.textSecondary, minWidth: 40 }}>
                  {formatTime(event.time)}
                </span>
                <span style={{
                  flex: 1,
                  textDecoration: event.completed ? 'line-through' : 'none',
                  color: event.completed ? colors.textMuted : colors.text
                }}>
                  {event.title}
                </span>
              </div>
            ))}
            {todayEvents.length > 3 && (
              <div style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
                还有 {todayEvents.length - 3} 项...
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      padding: 24,
      fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
      color: colors.text
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          <Calendar size={28} style={{ color: colors.accent }} />日程提醒
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '10px 20px',
              background: colors.accentGradient,
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <Plus size={16} />新建日程
          </button>
          {onClose && (
            <button onClick={onClose} style={{
              padding: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: colors.textSecondary,
              borderRadius: 8
            }}>×</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>今日日程</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.accent }}>{stats.today}</div>
        </div>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>即将到来</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.warning }}>{stats.upcoming}</div>
        </div>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>已完成</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.success }}>{stats.completed}</div>
        </div>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>总日程</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>{stats.total}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: '0 0 380px' }}>
          <div style={{
            background: colors.cardBg,
            borderRadius: 16,
            padding: 20,
            boxShadow: colors.shadow,
            marginBottom: 16
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <button onClick={handlePrevMonth} style={{
                padding: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textSecondary,
                borderRadius: 6,
                display: 'flex'
              }}>
                <ChevronLeft size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {year}年{month + 1}月
                </span>
                <button onClick={handleGoToToday} style={{
                  padding: '2px 8px',
                  background: colors.accentLight,
                  border: 'none',
                  borderRadius: 4,
                  color: colors.accent,
                  fontSize: 11,
                  cursor: 'pointer'
                }}>今天</button>
              </div>
              <button onClick={handleNextMonth} style={{
                padding: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textSecondary,
                borderRadius: 6,
                display: 'flex'
              }}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              marginBottom: 4
            }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontSize: 11,
                  color: colors.textMuted,
                  padding: '4px 0',
                  fontWeight: 500
                }}>{day}</div>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2
            }}>
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDate(day.dateStr)
                const isSelected = day.dateStr === selectedDate
                const isTodayDate = isToday(day.dateStr)

                return (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(day.dateStr)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: isSelected ? `2px solid ${colors.accent}` : '2px solid transparent',
                      borderRadius: 8,
                      background: isSelected ? colors.accentLight : isTodayDate ? colors.inputBg : 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isTodayDate ? 700 : 400,
                      color: day.isCurrentMonth ? colors.text : colors.textMuted,
                      position: 'relative',
                      transition: 'all 0.15s'
                    }}
                  >
                    {day.date}
                    {dayEvents.length > 0 && (
                      <div style={{ display: 'flex', gap: 1, marginTop: 1 }}>
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <div key={i} style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: e.color
                          }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{
            background: colors.cardBg,
            borderRadius: 16,
            padding: 20,
            boxShadow: colors.shadow
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} style={{ color: colors.warning }} />
                即将到来
              </h3>
            </div>
            {upcomingEvents.length === 0 ? (
              <div style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', padding: 16 }}>
                未来7天暂无日程
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.slice(0, 5).map(event => (
                  <div key={event.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: colors.inputBg,
                    borderLeft: `3px solid ${event.color}`
                  }}>
                    <div style={{ textAlign: 'center', minWidth: 36 }}>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>
                        {event.date.slice(5)}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: colors.textSecondary }}>
                        {formatTime(event.time)}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, flex: 1 }}>{event.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            background: colors.cardBg,
            borderRadius: 16,
            padding: 20,
            boxShadow: colors.shadow,
            minHeight: 400
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                {selectedDate} {getWeekdayLabel(selectedDate)}
                {isToday(selectedDate) && (
                  <span style={{
                    marginLeft: 8,
                    padding: '2px 8px',
                    background: colors.accentLight,
                    color: colors.accent,
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500
                  }}>今天</span>
                )}
              </h3>
            </div>

            {selectedEvents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: colors.textMuted
              }}>
                <Calendar size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: 15, marginBottom: 8 }}>当天暂无日程</div>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, date: selectedDate }))
                    setShowAddForm(true)
                  }}
                  style={{
                    padding: '8px 16px',
                    background: colors.accentLight,
                    border: 'none',
                    borderRadius: 8,
                    color: colors.accent,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  + 添加日程
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedEvents.map(event => (
                  <div key={event.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: colors.inputBg,
                    borderLeft: `4px solid ${event.color}`,
                    opacity: event.completed ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}>
                    <button
                      onClick={() => handleToggleComplete(event.id)}
                      style={{
                        padding: 0,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: 2,
                        color: event.completed ? colors.success : colors.textMuted
                      }}
                    >
                      {event.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: event.completed ? 'line-through' : 'none',
                        marginBottom: 4
                      }}>
                        {event.title}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: colors.textSecondary }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />{formatTime(event.time)}
                          {event.endTime && ` - ${formatTime(event.endTime)}`}
                        </span>
                        {event.repeat !== 'none' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Repeat size={12} />{REPEAT_LABELS[event.repeat]}
                          </span>
                        )}
                        {event.reminderMinutes > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bell size={12} />
                            {REMINDER_OPTIONS.find(o => o.value === event.reminderMinutes)?.label || `${event.reminderMinutes}分钟前`}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                          {event.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleEdit(event)}
                        style={{
                          padding: 4,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.textMuted,
                          borderRadius: 4
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        style={{
                          padding: 4,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.danger,
                          borderRadius: 4
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}
          onClick={(e) => { if (e.target === e.currentTarget) resetForm() }}
        >
          <div style={{
            background: colors.cardBg,
            borderRadius: 20,
            padding: 28,
            width: 480,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: colors.shadowLg
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {editingEvent ? '编辑日程' : '新建日程'}
              </h3>
              <button onClick={resetForm} style={{
                padding: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textSecondary,
                borderRadius: 4
              }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: colors.textSecondary }}>
                  日程标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：团队周会"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: 8,
                    background: colors.inputBg,
                    fontSize: 14,
                    color: colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: colors.textSecondary }}>
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="添加备注..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: 8,
                    background: colors.inputBg,
                    fontSize: 14,
                    color: colors.text,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: colors.textSecondary }}>
                    日期
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: 8,
                      background: colors.inputBg,
                      fontSize: 14,
                      color: colors.text,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: colors.textSecondary }}>
                    时间
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: `1px solid ${colors.inputBorder}`,
                        borderRadius: 8,
                        background: colors.inputBg,
                        fontSize: 14,
                        color: colors.text,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ color: colors.textMuted, fontSize: 13 }}>-</span>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      placeholder="结束"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: `1px solid ${colors.inputBorder}`,
                        borderRadius: 8,
                        background: colors.inputBg,
                        fontSize: 14,
                        color: colors.text,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: colors.textSecondary }}>
                    <Repeat size={12} style={{ marginRight: 4 }} />重复
                  </label>
                  <select
                    value={formData.repeat}
                    onChange={e => setFormData(prev => ({ ...prev, repeat: e.target.value as ScheduleEvent['repeat'] }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: 8,
                      background: colors.inputBg,
                      fontSize: 14,
                      color: colors.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    {Object.entries(REPEAT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: colors.textSecondary }}>
                    <Bell size={12} style={{ marginRight: 4 }} />提醒
                  </label>
                  <select
                    value={formData.reminderMinutes}
                    onChange={e => setFormData(prev => ({ ...prev, reminderMinutes: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: 8,
                      background: colors.inputBg,
                      fontSize: 14,
                      color: colors.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    {REMINDER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: colors.textSecondary }}>
                  <Palette size={12} style={{ marginRight: 4 }} />颜色标签
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EVENT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: color,
                        border: formData.color === color ? `3px solid ${colors.text}` : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={resetForm}
                  style={{
                    padding: '10px 24px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: 10,
                    color: colors.textSecondary,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.title.trim()}
                  style={{
                    padding: '10px 24px',
                    background: formData.title.trim() ? colors.accentGradient : colors.inputBorder,
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: formData.title.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  {editingEvent ? '保存修改' : '创建日程'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}