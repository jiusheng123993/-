/**
 * 通用 Zod Schema 定义
 * 所有路由的参数校验 schema 集中管理
 * 按 TECH_DESIGN 3.1 节关键参数定义
 */
import { z } from 'zod';

// ===== 通用 Schema =====

/** UUID 格式校验 */
export const uuidSchema = z.string().uuid('ID格式错误');

/** 分页参数 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** 排序参数 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ===== 认证模块 =====

/** 微信登录 */
export const wxLoginSchema = z.object({
  code: z.string().min(1, 'code不能为空'),
});

/** 发送短信验证码（App/H5 手机号登录） */
export const sendSmsSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
});

/** 手机号验证码登录（App/H5） */
export const phoneLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  code: z.string().regex(/^\d{4,6}$/, '验证码格式不正确'),
});

// ===== 宠物模块 =====

/** 创建宠物 */
export const createPetSchema = z.object({
  name: z.string({ error: 'name不能为空' }).min(1, 'name不能为空'),
  species: z.string({ error: 'species不能为空' }).min(1, 'species不能为空'),
  breed: z.string({ error: 'breed不能为空' }).min(1, 'breed不能为空'),
  breed_id: z.string({ error: 'breed_id不能为空' }).min(1, 'breed_id不能为空'),
  gender: z.string({ error: 'gender不能为空' }).min(1, 'gender不能为空'),
  birth_date: z.string({ error: 'birth_date不能为空' }).min(1, 'birth_date不能为空'),
  weight: z.number().optional(),
  avatar_photo_url: z.string().nullable().optional(),
  avatar_cartoon_url: z.string().nullable().optional(),
  avatar_style: z.string().nullable().optional(),
  photos: z.array(z.unknown()).optional(),
  is_neutered: z.boolean().optional(),
  microchip_id: z.string().optional(),
  notes: z.string().optional(),
});

/** 更新宠物 */
export const updatePetSchema = createPetSchema.partial();

// ===== 健康打卡模块 =====

/** 创建健康打卡 */
export const createCheckinSchema = z.object({
  poop_level: z.number().int().min(1).max(5),
  appetite_level: z.number().int().min(1).max(5),
  spirit_level: z.number().int().min(1).max(5),
  exercise_level: z.number().int().min(0).max(5),
  weight: z.number().optional(),
  has_anomaly: z.boolean().optional(),
  anomaly_items: z.array(z.string()).optional(),
  ai_feedback: z.string().nullable().optional(),
  risk_level: z.string().min(1),
  note: z.string().nullable().optional(),
});

// ===== 家庭模块 =====

/** 创建家庭 */
export const createFamilySchema = z.object({
  name: z.string({ error: '家庭名称不能为空' }).trim().min(1, '家庭名称不能为空').max(50, '名称最长50字符'),
  avatarUrl: z.string().url().optional(),
});

/** 更新家庭 */
export const updateFamilySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

/** 添加家庭成员 */
export const addFamilyMemberSchema = z.object({
  petId: z.string({ error: '宠物ID不能为空' }).min(1, '宠物ID不能为空').max(100, '宠物ID过长'),
  role: z.string().max(50).optional(),
});

// ===== 食物查询模块 =====

/** 食物查询 */
export const foodQuerySchema = z.object({
  keyword: z.string().min(1, '关键词不能为空').max(50, '关键词最长50字符'),
});

// ===== AI 对话模块 =====

/** 发送对话消息 */
export const chatMessageSchema = z.object({
  messages: z.array(z.unknown(), { error: 'messages 不能为空' }).min(1, 'messages 不能为空'),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  petId: z.string().optional(),
});

// ===== 取名模块 =====

/** 生成名字 */
export const generateNameSchema = z.object({
  petId: uuidSchema,
  style: z.enum(['chinese', 'western', 'cute', 'cool', 'elegant']).default('chinese'),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
});

// ===== 症状初筛模块 =====

