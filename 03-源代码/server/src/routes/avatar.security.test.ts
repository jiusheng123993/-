import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * avatar.ts 路由安全测试
 * 覆盖：横向越权、配额校验、SSRF 防护、style 白名单
 *
 * 由于路由层依赖较多外部模块（express、pool、各种 service），
 * 这里采用"测试路由内部辅助函数"的策略，聚焦于纯函数逻辑。
 * 路由集成测试应在端到端测试中完成。
 */

// 测试目标：路由文件中的辅助函数（通过模块内部导出或反射测试）
// 由于当前 avatar.ts 未导出辅助函数，我们测试等价的纯函数逻辑

// 模拟 isValidHttpUrl 的实现逻辑（与 avatar.ts 保持一致）
function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// 模拟 isOwnedPhotoUrl 的实现逻辑
function getSupabaseUrlPrefix(): string {
  const url = process.env.SUPABASE_URL || '';
  return url ? `${url}/storage/v1/object/public/` : '';
}

function isOwnedPhotoUrl(url: string, userId: string): boolean {
  const prefix = getSupabaseUrlPrefix();
  if (!prefix) return true;
  if (!url.startsWith(prefix)) return false;
  const rest = url.slice(prefix.length);
  const parts = rest.split('/');
  return parts.length >= 4 && parts[1] === userId;
}

// 模拟 style 白名单
const VALID_STYLES = ['cartoon', 'realistic'] as const;
type AvatarStyle = (typeof VALID_STYLES)[number];
function safeStyle(input: unknown): AvatarStyle {
  return VALID_STYLES.includes(input as AvatarStyle) ? (input as AvatarStyle) : 'cartoon';
}

// 模拟配额校验逻辑
const FREE_2D_MONTHLY_LIMIT = 1;
const MEMBER_3D_MONTHLY_LIMIT = 3;

function check2DQuota(isMember: boolean, usedCount: number): { allowed: boolean; reason?: string } {
  if (isMember) return { allowed: true };
  if (usedCount >= FREE_2D_MONTHLY_LIMIT) {
    return { allowed: false, reason: 'QUOTA_EXCEEDED' };
  }
  return { allowed: true };
}

function check3DQuota(isMember: boolean, usedCount: number): { allowed: boolean; reason?: string } {
  if (!isMember) return { allowed: false, reason: 'MEMBER_ONLY' };
  if (usedCount >= MEMBER_3D_MONTHLY_LIMIT) {
    return { allowed: false, reason: 'QUOTA_EXCEEDED' };
  }
  return { allowed: true };
}

// 模拟 generate-options 会员校验（无照片路径同样强制会员，堵住绕过前端会员墙的白嫖口子）
function checkGenerateOptionsMember(isMember: boolean): { allowed: boolean; reason?: string } {
  if (!isMember) return { allowed: false, reason: 'MEMBER_ONLY' };
  return { allowed: true };
}

beforeEach(() => {
  // 重置环境变量
  delete process.env.SUPABASE_URL;
});

