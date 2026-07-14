// 星寰海 v2.0 - 情绪日历页面
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import EmotionCalendar from '../../components/EmotionCalendar';
import DayDetailModal from '../../components/DayDetailModal';
import MonthlySummary from '../../components/MonthlySummary';
import FloatingNav from '../../components/FloatingNav';
import { useScheduleStore } from '../../stores/scheduleStore';
import './index.scss';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { currentMonth, loadFromStorage } = useScheduleStore();

  // 页面加载时从本地存储读取数据
  useDidShow(() => {
    loadFromStorage();
  });

  // 处理日期点击
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  // 添加记录
  const handleAddEntry = (date: string) => {
    Taro.navigateTo({
      url: `/pages/mood/index?date=${date}`,
    });
  };

  return (
    <View className='calendar-page'>
      {/* 水墨背景装饰 */}
      <View className='ink-bg-decoration ink-bg-1' />
      <View className='ink-bg-decoration ink-bg-2' />

      {/* 页面标题 */}
      <View className='page-header ink-item' style={{ animationDelay: '0.1s' }}>
        <Text className='page-title'>情绪日历</Text>
        <Text className='page-subtitle'>追踪你的情绪变化，发现规律</Text>
      </View>

      {/* 月度摘要 */}
      <View className='monthly-summary ink-item' style={{ animationDelay: '0.2s' }}>
        <MonthlySummary
          year={currentMonth.getFullYear()}
          month={currentMonth.getMonth()}
        />
      </View>

      {/* 日历组件 */}
      <View className='emotion-calendar ink-item' style={{ animationDelay: '0.3s' }}>
        <EmotionCalendar onDayClick={handleDayClick} />
      </View>

      {/* 使用提示 */}
      <View className='tips-section ink-item' style={{ animationDelay: '0.4s' }}>
        <Text className='tips-title'>💡 使用提示</Text>
        <View className='tip-item'>
          <Text className='tip-dot'>•</Text>
          <Text className='tip-text'>点击有颜色的日期查看当天的情绪记录</Text>
        </View>
        <View className='tip-item'>
          <Text className='tip-dot'>•</Text>
          <Text className='tip-text'>颜色越深表示情绪强度越高</Text>
        </View>
        <View className='tip-item'>
          <Text className='tip-dot'>•</Text>
          <Text className='tip-text'>左右滑动或点击箭头切换月份</Text>
        </View>
      </View>

      {/* 日期详情弹窗 */}
      <DayDetailModal
        date={showModal ? selectedDate : null}
        onClose={handleCloseModal}
        onAddEntry={handleAddEntry}
      />

      {/* 悬浮导航 */}
      <FloatingNav />
    </View>
  );
}