/**
 * 症状初筛
 * AI 建议类字段做限长/类型化校验，防止前端传入任意内容（XSS/注入面收敛）
 */
export const symptomCheckSchema = z.object({
  symptoms: z.array(z.string().max(50), { error: '请提供症状列表' }).min(1, '请提供症状列表').max(20, '症状过多'),
  duration: z.string().max(100).optional(),
  severity: z.string().max(20).optional(),
  additional_info: z.unknown().optional(),
  risk_level: z.enum(['normal', 'caution', 'warning', 'emergency']).optional(),
  possible_conditions: z.array(z.string().max(100)).max(10).optional(),
  ai_advice: z.string().max(2000).nullable().optional(),
  recommended_actions: z.array(z.string().max(200)).max(20).optional(),
  knowledge_match: z.unknown().nullable().optional(),
});

// ===== 记忆模块 =====

/** 记忆列表查询（可按宠物过滤） */
export const memoryListQuerySchema = z.object({
  petId: z.string().optional(),
});

/** 修正记忆内容 */
export const memoryUpdateSchema = z.object({
  content: z.string({ error: '请提供记忆内容' }).trim().min(1, '记忆内容不能为空').max(2000, '记忆内容过长'),
});

// ===== 疫苗模块 =====

/** 添加疫苗记录 */
export const createVaccineSchema = z.object({
  type: z.enum(['vaccine', 'deworm'], { error: '类型必须为 vaccine 或 deworm' }),
  category: z.string({ error: '请提供类别' }).min(1, '请提供类别'),
  date: z.string({ error: '请提供日期和下次日期' }).min(1, '请提供日期和下次日期'),
  next_date: z.string({ error: '请提供日期和下次日期' }).min(1, '请提供日期和下次日期'),
  status: z.string().optional(),
  hospital: z.string().optional(),
  doctor: z.string().optional(),
  notes: z.string().optional(),
  reminder_enabled: z.boolean().optional(),
});

// ===== 会员模块 =====

/** 创建会员订单（旧接口，保留以兼容 membership.ts 旧调用） */
export const createOrderSchema = z.object({
  plan: z.enum(['monthly', 'quarterly', 'yearly'], { error: 'plan 参数无效，可选值：monthly, quarterly, yearly' }),
});

/** 创建会员订阅支付订单（新接口，走支付流程） */
export const createMembershipOrderSchema = z.object({
  plan: z.enum(['monthly', 'quarterly', 'yearly'], {
    error: 'plan 参数无效，可选值：monthly, quarterly, yearly',
  }),
});

// ===== 支付模块 - 创建回忆录订单 =====

/**
 * 创建回忆录付费订单
 *
 * 入参与 createMemoirSchema 保持一致，但走支付流程：
 *   1. 服务端校验归属/并发/参数/价格
 *   2. 创建 pending 订单（product_metadata 存业务上下文）
 *   3. 调微信支付下单，返回 JSAPI 支付参数
 *   4. 前端调起支付 → 微信回调 → 创建 memoir 任务
 */
export const createMemoirOrderSchema = z
  .object({
    pet_id: z.string({ error: 'pet_id 不能为空' }).min(1, 'pet_id 不能为空').max(100, 'pet_id 过长'),
    memoir_type: z.enum(['daily', 'memorial', 'seasonal', 'milestone', 'custom'], {
      error: 'memoir_type 必须为 daily/memorial/seasonal/milestone/custom',
    }),
    source_photos: z
      .array(z.string().url(), { error: 'source_photos 不能为空' })
      .min(1, '至少需要1张照片'),
    source_text: z.string().max(2000).optional(),
    music_style: z.enum(['warm', 'nostalgic', 'cheerful', 'peaceful']).optional(),
    duration: z.number().int().min(5).max(180).optional(),
    style_preset: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    // 照片数量按产品线差异化校验（与 createMemoirSchema 一致）
    if (data.memoir_type === 'memorial') {
      if (data.source_photos.length < 8 || data.source_photos.length > 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_photos'],
          message: `纪念Vlog照片数量需8-15张，当前 ${data.source_photos.length} 张`,
        });
      }
      if (data.duration !== undefined && (data.duration < 60 || data.duration > 90)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['duration'],
          message: `纪念Vlog时长需60-90秒，当前 ${data.duration} 秒`,
        });
      }
    } else {
      if (data.source_photos.length < 1 || data.source_photos.length > 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_photos'],
          message: `日常回忆录照片数量需1-3张，当前 ${data.source_photos.length} 张`,
        });
      }
      if (data.duration !== undefined && (data.duration < 5 || data.duration > 30)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['duration'],
          message: `日常回忆录时长需5-30秒，当前 ${data.duration} 秒`,
        });
      }
    }
  });

