// 星寰海 v2.0 - 情绪记录页面
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import MoodSelector from '../../components/MoodSelector';
import IntensitySlider from '../../components/IntensitySlider';
import ContextTagSelector from '../../components/ContextTagSelector';
import { useMood } from '../../hooks/useMood';
import type { MoodTag, ContextTag, EmotionIntensity } from '../../memory-body/types/memoryBodyTypes';
import './index.scss';

export default function MoodPage() {
  const [selectedMood, setSelectedMood] = useState<MoodTag | null>(null);
  const [intensity, setIntensity] = useState<EmotionIntensity>(5);
  const [selectedContexts, setSelectedContexts] = useState<ContextTag[]>([]);
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { entries, isSaving, recordMood } = useMood();

  // 处理情境标签选择
  const handleContextSelect = (context: ContextTag) => {
    setSelectedContexts(prev => {
      if (prev.includes(context)) {
        return prev.filter(c => c !== context);
      }
      return [...prev, context];
    });
  };

  // 保存情绪记录
  const handleSave = async () => {
    if (!selectedMood) {
      Taro.showToast({ title: '请选择心情', icon: 'none' });
      return;
    }

    const result = await recordMood(selectedMood, intensity, selectedContexts.length > 0 ? selectedContexts : undefined, note || undefined);

    if (result) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // 重置表单
        setSelectedMood(null);
        setIntensity(5);
        setSelectedContexts([]);
        setNote('');
      }, 1500);
    } else {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  return (
    <View className='mood-page'>
      {/* 成功提示 */}
      {showSuccess && (
        <View className='success-overlay'>
          <View className='success-content'>
            <Text className='success-icon'>✓</Text>
            <Text className='success-text'>已记录</Text>
          </View>
        </View>
      )}

      {/* 情绪选择器 */}
      <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />

      {/* 强度滑块 */}
      <IntensitySlider value={intensity} onChange={setIntensity} />

      {/* 情境标签 */}
      <ContextTagSelector selected={selectedContexts} onSelect={handleContextSelect} />

      {/* 备注输入 */}
      <View className='note-section'>
        <Text className='note-title'>补充说明（可选）</Text>
        <Textarea
          className='note-input'
          placeholder='想说什么都可以...'
          placeholderClass='note-placeholder'
          maxlength={200}
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />
        <Text className='note-count'>{note.length}/200</Text>
      </View>

      {/* 保存按钮 */}
      <View className='save-section'>
        <View
          className={`save-btn ${!selectedMood ? 'disabled' : ''}`}
          onClick={handleSave}
        >
          <Text>{isSaving ? '保存中...' : '记录此刻'}</Text>
        </View>
      </View>

      {/* 最近记录 */}
      {entries.length > 0 && (
        <View className='recent-section'>
          <Text className='recent-title'>最近记录</Text>
          <View className='recent-list'>
            {entries.slice(0, 5).map((entry) => (
              <View key={entry.id} className='recent-item'>
                <View className='recent-item-header'>
                  <Text className='recent-mood'>{entry.mood}</Text>
                  <Text className='recent-time'>
                    {new Date(entry.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text className='recent-intensity'>强度: {entry.intensity}</Text>
                {entry.context && entry.context.length > 0 && (
                  <Text className='recent-context'>
                    情境: {entry.context.join(', ')}
                  </Text>
                )}
                {entry.note && (
                  <Text className='recent-note'>{entry.note}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
