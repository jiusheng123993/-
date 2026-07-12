// 星寰海 v2.0 - 登录页
import { View, Text, Image } from '@tarojs/components';
import { useAuth } from '../../hooks/useAuth';
import './index.scss';

export default function Login() {
  const { loading, error, login, clearError } = useAuth();

  const handleWechatLogin = async () => {
    await login();
  };

  return (
    <View className='login-page'>
      {/* 顶部装饰 */}
      <View className='login-header'>
        <View className='logo-container'>
          <Image
            className='logo'
            src='https://via.placeholder.com/120x120/4A90D9/FFFFFF?text=星寰海'
            mode='aspectFit'
          />
        </View>
        <Text className='app-name'>星寰海</Text>
        <Text className='app-slogan'>让每一次旅行都成为美好回忆</Text>
      </View>

      {/* 登录按钮区域 */}
      <View className='login-body'>
        {/* 错误提示 */}
        {error && (
          <View className='error-message' onClick={clearError}>
            <Text className='error-text'>{error}</Text>
          </View>
        )}

        {/* 微信登录按钮 */}
        <View
          className='wechat-login-btn'
          onClick={handleWechatLogin}
        >
          {loading ? (
            <View className='loading-indicator'>
              <View className='loading-spinner' />
              <Text className='loading-text'>正在登录...</Text>
            </View>
          ) : (
            <View className='btn-content'>
              <Image
                className='wechat-icon'
                src='https://via.placeholder.com/24x24/07C160/FFFFFF?text=W'
                mode='aspectFit'
              />
              <Text className='btn-text'>微信登录</Text>
            </View>
          )}
        </View>

        {/* 用户协议 */}
        <View className='agreement'>
          <Text className='agreement-text'>
            登录即表示同意
            <Text className='link'>《用户服务协议》</Text>
            和
            <Text className='link'>《隐私政策》</Text>
          </Text>
        </View>
      </View>

      {/* 底部信息 */}
      <View className='login-footer'>
        <Text className='footer-text'>© 2025 星寰海 All Rights Reserved</Text>
      </View>
    </View>
  );
}