// ===== 时间线模块 =====

/** 创建时间线事件 - 回忆类型白名单 */
export const timelineMomentTypeSchema = z.enum(
  ['memory', 'diary', 'milestone', 'photo', 'note'],
  { error: 'type 必须为 memory/diary/milestone/photo/note' },
);

/** 创建时间线事件 */
export const createTimelineEventSchema = z.object({
  petId: z.string({ error: '请提供宠物ID' }).min(1, '请提供宠物ID').max(100, '宠物ID过长'),
  type: timelineMomentTypeSchema.optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  photos: z.array(z.string().min(1, '照片地址不能为空')).max(9, 'photos 最多 9 张').optional(),
});

// ===== 回忆录模块 =====

/**
 * 创建回忆录任务
 * 照片数量按 memoir_type 差异化校验：
 *   - memorial：8-15 张（纪念Vlog，60-90秒叙事视频）
 *   - 其他类型（daily/seasonal/milestone/custom）：1-3 张（日常回忆录，5-30秒短视频）
 * 时长按产品线校验：
 *   - memorial：60-90 秒
 *   - 其他：5-30 秒
 */
export const createMemoirSchema = z
  .object({
    memoir_type: z.enum(['daily', 'memorial', 'seasonal', 'milestone', 'custom'], { error: 'memoir_type 必须为 daily/memorial/seasonal/milestone/custom' }),
    source_photos: z.array(z.string().url(), { error: 'source_photos 不能为空' })
      .min(1, '至少需要1张照片'),
    source_text: z.string().max(2000).optional(),
    music_style: z.enum(['warm', 'nostalgic', 'cheerful', 'peaceful']).optional(),
    duration: z.number().int().min(5).max(180).optional(),
    style_preset: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    // 照片数量按产品线差异化校验
    if (data.memoir_type === 'memorial') {
      if (data.source_photos.length < 8 || data.source_photos.length > 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_photos'],
          message: `纪念Vlog照片数量需8-15张，当前 ${data.source_photos.length} 张`,
        });
      }
      // 时长校验：memorial 60-90 秒
      if (data.duration !== undefined && (data.duration < 60 || data.duration > 90)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['duration'],
          message: `纪念Vlog时长需60-90秒，当前 ${data.duration} 秒`,
        });
      }
    } else {
      // daily/seasonal/milestone/custom：1-3 张
      if (data.source_photos.length < 1 || data.source_photos.length > 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_photos'],
          message: `日常回忆录照片数量需1-3张，当前 ${data.source_photos.length} 张`,
        });
      }
      // 时长校验：daily 5-30 秒
      if (data.duration !== undefined && (data.duration < 5 || data.duration > 30)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['duration'],
          message: `日常回忆录时长需5-30秒，当前 ${data.duration} 秒`,
        });
      }
    }
  });

// ===== 家庭动态墙模块 =====

