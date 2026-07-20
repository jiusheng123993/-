import { View, Text } from '@tarojs/components';
import { useMemo, useState } from 'react';
import type { VaccineRecord } from '../../services/vaccineService';

interface VaccineCalendarProps {
  records: VaccineRecord[];
  onDateClick?: (date: string) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function VaccineCalendar({ records, onDateClick }: VaccineCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{
      date: number;
      dateStr: string;
      isToday: boolean;
      hasVaccine: boolean;
      hasDeworm: boolean;
      hasOverdue: boolean;
    }> = [];

    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < startWeekday; i++) {
      days.push({
        date: 0,
        dateStr: '',
        isToday: false,
        hasVaccine: false,
        hasDeworm: false,
        hasOverdue: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecords = records.filter(
        (r) => r.date === dateStr || r.nextDate === dateStr
      );

      days.push({
        date: d,
        dateStr,
        isToday: dateStr === today,
        hasVaccine: dayRecords.some((r) => r.type === 'vaccine'),
        hasDeworm: dayRecords.some((r) => r.type === 'deworm'),
        hasOverdue: dayRecords.some((r) => r.status === 'overdue' && r.nextDate === dateStr),
      });
    }

    return days;
  }, [currentYear, currentMonth, records]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <View className='vaccine-calendar'>
      <View className='vaccine-calendar__header'>
        <View className='vaccine-calendar__nav-btn' onClick={handlePrevMonth}>
          <Text className='vaccine-calendar__nav-icon'>‹</Text>
        </View>
        <Text className='vaccine-calendar__title'>
          {currentYear}年{currentMonth + 1}月
        </Text>
        <View className='vaccine-calendar__nav-btn' onClick={handleNextMonth}>
          <Text className='vaccine-calendar__nav-icon'>›</Text>
        </View>
      </View>

      <View className='vaccine-calendar__weekdays'>
        {WEEKDAYS.map((day) => (
          <Text key={day} className='vaccine-calendar__weekday'>
            {day}
          </Text>
        ))}
      </View>

      <View className='vaccine-calendar__days'>
        {calendarDays.map((day, index) => (
          <View
            key={index}
            className={`vaccine-calendar__day${day.date === 0 ? ' vaccine-calendar__day--empty' : ''}${
              day.isToday ? ' vaccine-calendar__day--today' : ''
            }${day.hasOverdue ? ' vaccine-calendar__day--overdue' : ''}`}
            onClick={() => day.dateStr && onDateClick?.(day.dateStr)}
          >
            {day.date > 0 && (
              <>
                <Text className='vaccine-calendar__day-num'>{day.date}</Text>
                <View className='vaccine-calendar__day-marks'>
                  {day.hasVaccine && <View className='vaccine-calendar__mark vaccine-calendar__mark--vaccine' />}
                  {day.hasDeworm && <View className='vaccine-calendar__mark vaccine-calendar__mark--deworm' />}
                </View>
              </>
            )}
          </View>
        ))}
      </View>

      <View className='vaccine-calendar__legend'>
        <View className='vaccine-calendar__legend-item'>
          <View className='vaccine-calendar__legend-dot vaccine-calendar__legend-dot--vaccine' />
          <Text className='vaccine-calendar__legend-text'>疫苗</Text>
        </View>
        <View className='vaccine-calendar__legend-item'>
          <View className='vaccine-calendar__legend-dot vaccine-calendar__legend-dot--deworm' />
          <Text className='vaccine-calendar__legend-text'>驱虫</Text>
        </View>
        <View className='vaccine-calendar__legend-item'>
          <View className='vaccine-calendar__legend-dot vaccine-calendar__legend-dot--overdue' />
          <Text className='vaccine-calendar__legend-text'>逾期</Text>
        </View>
      </View>
    </View>
  );
}
