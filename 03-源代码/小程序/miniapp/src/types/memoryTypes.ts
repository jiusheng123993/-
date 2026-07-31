/**
 * AI 记忆（memory-body）类型定义
 *
 * 对应后端 memoryService.ts 的 MemoryEntry，字段为 camelCase
 * （后端 rowToMemoryEntry 已将数据库 snake_case 转为 camelCase 返回）
 */

/** 记忆分类 */
export type MemoryCategory =
  | 'health'        // 健康相关（症状、体征、趋势）
  | 'behavior'      // 行为习惯（作息、活动）
  | 'habit'         // 日常生活规律
  | 'preference'    // 偏好（喜欢/讨厌的食物、玩具等）
  | 'event'         // 重要事件（就医、生日、旅行）
  | 'feeding'       // 喂养记录模式
  | 'medical'       // 医疗记录（疫苗、手术、用药）
  | 'contradiction' // 矛盾记忆（同一事物有冲突记录）
  | 'general';      // 通用

/** 记忆来源 */
export type MemorySource = 'auto' | 'manual' | 'contradiction_resolved';

/** 记忆状态 */
export type MemoryStatus = 'active' | 'dormant' | 'expired' | 'contradicted';

/** 单条 AI 记忆 */
export interface MemoryEntry {
  id: number;
  userId: string;
  petId: string | null;
  category: MemoryCategory;
  /** 唯一键（英文 snake_case），同一用户+宠物下唯一 */
  key: string;
  /** 记忆内容（用户可编辑纠错） */
  content: string;
  /** 重要性 1-10 */
  importance: number;
  /** 置信度 0-1 */
  confidence: number;
  source: MemorySource;
  /** 证据片段（对话中提取的原文） */
  evidence: string[];
  /** 衰减率 */
  decayRate: number;
  status: MemoryStatus;
  /** 附加元数据 */
  meta: Record<string, unknown>;
}

/** GET /api/memory 响应 data */
export interface MemoryListResponse {
  list: MemoryEntry[];
  total: number;
}

/** PUT /api/memory/:id 请求 body */
export interface MemoryUpdatePayload {
  content: string;
}

/** PUT /api/memory/:id 响应 data */
export interface MemoryUpdateResult {
  id: number;
  content: string;
}