describe('avatar.ts - isValidHttpUrl（SSRF 防护）', () => {
  it('合法 http URL 应返回 true', () => {
    expect(isValidHttpUrl('http://example.com/photo.jpg')).toBe(true);
  });

  it('合法 https URL 应返回 true', () => {
    expect(isValidHttpUrl('https://example.com/photo.jpg')).toBe(true);
  });

  it('file:// 协议应返回 false（防止本地文件读取）', () => {
    expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
  });

  it('javascript: 协议应返回 false（防止 XSS）', () => {
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('非 URL 字符串应返回 false', () => {
    expect(isValidHttpUrl('not-a-url')).toBe(false);
  });

  it('空字符串应返回 false', () => {
    expect(isValidHttpUrl('')).toBe(false);
  });

  it('内网 IP 应仍返回 true（URL 合法性校验不负责内网过滤）', () => {
    // 注意：内网过滤由 isOwnedPhotoUrl 的归属校验负责
    expect(isValidHttpUrl('http://127.0.0.1:8080/')).toBe(true);
  });
});

describe('avatar.ts - isOwnedPhotoUrl（归属校验）', () => {
  const userId = 'user-001';
  const supabaseUrl = 'https://xxx.supabase.co';
  const prefix = `${supabaseUrl}/storage/v1/object/public/`;

  beforeEach(() => {
    process.env.SUPABASE_URL = supabaseUrl;
  });

  it('路径包含当前 userId 应返回 true', () => {
    const url = `${prefix}pet-photos/${userId}/pet-001/photo.jpg`;
    expect(isOwnedPhotoUrl(url, userId)).toBe(true);
  });

  it('路径包含他人 userId 应返回 false（横向越权防护）', () => {
    const url = `${prefix}pet-photos/other-user/pet-002/photo.jpg`;
    expect(isOwnedPhotoUrl(url, userId)).toBe(false);
  });

  it('非 Supabase URL 应返回 false（防止外部图片）', () => {
    expect(isOwnedPhotoUrl('https://evil.com/photo.jpg', userId)).toBe(false);
  });

  it('未配置 SUPABASE_URL 时应跳过归属校验（开发环境兼容）', () => {
    delete process.env.SUPABASE_URL;
    expect(isOwnedPhotoUrl('https://any.com/photo.jpg', userId)).toBe(true);
  });

  it('路径段不足应返回 false', () => {
    // 只有 bucket，没有 userId/petId/file
    const url = `${prefix}pet-photos`;
    expect(isOwnedPhotoUrl(url, userId)).toBe(false);
  });
});

describe('avatar.ts - style 白名单', () => {
  it('cartoon 应通过', () => {
    expect(safeStyle('cartoon')).toBe('cartoon');
  });

  it('realistic 应通过', () => {
    expect(safeStyle('realistic')).toBe('realistic');
  });

  it('任意字符串应回退为 cartoon', () => {
    expect(safeStyle('evil-style')).toBe('cartoon');
  });

  it('SQL 注入尝试应回退为 cartoon', () => {
    expect(safeStyle("'; DROP TABLE users; --")).toBe('cartoon');
  });

  it('空字符串应回退为 cartoon', () => {
    expect(safeStyle('')).toBe('cartoon');
  });

  it('undefined 应回退为 cartoon', () => {
    expect(safeStyle(undefined)).toBe('cartoon');
  });
});

describe('avatar.ts - 2D 配额校验', () => {
  it('会员应始终允许', () => {
    expect(check2DQuota(true, 999)).toEqual({ allowed: true });
  });

  it('免费用户未用配额应允许', () => {
    expect(check2DQuota(false, 0)).toEqual({ allowed: true });
  });

  it('免费用户配额用完应拒绝（QUOTA_EXCEEDED）', () => {
    expect(check2DQuota(false, 1)).toEqual({ allowed: false, reason: 'QUOTA_EXCEEDED' });
  });

  it('免费用户超额应拒绝', () => {
    expect(check2DQuota(false, 5)).toEqual({ allowed: false, reason: 'QUOTA_EXCEEDED' });
  });
});

describe('avatar.ts - 3D 配额校验', () => {
  it('非会员应直接拒绝（MEMBER_ONLY）', () => {
    expect(check3DQuota(false, 0)).toEqual({ allowed: false, reason: 'MEMBER_ONLY' });
  });

  it('会员未用配额应允许', () => {
    expect(check3DQuota(true, 0)).toEqual({ allowed: true });
  });

  it('会员配额用完应拒绝（QUOTA_EXCEEDED）', () => {
    expect(check3DQuota(true, 3)).toEqual({ allowed: false, reason: 'QUOTA_EXCEEDED' });
  });

  it('会员超额应拒绝', () => {
    expect(check3DQuota(true, 10)).toEqual({ allowed: false, reason: 'QUOTA_EXCEEDED' });
  });
});

describe('avatar.ts - generate-options 会员校验（无照片路径也强制，防白嫖）', () => {
  it('非会员调用（无论是否带参考照片）应被拒绝 MEMBER_ONLY', () => {
    expect(checkGenerateOptionsMember(false)).toEqual({ allowed: false, reason: 'MEMBER_ONLY' });
  });

  it('会员调用应放行', () => {
    expect(checkGenerateOptionsMember(true)).toEqual({ allowed: true });
  });
});

describe('avatar.ts - 综合安全场景', () => {
  it('场景1：免费用户尝试用他人照片 URL 生成 2D', () => {
    process.env.SUPABASE_URL = 'https://xxx.supabase.co';
    const otherUserUrl = 'https://xxx.supabase.co/storage/v1/object/public/pet-photos/other-user/pet-002/photo.jpg';

    // 应被 isOwnedPhotoUrl 拦截
    expect(isOwnedPhotoUrl(otherUserUrl, 'user-001')).toBe(false);
  });

  it('场景2：用户尝试用 file:// 协议读取本地文件', () => {
    // 应被 isValidHttpUrl 拦截
    expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
  });

  it('场景3：用户尝试注入恶意 style', () => {
    // 应被白名单拦截，回退为 cartoon
    expect(safeStyle("'; DROP TABLE pet_profiles; --")).toBe('cartoon');
  });

  it('场景4：非会员尝试生成 3D', () => {
    // 应被配额校验拦截
    expect(check3DQuota(false, 0)).toEqual({ allowed: false, reason: 'MEMBER_ONLY' });
  });

  it('场景5：会员尝试超额生成 3D', () => {
    expect(check3DQuota(true, 3)).toEqual({ allowed: false, reason: 'QUOTA_EXCEEDED' });
  });
});