/** 创建家庭动态 */
export const createFeedSchema = z.object({
  feed_type: z.enum(
    ['moment', 'achievement', 'health_milestone', 'family_event'],
    { error: 'feed_type 无效' },
  ),
  content: z.string({ error: 'content 不能为空' })
    .min(1, 'content 不能为空')
    .max(2000, 'content 最长 2000 字符'),
  pet_id: z.string().optional(),
  photos: z.array(z.string().url(), { error: 'photos 必须为合法 URL 数组' })
    .max(9, 'photos 最多 9 张')
    .optional(),
});

/** 更新家庭动态 */
export const updateFeedSchema = z.object({
  content: z.string({ error: 'content 不能为空' })
    .min(1, 'content 不能为空')
    .max(2000, 'content 最长 2000 字符')
    .optional(),
  photos: z.array(z.string().url(), { error: 'photos 必须为合法 URL 数组' })
    .max(9, 'photos 最多 9 张')
    .optional(),
});

/** 家庭动态查询参数 */
export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  feed_type: z.string().optional(),
  pet_id: z.string().optional(),
});

// ===== 家庭周报模块 =====

/** 家庭周报列表查询参数 */
export const weeklyReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'page 最小为 1').default(1),
  page_size: z.coerce.number().int().min(1, 'page_size 最小为 1').max(100, 'page_size 最大为 100').default(20),
  year: z.coerce.number().int().min(2020, 'year 不合法').max(2100, 'year 不合法').optional(),
});

// ===== 分享卡片模块 =====

/** 生成分享卡片请求 */
export const generateShareCardSchema = z.object({
  card_type: z.enum(
    ['health_report', 'weekly_summary', 'milestone', 'family_tree', 'memoir', 'naming', 'birthday', 'achievement', 'daily_moment', 'yearly_review', 'wardrobe'],
    { error: 'card_type 无效' },
  ),
  source_data: z
    .object({
      report_id: z.string().optional(),
      memoir_id: z.string().optional(),
      pet_id: z.string().optional(),
      milestone_id: z.string().optional(),
      snapshot_id: z.string().optional(),
      name_history_id: z.string().optional(),
      feed_id: z.string().optional(),
      custom_text: z.string().max(500, 'custom_text 最长 500 字符').optional(),
      custom_photos: z.array(z.string().url(), { error: 'custom_photos 必须为合法 URL 数组' })
        .max(9, 'custom_photos 最多 9 张')
        .optional(),
    })
    .refine(
      (data) => Object.values(data).some((v) => v !== undefined),
      { message: 'source_data 不能为空' },
    ),
  style: z
    .object({
      theme: z.enum(['warm', 'elegant', 'cute', 'minimal']).optional(),
      background_color: z.string().max(20, 'background_color 最长 20 字符').optional(),
      font_family: z.string().max(50, 'font_family 最长 50 字符').optional(),
    })
    .optional(),
});

/** 分享行为请求（记录分享） */
export const shareActionSchema = z.object({
  share_channel: z.enum(['wechat', 'moments', 'save', 'copy'], { error: 'share_channel 无效' }),
});

/** 分享卡片列表查询参数 */
export const shareCardQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'page 最小为 1').default(1),
  page_size: z.coerce.number().int().min(1, 'page_size 最小为 1').max(100, 'page_size 最大为 100').default(20),
  card_type: z.string().optional(),
});

// ===== 家族图谱模块 =====

/** 关系类型枚举（血缘+非血缘） */
const RELATION_TYPES = ['friend', 'rival', 'companion', 'parent_child', 'sibling', 'mate', 'other'] as const;

/** 创建宠物关系 */
export const createRelationshipSchema = z
  .object({
    pet_id_a: z.string({ error: 'pet_id_a 不能为空' }).min(1, 'pet_id_a 不能为空'),
    pet_id_b: z.string({ error: 'pet_id_b 不能为空' }).min(1, 'pet_id_b 不能为空'),
    relation_type: z.enum(RELATION_TYPES, { error: 'relation_type 无效' }),
    direction: z.enum(['a_to_b', 'b_to_a', 'mutual']).optional(),
    label_a: z.string().max(50, 'label_a 最长 50 字符').optional(),
    label_b: z.string().max(50, 'label_b 最长 50 字符').optional(),
  })
  .refine((data) => data.pet_id_a !== data.pet_id_b, {
    message: 'pet_id_a 和 pet_id_b 不能相同',
    path: ['pet_id_b'],
  });

