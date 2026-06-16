import { useEffect, useState } from 'react'

export function ClockDisplay() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const weekdayStr = weekdays[now.getDay()]

  return (
    <>
      <span className="hero-date">{dateStr}</span>
      <span className="hero-weekday">{weekdayStr}</span>
      <span className="hero-time">{timeStr}</span>
    </>
  )
}
