/**
 * 回忆录业务服务层 - 编排回忆录任务的核心业务逻辑
 * 职责：
 *   1. 归属校验（防越权）
 *   2. 并发检查（同一宠物同时只能有一个 pending/processing 任务）
 *   3. 会员配额校验（日常回忆录会员每月免费 3 次；纪念Vlog 会员 99 元/次，非会员 149 元/次）
 *   4. 照片数量与时长校验（与 videoGenerationService 产品线配置一致）
 *   5. 任务创建（status='pending'，由 memoirProcessor 异步消费）
 *   6. 状态查询、列表分页、删除约束、预览获取
 *
 * 安全约束：
 *   - 同一宠物禁止并发生成
 *   - 会员过期视为非会员
 *   - 配额校验在 service 层强制执行，不依赖前端
 */
import { MemoirRepository, type MemoirRecordRow } from '../repositories/memoirRepository.js';
import { PetRepository } from '../repositories/petRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import {
  PRODUCT_LINE_CONFIG,
  mapMemoirTypeToProductLine,
  validatePhotoCount,
  validateDuration,
} from './videoGenerationService.js';

/** 回忆录任务响应（创建/状态查询） */
export interface MemoirTaskResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimated_wait_seconds: number;
  created_at: string;
}

/** 创建回忆录请求参数 */
export interface CreateMemoirInput {
  memoir_type: string;
  source_photos: string[];
  source_text?: string;
  music_style?: string;
  duration?: number;
  style_preset?: string;
}

/** 业务错误（带状态码，供路由层捕获） */
export class MemoirError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'MemoirError';
  }
}

/** 会员配额相关常量（与 PRD 一致） */
const DAILY_MEMOIR_MEMBER_MONTHLY_LIMIT = 3;

/** 业务错误码（用于前端区分弹窗逻辑） */
export const MEMOIR_ERROR_CODES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  CONCURRENT_TASK: 'CONCURRENT_TASK',
} as const;

/** 业务错误（带错误码，供前端区分处理） */
export class MemoirBusinessError extends MemoirError {
  constructor(
    statusCode: number,
    message: string,
    public code: string,
    public extra?: Record<string, unknown>,
  ) {
    super(statusCode, message);
    this.name = 'MemoirBusinessError';
  }
}

const memoirRepository = new MemoirRepository();
const petRepository = new PetRepository();
const membershipRepository = new MembershipRepository();

/** 默认预估等待时间（秒） */
const DEFAULT_ESTIMATED_WAIT = 60;

/**
 * 构建任务响应
 */
function buildTaskResponse(record: MemoirRecordRow): MemoirTaskResponse {
  const progressMap: Record<string, number> = {
    pending: 0,
    processing: 50,
    completed: 100,
    failed: 0,
  };
  return {
    id: record.id,
    status: record.status as MemoirTaskResponse['status'],
    progress: progressMap[record.status] ?? 0,
    estimated_wait_seconds: record.status === 'completed' ? 0 : DEFAULT_ESTIMATED_WAIT,
    created_at: record.created_at,
  };
}

/**
 * 判断用户当前是否为有效会员（status=active 且未过期）
 * @returns 会员等级：'member' | 'free'
 */
async function resolveUserTier(userId: string): Promise<'member' | 'free'> {
  const membership = await membershipRepository.findTierAndStatus(userId);
  if (!membership) return 'free';

  // 过期判断
  if (membership.status !== 'active') return 'free';
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return 'free';
  }
  return membership.tier === 'member' ? 'member' : 'free';
}

/**
 * 获取当前月份字符串（YYYY-MM）
 */
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 校验产品线相关参数（照片数量、时长）
 * 与 videoGenerationService 的产品线配置保持一致
 */
function validateProductLineParams(data: CreateMemoirInput): void {
  const productLine = mapMemoirTypeToProductLine(data.memoir_type);

  const photoError = validatePhotoCount(productLine, data.source_photos.length);
  if (photoError) {
    throw new MemoirError(400, photoError);
  }

  const durationError = validateDuration(productLine, data.duration ?? null);
  if (durationError) {
    throw new MemoirError(400, durationError);
  }
}

/**
 * 校验会员配额与付费要求
 *
 * 业务规则（与 PRD 一致）：
 *   - 日常回忆录（daily/seasonal/milestone/custom）：
 *       · 会员：每月免费 3 次，超出后需付费（9.9 元/次）
 *       · 非会员：需付费（9.9 元/次）
 *   - 纪念Vlog（memorial）：
 *       · 会员：99 元/次
 *       · 非会员：149 元/次
 *
 * 当前实现：
 *   - 会员的日常回忆录在月度配额内直接放行
 *   - 其他场景（超出配额、非会员、纪念Vlog）抛出 PAYMENT_REQUIRED
 *   - 实际支付流程由后续迭代接入（创建 payment_order 后再创建任务）
 */
