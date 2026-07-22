import Taro from '@tarojs/taro';
import { encrypt, decrypt } from './crypto';

const STORAGE_PREFIX = 'xhh_';
const ENCRYPTED_MARKER = 'enc:';

const SENSITIVE_KEY_PATTERNS: string[] = [
  'health_entries',
  'health_index',
  'health_profile',
  'vaccinations',
  'vaccine_reminders',
  'membership',
  'membership_orders',
  'memory_index',
  'food_queries',
  'checkin_stats',
  'token',
  'refresh_token',
  'user',
];

let encryptionEnabled = true;
let currentUserId = '';

export function setEncryptionEnabled(enabled: boolean): void {
  encryptionEnabled = enabled;
}

export function setStorageUserId(userId: string): void {
  currentUserId = userId;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => key.includes(pattern));
}

export function getStorage<T>(key: string): T | null {
  try {
    const raw = Taro.getStorageSync(STORAGE_PREFIX + key);
    if (!raw) return null;
    if (typeof raw === 'string' && raw.startsWith(ENCRYPTED_MARKER)) {
      if (!currentUserId) return null;
      const decrypted = decrypt(raw.slice(ENCRYPTED_MARKER.length), currentUserId);
      if (!decrypted) return null;
      return JSON.parse(decrypted) as T;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getStorageArray<T>(key: string): T[] {
  const result = getStorage<T[]>(key);
  return result || [];
}

export function setStorage<T>(key: string, value: T): void {
  try {
    const jsonStr = JSON.stringify(value);
    if (encryptionEnabled && currentUserId && isSensitiveKey(key)) {
      const encrypted = encrypt(jsonStr, currentUserId);
      Taro.setStorageSync(STORAGE_PREFIX + key, ENCRYPTED_MARKER + encrypted);
    } else {
      Taro.setStorageSync(STORAGE_PREFIX + key, jsonStr);
    }
  } catch {
  }
}

export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(STORAGE_PREFIX + key);
  } catch {
  }
}

export function clearAllStorage(): void {
  try {
    const keys = Taro.getStorageInfoSync().keys;
    keys.forEach(k => {
      if (k.startsWith(STORAGE_PREFIX)) {
        Taro.removeStorageSync(k);
      }
    });
  } catch {
  }
}
