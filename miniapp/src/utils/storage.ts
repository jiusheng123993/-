// 星寰海 v2.0 - 本地存储工具（小程序适配）
import Taro from '@tarojs/taro';

const STORAGE_PREFIX = 'xhh_';

/** 安全读取本地存储 */
export function getStorage<T>(key: string): T | null {
  try {
    const raw = Taro.getStorageSync(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 安全读取本地存储（返回数组，空数组作为默认值） */
export function getStorageArray<T>(key: string): T[] {
  const result = getStorage<T[]>(key);
  return result || [];
}

/** 安全写入本地存储 */
export function setStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    console.error('[Storage] 写入失败:', key);
  }
}

/** 删除本地存储 */
export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(STORAGE_PREFIX + key);
  } catch {
    console.error('[Storage] 删除失败:', key);
  }
}

/** 清空所有星寰海相关存储 */
export function clearAllStorage(): void {
  try {
    const keys = Taro.getStorageInfoSync().keys;
    keys.forEach(k => {
      if (k.startsWith(STORAGE_PREFIX)) {
        Taro.removeStorageSync(k);
      }
    });
  } catch {
    console.error('[Storage] 清空失败');
  }
}
