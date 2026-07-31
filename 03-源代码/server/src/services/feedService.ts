/**
 * 家庭动态墙业务服务层 - 编排家庭动态的核心业务逻辑
 * 职责：家庭归属校验、宠物归属校验、动态发布、编辑、删除、分页列表、精选动态
 * 所有操作前先验证 family_id 属于当前用户，防止跨用户越权
 */
import {
  FeedRepository,
  type FeedRow,
  type FeedWithPetRow,
} from '../repositories/feedRepository.js';
import { FamilyRepository } from '../repositories/familyRepository.js';
import { PetRepository } from '../repositories/petRepository.js';

/** 创建动态请求参数 */
export interface CreateFeedInput {
  feed_type: 'moment' | 'achievement' | 'health_milestone' | 'family_event';
  content: string;
  pet_id?: string;
  photos?: string[];
}

/** 更新动态请求参数 */
export interface UpdateFeedInput {
  content?: string;
  photos?: string[];
}

/** 分页查询参数 */
export interface FeedQueryInput {
  page: number;
  page_size: number;
  feed_type?: string;
  pet_id?: string;
}

/** 分页列表响应 */
export interface FeedListResponse {
  items: FeedWithPetRow[];
  total: number;
  page: number;
  page_size: number;
}

/** 业务错误（带状态码，供路由层捕获） */
export class FeedError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'FeedError';
  }
}

const feedRepository = new FeedRepository();
const familyRepository = new FamilyRepository();
const petRepository = new PetRepository();

/**
 * 分页查询家庭动态列表
 * - 校验家庭归属
 * - 查询列表 + 总数（并行）
 */
export async function listFeeds(
  userId: string,
  familyId: string,
  query: FeedQueryInput,
): Promise<FeedListResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FeedError(403, '无权查看此家庭');
  }

  const [items, total] = await Promise.all([
    feedRepository.findByFamilyId(
      familyId,
      query.page,
      query.page_size,
      query.feed_type,
      query.pet_id,
    ),
    feedRepository.countByFamilyId(familyId, query.feed_type, query.pet_id),
  ]);

  return {
    items,
    total,
    page: query.page,
    page_size: query.page_size,
  };
}

/**
 * 发布家庭动态
 * - 校验家庭归属
 * - 如提供 pet_id，校验宠物归属
 * - 插入记录（ai_generated=false, source_ref=null）
 */
export async function createFeed(
  userId: string,
  familyId: string,
  data: CreateFeedInput,
): Promise<FeedRow> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FeedError(403, '无权操作此家庭');
  }

  if (data.pet_id) {
    const ownsPet = await petRepository.isOwner(data.pet_id, userId);
    if (!ownsPet) {
      throw new FeedError(403, '只能关联自己的宠物');
    }
  }

  const record = await feedRepository.insert({
    family_id: familyId,
    pet_id: data.pet_id ?? null,
    user_id: userId,
    feed_type: data.feed_type,
    content: data.content,
    photos: data.photos ?? null,
    ai_generated: false,
    source_ref: null,
  });

  return record;
}

/**
 * 编辑家庭动态
 * - 校验家庭归属
 * - 校验动态存在且属于当前用户（只能编辑自己的）
 * - content 和 photos 至少提供一个
 */
export async function updateFeed(
  userId: string,
  familyId: string,
  feedId: string,
  data: UpdateFeedInput,
): Promise<FeedRow> {
  if (data.content === undefined && data.photos === undefined) {
    throw new FeedError(400, '没有需要更新的字段');
  }

  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FeedError(403, '无权操作此家庭');
  }

  // 先查家庭内是否存在该动态（区分 404 与 403）
  const existing = await feedRepository.findByIdAndFamily(feedId, familyId);
  if (!existing) {
    throw new FeedError(404, '动态不存在');
  }

  // 再校验是否属于当前用户（只能编辑自己的）
  if (existing.user_id !== userId) {
    throw new FeedError(403, '只能编辑自己发布的动态');
  }

  const updateData: Record<string, unknown> = {};
  if (data.content !== undefined) {
    updateData.content = data.content;
  }
  if (data.photos !== undefined) {
    updateData.photos = data.photos;
  }

  const updated = await feedRepository.updateById(feedId, updateData);
  if (!updated) {
    throw new FeedError(404, '动态不存在');
  }

  return updated;
}

/**
 * 删除家庭动态
 * - 校验家庭归属
 * - 校验动态存在且属于当前用户（只能删除自己的）
 */
export async function deleteFeed(
  userId: string,
  familyId: string,
  feedId: string,
): Promise<void> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FeedError(403, '无权操作此家庭');
  }

  // 先查家庭内是否存在该动态（区分 404 与 403）
  const existing = await feedRepository.findByIdAndFamily(feedId, familyId);
  if (!existing) {
    throw new FeedError(404, '动态不存在');
  }

  // 再校验是否属于当前用户（只能删除自己的）
  if (existing.user_id !== userId) {
    throw new FeedError(403, '只能删除自己发布的动态');
  }

  await feedRepository.deleteById(feedId);
}

/**
 * 获取家庭精选动态（最近 30 天前 5 条）
 * - 校验家庭归属
 * - 无动态返回空数组
 */
export async function listHighlights(
  userId: string,
  familyId: string,
): Promise<FeedWithPetRow[]> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FeedError(403, '无权查看此家庭');
  }

  return feedRepository.findHighlightByFamilyId(familyId, 5);
}
