/**
 * 自动家庭动态服务
 *
 * 在关键节点（打卡异常 / 连续打卡里程碑、疫苗完成、回忆录生成完成、新成员加入）
 * 自动写入家庭动态（PRD 4.11.5）。策略：只发"有意义的节点"，避免每次打卡都发导致刷屏。
 */
import { pool } from '../db.js';

/** 查找宠物所属的第一个家庭；宠物不在任何家庭时返回 null */
export async function findPetFamilyId(petId: string): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT family_id FROM pet_family_members WHERE pet_id = $1 LIMIT 1`,
    [petId],
  );
  return rows.length > 0 ? rows[0].family_id : null;
}

/** 查询宠物名字（用于动态文案），查不到时用兜底称呼 */
export async function getPetName(petId: string): Promise<string> {
  const { rows } = await pool.query(`SELECT name FROM pet_profiles WHERE id = $1`, [petId]);
  return rows.length > 0 ? rows[0].name || '毛孩子' : '毛孩子';
}

/**
 * 直接写入家庭动态
 * 由服务端可信逻辑触发，因此绕过所有权校验；标记 ai_generated 便于前端过滤
 */
export async function autoPostFeed(params: {
  userId: string;
  petId: string;
  familyId?: string;
  feedType: 'moment' | 'achievement' | 'health_milestone' | 'family_event';
  content: string;
  sourceRef: string;
}): Promise<void> {
  try {
    const familyId = params.familyId || await findPetFamilyId(params.petId);
    if (!familyId) return;
    await pool.query(
      `INSERT INTO pet_family_feeds (family_id, pet_id, user_id, feed_type, content, photos, ai_generated, source_ref)
       VALUES ($1, $2, $3, $4, $5, NULL, true, $6)`,
      [familyId, params.petId, params.userId, params.feedType, params.content, params.sourceRef],
    );
  } catch (error) {
    console.warn('[AutoFeed] 自动发布动态失败:', error);
  }
}

/** 计算宠物连续打卡天数（含今天；今天未打卡则从昨天起算） */
export async function computeStreakDays(petId: string, userId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT to_char(created_at, 'YYYY-MM-DD') AS day
     FROM pet_health_entries
     WHERE pet_id = $1 AND user_id = $2
     ORDER BY created_at DESC LIMIT 365`,
    [petId, userId],
  );
  const days = new Set(rows.map(r => r.day));
  let streak = 0;
  const cursor = new Date();
  // 今天已打卡则从今天起算；否则从昨天起算（允许当天尚未打卡）
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** 打卡后触发：异常预警 + 连续打卡里程碑 */
export async function maybePostCheckinFeed(
  userId: string,
  petId: string,
  riskLevel: string,
  streakDays: number,
): Promise<void> {
  try {
    const petName = await getPetName(petId);
    if (riskLevel === 'high' || riskLevel === 'emergency') {
      await autoPostFeed({
        userId,
        petId,
        feedType: 'health_milestone',
        content: riskLevel === 'emergency'
          ? `⚠️ ${petName} 今天打卡出现紧急健康信号，建议立即联系宠物医院`
          : `⚠️ ${petName} 今天打卡出现高风险健康信号，建议持续观察`,
        sourceRef: `checkin:${riskLevel}`,
      });
    }
    if ([7, 30, 100].includes(streakDays)) {
      await autoPostFeed({
        userId,
        petId,
        feedType: 'health_milestone',
        content: `🎉 ${petName} 连续打卡 ${streakDays} 天，健康小标兵！`,
        sourceRef: `checkin:streak:${streakDays}`,
      });
    }
  } catch (error) {
    console.warn('[AutoFeed] 打卡动态处理失败:', error);
  }
}

/** 疫苗完成 → 自动发动态 */
export async function postVaccineCompletedFeed(
  userId: string,
  petId: string,
  vaccineLabel: string,
): Promise<void> {
  try {
    const petName = await getPetName(petId);
    await autoPostFeed({
      userId,
      petId,
      feedType: 'achievement',
      content: `💉 ${petName} 完成了${vaccineLabel}，健康又多一层保障！`,
      sourceRef: 'vaccine:completed',
    });
  } catch (error) {
    console.warn('[AutoFeed] 疫苗动态处理失败:', error);
  }
}

/** 新成员加入家庭 → 自动发动态 */
export async function postMemberJoinedFeed(
  familyId: string,
  userId: string,
  petId: string,
): Promise<void> {
  try {
    const petName = await getPetName(petId);
    await autoPostFeed({
      userId,
      petId,
      familyId,
      feedType: 'family_event',
      content: `🐾 ${petName} 加入了家庭！`,
      sourceRef: 'family:member',
    });
  } catch (error) {
    console.warn('[AutoFeed] 成员动态处理失败:', error);
  }
}

/** 回忆录生成完成 → 自动发动态 */
export async function postMemoirCompletedFeed(
  userId: string,
  petId: string,
  memoirType: string,
): Promise<void> {
  try {
    const petName = await getPetName(petId);
    const label = memoirType === 'vlog' ? '纪念Vlog' : '日常回忆录';
    await autoPostFeed({
      userId,
      petId,
      feedType: 'family_event',
      content: `🎬 ${petName} 的${label}完成啦，一起来回顾这段温暖时光～`,
      sourceRef: `memoir:${memoirType}`,
    });
  } catch (error) {
    console.warn('[AutoFeed] 回忆录动态处理失败:', error);
  }
}
