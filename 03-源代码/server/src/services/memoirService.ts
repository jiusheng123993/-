/**
 * 回忆录业务服务层 - 编排回忆录任务的核心业务逻辑
 * 职责：
 *   1. 归属校验（防越权）
 *   2. 并发检查（同一宠物同时只能有一个 pending/processing 任务）
 *   3. 档位定价校验（2026-09-09 三档体系：视频类一律付费，会员享价差，无免费次数）
 *   4. 照片数量与时长校验（按档位 MEMOIR_TIER_CONFIG）
 *   5. 任务创建（status='pending'，由 memoirProcessor 异步消费）
 *   6. 状态查询、列表分页、删除约束、预览获取
 *
 * 安全约束：
 *   - 同一宠物禁止并发生成
 *   - 会员过期视为非会员
 *   - 档位校验在 service 层强制执行，不依赖前端
 */
import { MemoirRepository, type MemoirRecordRow } from '../repositories/memoirRepository.js';
import { refundMemoirOrder } from './memoirRefundService.js';
import { PetRepository } from '../repositories/petRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import {
  PRODUCT_LINE_CONFIG,
  mapTierToGenerationLine,
  resolveMemoirTier,
  validateTierPhotoCount,
  validateTierDuration,
} from './videoGenerationService.js';
import { MEMOIR_TIER_CONFIG, MEMOIR_TIER_PRICES, type MemoirTier } from '../config.js';

/** 回忆录任务响应（创建/状态查询） */
export interface MemoirTaskResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimated_wait_seconds: number;
  /** 生成完成后的视频地址（completed 时存在） */
  video_url: string | null;
  /** 生成完成后的预览地址（completed 时存在） */
  preview_url: string | null;
  created_at: string;
  /** 剧本确认闸门（立项 v0.2 P0-2）：true=分镜已生成、等待用户确认后才烧视频成本 */
  awaiting_confirmation?: boolean;
  /** 待确认的分镜脚本（awaiting_confirmation=true 时存在，供前端预览渲染） */
  script?: Record<string, unknown> | null;
}

