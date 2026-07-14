// 星寰海 v3.0 - 日期详情弹窗组件（水墨风格）
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo } from 'react';
import { useScheduleStore } from '../stores/scheduleStore';
import type { ScheduleEvent } from '../stores/scheduleStore';
import './DayDetailModal.scss';

interface DayDetailModalProps {
  date: string | null;
  onClose: () => void;
  onAddEntry?: (date: string) => void;
}

/** 情绪标签映射 */
const MOOD_LABELS: Record<string, string> = {
  sad: '难过',
  anxious: '焦虑',
  tired: '疲惫',
  lonely: '孤独',
  unclear: '说不清',
  happy: '开心',
  calm: '平静',
  angry: '愤怒',
  fearful: '恐惧',
  joyful: '喜悦',
  stressed: '压力大',
  relaxed: '放松',
  frustrated: '挫败',
  hopeful: '有希望',
  guilty: '内疚',
  ashamed: '羞愧',
  grateful: '感恩',
  disappointed: '失望',
  nervous: '紧张',
  confident: '自信',
  lonely_deep: '深度孤独',
  empty: '空虚',
  overwhelmed: '崩溃',
};

/** 情境标签映射 */
const CONTEXT_LABELS: Record<string, string> = {
  work: '工作',
  family: '家庭',
  relationship: '关系',
  health: '健康',
  finance: '财务',
  social: '社交',
  self_growth: '自我成长',
  other: '其他',
};

/** 风险等级颜色 - 水墨灰阶 */
function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return '#2d2d2d'; // 深墨
    case 'high': return '#5a5a5a';     // 浓墨
    case 'medium': return '#8a8a8a';   // 中墨
    case 'low': return '#b0b0b0';      // 淡墨
    default: return '#d0d0d0';
  }
}

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function DayDetailModal({ date, onClose, onAddEntry }: DayDetailModalProps) {
  const { events, removeEvent } = useScheduleStore();

  // 获取当天的事件
  const dayEvents = useMemo<ScheduleEvent[]>(() => {
    if (!date) return [];
    return events.filter(e => e.date === date).sort((a, b) => {
      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });
  }, [date, events]);

  // 计算统计数据
  const stats = useMemo(() => {
    if (dayEvents.length === 0) return null;

    const totalIntensity = dayEvents.reduce((sum, e) => sum + (e.intensity || 0), 0);
    const avgIntensity = Math.round((totalIntensity / dayEvents.length) * 10) / 10;
    const highRiskCount = dayEvents.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length;

    return {
      totalEntries: dayEvents.length,
      avgIntensity,
      highRiskCount,
    };
  }, [dayEvents]);

  // 删除事件
  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          removeEvent(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  };

  // 添加条目
  const handleAddEntry = () => {
    if (date && onAddEntry) {
      onAddEntry(date);
    }
  };

  if (!date) return null;

  return (
    <View className='day-detail-modal'>
      <View className='modal-overlay' onClick={onClose} />
      <View className='modal-content'>
        {/* 头部 */}
        <View className='modal-header'>
          <Text className='modal-date'>{formatTime(date)}</Text>
          <View className='close-btn' onClick={onClose}>
            <Text>✕</Text>
          </View>
        </View>

        {/* 统计摘要 */}
        {stats && (
          <View className='stats-section'>
            <View className='stat-item'>
              <Text className='stat-value'>{stats.totalEntries}</Text>
              <Text className='stat-label'>条记录</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value' style={{ color: '#5a5a5a' }}>{stats.avgIntensity}</Text>
              <Text className='stat-label'>平均强度</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value' style={{ color: stats.highRiskCount > 0 ? '#2d2d2d' : '#8a8a8a' }}>
                {stats.highRiskCount}
              </Text>
              <Text className='stat-label'>高风险</Text>
            </View>
          </View>
        )}

        {/* 事件列表 */}
        <View className='events-section'>
          {dayEvents.length === 0 ? (
            <View className='empty-state'>
              <Text className='empty-text'>今天还没有记录</Text>
              <View className='add-btn' onClick={handleAddEntry}>
                <Text>添加记录</Text>
              </View>
            </View>
          ) : (
            <View className='event-list'>
              {dayEvents.map((event, index) => (
                <View key={event.id} className='event-card'>
                  <View className='event-header'>
                    <View className='event-time'>
                      <Text className='event-time-text'>{event.time || `${index + 1}`}</Text>
                    </View>
                    <View
                      className='event-risk-badge'
                      style={{ backgroundColor: getRiskColor(event.riskLevel) + '15', borderColor: getRiskColor(event.riskLevel) + '20' }}
                    >
                      <Text className='event-risk-text' style={{ color: getRiskColor(event.riskLevel) }}>
                        {event.riskLevel === 'critical' ? '极高' : event.riskLevel === 'high' ? '高' : event.riskLevel === 'medium' ? '中' : '低'}风险
                      </Text>
                    </View>
                  </View>

                  <Text className='event-title'>{event.title}</Text>

                  {event.emotionTag && (
                    <View className='event-tags'>
                      <View className='tag emotion'>
                        <Text>{MOOD_LABELS[event.emotionTag] || event.emotionTag}</Text>
                      </View>
                      {event.intensity && (
                        <View className='tag intensity'>
                          <Text>强度: {event.intensity}/10</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {event.contextTags && event.contextTags.length > 0 && (
                    <View className='event-contexts'>
                      {event.contextTags.map((ctx, i) => (
                        <View key={i} className='tag context'>
                          <Text>{CONTEXT_LABELS[ctx] || ctx}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {event.note && (
                    <Text className='event-note'>{event.note}</Text>
                  )}

                  <View className='event-actions'>
                    <View className='action-btn delete' onClick={() => handleDelete(event.id)}>
                      <Text>删除</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 底部操作 */}
        <View className='modal-footer'>
          <View className='add-entry-btn' onClick={handleAddEntry}>
            <Text>+ 添加记录</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
