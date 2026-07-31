/**
 * 分享卡片业务服务层 - 编排分享卡片的核心业务逻辑
 * 职责：生成卡片、分页列表、详情查询、删除卡片、记录分享行为
 * 所有操作基于 user_id 做归属校验，防止跨用户越权访问
 * 骨架阶段：card_url 使用 mock URL，card_data 存储请求的 source_data 和 style
 */
import crypto from 'crypto';
import {
  ShareCardRepository,
  type ShareCardRow,
} from '../repositories/shareCardRepository.js';

/** 生成卡片的 source_data 输入 */
export interface ShareCardSourceData {
  report_id?: string;
  memoir_id?: string;
  pet_id?: string;
  milestone_id?: string;
  snapshot_id?: string;
  name_history_id?: string;
  feed_id?: string;
  custom_text?: string;
  custom_photos?: string[];
}

/** 生成卡片的 style 输入 */
export interface ShareCardStyle {
  theme?: 'warm' | 'elegant' | 'cute' | 'minimal';
  background_color?: string;
  font_family?: string;
}

/** 生成卡片请求参数 */
export interface GenerateShareCardInput {
  card_type: string;
  source_data: ShareCardSourceData;
  style?: ShareCardStyle;
}

/** 分页查询参数 */
export interface ShareCardQueryInput {
  page: number;
  page_size: number;
  card_type?: string;
}

/** 分页列表响应 */
export interface ShareCardListResponse {
  items: ShareCardRow[];
  total: number;
  page: number;
  page_size: number;
}

/** 分享渠道类型 */
export type ShareChannel = 'wechat' | 'moments' | 'save' | 'copy';

/** 业务错误（带状态码，供路由层捕获） */
export class ShareCardError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ShareCardError';
  }
}

const shareCardRepository = new ShareCardRepository();

/**
 * 构建 mock card_data（骨架阶段不实现真实卡片渲染）
 * 结构包含 title/content/style/source_data/generated_at
 */
function buildMockCardData(
  cardType: string,
  sourceData: ShareCardSourceData,
  style?: ShareCardStyle,
): Record<string, unknown> {
  return {
    title: `${cardType} 卡片`,
    content: sourceData.custom_text || '分享我的宠物生活',
    style: style || { theme: 'warm' },
    source_data: sourceData,
    generated_at: new Date().toISOString(),
  };
}

/**
 * 生成分享卡片
 * - 构造 mock card_data
 * - 构造 mock card_url（用 crypto.randomUUID() 生成唯一 id）
 * - 插入记录，share_count=0, share_channel=null
 */
export async function generateCard(
  userId: string,
  data: GenerateShareCardInput,
): Promise<ShareCardRow> {
  const cardId = crypto.randomUUID();
  const cardData = buildMockCardData(data.card_type, data.source_data, data.style);
  const cardUrl = `https://placeholder.example.com/card/${cardId}.png`;

  return shareCardRepository.insertCard({
    user_id: userId,
    card_type: data.card_type,
    card_data: cardData,
    card_url: cardUrl,
    share_channel: null,
    share_count: 0,
  });
}

/**
 * 分页查询用户卡片列表
 * - 查询列表 + 总数（并行）
 */
export async function listCards(
  userId: string,
  query: ShareCardQueryInput,
): Promise<ShareCardListResponse> {
  const [items, total] = await Promise.all([
    shareCardRepository.findByUserId(
      userId,
      query.page,
      query.page_size,
      query.card_type,
    ),
    shareCardRepository.countByUserId(userId, query.card_type),
  ]);

  return {
    items,
    total,
    page: query.page,
    page_size: query.page_size,
  };
}

/**
 * 获取卡片详情
 * - findByIdAndUser，不存在或不属于当前用户均返回 404
 */
export async function getCard(
  userId: string,
  cardId: string,
): Promise<ShareCardRow> {
  const card = await shareCardRepository.findByIdAndUser(cardId, userId);
  if (!card) {
    throw new ShareCardError(404, '卡片不存在');
  }
  return card;
}

/**
 * 删除卡片
 * - findByIdAndUser，不存在或不属于当前用户均返回 404
 * - 删除记录
 */
export async function deleteCard(
  userId: string,
  cardId: string,
): Promise<void> {
  const card = await shareCardRepository.findByIdAndUser(cardId, userId);
  if (!card) {
    throw new ShareCardError(404, '卡片不存在');
  }
  await shareCardRepository.deleteById(cardId);
}

/**
 * 记录分享行为
 * - findByIdAndUser，不存在或不属于当前用户均返回 404
 * - share_count + 1 并更新 share_channel
 * - 返回更新后的卡片
 */
export async function recordShare(
  userId: string,
  cardId: string,
  channel: ShareChannel,
): Promise<ShareCardRow> {
  const card = await shareCardRepository.findByIdAndUser(cardId, userId);
  if (!card) {
    throw new ShareCardError(404, '卡片不存在');
  }

  const updated = await shareCardRepository.incrementShareCount(cardId, userId, channel);
  if (!updated) {
    // 理论上不会发生（前面已校验归属），作为并发兜底
    throw new ShareCardError(404, '卡片不存在');
  }
  return updated;
}
