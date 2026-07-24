/**
 * 日志脱敏工具 - 防止日志注入攻击
 *
 * 安全规则：
 * 1. 所有从用户输入获取的字符串在写入日志前必须经过 sanitizeLog()
 * 2. 换行符（\n \r）必须替换，防止日志伪造（Log Forging）
 * 3. 控制字符必须过滤，防止终端逃逸攻击
 * 4. 敏感数据（token、密码、密钥）必须脱敏为 ****
 */

const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const NEWLINE_PATTERN = /\r?\n|\r/g;
const MULTI_SPACE_PATTERN = /\s{3,}/g;

/**
 * 对用户输入进行日志脱敏
 * - 替换换行符为空格（防止日志伪造）
 * - 删除控制字符（防止终端逃逸）
 * - 合并多余空格
 */
export function sanitizeLog(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }

  const str = typeof input === 'string' ? input : String(input);

  return str
    .replace(NEWLINE_PATTERN, ' ')
    .replace(CONTROL_CHAR_PATTERN, '')
    .replace(MULTI_SPACE_PATTERN, ' ')
    .trim();
}

/**
 * 对错误对象进行脱敏，保留错误类型和脱敏后的消息
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${sanitizeLog(error.message)}`;
  }
  return sanitizeLog(error);
}

/**
 * 脱敏敏感字符串 - 只保留前 4 位和后 4 位
 */
export function maskSensitive(value: string): string {
  if (!value || value.length <= 8) {
    return '****';
  }
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

/**
 * 脱敏 URL 中的查询参数值（不修改原始 URL，仅用于日志）
 */
export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.search) {
      u.search = '***';
    }
    return u.toString();
  } catch {
    return sanitizeLog(url);
  }
}
