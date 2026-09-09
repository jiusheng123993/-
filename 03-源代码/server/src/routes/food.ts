import { beijingDateString } from '../utils/beijingTime.js';
/**
 * 食物安全查询路由 - 查询食物对宠物的安全性
 * 支持关键词模糊匹配、历史查询记录、查询统计
 * 数据访问全部通过 FoodRepository，禁止直接拼接 SQL
 */
import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { foodQuerySchema } from '../schemas/index.js';
import { FoodRepository, type FoodRow, type KnowledgeFoodRow } from '../repositories/foodRepository.js';

const router = Router();
router.use(authMiddleware);

const foodRepository = new FoodRepository();

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toCamelCaseArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  return arr.map(toCamelCase);
}

/**
 * 把前端 PetFoodQuery 契约需要的字段补全（安全等级映射 + 默认值）
 * 前端 PetFoodQuery.safetyLevel 的枚举是 'safe'|'caution'|'dangerous'|'toxic'
 * 而历史/占位表 pet_food_queries 的枚举是 'safe'|'caution'|'danger'，需把 'danger' 归一为 'dangerous'。
 */
function toFoodQueryResult(
  userId: string,
  source: 'knowledge_base' | 'database' | 'placeholder',
  data: Partial<{
    id: string; food_name: string; safety_level: string; detail: string;
    dangerous_compounds: string[]; toxic_doses: string; symptoms: string[]; first_aid: string;
    created_at: string;
  }>,
): Record<string, unknown> {
  const rawLevel = data.safety_level || 'caution';
  const level = rawLevel === 'danger' ? 'dangerous' : rawLevel;
  return {
    id: data.id,
    userId,
    foodName: data.food_name,
    safetyLevel: level,
    detail: data.detail || '',
    dangerousCompounds: data.dangerous_compounds || [],
    toxicDoses: data.toxic_doses || '',
    symptoms: data.symptoms || [],
    breedWarnings: [],
    firstAid: data.first_aid || '',
    isMemberQuery: false,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    source,
  };
}

/** 权威知识库行 → PetFoodQuery（补 userId/isMemberQuery/createdAt） */
function mapKnowledgeToQuery(kn: KnowledgeFoodRow, userId: string): Record<string, unknown> {
  return toFoodQueryResult(userId, 'knowledge_base', {
    id: kn.id,
    food_name: kn.food_name,
    safety_level: kn.safety_level,
    detail: kn.detail,
    dangerous_compounds: kn.dangerous_compounds,
    toxic_doses: kn.toxic_doses,
    symptoms: kn.symptoms,
    first_aid: kn.first_aid,
    created_at: kn.created_at,
  });
}

/** 历史/占位表行 → PetFoodQuery */
function mapHistoryToQuery(row: FoodRow, userId: string): Record<string, unknown> {
  return toFoodQueryResult(userId, 'database', {
    id: row.id,
    food_name: row.food_name,
    safety_level: row.safety_level,
    detail: row.detail,
    created_at: row.created_at,
  });
}

router.get('/query', validate({ query: foodQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query as { keyword: string };

    // 1. 优先查权威知识库 pet_food_safety_knowledge（标准答案，避免"权威库=safe 但查询页回 caution"）
    const knowledge = await foodRepository.searchKnowledge(keyword);
    if (knowledge) {
      res.json({ success: true, data: mapKnowledgeToQuery(knowledge, req.userId!), source: 'knowledge_base' });
      return;
    }

    // 2. 用户历史/占位表兜底（通常只在知识库未收录时命中）
    const rows = await foodRepository.searchByKeyword(keyword);
    if (rows.length > 0) {
      res.json({ success: true, data: mapHistoryToQuery(rows[0], req.userId!), source: 'database' });
      return;
    }

    // 3. 知识库也没有 → 落一条占位（safety_level=caution），前端按"谨慎"展示
    const id = uuidv4();
    const inserted = await foodRepository.insertPlaceholder(
      id,
      req.userId!,
      keyword,
      '本知识库暂无该食物的安全数据，请谨慎对待，建议咨询兽医',
    );

    res.json({
      success: true,
      data: mapHistoryToQuery(inserted, req.userId!),
      source: 'placeholder',
      message: '本地知识库暂无该食物数据，已记录查询',
    });
  } catch (err) {
    console.error('[Food Query Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const rows = await foodRepository.findHistoryByUser(req.userId!);
    res.json({ success: true, data: toCamelCaseArray(rows) });
  } catch (err) {
    console.error('[Food History Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = beijingDateString(); // 审查⏳1：北京「今日」

    const [totalQueries, todayQueries] = await Promise.all([
      foodRepository.countByUser(req.userId!),
      foodRepository.countTodayByUser(req.userId!, today),
    ]);

    res.json({
      success: true,
      data: {
        totalQueries,
        todayQueries,
      },
    });
  } catch (err) {
    console.error('[Food Stats Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/today-count', async (req: Request, res: Response) => {
  try {
    const today = beijingDateString(); // 审查⏳1：北京「今日」
    const count = await foodRepository.countTodayByUser(req.userId!, today);

    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('[Food Today Count Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
