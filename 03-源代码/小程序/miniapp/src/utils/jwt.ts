// 星寰海 v2.0 - JWT Token 工具函数
import { CryptoJS } from './crypto';

/**
 * 解码 Base64 URL 安全字符串
 */
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(
    CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(base64))
  );
}

/**
 * 解析 JWT Token（不验证签名）
 */
export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  const exp = payload.exp as number;
  return Date.now() >= exp * 1000;
}

/**
 * 获取 Token 过期时间（毫秒）
 */
export function getTokenExpiry(token: string): number | null {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return null;

  return (payload.exp as number) * 1000;
}

/**
 * 检查 Token 是否即将过期（30分钟内）
 */
export function isTokenExpiringSoon(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry - Date.now() < 30 * 60 * 1000; // 30分钟
}

/**
 * 验证 Token 是否有效
 */
export function verifyToken(token: string): boolean {
  if (!token || token.split('.').length !== 3) return false;
  return !isTokenExpired(token);
}