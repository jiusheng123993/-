/**
 * 回忆录素材盘点服务 - 创建页"素材检查器"的数据源
 * 职责（2026-09-09 素材体系设计 §五/§六）：
 *   1. getMaterialCheck：盘点某宠物可复用的照片与时光线记忆，给出档位建议
 *      - 档案相册照片（pet_profiles.photos）
 *      - 时光线回忆（pet_moments，含描述条数与照片数）
 *      - suggested_tier：按可复用素材量推荐 light/standard/full
 *   2. getPhotoPool：返回可在创建页直接勾选的库内照片（档案相册 + 时光线照片）
 *
 * 安全约束：
 *   - 所有查询强制 user_id + pet_id 双重过滤（防横向越权，不依赖路由层校验）
 *
 * 实现说明：跨表聚合查询（pet_profiles + pet_moments），独立 repository 会造成过度拆分，
 * 采用与 memoryService 一致的 pool 直查模式（有既有先例）。
 */
import { pool } from '../db.js';

/** 素材盘点响应 */
export interface MaterialCheckResult {
  /** 档案相册照片数 */
  profile_photo_count: number;
  /** 时光线回忆总数（不限有无描述） */
  moment_count: number;
  /** 时光线中有可用描述的回忆数（进旁白锚定的候选） */
  moment_with_description_count: number;
  /** 时光线照片总数（跨所有回忆求和） */
  moment_photo_count: number;
  /** 可勾选的时光线回忆列表（创建页"选记忆"步骤数据源，最多 20 条） */
  moments: Array<{
    id: string;
    type: string;
    day: string;
    /** 描述摘要（无描述为 null，不可进旁白锚定） */
    summary: string | null;
    has_photo: boolean;
  }>;
  /** 建议档位（light/standard/full） */
  suggested_tier: 'light' | 'standard' | 'full';
  /** 建议理由（前端展示） */
  suggestion_reason: string;
}

/** 照片池响应（创建页"选照片-库内勾选"步骤数据源） */
export interface PhotoPoolResult {
  /** 档案相册照片 URL 列表 */
  profile_photos: string[];
  /** 时光线照片（按回忆分组，展示需要日期上下文） */
  moment_photos: Array<{ moment_id: string; day: string; url: string }>;
}

/** 档位建议阈值（与 MEMOIR_TIER_CONFIG 照片边界一致 + 记忆勾选门槛） */
const FULL_TIER_MIN_PHOTOS = 8;
const FULL_TIER_MIN_MEMORIES = 3;
const STANDARD_TIER_MIN_PHOTOS = 5;

/**
 * 素材盘点：统计该宠物的库内照片与时光线回忆，并给出档位建议
 * @param userId 当前用户（强制归属过滤）
 * @param petId 宠物 ID
 *
 * 列型说明（审查 P1-1 修复）：
 *   - pet_profiles 主键是 id（无 pet_id 列），归属过滤 = id + user_id
 *   - pet_moments.photos 是 TEXT[]（迁移 007），用 array_length 而非 jsonb 函数
 *   - pet_moments.id 是 TEXT（uuid 格式字符串），直接 text 比对
 */
