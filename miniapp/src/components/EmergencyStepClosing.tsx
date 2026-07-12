// 星寰海 v2.0 - 结束步骤组件
// 总结流程，提供鼓励和后续建议

import { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import './EmergencyStepClosing.scss';

interface StepSummary {
  stepNumber: number;
  title: string;
  content?: string;
}

interface EncouragementMessage {
  id: string;
  text: string;
  icon?: string;
}

interface EmergencyStepClosingProps {
  title: string;
  subtitle?: string;
  flowColor: string;
  summaries: StepSummary[];
  encouragements: EncouragementMessage[];
  showGratitude?: boolean;
  onComplete?: (data: { gratitude?: string }) => void;
}

export default function EmergencyStepClosing({
  title,
  subtitle,
  flowColor,
  summaries,
  encouragements,
  showGratitude = false,
  onComplete
}: EmergencyStepClosingProps) {
  const [gratitudeText, setGratitudeText] = useState('');
  const [showAllEncouragements, setShowAllEncouragements] = useState(false);

  const handleComplete = () => {
    if (onComplete) {
      onComplete({ gratitude: gratitudeText || undefined });
    }
  };

  const visibleEncouragements = showAllEncouragements
    ? encouragements
    : encouragements.slice(0, 3);

  return (
    <View className="closing-step">
      <View className="closing-header">
        <Text className="closing-title">{title}</Text>
        {subtitle && <Text className="closing-subtitle">{subtitle}</Text>}
      </View>

      {/* 步骤总结 */}
      <View className="summary-section">
        <Text className="section-label">你完成了这些步骤：</Text>
        <View className="summary-list">
          {summaries.map((summary) => (
            <View key={summary.stepNumber} className="summary-item">
              <View className="summary-number" style={{ background: flowColor }}>
                <Text>{summary.stepNumber}</Text>
              </View>
              <View className="summary-content">
                <Text className="summary-title">{summary.title}</Text>
                {summary.content && (
                  <Text className="summary-text">{summary.content}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 鼓励话语 */}
      <View className="encouragement-section">
        <Text className="section-label">想对你说：</Text>
        <View className="encouragement-list">
          {visibleEncouragements.map((msg) => (
            <View key={msg.id} className="encouragement-card">
              <Text className="encouragement-icon">{msg.icon || '💛'}</Text>
              <Text className="encouragement-text">{msg.text}</Text>
            </View>
          ))}
        </View>
        {encouragements.length > 3 && (
          <View className="show-more" onClick={() => setShowAllEncouragements(!showAllEncouragements)}>
            <Text>{showAllEncouragements ? '收起' : '查看更多'}</Text>
          </View>
        )}
      </View>

      {/* 感恩练习 */}
      {showGratitude && (
        <View className="gratitude-section">
          <Text className="section-label">感恩练习（可选）</Text>
          <Text className="gratitude-hint">
            写下三件今天值得感恩的事，即使是很小的事情
          </Text>
          <Textarea
            className="gratitude-textarea"
            placeholder="例如：今天阳光很好、喝了一杯热茶..."
            value={gratitudeText}
            onInput={(e) => setGratitudeText(e.detail.value)}
            maxlength={200}
            autoHeight
          />
        </View>
      )}

      {/* 完成按钮 */}
      <View className="complete-btn" style={{ background: flowColor }} onClick={handleComplete}>
        <Text>完成并保存</Text>
      </View>

      {/* 温馨提示 */}
      <View className="footer-note">
        <Text>如果这种感觉持续困扰你，请寻求专业帮助</Text>
        <Text className="hotline">心理援助热线：400-161-9995</Text>
      </View>
    </View>
  );
}