/** 创建回忆录请求参数 */
export interface CreateMemoirInput {
  memoir_type: string;
  /** 档位（2026-09-09 三档体系，可选；缺省按 memoir_type 历史规则回退） */
  tier?: string;
  source_photos: string[];
  source_text?: string;
  music_style?: string;
  duration?: number;
  style_preset?: string;
  /**
   * 回忆标签（F4：记忆驱动回忆录）
   * 用户选标签（如 milestone/daily_joy/farewell），分镜生成时按标签筛核心层记忆作素材
   */
  tags?: string[];
  /**
   * 勾选记忆（G2：用户从时光线勾选的真实回忆 ID）
   * 仅勾选的回忆进入旁白锚定；不勾则走【无记忆约束】只写照片可见事实
   */
  selected_moment_ids?: string[];
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

/** 业务错误码（用于前端区分弹窗逻辑）——QUOTA_EXCEEDED 随免费配额废除（2026-09-09）一并移除 */
export const MEMOIR_ERROR_CODES = {
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
    video_url: record.video_url,
    preview_url: record.preview_url,
    created_at: record.created_at,
    // 剧本确认闸门（立项 v0.2 P0-2）：仅在等待确认时透传脚本，避免常规轮询冗余负载
    awaiting_confirmation:
      record.status === 'pending' && record.awaiting_confirmation === true,
    script:
      record.status === 'pending' && record.awaiting_confirmation === true
        ? ((record.narrative_structure?.script as Record<string, unknown> | undefined) ?? null)
        : undefined,
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
 * 校验档位相关参数（照片数量、时长，按 MEMOIR_TIER_CONFIG）
 * @param data 创建入参（tier 缺省时按 memoir_type 回退）
 * @returns 归一化后的档位
 */
function validateTierParams(data: CreateMemoirInput): MemoirTier {
  const tier = resolveMemoirTier(data.tier, data.memoir_type);

  const photoError = validateTierPhotoCount(tier, data.source_photos.length);
  if (photoError) {
    throw new MemoirError(400, photoError);
  }

  const durationError = validateTierDuration(tier, data.duration ?? null);
  if (durationError) {
    throw new MemoirError(400, durationError);
  }

  return tier;
}

/**
 * 计算档位应付金额（2026-09-09 三档定价体系）
 *
 * 业务规则（用户拍板）：
 *   - 视频类一律付费，会员不再有免费次数（原"日常回忆录会员每月免费 3 次"已废除——
 *     模型换 Seedance 2.0 mini 720p 后成本 ~0.5 元/秒，免费送每位会员月亏 24-36 元）
 *   - 会员享价差：light 18.9 / standard 45 / full 79（元）
 *   - 非会员原价：light 25.9 / standard 59 / full 99（元）
 *
 * @returns 应付金额（分）与档位；金额恒 >0（调用方按 PAYMENT_REQUIRED 引导支付）
 */
function calculateTierPrice(
  tier: MemoirTier,
  userTier: 'member' | 'free',
): number {
  const prices = MEMOIR_TIER_PRICES[tier];
  return userTier === 'member' ? prices.member : prices.free;
}

/**
 * 校验付费要求（三档定价：一律返回 PAYMENT_REQUIRED，金额按档位与会员身份区分）
 *
 * 注意：本函数只负责"告知价格"，实际支付流程由 payment 模块完成
 * （创建 payment_order → 微信支付 → 回调 createMemoirFromPayment）
 */
async function validateMembershipQuota(
  userId: string,
  memoirType: string,
  tier: MemoirTier,
): Promise<void> {
  const userTier = await resolveUserTier(userId);
  const price = calculateTierPrice(tier, userTier);
  const tierName = { light: '轻纪念', standard: '标准回忆录', full: '完整回忆录' }[tier];
  throw new MemoirBusinessError(
    402,
    `${tierName}需付费生成（${userTier === 'member' ? '会员价' : '非会员价'}：${price / 100}元）`,
    MEMOIR_ERROR_CODES.PAYMENT_REQUIRED,
    { price, tier, userTier },
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
  const owns = await petRepository.canAccess(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  // 2. 档位参数校验（照片数/时长按 MEMOIR_TIER_CONFIG；tier 缺省按类型回退）
  const tier = validateTierParams(data);

  // 3. 并发检查
  const activeTask = await memoirRepository.findActiveByPetId(petId);
  if (activeTask) {
    throw new MemoirBusinessError(
      409,
      '该宠物已有正在进行的回忆录任务',
      MEMOIR_ERROR_CODES.CONCURRENT_TASK,
    );
  }

  // 4. 付费校验（三档定价：一律 PAYMENT_REQUIRED，走 payment 模块下单）
  await validateMembershipQuota(userId, data.memoir_type, tier);

  // 5. 解析叙事结构（生成管线按档位映射：light→daily 单段，standard/full→memorial 多段）
  const productLine = mapTierToGenerationLine(tier);
  const narrativeStructure = {
    // 档位落库：memoirProcessor 按此选择生成管线与分镜结构
    tier,
    music_style: data.music_style ?? null,
    duration: data.duration ?? MEMOIR_TIER_CONFIG[tier].defaultDuration,
    style_preset: data.style_preset ?? null,
    // F4：回忆标签（分镜生成时按标签筛核心层记忆）
    tags: Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === 'string') : undefined,
    // G2：勾选记忆（仅勾选的时光线回忆进旁白锚定）
    selected_moment_ids: Array.isArray(data.selected_moment_ids)
      ? data.selected_moment_ids.filter((id) => typeof id === 'string')
      : undefined,
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
 * 支付回调后创建回忆录任务
 *
 * 与 createMemoir 的差异：
 *   - 跳过付费校验（已完成支付，由 payment 模块保证订单有效性）
 *   - 写入 payment_id 关联订单（用于审计和退款关联）
 *   - 仍做归属校验、并发检查、产品线参数校验
 *
 * 安全约束：
 *   - 调用方必须先校验订单状态为 paid 且属于该用户
 *   - payment_id 应在订单已标记 paid 后才传入
 *
 * @param orderId - 支付订单 ID（payment_orders.id）
 * @param userId - 用户 ID
 * @param petId - 宠物 ID
 * @param data - 回忆录创建参数（来自订单的 product_metadata）
 * @throws MemoirError 如果归属/并发/参数校验失败
 * @throws MemoirBusinessError 如果存在并发任务
 */
export async function createMemoirFromPayment(
  orderId: string,
  userId: string,
  petId: string,
  data: CreateMemoirInput,
): Promise<MemoirTaskResponse> {
  // 1. 归属校验（回调上下文已带 userId，但仍需校验 petId 归属）
  const owns = await petRepository.canAccess(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  // 2. 档位参数校验（防止 product_metadata 被篡改；tier 缺省按类型回退）
  const tier = validateTierParams(data);

  // 3. 并发检查（同一宠物同时只能有一个 pending/processing 任务）
  const activeTask = await memoirRepository.findActiveByPetId(petId);
  if (activeTask) {
    throw new MemoirBusinessError(
      409,
      '该宠物已有正在进行的回忆录任务',
      MEMOIR_ERROR_CODES.CONCURRENT_TASK,
    );
  }

  // 4. 解析叙事结构（生成管线按档位映射：light→daily 单段，standard/full→memorial 多段）
  const productLine = mapTierToGenerationLine(tier);
  const narrativeStructure = {
    // 档位落库：memoirProcessor 按此选择生成管线与分镜结构
    tier,
    music_style: data.music_style ?? null,
    duration: data.duration ?? MEMOIR_TIER_CONFIG[tier].defaultDuration,
    style_preset: data.style_preset ?? null,
    // F4：回忆标签（分镜生成时按标签筛核心层记忆）
    tags: Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === 'string') : undefined,
    // G2：勾选记忆（仅勾选的时光线回忆进旁白锚定）
    selected_moment_ids: Array.isArray(data.selected_moment_ids)
      ? data.selected_moment_ids.filter((id) => typeof id === 'string')
      : undefined,
  };

  // 5. 插入任务记录，关联支付订单
  const record = await memoirRepository.insert({
    user_id: userId,
    pet_id: petId,
    memoir_type: data.memoir_type,
    status: 'pending',
    source_photos: data.source_photos,
    source_text: data.source_text ?? null,
    narrative_structure: JSON.stringify(narrativeStructure),
    payment_id: orderId,
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
  const owns = await petRepository.canAccess(petId, userId);
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
 * 用户确认分镜脚本（立项 v0.2 P0-2 剧本确认闸门）
 * 确认后任务释放回生成队列，处理器下次轮询领取并直接进入视频生成（此时才发生 Seedance 成本）
 * @throws MemoirError 404 宠物/任务不存在；409 任务不在等待确认状态（含已确认/已过期）
 */
export async function confirmMemoirScript(
  userId: string,
  petId: string,
  memoirId: string,
): Promise<void> {
  const owns = await petRepository.canAccess(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  const confirmed = await memoirRepository.confirmScript(memoirId, userId);
  if (!confirmed) {
    throw new MemoirError(409, '任务不在等待确认状态，请刷新后查看最新进度');
  }
}

/**
 * 用户拒绝分镜脚本（立项 v0.2 P0-2 剧本确认闸门）
 * 拒绝发生在视频生成之前，Seedance 成本未发生；任务置为 failed 终态，用户可另建新任务
 * @throws MemoirError 404 宠物/任务不存在；409 任务不在等待确认状态
 */
export async function rejectMemoirScript(
  userId: string,
  petId: string,
  memoirId: string,
): Promise<void> {
  const owns = await petRepository.canAccess(petId, userId);
  if (!owns) {
    throw new MemoirError(404, '宠物不存在');
  }

  const rejected = await memoirRepository.rejectScript(memoirId, userId);
  if (!rejected) {
    throw new MemoirError(409, '任务不在等待确认状态，请刷新后查看最新进度');
  }

  // 退款闭环（审查⏳3）：用户放弃剧本 = 任务终止且未消耗视频成本，
  // 付费单条（payment_id 非空）应全额退款。失败仅记日志不阻断放弃动作。
  const task = await memoirRepository.findById(memoirId);
  if (task) {
    await refundMemoirOrder(task, '用户放弃生成（剧本未确认），自动退款');
  }
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
  const owns = await petRepository.canAccess(petId, userId);
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
  const owns = await petRepository.canAccess(petId, userId);
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
  const owns = await petRepository.canAccess(petId, userId);
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
