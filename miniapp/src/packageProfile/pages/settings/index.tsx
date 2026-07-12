import { useEffect, useState, useCallback } from 'react';
import { View, Text, Switch, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useSettingsStore } from '../../../stores/settingsStore';
import { requestSubscribe, FOLLOWUP_TEMPLATE_ID } from '../../../services/subscribeService';
import { APP_VERSION, HOTLINE_NUMBER } from '../../../constants';
import './index.scss';

const TIME_OPTIONS = [
  { value: '07:00', label: '早上 7:00' },
  { value: '08:00', label: '早上 8:00' },
  { value: '09:00', label: '早上 9:00' },
  { value: '10:00', label: '上午 10:00' },
  { value: '18:00', label: '下午 6:00' },
  { value: '19:00', label: '晚上 7:00' },
  { value: '20:00', label: '晚上 8:00' },
  { value: '21:00', label: '晚上 9:00' },
];

export default function Settings() {
  const router = useRouter();
  const {
    notification,
    isLoading,
    loadSettings,
    updateNotificationSettings,
    clearMoodData,
    clearEmergencyData,
    clearTreeholeData,
    clearAllData,
    exportData,
  } = useSettingsStore();

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(2);

  const handleLoadSettings = useCallback(() => {
    loadSettings();
    const idx = TIME_OPTIONS.findIndex((t) => t.value === notification.followupTime);
    if (idx >= 0) {
      setSelectedTimeIndex(idx);
    }
  }, [notification.followupTime]);

  useEffect(() => {
    handleLoadSettings();
  }, [handleLoadSettings]);

  const handleNotificationSwitch = async (enabled: boolean) => {
    if (enabled) {
      try {
        const results = await requestSubscribe([FOLLOWUP_TEMPLATE_ID]);
        if (results[FOLLOWUP_TEMPLATE_ID]) {
          updateNotificationSettings({ enabled: true });
          Taro.showToast({ title: '已开启通知', icon: 'success' });
        } else {
          Taro.showToast({ title: '请授权通知', icon: 'none' });
        }
      } catch (err) {
        Taro.showToast({ title: '授权失败', icon: 'none' });
      }
    } else {
      updateNotificationSettings({ enabled: false });
      Taro.showToast({ title: '已关闭通知', icon: 'success' });
    }
  };

  const handleTimeChange = (e: unknown) => {
    const event = e as { detail: { value: number | number[] } };
    const idx = Array.isArray(event.detail.value) ? event.detail.value[0] : event.detail.value;
    setSelectedTimeIndex(idx);
    updateNotificationSettings({ followupTime: TIME_OPTIONS[idx].value });
  };

  const handleClearMoodData = async () => {
    const result = await Taro.showModal({
      title: '清除情绪记录',
      content: '确定要清除所有情绪记录吗？此操作不可恢复。',
      confirmText: '确定清除',
      confirmColor: '#ef5350',
    });

    if (result.confirm) {
      clearMoodData();
      Taro.showToast({ title: '已清除', icon: 'success' });
    }
  };

  const handleClearEmergencyData = async () => {
    const result = await Taro.showModal({
      title: '清除急救记录',
      content: '确定要清除所有急救记录吗？此操作不可恢复。',
      confirmText: '确定清除',
      confirmColor: '#ef5350',
    });

    if (result.confirm) {
      clearEmergencyData();
      Taro.showToast({ title: '已清除', icon: 'success' });
    }
  };

  const handleClearTreeholeData = async () => {
    const result = await Taro.showModal({
      title: '清除树洞记录',
      content: '确定要清除所有树洞记录吗？此操作不可恢复。',
      confirmText: '确定清除',
      confirmColor: '#ef5350',
    });

    if (result.confirm) {
      clearTreeholeData();
      Taro.showToast({ title: '已清除', icon: 'success' });
    }
  };

  const handleClearAllData = async () => {
    const result = await Taro.showModal({
      title: '清除所有数据',
      content: '确定要清除所有数据吗？包括情绪记录、急救记录、树洞记录等。此操作不可恢复。',
      confirmText: '确定清除',
      confirmColor: '#ef5350',
    });

    if (result.confirm) {
      clearAllData();
      Taro.showToast({ title: '已清除所有数据', icon: 'success' });
    }
  };

  const handleExportData = async () => {
    try {
      const jsonData = exportData();
      const fileName = `星寰海数据导出_${new Date().toISOString().split('T')[0]}.json`;

      const fs = Taro.getFileSystemManager();
      const filePath = `${Taro.env.USER_DATA_PATH}/${fileName}`;
      fs.writeFileSync(filePath, jsonData, 'utf8');

      Taro.showModal({
        title: '数据已导出',
        content: `文件已保存到：${filePath}\n\n是否复制到剪贴板？`,
        success: (res) => {
          if (res.confirm) {
            Taro.setClipboardData({ data: jsonData });
            Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
          }
        },
      });
    } catch (err) {
      Taro.showToast({ title: '导出失败', icon: 'none' });
    }
  };

  const handleHotline = () => {
    Taro.makePhoneCall({ phoneNumber: HOTLINE_NUMBER });
  };

  const handleUserAgreement = () => {
    Taro.showModal({
      title: '用户协议',
      content: '星寰海是一款情绪健康管理工具，致力于帮助用户消减情绪痛苦。使用本应用即表示您同意遵守相关法律法规，不利用本应用从事违法违规活动。本应用提供的所有内容仅供参考，不构成医疗诊断或治疗建议。如有严重心理问题，请及时寻求专业帮助。',
      showCancel: false,
    });
  };

  const handlePrivacyPolicy = () => {
    Taro.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私。您的情绪数据仅存储在您的设备上，云端备份采用加密存储。我们不会读取您的私人内容，也不会将您的数据出售给任何第三方。您可以随时一键删除所有记录。',
      showCancel: false,
    });
  };

  return (
    <View className='settings-page'>
      <View className='settings-section'>
        <View className='section-title'>
          <Text>通知设置</Text>
        </View>
        <View className='settings-card'>
          <View className='settings-item'>
            <View className='item-left'>
              <Text className='item-label'>跟进推送</Text>
              <Text className='item-desc'>急救后第二天跟进提醒</Text>
            </View>
            <Switch
              checked={notification.enabled}
              onChange={(e) => handleNotificationSwitch(e.detail.value)}
              color='#7c4dff'
            />
          </View>
          {notification.enabled && (
            <View className='settings-item' onClick={() => setTimePickerVisible(true)}>
              <View className='item-left'>
                <Text className='item-label'>推送时间</Text>
                <Text className='item-desc'>{TIME_OPTIONS[selectedTimeIndex].label}</Text>
              </View>
              <Text className='item-arrow'>›</Text>
              {timePickerVisible && (
                <Picker
                  mode='selector'
                  range={TIME_OPTIONS.map((t) => t.label)}
                  value={selectedTimeIndex}
                  onChange={handleTimeChange}
                  onCancel={() => setTimePickerVisible(false)}
                >
                  <View />
                </Picker>
              )}
            </View>
          )}
        </View>
      </View>

      <View className='settings-section'>
        <View className='section-title'>
          <Text>隐私设置</Text>
        </View>
        <View className='settings-card'>
          <View className='settings-item' onClick={handleClearMoodData}>
            <View className='item-left'>
              <Text className='item-label'>清除情绪记录</Text>
            </View>
            <Text className='item-arrow danger'>清除</Text>
          </View>
          <View className='settings-item' onClick={handleClearEmergencyData}>
            <View className='item-left'>
              <Text className='item-label'>清除急救记录</Text>
            </View>
            <Text className='item-arrow danger'>清除</Text>
          </View>
          <View className='settings-item' onClick={handleClearTreeholeData}>
            <View className='item-left'>
              <Text className='item-label'>清除树洞记录</Text>
            </View>
            <Text className='item-arrow danger'>清除</Text>
          </View>
          <View className='settings-item' onClick={handleExportData}>
            <View className='item-left'>
              <Text className='item-label'>导出数据</Text>
              <Text className='item-desc'>导出为 JSON 格式</Text>
            </View>
            <Text className='item-arrow'>›</Text>
          </View>
          <View className='settings-item danger-item' onClick={handleClearAllData}>
            <View className='item-left'>
              <Text className='item-label danger'>清除所有数据</Text>
            </View>
            <Text className='item-arrow danger'>清除</Text>
          </View>
        </View>
      </View>

      <View className='settings-section'>
        <View className='section-title'>
          <Text>关于</Text>
        </View>
        <View className='settings-card'>
          <View className='settings-item'>
            <View className='item-left'>
              <Text className='item-label'>版本号</Text>
            </View>
            <Text className='item-value'>{APP_VERSION}</Text>
          </View>
          <View className='settings-item' onClick={handleHotline}>
            <View className='item-left'>
              <Text className='item-label'>心理援助热线</Text>
            </View>
            <Text className='item-value link'>{HOTLINE_NUMBER}</Text>
          </View>
          <View className='settings-item' onClick={handleUserAgreement}>
            <View className='item-left'>
              <Text className='item-label'>用户协议</Text>
            </View>
            <Text className='item-arrow'>›</Text>
          </View>
          <View className='settings-item' onClick={handlePrivacyPolicy}>
            <View className='item-left'>
              <Text className='item-label'>隐私政策</Text>
            </View>
            <Text className='item-arrow'>›</Text>
          </View>
        </View>
      </View>

      {isLoading && (
        <View className='loading-overlay'>
          <Text className='loading-text'>处理中...</Text>
        </View>
      )}
    </View>
  );
}
