// 星寰海 v2.0 - API服务层
import Taro from '@tarojs/taro';

const BASE_URL = 'https://your-supabase-project.supabase.co';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  header?: Record<string, string>;
}

/** 通用请求封装 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, header = {} } = options;

  const token = Taro.getStorageSync('xhh_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    ...header
  };

  try {
    const res = await Taro.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header: headers
    });

    if (res.statusCode === 200 || res.statusCode === 201) {
      return res.data as T;
    } else if (res.statusCode === 401) {
      Taro.removeStorageSync('xhh_token');
      Taro.navigateTo({ url: '/pages/login/index' });
      throw new Error('未授权，请重新登录');
    } else {
      throw new Error(`API错误: ${res.statusCode}`);
    }
  } catch (err) {
    console.error('[API] 请求失败:', path, err);
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', data }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PUT', data }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
