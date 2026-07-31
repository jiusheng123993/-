/**
 * 年度回忆图集业务服务层 - 编排年度回忆的核心业务逻辑
 * 职责：归属校验、年份唯一性检查、创建草稿、查询详情、列表分页、更新、视频生成占位
 * 骨架阶段不实现真实视频生成，仅创建任务并标记 status
 */
import { YearlyReviewRepository, type YearlyReviewRow } from '../repositories/yearlyReviewRepository.js';
import { PetRepository } from '../repositories/petRepository.js';

/** 创建年度回忆输入 */
export interface CreateYearlyReviewInput {
  year: number;
  auto_select?: boolean;
  custom_photos?: string[];
  title?: string;
}

/** 更新年度回忆输入 */
export interface UpdateYearlyReviewInput {
  title?: string;
  review_data?: { sections?: unknown[] };
  cover_url?: string;
}

/** 年度回忆详情响应 */
export interface YearlyReviewDetailResponse {
  id: string;
  pet_id: string;
  year: number;
  status: string;
  review_data: Record<string, unknown> | null;
  cover_url: string | null;
  video_url: string | null;
  paid: boolean;
  created_at: string;
  updated_at: string;
}

/** 年度回忆列表项响应 */
export interface YearlyReviewListItem {
  id: string;
  year: number;
  status: string;
  cover_url: string | null;
  summary: string;
  photo_count: number;
  paid: boolean;
  created_at: string;
}

/** 业务错误（带状态码，供路由层捕获） */
export class YearlyReviewError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'YearlyReviewError';
  }
}

const yearlyReviewRepository = new YearlyReviewRepository();
const petRepository = new PetRepository();

/**
 * 从 review_data 提取摘要（取 summary 字段，无则返回空串）
 */
function extractSummary(reviewData: Record<string, unknown> | null): string {
  if (!reviewData) return '';
  const summary = reviewData.summary;
  return typeof summary === 'string' ? summary : '';
}

/**
 * 从 review_data 统计照片数
 */
function countPhotos(reviewData: Record<string, unknown> | null): number {
  if (!reviewData) return 0;
  const sections = reviewData.sections;
  if (!Array.isArray(sections)) return 0;
  let total = 0;
  for (const section of sections) {
    if (section && typeof section === 'object' && 'photos' in section) {
      const photos = (section as { photos?: unknown }).photos;
      if (Array.isArray(photos)) total += photos.length;
    }
  }
  return total;
}

/**
 * 将数据行映射为详情响应
 */
function toDetailResponse(row: YearlyReviewRow): YearlyReviewDetailResponse {
  return {
    id: row.id,
    pet_id: row.pet_id,
    year: row.year,
    status: row.status,
    review_data: row.review_data,
    cover_url: row.cover_url,
    video_url: row.video_url,
    paid: row.paid,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * 将数据行映射为列表项响应
 */
function toListItem(row: YearlyReviewRow): YearlyReviewListItem {
  return {
    id: row.id,
    year: row.year,
    status: row.status,
    cover_url: row.cover_url,
    summary: extractSummary(row.review_data),
    photo_count: countPhotos(row.review_data),
    paid: row.paid,
    created_at: row.created_at,
  };
}

/**
 * 创建年度回忆（草稿状态）
 * - 归属校验
 * - 同年唯一性检查（UNIQUE(pet_id, year)）
 * - 自动选片或使用自定义照片
 */
export async function createYearlyReview(
  userId: string,
  petId: string,
  data: CreateYearlyReviewInput,
): Promise<YearlyReviewDetailResponse> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new YearlyReviewError(404, '宠物不存在');
  }

  const exists = await yearlyReviewRepository.existsByPetAndYear(petId, data.year);
  if (exists) {
    throw new YearlyReviewError(409, `${data.year} 年度回忆已存在`);
  }

  const autoSelect = data.auto_select !== false;
  const reviewData: Record<string, unknown> = {
    title: data.title ?? `${data.year} 年度回忆`,
    summary: '',
    auto_select: autoSelect,
    custom_photos: data.custom_photos ?? [],
    stats: {
      total_photos: 0,
      total_checkins: 0,
      total_milestones: 0,
      health_avg_score: 0,
      best_month: '',
      vet_visits: 0,
    },
    monthly_highlights: [],
    milestones: [],
    growth_timeline: [],
  };

  const record = await yearlyReviewRepository.insert({
    user_id: userId,
    pet_id: petId,
    year: data.year,
    status: 'draft',
    review_data: JSON.stringify(reviewData),
    paid: false,
  });

  return toDetailResponse(record);
}