export async function getMaterialCheck(userId: string, petId: string): Promise<MaterialCheckResult> {
  // 一次查询取档案照片（pet_profiles 单行）
  const profileRes = await pool.query(
    `SELECT photos FROM pet_profiles WHERE id = $1 AND user_id = $2`,
    [petId, userId],
  );
  const profilePhotos: string[] = Array.isArray(profileRes.rows[0]?.photos) ? profileRes.rows[0].photos : [];

  // 时光线统计（审查 P2：总数用独立聚合，不受候选列表 LIMIT 截断——重素材用户档位建议不被低估）
  const statsRes = await pool.query(
    `SELECT COUNT(*)::int AS moment_total,
            COUNT(*) FILTER (WHERE jsonb_typeof(content) = 'object'
               AND NULLIF(BTRIM(COALESCE(content->>'description', '')), '') IS NOT NULL)::int AS moment_with_desc,
            COALESCE(SUM(COALESCE(array_length(photos, 1), 0)), 0)::int AS photo_total
     FROM pet_moments
     WHERE user_id = $1 AND pet_id = $2`,
    [petId, userId],
  );
  const momentCount = Number(statsRes.rows[0]?.moment_total ?? 0);
  const momentWithDescCount = Number(statsRes.rows[0]?.moment_with_desc ?? 0);
  const momentPhotoCount = Number(statsRes.rows[0]?.photo_total ?? 0);

  // 时光线候选：只取有描述的回忆（旁白锚定候选，最多 20 条）
  const momentsRes = await pool.query(
    `SELECT id, type,
            to_char(COALESCE(happened_at, (created_at AT TIME ZONE 'Asia/Shanghai')::date), 'YYYY-MM-DD') AS day,
            LEFT(COALESCE(content->>'description', ''), 80) AS summary,
            COALESCE(array_length(photos, 1), 0) AS photo_len
     FROM pet_moments
     WHERE user_id = $1 AND pet_id = $2
       AND jsonb_typeof(content) = 'object'
       AND NULLIF(BTRIM(COALESCE(content->>'description', '')), '') IS NOT NULL
     ORDER BY COALESCE(happened_at, (created_at AT TIME ZONE 'Asia/Shanghai')::date) DESC, created_at DESC
     LIMIT 20`,
    [petId, userId],
  );
  const withDescription = momentsRes.rows;

  // 档位建议：可用照片 = 档案相册 + 时光线照片；完整档额外要求记忆勾选素材 ≥3
  const totalPhotos = profilePhotos.length + momentPhotoCount;
  // 勾选候选数 = 有描述的回忆总数（schema 勾选上限 10，超出部分用户用不上）
  const memoryCandidates = Math.min(momentWithDescCount, 10);
  let suggestedTier: MaterialCheckResult['suggested_tier'] = 'light';
  let suggestionReason = '';
  if (totalPhotos >= FULL_TIER_MIN_PHOTOS && memoryCandidates >= FULL_TIER_MIN_MEMORIES) {
    suggestedTier = 'full';
    suggestionReason = `照片 ${totalPhotos} 张、可勾选回忆 ${memoryCandidates} 条，满足完整回忆录（8-15 张 + 勾选 ≥3 条记忆）`;
  } else if (totalPhotos >= STANDARD_TIER_MIN_PHOTOS) {
    suggestedTier = 'standard';
    suggestionReason = `照片 ${totalPhotos} 张，满足标准回忆录（5-7 张）${memoryCandidates < FULL_TIER_MIN_MEMORIES ? `；可勾选回忆仅 ${memoryCandidates} 条，补写回忆可解锁完整档` : ''}`;
  } else {
    suggestedTier = 'light';
    suggestionReason = `照片 ${totalPhotos} 张，先从轻纪念开始；${totalPhotos < 1 ? '先上传或勾选照片' : `再补 ${STANDARD_TIER_MIN_PHOTOS - totalPhotos} 张可解锁标准档`}`;
  }

  return {
    profile_photo_count: profilePhotos.length,
    moment_count: momentCount,
    moment_with_description_count: momentWithDescCount,
    moment_photo_count: momentPhotoCount,
    moments: withDescription.map((r) => ({
      id: String(r.id),
      type: String(r.type),
      day: String(r.day),
      summary: r.summary ? String(r.summary) : null,
      has_photo: Number(r.photo_len ?? 0) > 0,
    })),
    suggested_tier: suggestedTier,
    suggestion_reason: suggestionReason,
  };
}

/**
 * 照片池：返回创建页可直接勾选的库内照片（档案相册 + 时光线照片）
 * @param userId 当前用户（强制归属过滤）
 * @param petId 宠物 ID
 */
export async function getPhotoPool(userId: string, petId: string): Promise<PhotoPoolResult> {
  // pet_profiles 主键是 id（审查 P1-1：该表无 pet_id 列）
  const profileRes = await pool.query(
    `SELECT photos FROM pet_profiles WHERE id = $1 AND user_id = $2`,
    [petId, userId],
  );
  const profilePhotos: string[] = Array.isArray(profileRes.rows[0]?.photos) ? profileRes.rows[0].photos : [];

  // 时光线照片展开：每张照片带所属回忆 ID 与日期（前端按组展示）
  // photos 是 TEXT[]（迁移 007），非 jsonb——用 unnest 展开最简洁且不炸列型
  const momentsRes = await pool.query(
    `SELECT m.id,
            to_char(COALESCE(m.happened_at, (m.created_at AT TIME ZONE 'Asia/Shanghai')::date), 'YYYY-MM-DD') AS day,
            p.url
     FROM pet_moments m
     CROSS JOIN LATERAL unnest(m.photos) AS p(url)
     WHERE m.user_id = $1 AND m.pet_id = $2
       AND COALESCE(array_length(m.photos, 1), 0) > 0
     ORDER BY COALESCE(m.happened_at, (m.created_at AT TIME ZONE 'Asia/Shanghai')::date) DESC
     LIMIT 200`,
    [petId, userId],
  );
  const momentPhotos: PhotoPoolResult['moment_photos'] = momentsRes.rows.map((row) => ({
    moment_id: String(row.id),
    day: String(row.day),
    url: String(row.url),
  }));

  return { profile_photos: profilePhotos, moment_photos: momentPhotos };
}
