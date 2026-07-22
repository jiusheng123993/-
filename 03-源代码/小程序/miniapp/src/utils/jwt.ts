import { CryptoJS } from './crypto';

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(
    CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(base64))
  );
}

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

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  const exp = payload.exp as number;
  return Date.now() >= exp * 1000;
}

export function getTokenExpiry(token: string): number | null {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return null;

  return (payload.exp as number) * 1000;
}

export function isTokenExpiringSoon(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry - Date.now() < 30 * 60 * 1000;
}

export function isTokenFormatValid(token: string): boolean {
  if (!token || token.split('.').length !== 3) return false;
  return !isTokenExpired(token);
}

/** @deprecated Use isTokenFormatValid for local checks or validateTokenWithServer for security-critical operations */
export const verifyToken = isTokenFormatValid;

export async function validateTokenWithServer(token: string): Promise<boolean> {
  if (!isTokenFormatValid(token)) return false;

  try {
    const supabaseUrl = (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_URL;
    if (!supabaseUrl) return isTokenFormatValid(token);

    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_KEY || '',
      },
    });

    return res.ok;
  } catch {
    return isTokenFormatValid(token);
  }
}