/**
 * 获取年度回忆详情（按年份）
 */
export async function getYearlyReviewByYear(
  userId: string,
  petId: string,
  year: number,
): Promise<YearlyReviewDetailResponse> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new YearlyReviewError(404, '宠物不存在');
  }

  const record = await yearlyReviewRepository.findByPetAndYear(petId, year);
  if (!record) {
    throw new YearlyReviewError(404, `${year} 年度回忆不存在`);
  }

  return toDetailResponse(record);
}

/**
 * 分页查询年度回忆列表
 */
export async function listYearlyReviews(
  userId: string,
  petId: string,
  page: number,
  pageSize: number,
): Promise<{ items: YearlyReviewListItem[]; total: number; page: number; page_size: number }> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new YearlyReviewError(404, '宠物不存在');
  }

  const offset = (page - 1) * pageSize;
  const [rows, total] = await Promise.all([
    yearlyReviewRepository.findByPetId(petId, userId, pageSize, offset),
    yearlyReviewRepository.countByPetId(petId, userId),
  ]);

  return {
    items: rows.map(toListItem),
    total,
    page,
    page_size: pageSize,
  };
}

/**
 * 更新年度回忆（标题、内容板块、封面）
 */
export async function updateYearlyReview(
  userId: string,
  petId: string,
  reviewId: string,
  data: UpdateYearlyReviewInput,
): Promise<YearlyReviewDetailResponse> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new YearlyReviewError(404, '宠物不存在');
  }

  const record = await yearlyReviewRepository.findByIdPetUser(reviewId, petId, userId);
  if (!record) {
    throw new YearlyReviewError(404, '年度回忆不存在');
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) {
    const existing = record.review_data ?? {};
    const newReviewData = {
      ...existing,
      title: data.title,
    };
    updateData.review_data = JSON.stringify(newReviewData);
  }
  if (data.review_data !== undefined) {
    const existing = record.review_data ?? {};
    const newReviewData = {
      ...existing,
      ...data.review_data,
    };
    updateData.review_data = JSON.stringify(newReviewData);
  }
  if (data.cover_url !== undefined) {
    updateData.cover_url = data.cover_url;
  }
  updateData.updated_at = new Date().toISOString();

  const updated = await yearlyReviewRepository.updateById(reviewId, updateData);
  if (!updated) {
    throw new YearlyReviewError(500, '更新失败');
  }

  return toDetailResponse(updated);
}

/**
 * 生成年度视频（占位实现，仅标记状态为 generating_video）
 * 真实实现应通过异步任务队列处理
 */
export async function generateYearlyVideo(
  userId: string,
  petId: string,
  reviewId: string,
): Promise<{ id: string; status: string; message: string }> {
  const owns = await petRepository.isOwner(petId, userId);
  if (!owns) {
    throw new YearlyReviewError(404, '宠物不存在');
  }

  const record = await yearlyReviewRepository.findByIdPetUser(reviewId, petId, userId);
  if (!record) {
    throw new YearlyReviewError(404, '年度回忆不存在');
  }

  if (record.status === 'generating_video') {
    throw new YearlyReviewError(409, '视频正在生成中，请勿重复触发');
  }

  if (record.status === 'draft') {
    throw new YearlyReviewError(400, '草稿状态无法生成视频，请先完善内容');
  }

  await yearlyReviewRepository.updateById(reviewId, {
    status: 'generating_video',
    updated_at: new Date().toISOString(),
  });

  return {
    id: reviewId,
    status: 'generating_video',
    message: '视频生成任务已提交，预计 5-10 分钟后完成',
  };
}
