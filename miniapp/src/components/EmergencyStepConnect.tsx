// 星寰海 v3.0 - 急救步骤4：建立连接（水墨风格）
import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './EmergencyStepConnect.scss';

interface Resource {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface SupportMessage {
  id: string;
  text: string;
  author: string;
}

interface EmergencyStepConnectProps {
  title: string;
  subtitle: string;
  resourceType: string;
  resources: Resource[];
  supportMessages?: SupportMessage[];
  onSelect: (resourceId: string) => void;
}

export default function EmergencyStepConnect({
  title,
  subtitle,
  resources,
  supportMessages,
  onSelect,
}: EmergencyStepConnectProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const handleResourceClick = (resourceId: string) => {
    setSelectedResource(resourceId);
    onSelect(resourceId);
  };

  const handleHotlineCall = () => {
    Taro.makePhoneCall({ phoneNumber: '400-161-9995' });
  };

  return (
    <View className='emergency-step-connect'>
      <View className='step-header'>
        <Text className='step-title'>{title}</Text>
        <Text className='step-subtitle'>{subtitle}</Text>
      </View>

      {/* 资源列表 */}
      <View className='resources-section'>
        <Text className='section-label'>你可以尝试：</Text>
        <View className='resources-list'>
          {resources.map((resource, index) => (
            <View
              key={resource.id}
              className={`resource-card ${selectedResource === resource.id ? 'selected' : ''}`}
              onClick={() => handleResourceClick(resource.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <View className='resource-icon'>
                <Text className='icon-text'>{resource.icon || '•'}</Text>
              </View>
              <View className='resource-content'>
                <Text className='resource-title'>{resource.title}</Text>
                <Text className='resource-description'>{resource.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 支持消息 */}
      {supportMessages && supportMessages.length > 0 && (
        <View className='messages-section'>
          <Text className='section-label'>来自社区的声音：</Text>
          <View className='messages-list'>
            {supportMessages.map((message, index) => (
              <View
                key={message.id}
                className='message-card'
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <Text className='message-text'>"{message.text}"</Text>
                <Text className='message-author'>— {message.author}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 热线按钮 */}
      <View className='hotline-section'>
        <Text className='hotline-label'>需要立即帮助？</Text>
        <View className='hotline-btn' onClick={handleHotlineCall}>
          <Text className='hotline-icon'>📞</Text>
          <View className='hotline-info'>
            <Text className='hotline-title'>希望24热线</Text>
            <Text className='hotline-number'>400-161-9995</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
