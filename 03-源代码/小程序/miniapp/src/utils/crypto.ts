import CryptoJS from 'crypto-js';

const APP_SALT = 'xhh-v2-aes-salt-2026';

function deriveKey(userId: string): string {
  return CryptoJS.SHA256(APP_SALT + ':' + userId).toString();
}

export function encrypt(data: string, userId: string): string {
  const key = deriveKey(userId);
  return CryptoJS.AES.encrypt(data, key).toString();
}

export function decrypt(encrypted: string, userId: string): string {
  try {
    const key = deriveKey(userId);
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export { CryptoJS };
