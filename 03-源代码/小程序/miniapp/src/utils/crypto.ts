import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256';
import Utf8 from 'crypto-js/enc-utf8';
import Base64 from 'crypto-js/enc-base64';

function getAppSalt(): string {
  const salt = (process.env as Record<string, string | undefined>).TARO_APP_CRYPTO_SALT
  if (!salt) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TARO_APP_CRYPTO_SALT 环境变量未配置，生产环境必须设置')
    }
    return 'xhh-v2-aes-salt-2026-dev'
  }
  return salt
}

function deriveKey(userId: string): string {
  return SHA256(getAppSalt() + ':' + userId).toString();
}

export function encrypt(data: string, userId: string): string {
  const key = deriveKey(userId);
  return AES.encrypt(data, key).toString();
}

export function decrypt(encrypted: string, userId: string): string {
  try {
    const key = deriveKey(userId);
    const bytes = AES.decrypt(encrypted, key);
    return bytes.toString(Utf8);
  } catch {
    return '';
  }
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const CryptoJS = { AES, SHA256, enc: { Utf8, Base64 } } as const;
