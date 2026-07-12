// 星寰海 v2.0 - 加密工具（AES-256）
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'xinghuanhai-v2-secret-key-2026';

/** AES加密 */
export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

/** AES解密 */
export function decrypt(encrypted: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

/** 生成唯一ID */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
