/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误，返回标准化的错误响应格式
 */
import type { Request, Response, NextFunction } from 'express';

/** 应用错误类型 - 包含状态码和错误码 */
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? '服务器内部错误' : err.message;

  if (statusCode === 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.code ? { code: err.code } : {}),
  });
}
