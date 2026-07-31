/**
 * 请求日志中间件
 * 记录每个 API 请求的方法、路径、状态码、耗时
 * 敏感参数自动脱敏，不记录 password/token 等字段
 */
import type { Request, Response, NextFunction } from 'express';

/** 需要脱敏的字段名（小写匹配） */
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization', 'apikey'];

/** 脱敏对象中的敏感字段 */
function sanitize(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data;
  const obj = data as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '***';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/** 请求日志中间件 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const { method, path, ip } = req;

  // 响应完成后记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    const logData = {
      method,
      path,
      ip,
      statusCode,
      duration: `${duration}ms`,
      userId: req.userId || '-',
      query: sanitize(req.query),
    };

    if (logLevel === 'error') {
      console.error('[API]', JSON.stringify(logData));
    } else if (logLevel === 'warn') {
      console.warn('[API]', JSON.stringify(logData));
    } else {
      console.log('[API]', JSON.stringify(logData));
    }
  });

  next();
}