/** 更新宠物关系（仅允许更新 label） */
export const updateRelationshipSchema = z.object({
  label_a: z.string().max(50, 'label_a 最长 50 字符').optional(),
  label_b: z.string().max(50, 'label_b 最长 50 字符').optional(),
});

/** 创建血缘关系 */
export const createLineageSchema = z
  .object({
    parent_id: z.string({ error: 'parent_id 不能为空' }).min(1, 'parent_id 不能为空'),
    child_id: z.string({ error: 'child_id 不能为空' }).min(1, 'child_id 不能为空'),
    litter_date: z.string().optional(),
  })
  .refine((data) => data.parent_id !== data.child_id, {
    message: 'parent_id 和 child_id 不能相同',
    path: ['child_id'],
  });

/** 创建家族图谱快照 */
export const createSnapshotSchema = z.object({
  layout_type: z.enum(['tree', 'radial', 'force', 'manual'], { error: 'layout_type 无效' }),
  graph_data: z.record(z.string(), z.unknown(), { error: 'graph_data 不能为空' }),
  thumbnail_url: z.string().url('thumbnail_url 必须为合法 URL').optional(),
});

/** 快照列表查询参数 */
export const snapshotQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'page 最小为 1').default(1),
  page_size: z.coerce.number().int().min(1, 'page_size 最小为 1').max(100, 'page_size 最大为 100').default(20),
});

// ===== 年度回忆图集模块 =====

/** 创建年度回忆请求 */
export const createYearlyReviewSchema = z.object({
  year: z
    .number({ error: 'year 必须为整数' })
    .int('year 必须为整数')
    .min(2000, 'year 不合法')
    .max(2100, 'year 不合法'),
  auto_select: z.boolean().optional(),
  custom_photos: z
    .array(z.string().url(), { error: 'custom_photos 必须为合法 URL 数组' })
    .max(100, 'custom_photos 最多 100 张')
    .optional(),
  title: z.string().max(100, 'title 最长 100 字符').optional(),
});

/** 更新年度回忆请求 */
export const updateYearlyReviewSchema = z.object({
  title: z.string().max(100, 'title 最长 100 字符').optional(),
  review_data: z
    .object({
      sections: z
        .array(
          z.object({
            type: z.enum(['monthly', 'milestone', 'health', 'growth'], {
              error: 'section.type 无效',
            }),
            photos: z.array(z.string().url()).max(50),
            title: z.string().max(100),
            description: z.string().max(500),
          }),
        )
        .max(50, 'sections 最多 50 项')
        .optional(),
    })
    .optional(),
  cover_url: z.string().url('cover_url 必须为合法 URL').optional(),
});

/** 年度列表查询参数 */
export const yearlyReviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'page 最小为 1').default(1),
  page_size: z.coerce.number().int().min(1, 'page_size 最小为 1').max(100, 'page_size 最大为 100').default(20),
});

// ===== 排行榜模块 =====

/** 排行榜查询参数 */
export const leaderboardQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly', 'all_time'], { error: 'period 无效' }).default('weekly'),
});

/** 分配角色请求 */
export const assignRoleSchema = z.object({
  pet_id: z.string({ error: 'pet_id 不能为空' }).min(1, 'pet_id 不能为空'),
  role_type: z.enum(
    ['guardian', 'comedian', 'sleepyhead', 'gourmet', 'athlete', 'princess', 'explorer', 'baby'],
    { error: 'role_type 无效' },
  ),
  assignment: z
    .string({ error: 'assignment 不能为空' })
    .min(1, 'assignment 不能为空')
    .max(100, 'assignment 最长 100 字符'),
});

