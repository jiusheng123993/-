// 星寰海 v3.0 - 情绪日历组件（水墨风格）
import { View, Text } from '@tarojs/components';
import { useMemo } from 'react';
import { useScheduleStore } from '../stores/scheduleStore';
import type { RiskLevel } from '../stores/scheduleStore';
import './EmotionCalendar.scss';

interface DayInfo {
  day: number;
  date: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEntries: boolean;
  entryCount: number;
  maxIntensity?: number;
}

interface EmotionCalendarProps {
  onDayClick?: (date: string) => void;
}

/** 根据风险等级获取水墨灰阶颜色 */
function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical': return '#2d2d2d'; // 深墨
    case 'high': return '#5a5a5a';     // 浓墨
    case 'medium': return '#8a8a8a';   // 中墨
    case 'low': return '#b0b0b0';      // 淡墨
    default: return '#d0d0d0';
  }
}

/** 根据强度获取圆点大小 */
function getDotSize(intensity?: number): string {
  if (!intensity) return '8rpx';
  if (intensity >= 8) return '16rpx';
  if (intensity >= 6) return '12rpx';
  return '8rpx';
}

export default function EmotionCalendar({ onDayClick }: EmotionCalendarProps) {
  const { currentMonth, events, navigateMonth, setSelectedDate } = useScheduleStore();

  // 生成日历数据
  const calendarDays = useMemo<DayInfo[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: DayInfo[] = [];

    // 上月填充
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        hasEntries: events.some(e => e.date === dateStr),
        entryCount: events.filter(e => e.date === dateStr).length,
      });
    }

    // 当月
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      const maxIntensity = dayEvents.reduce((max, e) => Math.max(max, e.intensity || 0), 0);
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: today.toISOString().split('T')[0] === dateStr,
        hasEntries: dayEvents.length > 0,
        entryCount: dayEvents.length,
        maxIntensity,
      });
    }

    // 下月填充（补齐6行）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        hasEntries: events.some(e => e.date === dateStr),
        entryCount: events.filter(e => e.date === dateStr).length,
      });
    }

    return days;
  }, [currentMonth, events]);

  // 月份标题
  const monthTitle = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  // 星期标题
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 处理日期点击
  const handleDayClick = (dayInfo: DayInfo) => {
    if (!dayInfo.isCurrentMonth) return;
    setSelectedDate(dayInfo.date);
    if (onDayClick) {
      onDayClick(dayInfo.date);
    }
  };

  // 获取当天的风险颜色
  const getDayColor = (dayInfo: DayInfo): string => {
    if (!dayInfo.hasEntries) return '';
    if (dayInfo.maxIntensity && dayInfo.maxIntensity >= 8) return getRiskColor('critical');
    if (dayInfo.maxIntensity && dayInfo.maxIntensity >= 6) return getRiskColor('high');
    if (dayInfo.maxIntensity && dayInfo.maxIntensity >= 4) return getRiskColor('medium');
    return getRiskColor('low');
  };

  return (
    <View className='emotion-calendar'>
      {/* 头部：月份导航 */}
      <View className='calendar-header'>
        <View className='nav-btn' onClick={() => navigateMonth('prev')}>
          <Text className='nav-icon'>‹</Text>
        </View>
        <Text className='month-title'>{monthTitle}</Text>
        <View className='nav-btn' onClick={() => navigateMonth('next')}>
          <Text className='nav-icon'>›</Text>
        </View>
      </View>

      {/* 星期标题 */}
      <View className='week-header'>
        {weekDays.map((day, index) => (
          <Text key={index} className={`week-day ${index === 0 || index === 6 ? 'weekend' : ''}`}>
            {day}
          </Text>
        ))}
      </View>

      {/* 日期网格 */}
      <View className='days-grid'>
        {calendarDays.map((dayInfo, index) => (
          <View
            key={index}
            className={`day-cell ${!dayInfo.isCurrentMonth ? 'other-month' : ''} ${dayInfo.isToday ? 'today' : ''}`}
            onClick={() => handleDayClick(dayInfo)}
          >
            <Text className={`day-number ${dayInfo.isToday ? 'today-number' : ''}`}>
              {dayInfo.day}
            </Text>
            {dayInfo.hasEntries && (
              <View
                className='entry-dot'
                style={{
                  width: getDotSize(dayInfo.maxIntensity),
                  height: getDotSize(dayInfo.maxIntensity),
                  backgroundColor: getDayColor(dayInfo),
                }}
              />
            )}
            {dayInfo.entryCount > 1 && (
              <Text className='entry-count'>{dayInfo.entryCount}</Text>
            )}
          </View>
        ))}
      </View>

      {/* 图例 - 水墨灰阶 */}
      <View className='legend'>
        <View className='legend-item'>
          <View className='legend-dot' style={{ backgroundColor: getRiskColor('low') }} />
          <Text className='legend-text'>淡墨</Text>
        </View>
        <View className='legend-item'>
          <View className='legend-dot' style={{ backgroundColor: getRiskColor('medium') }} />
          <Text className='legend-text'>中墨</Text>
        </View>
        <View className='legend-item'>
          <View className='legend-dot' style={{ backgroundColor: getRiskColor('high') }} />
          <Text className='legend-text'>浓墨</Text>
        </View>
        <View className='legend-item'>
          <View className='legend-dot' style={{ backgroundColor: getRiskColor('critical') }} />
          <Text className='legend-text'>深墨</Text>
        </View>
      </View>
    </View>
  );
}
