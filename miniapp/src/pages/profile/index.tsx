import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAuthStore } from '../../stores/authStore';
import { useUserStats } from '../../hooks/useUserStats';
import { APP_VERSION, HOTLINE_NUMBER } from '../../constants';
import './index.scss';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const stats = useUserStats();

  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      Taro.navigateTo({ url: '/pages/login/index' });
    }
  };

  const handleSettingsClick = () => {
    Taro.navigateTo({ url: '/packageProfile/pages/settings/index' });
  };

  const handleAboutClick = () => {
    Taro.showModal({
      title: '关于星寰海',
      content: `版本：${APP_VERSION}\n\n星寰海 — 以memory-body引擎为核心，通过事前干预、事后急救、主动陪伴三道防线，帮助用户消减情绪痛苦。\n\n心理援助热线：${HOTLINE_NUMBER}`,
      showCancel: true,
      cancelText: '拨打热线',
      confirmText: '知道了',
      success: (res) => {
        if (res.cancel) {
          Taro.makePhoneCall({ phoneNumber: HOTLINE_NUMBER });
        }
      },
    });
  };

  const handleLogout = async () => {
    const result = await Taro.showModal({
      title: '确认登出',
      content: '登出后需要重新登录才能使用完整功能',
      confirmText: '确认登出',
      cancelText: '取消',
    });

    if (result.confirm) {
      await logout();
      Taro.showToast({ title: '已登出', icon: 'success' });
    }
  };

  return (
    <View className='profile-page'>
      <View className='profile-header'>
        <View className='avatar-section' onClick={handleAvatarClick}>
          {user?.avatarUrl ? (
            <Image className='avatar' src={user.avatarUrl} mode='aspectFill' />
          ) : (
            <View className='avatar-placeholder'>
              <Text className='avatar-icon'>👤</Text>
            </View>
          )}
          <View className='user-info'>
            {isAuthenticated && user?.nickname ? (
              <Text className='nickname'>{user.nickname}</Text>
            ) : (
              <Text className='login-hint'>点击登录</Text>
            )}
          </View>
        </View>
      </View>

      <View className='stats-section'>
        <View className='stats-title'>
          <Text>我的数据</Text>
        </View>
        <View className='stats-grid'>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.usageDays}</Text>
            <Text className='stat-label'>使用天数</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.moodCount}</Text>
            <Text className='stat-label'>情绪记录</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.emergencyCount}</Text>
            <Text className='stat-label'>急救次数</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.treeholeCount}</Text>
            <Text className='stat-label'>树洞互动</Text>
          </View>
        </View>
      </View>

      <View className='menu-section'>
        <View className='menu-item' onClick={handleSettingsClick}>
          <Text className='menu-icon'>⚙️</Text>
          <Text className='menu-text'>设置</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={handleAboutClick}>
          <Text className='menu-icon'>ℹ️</Text>
          <Text className='menu-text'>关于我们</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {isAuthenticated && (
        <View className='logout-section'>
          <View className='logout-btn' onClick={handleLogout}>
            <Text className='logout-text'>退出登录</Text>
          </View>
        </View>
      )}

      <View className='profile-footer'>
        <Text className='footer-text'>星寰海 v{APP_VERSION}</Text>
      </View>
    </View>
  );
}