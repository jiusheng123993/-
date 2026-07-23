import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getRecordsByMonth } from '../../../services/vaccineService'
import { useFamilyStore } from '../../../stores/familyStore'

interface CalendarEvent {
  date: number
  petName: string
  title: string
  type: 'vaccine' | 'deworm' | 'checkup'
}

const MOCK_EVENTS: CalendarEvent[] = [
  { date: 20, petName: '青橘', title: '猫三联第2针', type: 'vaccine' },
  { date: 25, petName: '全员', title: '体外驱虫日', type: 'deworm' },
  { date: 3, petName: '花花', title: '产后复查', type: 'checkup' },
]

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function FamilyCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS)

  const { members } = useFamilyStore()

  useEffect(() => {
    loadEvents()
  }, [year, month])

  const loadEvents = async () => {
    try {
      if (!members || members.length === 0) {
        setEvents(MOCK_EVENTS)
        return
      }
      const allRecords: any[] = []
      for (const member of members) {
        if (member.petId) {
          const records = await getRecordsByMonth(member.petId, year, month)
          if (records && records.length > 0) {
            records.forEach((r: any) => {
              allRecords.push({ ...r, petName: (member as any).petName || (member as any).name || '宠物' })
            })
          }
        }
      }
      if (allRecords.length > 0) {
        const mapped: CalendarEvent[] = allRecords.map((r: any) => ({
          date: new Date(r.date || r.nextDate).getDate(),
          petName: r.petName || '宠物',
          title: r.category || r.type,
          type: r.type || 'vaccine',
        }))
        setEvents(mapped)
      } else {
        setEvents(MOCK_EVENTS)
      }
    } catch {
      setEvents(MOCK_EVENTS)
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const todayDate = today.getDate()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const selectedEvents = selectedDay
    ? events.filter(e => e.date === selectedDay)
    : []

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
    setSelectedDay(null)
  }

  return (
    <View style={{ minHeight: '100vh', background: '#0F1724', padding: '20px', paddingTop: '60px' }}>
      <Text style={{ color: '#F5D78C', fontSize: '22px', fontFamily: 'serif', display: 'block', textAlign: 'center', marginBottom: '20px' }}>
        家庭日历
      </Text>

      {/* 月份切换 */}
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', gap: '20px' }}>
        <View onClick={handlePrevMonth} style={{ color: '#E8A838', fontSize: '20px', padding: '8px' }}>
          <Text>◀</Text>
        </View>
        <Text style={{ color: '#E8DFD5', fontSize: '18px', fontFamily: 'serif' }}>
          {year}年{month}月
        </Text>
        <View onClick={handleNextMonth} style={{ color: '#E8A838', fontSize: '20px', padding: '8px' }}>
          <Text>▶</Text>
        </View>
      </View>

      {/* 星期头 */}
      <View style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
        {WEEK_DAYS.map(w => (
          <Text key={w} style={{ color: '#8899AA', fontSize: '12px', textAlign: 'center', padding: '4px' }}>{w}</Text>
        ))}
      </View>

      {/* 日历网格 */}
      <View style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '20px' }}>
        {days.map((d, idx) => {
          const isToday = isCurrentMonth && d === todayDate
          const hasEvent = d !== null && events.some(e => e.date === d)
          const isSelected = d === selectedDay

          return (
            <View
              key={idx}
              onClick={() => d && setSelectedDay(d)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                background: isSelected ? 'rgba(232,168,56,0.2)' : 'transparent',
                border: isToday ? '2px solid #E8A838' : '1px solid transparent',
                color: d ? '#E8DFD5' : 'transparent',
                fontSize: '14px',
                position: 'relative',
              }}
            >
              {d && <Text>{d}</Text>}
              {hasEvent && (
                <View style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#E8A838', marginTop: '2px'
                }} />
              )}
            </View>
          )
        })}
      </View>

      {/* 当天事件 */}
      <View style={{ marginTop: '8px' }}>
        <Text style={{ color: '#8899AA', fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          {selectedDay ? `${month}月${selectedDay}日 · 事件` : '点击日期查看事件'}
        </Text>

        {selectedEvents.map((ev, idx) => (
          <View key={idx} style={{
            padding: '14px 16px', borderRadius: '12px', marginBottom: '8px',
            background: '#1A2332', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '12px',
            borderLeft: ev.type === 'vaccine' ? '3px solid #E8A838'
              : ev.type === 'deworm' ? '3px solid #8CAD7E' : '3px solid #5B9A9B',
          }}>
            <Text style={{ fontSize: '20px' }}>
              {ev.type === 'vaccine' ? '💉' : ev.type === 'deworm' ? '🪱' : '🩺'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#E8DFD5', fontSize: '14px', display: 'block' }}>{ev.title}</Text>
              <Text style={{ color: '#8899AA', fontSize: '11px', display: 'block' }}>{ev.petName}</Text>
            </View>
          </View>
        ))}

        {selectedDay && selectedEvents.length === 0 && (
          <Text style={{ color: '#8899AA', fontSize: '13px', display: 'block', textAlign: 'center', padding: '20px' }}>
            暂无事件
          </Text>
        )}
      </View>

      {/* 底部查看全部按钮 */}
      <View
        onClick={() => Taro.navigateTo({ url: '/pagesPet/vaccine/index' })}
        style={{
          marginTop: '24px',
          padding: '14px 32px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #E8A838, #C88520)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#0F1724', fontSize: '15px', fontWeight: 600 }}>
          查看全部提醒
        </Text>
      </View>
    </View>
  )
}
