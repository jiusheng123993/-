// 星寰海 v2.0 - 连接步骤组件
// 提供支持资源和连接选项

import { View, Text } from '@tarojs/components';
import './EmergencyStepConnect.scss';

interface ResourceLink {
  id: string;
  title: string;
  description: string;
  url?: string;
  icon?: string;
}

interface SupportMessage {
  id: string;
  text: string;
  author?: string;
}

interface EmergencyStepConnectProps {
  title: string;
  subtitle?: string;
  flowColor: string;
  resourceType: 'peer' | 'professional' | 'community' | 'sleep' | 'counseling';
  resources: ResourceLink[];
  supportMessages?: SupportMessage[];
  onResourceClick?: (resourceId: string) => void;
}

export default function EmergencyStepConnect({
  title,
  subtitle,
  flowColor,
  resourceType,
  resources,
  supportMessages = [],
  onResourceClick
}: EmergencyStepConnectProps) {
  const renderPeerSupport = () => (
    <View className="connect-section">
      <Text className="section-title">你不是一个人</Text>
      <Text className="section-desc">
        今晚有成千上万的人也在经历类似的感受
      </Text>

      {supportMessages.length > 0 && (
        <View className="messages-list">
          {supportMessages.map((msg) => (
            <View key={msg.id} className="message-card">
              <Text className="message-text">"{msg.text}"</Text>
              {msg.author && <Text className="message-author">— {msg.author}</Text>}
            </View>
          ))}
        </View>
      )}

      <View className="resources-grid">
        {resources.map((resource) => (
          <View
            key={resource.id}
            className="resource-card"
            onClick={() => onResourceClick?.(resource.id)}
          >
            <Text className="resource-icon">{resource.icon || '💬'}</Text>
            <Text className="resource-title">{resource.title}</Text>
            <Text className="resource-desc">{resource.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderProfessionalHelp = () => (
    <View className="connect-section">
      <Text className="section-title">寻求专业帮助</Text>
      <Text className="section-desc">
        如果你感觉情绪难以承受，专业人士可以提供帮助
      </Text>

      <View className="hotline-card">
        <Text className="hotline-label">全国心理援助热线</Text>
        <Text className="hotline-number">400-161-9995</Text>
        <Text className="hotline-hours">24 小时免费服务</Text>
      </View>

      <View className="resources-list">
        {resources.map((resource) => (
          <View
            key={resource.id}
            className="resource-item"
            onClick={() => onResourceClick?.(resource.id)}
          >
            <Text className="resource-icon">{resource.icon || '📞'}</Text>
            <View className="resource-info">
              <Text className="resource-title">{resource.title}</Text>
              <Text className="resource-desc">{resource.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCommunityResources = () => (
    <View className="connect-section">
      <Text className="section-title">找到你的社区</Text>
      <Text className="section-desc">
        与理解你的人建立连接
      </Text>

      <View className="community-options">
        {resources.map((resource) => (
          <View
            key={resource.id}
            className="community-card"
            style={{ borderLeftColor: flowColor }}
            onClick={() => onResourceClick?.(resource.id)}
          >
            <Text className="community-icon">{resource.icon || '🌍'}</Text>
            <Text className="community-title">{resource.title}</Text>
            <Text className="community-desc">{resource.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSleepHygiene = () => (
    <View className="connect-section">
      <Text className="section-title">改善睡眠质量</Text>
      <Text className="section-desc">
        良好的睡眠习惯可以帮助你恢复能量
      </Text>

      <View className="tips-list">
        {resources.map((resource, index) => (
          <View key={resource.id} className="tip-item">
            <Text className="tip-number">{index + 1}</Text>
            <View className="tip-content">
              <Text className="tip-title">{resource.title}</Text>
              <Text className="tip-desc">{resource.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCounselingOption = () => (
    <View className="connect-section">
      <Text className="section-title">专业咨询</Text>
      <Text className="section-desc">
        有时候，和专业人士聊聊会有帮助
      </Text>

      <View className="counseling-options">
        {resources.map((resource) => (
          <View
            key={resource.id}
            className="counseling-card"
            onClick={() => onResourceClick?.(resource.id)}
          >
            <Text className="counseling-icon">{resource.icon || '🎯'}</Text>
            <Text className="counseling-title">{resource.title}</Text>
            <Text className="counseling-desc">{resource.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (resourceType) {
      case 'peer':
        return renderPeerSupport();
      case 'professional':
        return renderProfessionalHelp();
      case 'community':
        return renderCommunityResources();
      case 'sleep':
        return renderSleepHygiene();
      case 'counseling':
        return renderCounselingOption();
      default:
        return renderPeerSupport();
    }
  };

  return (
    <View className="connect-step">
      <View className="connect-header">
        <Text className="connect-title">{title}</Text>
        {subtitle && <Text className="connect-subtitle">{subtitle}</Text>}
      </View>

      <View className="connect-content">
        {renderContent()}
      </View>
    </View>
  );
}