/** 更新角色请求 */
export const updateRoleSchema = z.object({
  assignment: z.string().max(100, 'assignment 最长 100 字符').optional(),
  role_type: z
    .enum(['guardian', 'comedian', 'sleepyhead', 'gourmet', 'athlete', 'princess', 'explorer', 'baby'], {
      error: 'role_type 无效',
    })
    .optional(),
});

// ===== 健康打卡模块 - Query 参数 =====

/** 打卡历史查询参数 */
export const checkinHistoryQuerySchema = z.object({
  days: z.coerce.number().int('days 必须为整数').min(1, 'days 最小为 1').max(365, 'days 最大为 365').default(30),
});

// ===== 症状初筛模块 - Query 参数 =====

/** 症状初筛历史查询参数（分页） */
export const symptomHistoryQuerySchema = z.object({
  page: z.coerce.number().int('page 必须为整数').min(1, 'page 最小为 1').default(1),
  page_size: z.coerce.number().int('page_size 必须为整数').min(1, 'page_size 最小为 1').max(50, 'page_size 最大为 50').default(20),
});

// ===== 时间线模块 - Query 参数 =====

/** 回忆列表查询参数 */
export const timelineMomentsQuerySchema = z.object({
  pet_id: z.string().min(1, 'pet_id 不能为空').optional(),
  family_id: z.string().min(1, 'family_id 不能为空').optional(),
  limit: z.coerce.number().int('limit 必须为整数').min(1, 'limit 最小为 1').max(100, 'limit 最大为 100').default(50),
});

// ===== Agent 模块 - Query 参数 =====

/** Agent 对话历史查询参数 */
export const agentHistoryQuerySchema = z.object({
  petId: z.string().min(1, 'petId 不能为空').optional(),
  limit: z.coerce.number().int('limit 必须为整数').min(1, 'limit 最小为 1').max(100, 'limit 最大为 100').default(20),
});

/** Agent 对话请求 */
export const agentChatSchema = z.object({
  message: z.string({ error: 'message 不能为空' }).trim().min(1, 'message 不能为空').max(2000, '消息过长，最多 2000 字'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(1000),
      }),
    )
    .max(10, 'history 最多 10 条')
    .optional(),
  petId: z.string().min(1, 'petId 不能为空').optional(),
});

// ===== 健康趋势模块 - Query 参数 =====

/** 趋势图查询参数 */
export const trendQuerySchema = z.object({
  type: z.enum(['weight', 'appetite', 'poop'], { error: 'type 必须为 weight, appetite 或 poop' }).default('weight'),
  days: z.coerce.number().int('days 必须为整数').min(1, 'days 最小为 1').max(365, 'days 最大为 365').default(30),
});

/** 月度报告查询参数 */
export const trendReportQuerySchema = z.object({
  year: z.coerce.number().int('year 必须为整数').min(2000, 'year 不合法').max(2100, 'year 不合法').optional(),
  month: z.coerce.number().int('month 必须为整数').min(1, 'month 最小为 1').max(12, 'month 最大为 12').optional(),
});

// ===== 家庭模块 - Query 参数 =====

/** 家庭动态列表查询参数 */
export const familyMomentsQuerySchema = z.object({
  limit: z.coerce.number().int('limit 必须为整数').min(1, 'limit 最小为 1').max(100, 'limit 最大为 100').default(20),
});

/** 家庭新动态查询参数（since 时间戳必填） */
export const familyNewMomentsQuerySchema = z.object({
  since: z.string({ error: 'since 参数不能为空' }).min(1, 'since 参数不能为空'),
});

// ===== 全家福合成模块 =====