async function validateMembershipQuota(
  userId: string,
  memoirType: string,
): Promise<void> {
  const tier = await resolveUserTier(userId);
  const productLine = mapMemoirTypeToProductLine(memoirType);

  // 纪念Vlog：会员/非会员均需付费
  if (productLine === 'memorial') {
    const price = tier === 'member' ? 9900 : 14900; // 单位：分
    throw new MemoirBusinessError(
      402,
      `纪念Vlog需付费生成（${tier === 'member' ? '会员价' : '非会员价'}：${price / 100}元）`,
      MEMOIR_ERROR_CODES.PAYMENT_REQUIRED,
      { price, productLine: 'memorial', tier },
    );
  }

  // 日常回忆录：会员每月免费 3 次
  if (tier === 'member') {
    const yearMonth = getCurrentYearMonth();
    const usedCount = await memoirRepository.countMonthlyDailyMemoirsByUser(userId, yearMonth);
    if (usedCount >= DAILY_MEMOIR_MEMBER_MONTHLY_LIMIT) {
      // 超出免费配额，需付费 9.9 元/次
      throw new MemoirBusinessError(
        402,
        `本月免费配额已用完（${DAILY_MEMOIR_MEMBER_MONTHLY_LIMIT}次），超出需付费 9.9 元/次`,
        MEMOIR_ERROR_CODES.PAYMENT_REQUIRED,
        { price: 990, productLine: 'daily', tier, usedCount, limit: DAILY_MEMOIR_MEMBER_MONTHLY_LIMIT },
      );
    }
    return;
  }

  // 非会员日常回忆录：需付费 9.9 元/次
  throw new MemoirBusinessError(
    402,
    '非会员日常回忆录需付费 9.9 元/次',
    MEMOIR_ERROR_CODES.PAYMENT_REQUIRED,
    { price: 990, productLine: 'daily', tier: 'free' },
  );
}

/**
 * 创建回忆录任务
 * - 归属校验
 * - 产品线参数校验（照片数量、时长）
 * - 并发检查（同一宠物同时只能有一个 pending/processing 任务）
 * - 会员配额与付费校验
 * - 插入记录 status='pending'
 */
export async function createMemoir(
  userId: string,
  petId: string,
  data: CreateMemoirInput,
): Promise<MemoirTaskResponse> {
  // 1. 归属校验
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  // 2. 产品线参数校验（与 videoGenerationService 配置一致）
  validateProductLineParams(data);

  // 3. 并发检查
  const activeTask = await memoirRepository.findActiveByPetId(petId);
  if (activeTask) {
    throw new MemoirBusinessError(
      409,
      '该宠物已有正在进行的回忆录任务',
      MEMOIR_ERROR_CODES.CONCURRENT_TASK,
    );
  }

  // 4. 会员配额与付费校验
  await validateMembershipQuota(userId, data.memoir_type);

  // 5. 解析叙事结构
  const productLine = mapMemoirTypeToProductLine(data.memoir_type);
  const cfg = PRODUCT_LINE_CONFIG[productLine];
  const narrativeStructure = {
    music_style: data.music_style ?? null,
    duration: data.duration ?? cfg.defaultDuration,
    style_preset: data.style_preset ?? null,
  };

  // 6. 插入任务记录
  const record = await memoirRepository.insert({
    user_id: userId,
    pet_id: petId,
    memoir_type: data.memoir_type,
    status: 'pending',
    source_photos: data.source_photos,
    source_text: data.source_text ?? null,
    narrative_structure: JSON.stringify(narrativeStructure),
  });

  return buildTaskResponse(record);
}

/**
 * 查询最新任务状态
 */
export async function getStatus(
  userId: string,
  petId: string,
): Promise<MemoirTaskResponse> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  const latest = await memoirRepository.findLatestByPetId(petId);
  if (!latest) {
    throw new MemoirError(404, '暂无回忆录任务');
  }

  return buildTaskResponse(latest);
}

/**
 * 分页查询回忆录列表
 */
export async function listMemoirs(
  userId: string,
  petId: string,
  page: number,
  pageSize: number,
): Promise<{ list: MemoirRecordRow[]; total: number; page: number; page_size: number }> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  const offset = (page - 1) * pageSize;
  const [list, total] = await Promise.all([
    memoirRepository.findByPetId(petId, pageSize, offset),
    memoirRepository.countByPetId(petId),
  ]);

  return { list, total, page, page_size: pageSize };
}

/**
 * 删除回忆录
 * - pending/processing 状态不允许删除
 */
export async function deleteMemoir(
  userId: string,
  petId: string,
  memoirId: string,
): Promise<void> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  const record = await memoirRepository.findByIdAndUser(memoirId, userId);
  if (!record) {
    throw new MemoirError(404, '回忆录不存在');
  }

  if (record.status === 'pending' || record.status === 'processing') {
    throw new MemoirError(409, '正在生成中的回忆录不允许删除');
  }

  await memoirRepository.deleteById(memoirId);
}

/**
 * 获取预览视频地址
 */
export async function previewMemoir(
  userId: string,
  petId: string,
  memoirId: string,
): Promise<{ preview_url: string }> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  const record = await memoirRepository.findByIdAndUser(memoirId, userId);
  if (!record) {
    throw new MemoirError(404, '回忆录不存在');
  }

  if (!record.preview_url) {
    throw new MemoirError(404, '预览视频尚未生成');
  }

  return { preview_url: record.preview_url };
}
