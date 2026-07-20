import Taro from '@tarojs/taro';

const BASE_URL = process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000/api';

const MAX_RETRY = 3;
const RETRY_DELAY_BASE = 1000;
const REQUEST_TIMEOUT = 15000;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  header?: Record<string, string>;
  retry?: number;
}

const pendingRequests = new Map<string, Promise<unknown>>();

function getRequestKey(path: string, options: RequestOptions): string {
  return `${options.method || 'GET'}:${path}:${JSON.stringify(options.data || '')}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, header = {}, retry = 0 } = options;

  const requestKey = getRequestKey(path, options);
  if (method === 'GET' && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<T>;
  }

  const token = Taro.getStorageSync('xhh_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...header
  };

  const requestPromise = (async (): Promise<T> => {
    try {
      const res = await Taro.request({
        url: `${BASE_URL}${path}`,
        method,
        data,
        header: headers,
        timeout: REQUEST_TIMEOUT
      });

      if (res.statusCode === 200 || res.statusCode === 201) {
        return res.data as T;
      } else if (res.statusCode === 401) {
        Taro.removeStorageSync('xhh_token');
        Taro.removeStorageSync('xhh_refresh_token');
        Taro.navigateTo({ url: '/pages/login/index' });
        throw new Error('未授权，请重新登录');
      } else if (res.statusCode === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (res.statusCode >= 500) {
        if (retry < MAX_RETRY) {
          await delay(RETRY_DELAY_BASE * Math.pow(2, retry));
          return request<T>(path, { ...options, retry: retry + 1 });
        }
        throw new Error(`服务器错误: ${res.statusCode}`);
      } else {
        const errMsg = res.data?.message || res.data?.error || `API错误: ${res.statusCode}`;
        throw new Error(typeof errMsg === 'string' ? errMsg : `API错误: ${res.statusCode}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('request:fail')) {
        if (retry < MAX_RETRY) {
          await delay(RETRY_DELAY_BASE * Math.pow(2, retry));
          return request<T>(path, { ...options, retry: retry + 1 });
        }
        throw new Error('网络连接失败，请检查网络设置');
      }
      throw err;
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  if (method === 'GET') {
    pendingRequests.set(requestKey, requestPromise);
  }

  return requestPromise;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', data }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PUT', data }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