/** 全家福生成请求 */
export const generateFamilyPhotoSchema = z.object({
  style: z
    .string({ error: 'style 不能为空' })
    .refine(
      (val) => ['pixar', 'ghibli', 'oil', 'ink', 'nordic', 'cyberpunk'].includes(val),
      { message: 'style 必须为 pixar / ghibli / oil / ink / nordic / cyberpunk 之一' },
    ),
});

// ===== 回忆录模块 - Query 参数 =====

/** 回忆录列表查询参数（分页） */
export const memoirListQuerySchema = z.object({
  page: z.coerce.number().int('page 必须为整数').min(1, 'page 最小为 1').default(1),
  page_size: z.coerce.number().int('page_size 必须为整数').min(1, 'page_size 最小为 1').max(100, 'page_size 最大为 100').default(20),
});

/** 回忆录预览请求 */
export const memoirPreviewSchema = z.object({
  memoir_id: z.string({ error: 'memoir_id 不能为空' }).min(1, 'memoir_id 不能为空'),
});

// ===== 衣橱模块 - Query/Body 参数 =====

/** 衣橱总览查询参数（petId 必填） */
export const wardrobeOverviewQuerySchema = z.object({
  petId: z.string({ error: 'petId 参数不能为空' }).min(1, 'petId 参数不能为空'),
});

/** 配饰列表查询参数（slot 可选枚举） */
export const wardrobeAccessoriesQuerySchema = z.object({
  slot: z.enum(['head', 'neck', 'back', 'body', 'feet'], { error: '无效的槽位参数' }).optional(),
});

/** 装备配饰请求 */
export const wardrobeEquipSchema = z.object({
  petId: z.string({ error: 'petId 参数不能为空' }).min(1, 'petId 参数不能为空'),
  slot: z.string({ error: 'slot 参数不能为空' }).min(1, 'slot 参数不能为空'),
  accessoryId: z.string({ error: 'accessoryId 参数不能为空' }).min(1, 'accessoryId 参数不能为空').max(64, 'accessoryId 过长').regex(/^[a-zA-Z0-9_-]+$/, 'accessoryId 格式不合法'),
});

/** 卸下配饰请求 */
export const wardrobeUnequipSchema = z.object({
  petId: z.string({ error: 'petId 参数不能为空' }).min(1, 'petId 参数不能为空'),
  slot: z.string({ error: 'slot 参数不能为空' }).min(1, 'slot 参数不能为空'),
});

/** 试穿请求 */
export const wardrobeTryOnSchema = z.object({
  petId: z.string({ error: 'petId 参数不能为空' }).min(1, 'petId 参数不能为空'),
  outfitSnapshot: z.record(z.string(), z.unknown(), { error: 'outfitSnapshot 参数不能为空' }),
});

/** 解锁配饰请求 */
export const wardrobeUnlockSchema = z.object({
  accessoryId: z.string({ error: 'accessoryId 参数不能为空' }).min(1, 'accessoryId 参数不能为空').max(64, 'accessoryId 过长').regex(/^[a-zA-Z0-9_-]+$/, 'accessoryId 格式不合法'),
  source: z.string().max(50, 'source 最长 50 字符').optional(),
});

/** 主题套装生成请求 */
export const themeSuiteGenerateSchema = z.object({
  petId: z.string({ error: 'petId 参数不能为空' }).min(1, 'petId 参数不能为空'),
  suiteId: z.string({ error: 'suiteId 参数不能为空' }).min(1, 'suiteId 参数不能为空').max(64, 'suiteId 过长').regex(/^[a-zA-Z0-9_-]+$/, 'suiteId 格式不合法'),
});

// ===== 疫苗模块 - Body 参数 =====

/** 设置疫苗提醒请求 */
export const vaccineReminderSchema = z.object({
  reminder_enabled: z.boolean({ error: '请提供 reminder_enabled 布尔值' }),
});

// ===== 宠物模块 - Body 参数 =====

/** 宠物离世标记请求 */
export const petDeceasedSchema = z.object({
  deceased_date: z.string().min(1, 'deceased_date 不能为空').optional(),
});
