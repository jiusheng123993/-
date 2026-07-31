/**
 * Zod 参数校验中间件
 * 使用 Zod schema 对请求参数（body/query/params）进行运行时类型校验
 * 所有外部输入必须经过校验，不信任任何前端数据
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import type { ZodIssue } from 'zod';

/** 校验目标位置 */
type ValidationTarget = 'body' | 'query' | 'params';

/** 校验配置 */
interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * 创建参数校验中间件
 * @param options - 各位置的 Zod schema
 * @returns Express 中间件
 *
 * @example
 * router.post('/pets', validate({ body: createPetSchema }), petController.create);
 */
export function validate(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const target of ['body', 'query', 'params'] as ValidationTarget[]) {
      const schema = options[target];
      if (!schema) continue;

      const result = schema.safeParse(req[target]);
      if (!result.success) {
        const zodError = result.error as ZodError;
        const issues: ZodIssue[] = zodError.issues;
        const fieldErrors = issues.map((err: ZodIssue) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        errors.push(...fieldErrors);
      } else {
        // 用校验后的数据替换原始数据（剥离多余字段，类型转换）
        req[target] = result.data;
      }
    }

    if (errors.length > 0) {
      // message 包含第一个错误的字段名和具体提示，便于前端定位和测试断言
      const firstError = errors[0] ?? '参数校验失败';
      res.status(400).json({
        success: false,
        code: '100001',
        message: firstError,
        errors,
      });
      return;
    }

    next();
  };
}
