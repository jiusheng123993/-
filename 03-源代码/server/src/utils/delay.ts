/**
 * 延迟工具 - 返回在指定毫秒后 resolve 的 Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
