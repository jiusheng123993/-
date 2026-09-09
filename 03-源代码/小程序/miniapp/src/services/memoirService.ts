/**
 * 回忆录 service 层（B2 前端，2026-09-09 三档定价体系）
 *
 * 此前 memoir 页面直连 Taro.request 且无 service 层，支付为占位实现
 * （调用不存在的 /memoir/pay + 硬编码 99/149）。本层对齐 B1 后端契约：
 * - 素材盘点：GET /api/pets/:petId/memoir/material-check
 * - 照片池：  GET /api/pets/:petId/memoir/photo-pool
 * - 三档价格：GET /api/pets/:petId/membership（memoirPrices 三档表）
 * - 下单：    POST /api/payment/memoir/order（tier + selected_moment_ids 透传）
 * - 拉起支付：复用 platform.requestWechatPayment（微信支付参数直接透传）
 * - 任务获取：支付回调在服务端创建任务，前端轮询 status 端点按「任务 id 变化」识别新任务
 * - 直创建（POST /:petId/memoir）三档恒 402，不再是合法路径——本层不提供该调用
 */
import Taro from '@tarojs/taro'
import { CONFIG } from '../config'
import { storage } from '../utils/storage'
import { api, resolveAvatarUrl } from './api'
import { isWeapp, requestPayment } from '../platform'
import type { MemoirPrices, MemoirTier } from '../utils/memoirTier'

// ==================== 类型定义 ====================

/** 素材盘点中的时光线回忆候选（服务端只返回有描述的回忆） */
export interface MaterialMoment {
  id: string
  type: string
  /** 回忆日期（YYYY-MM-DD） */
  day: string
  /** 描述摘要（≤80 字，服务端截断） */
  summary: string | null
  /** 该回忆是否带照片（TEXT[] 列型，服务端由 array_length 推导） */
  has_photo: boolean
}

/** 素材盘点响应（B1 定稿：统计独立聚合不随候选 LIMIT 截断） */
export interface MaterialCheck {
  /** 档案相册照片数 */
  profile_photo_count: number
  /** 时光线回忆总数 */
  moment_count: number
  /** 有描述的回忆数（可进旁白锚定的候选总量） */
  moment_with_description_count: number
  /** 时光线照片总数 */
  moment_photo_count: number
  /** 有描述的回忆候选（最多 20 条，按日期倒序） */
  moments: MaterialMoment[]
  /** 库内素材建议档位（light/standard/full） */
  suggested_tier: MemoirTier
  /** 建议理由（可直接展示的中文文案） */
  suggestion_reason: string
}

/** 照片池中的时光线照片项 */
export interface PoolMomentPhoto {
  moment_id: string
  day: string
  /** 服务端相对路径 /uploads/...（展示用 resolveAvatarUrl 补全，提交原样透传） */
  url: string
}

/** 照片池响应（档案相册 + 时光线照片两组） */
export interface PhotoPool {
  profile_photos: string[]
  moment_photos: PoolMomentPhoto[]
}

/** 三档价格查询结果（membership 端点 memoirPrices + 会员身份） */
export interface MemoirPricing {
  isMember: boolean
  prices: MemoirPrices | null
}

/** 下单参数（与服务端 createMemoirOrderSchema 对齐；tier 显式必传） */
export interface CreateMemoirOrderParams {
  petId: string
  memoirType: 'daily' | 'memorial' | 'seasonal' | 'milestone' | 'custom'
  tier: MemoirTier
  sourcePhotos: string[]
  sourceText?: string
  musicStyle?: string
  stylePreset?: string
  tags?: string[]
  selectedMomentIds?: string[]
  /** 用户导入的自定义 BGM 公网 URL（有则生成合成优先用，替代内置曲） */
  customBgmUrl?: string
}

/** 下单响应（payment 为微信支付参数，直接透传给 requestPayment） */
export interface MemoirOrderResult {
  orderId: string
  amount: number
  payment: {
    timeStamp: string
    nonceStr: string
    package: string
    signType: string
    paySign: string
  }
}

/** 任务状态响应（status 端点；awaiting_confirmation 为剧本确认闸门） */
export interface MemoirTaskStatus {
  id: string
  // 注意：status 恒为后端 DB 原值（pending/processing/completed/failed）；
  // 剧本确认闸门只用独立布尔字段 awaiting_confirmation 判定（后端不把它放进 status）
  status: 'pending' | 'processing' | 'completed' | 'failed'
  video_url?: string
  awaiting_confirmation?: boolean
  script?: {
    title?: string
    theme?: string
    segments?: Array<{
      photo_index?: number
      duration_sec?: number
      narration?: string
      subtitle?: string
    }> | null
  } | null
}

// ==================== 内部工具 ====================

/**
 * 从业务错误 Error 提取服务端 message（api.ts 已把 code 挂到 err.code）
 * 402 PAYMENT_REQUIRED 时服务端 message 含档位与价格，可直接展示
 */
function businessMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

// ==================== 素材盘点 / 照片池 / 价格 ====================

/**
 * 素材盘点（创建页第一屏）：库内可复用照片数、时光线回忆候选与档位建议
 * @param petId 宠物 ID
 */
export async function getMaterialCheck(petId: string): Promise<MaterialCheck> {
  if (CONFIG.USE_MOCK) {
    // Mock 模式：返回静态演示数据（开发/预览环境无后端）
    return {
      profile_photo_count: 6,
      moment_count: 4,
      moment_with_description_count: 3,
      moment_photo_count: 8,
      moments: [
        { id: 'mock-m1', type: 'diary', day: '2026-09-01', summary: '第一次去公园，追着蝴蝶跑了半天', has_photo: true },
        { id: 'mock-m2', type: 'milestone', day: '2026-08-20', summary: '学会握手啦', has_photo: false },
        { id: 'mock-m3', type: 'memory', day: '2026-08-01', summary: '洗澡后吹毛像只小狮子', has_photo: true },
      ],
      suggested_tier: 'standard',
      suggestion_reason: '照片 14 张，满足标准回忆录（5-7 张）',
    }
  }
  try {
    return await api.get<MaterialCheck>(`/api/pets/${petId}/memoir/material-check`)
  } catch (err) {
    // 404 宠物不存在 / 401 已由 api 层处理；其余透传给页面 toast
    throw new Error(businessMessage(err, '素材盘点失败，请重试'))
  }
}

/**
 * 库内照片池（选照片-库内勾选步骤）：档案相册 + 时光线照片，统一为可直接勾选的 URL
 * 展示用绝对地址（resolveAvatarUrl 补全）；提交时用 Raw 原始值
 * （source_photos 白名单只信任 /uploads/ 相对路径与本站绝对 URL，透传原始值最稳）
 * @param petId 宠物 ID
 */
export async function getPhotoPool(petId: string): Promise<PhotoPool & { profilePhotosRaw: string[]; momentPhotosRaw: PoolMomentPhoto[] }> {
  if (CONFIG.USE_MOCK) {
    const mockPool: PhotoPool = {
      profile_photos: [
        `${CONFIG.API_BASE_URL}/uploads/mock/pool1.jpg`,
        `${CONFIG.API_BASE_URL}/uploads/mock/pool2.jpg`,
        `${CONFIG.API_BASE_URL}/uploads/mock/pool3.jpg`,
      ],
      moment_photos: [
        { moment_id: 'mock-m1', day: '2026-09-01', url: `${CONFIG.API_BASE_URL}/uploads/mock/mp1.jpg` },
      ],
    }
    return { ...mockPool, profilePhotosRaw: mockPool.profile_photos, momentPhotosRaw: mockPool.moment_photos }
  }
  try {
    const pool = await api.get<PhotoPool>(`/api/pets/${petId}/memoir/photo-pool`)
    // 展示用绝对地址；提交用服务端原始值
    const profilePhotosRaw = pool.profile_photos
    const momentPhotosRaw = pool.moment_photos
    return {
      profile_photos: profilePhotosRaw.map((u) => resolveAvatarUrl(u)),
      moment_photos: momentPhotosRaw.map((m) => ({ ...m, url: resolveAvatarUrl(m.url) })),
      profilePhotosRaw,
      momentPhotosRaw,
    }
  } catch (err) {
    throw new Error(businessMessage(err, '照片池加载失败，请重试'))
  }
}

/**
 * 三档价格与会员身份（确认页三档卡取价）
 * 复用 membership 端点（B1 已把旧两档 memoirPrice/memberPrice 换成 memoirPrices 三档表）
 * @param petId 宠物 ID
 */
export async function getMemoirPricing(petId: string): Promise<MemoirPricing> {
  if (CONFIG.USE_MOCK) {
    return {
      isMember: false,
      prices: {
        light: { member: 1890, free: 2590 },
        standard: { member: 4500, free: 5900 },
        full: { member: 7900, free: 9900 },
      },
    }
  }
  try {
    const res = await api.get<{ isMember: boolean; memoirPrices?: MemoirPrices }>(
      `/api/pets/${petId}/membership`,
    )
    return { isMember: !!res.isMember, prices: res.memoirPrices ?? null }
  } catch {
    // 价格查询失败不阻断流程：确认页可继续浏览，支付时以下单响应 amount 为准
    return { isMember: false, prices: null }
  }
}

// ==================== 本地照片上传 ====================

/**
 * 上传本地照片到服务器（返回 /uploads/... 相对路径，可进 source_photos）
 * ⚠️ 隐藏 P0 修复（2026-09-09）：此前页面直接把 wxfile:// 临时路径塞进 source_photos，
 * 被服务端 memoirPhotoUrlSchema 白名单拒绝（仅 /uploads/ 与本站 http(s)）——生产视频链
 * 从未跑通与此吻合。复用时光线照片上传端点（multer 单文件 + uploadLimiter）。
 * @param filePath 本地临时路径（chooseImage/chooseMedia 返回）
 * @returns 服务端相对路径（如 /uploads/moment-photos/{userId}/xxx.jpg）
 */
export async function uploadLocalPhoto(filePath: string): Promise<string> {
  const token = storage.getToken()
  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${CONFIG.API_BASE_URL}/api/timeline/photo/upload`,
      filePath,
      name: 'photo',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as { success?: boolean; data?: { url?: string }; message?: string }
          if (body.success && body.data?.url) {
            resolve(body.data.url)
          } else {
            reject(new Error(body.message || '照片上传失败'))
          }
        } catch {
          reject(new Error('照片上传失败，请重试'))
        }
      },
      fail: () => reject(new Error('照片上传失败，请检查网络')),
    })
  })
}

/**
 * 上传用户导入的 BGM 音频（2026-09-09）：微信选音频 → multipart 上传 → 返回公网 URL。
 * 版权归用户（前端已放置"请确认拥有授权"提示），服务端仅存音频供生成合成使用。
 */
export async function uploadMemoirBgm(petId: string, filePath: string): Promise<string> {
  const token = storage.getToken()
  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${CONFIG.API_BASE_URL}/api/pets/${petId}/memoir/bgm/upload`,
      filePath,
      name: 'audio',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as { success?: boolean; data?: { url?: string }; message?: string }
          if (body.success && body.data?.url) {
            resolve(body.data.url)
          } else {
            reject(new Error(body.message || '音频上传失败'))
          }
        } catch {
          reject(new Error('音频上传失败，请重试'))
        }
      },
      fail: () => reject(new Error('音频上传失败，请检查网络')),
    })
  })
}

// ==================== 支付链（下单 → 微信支付 → 任务轮询） ====================

/**
 * BGM key → 后端 music_style 枚举映射（审查 P0 收口：两页共享一处定义，
 * 防止「一处对一处漏」——daily 页曾漏映射直传 piano/guitar 等被 schema 400 拒绝）
 * 已知 BGM key（piano/guitar/strings/upbeat）映射；未知值原样透传（兼容直传后端枚举）
 */
const BGM_KEY_TO_MUSIC_STYLE: Record<string, string> = {
  piano: 'peaceful',
  guitar: 'warm',
  strings: 'nostalgic',
  upbeat: 'cheerful',
}

/** 供测试锁死映射（与页面 BGM_OPTIONS key 一致） */
export function mapBGMKeyToMusicStyle(bgmKey: string): string {
  return BGM_KEY_TO_MUSIC_STYLE[bgmKey] ?? bgmKey
}

/**
 * 创建回忆录付费订单（B1 契约：三档一律付费，响应含微信支付参数）
 * @param params 下单参数（petId/tier/sourcePhotos 必填；musicStyle 传页面 BGM key，内部转换）
 */
export async function createMemoirOrder(params: CreateMemoirOrderParams): Promise<MemoirOrderResult> {
  if (CONFIG.USE_MOCK) {
    // Mock 模式：跳过真实支付，直接返回可「支付成功」的假单
    return {
      orderId: `mock_order_${Date.now()}`,
      amount: params.tier === 'full' ? 9900 : params.tier === 'standard' ? 5900 : 2590,
      payment: { timeStamp: '0', nonceStr: 'mock', package: 'prepay_id=mock', signType: 'RSA', paySign: 'mock' },
    }
  }
  try {
    const res = await api.post<{
      need_payment: boolean
      amount: number
      payment: MemoirOrderResult['payment'] & { orderId: string }
    }>('/api/payment/memoir/order', {
      pet_id: params.petId,
      memoir_type: params.memoirType,
      tier: params.tier,
      source_photos: params.sourcePhotos,
      source_text: params.sourceText,
      // BGM key → 后端枚举（warm/nostalgic/cheerful/peaceful）转换统一在此
      music_style: params.musicStyle ? mapBGMKeyToMusicStyle(params.musicStyle) : undefined,
      style_preset: params.stylePreset,
      tags: params.tags,
      selected_moment_ids: params.selectedMomentIds,
    })
    if (!res?.payment?.orderId) {
      throw new Error('下单响应异常，请重试')
    }
    return { orderId: res.payment.orderId, amount: res.amount, payment: res.payment }
  } catch (err) {
    // 402/400/409 均透传服务端 message（含档位价格/校验原因/并发任务提示）
    throw new Error(businessMessage(err, '下单失败，请重试'))
  }
}

/**
 * 拉起微信支付（支付参数为下单响应原样透传）
 * @returns true=支付流程完成（不等于支付成功，需轮询确认）；false=用户取消
 */
export async function payWithWechat(payment: MemoirOrderResult['payment']): Promise<boolean> {
  if (CONFIG.USE_MOCK) return true
  if (!isWeapp()) {
    throw new Error('微信支付仅支持小程序环境')
  }
  return requestPayment({
    timeStamp: payment.timeStamp,
    nonceStr: payment.nonceStr,
    package: payment.package,
    signType: payment.signType,
    paySign: payment.paySign,
  })
}

/**
 * 支付成功后等待任务出现（支付回调在服务端创建任务，存在 1~10s 异步延迟）
 *
 * 新任务识别：提交前快照「当前最新任务 id」（preTaskId，无任务为 null），
 * 轮询中 latest.id !== preTaskId 即认定回调创建的新任务已出现——
 * 防止旧任务干扰（findLatestByPetId 不区分新旧，仅对比 id 最稳）。
 *
 * @param petId 宠物 ID
 * @param preTaskId 提交前的最新任务 id（无任务传 null）
 * @param opts.maxAttempts 轮询次数上限（默认 45 次 × 2s = 90s）
 * @param opts.onTick 每次轮询回调（可用于刷新 UI 计时）
 * @returns 新任务状态；超时返回 null（提示用户稍后查看）
 */
export async function waitForNewTask(
  petId: string,
  preTaskId: string | null,
  opts: { maxAttempts?: number; intervalMs?: number; onTick?: (elapsed: number) => void } = {},
): Promise<MemoirTaskStatus | null> {
  const maxAttempts = opts.maxAttempts ?? 45
  const intervalMs = opts.intervalMs ?? 2000

  for (let i = 0; i < maxAttempts; i++) {
    if (opts.onTick) opts.onTick((i + 1) * intervalMs)
    try {
      const task = await api.get<MemoirTaskStatus>(`/api/pets/${petId}/memoir/status`)
      // 服务端返回 latest 任务；id 与提交前快照不同 = 回调创建的新任务
      if (task?.id && task.id !== preTaskId) {
        return normalizeTaskStatus(task)
      }
    } catch {
      // 404（暂无任务）/网络抖动：继续轮询
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return null
}

/**
 * 任务状态规范化：video_url 相对路径补全为绝对地址
 * （后端 videoUrl = publicBaseUrl + /uploads/...，生产为绝对 URL；
 *  但 publicBaseUrl 未配置时是相对路径，<Image>/previewMedia 需要绝对地址）
 * @param task 服务端返回的任务状态
 */
function normalizeTaskStatus(task: MemoirTaskStatus): MemoirTaskStatus {
  if (!task) return task
  return {
    ...task,
    video_url: task.video_url ? resolveAvatarUrl(task.video_url) : task.video_url,
  }
}

/**
 * 支付前快照最新任务 id（严格模式，审查 P0 修复：区分「无任务(404)」与「网络失败」）：
 * - 无任务（服务端 404，返回体 success=false）→ null（可安全作为 preTaskId）——
 *   首次购买用户（最常见人群）必走此分支，绝不能阻断其支付
 * - 网络失败（无 statusCode / 非 404）→ 重试 3 次；仍失败返回 undefined（调用方必须阻断支付——
 *   置 null 会把库内旧任务误判为新任务，新订单反被并发互斥自动退款）
 * @param petId 宠物 ID
 */
export async function snapshotLatestTaskId(petId: string): Promise<string | null | undefined> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const task = await api.get<MemoirTaskStatus>(`/api/pets/${petId}/memoir/status`)
      return task?.id ?? null
    } catch (err) {
      // 404 = 服务端确认「暂无任务」：直接返回 null，不重试
      if (err instanceof Error && (err as Error & { statusCode?: number }).statusCode === 404) {
        return null
      }
      // 网络失败重试（间隔 1s）
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  return undefined
}

/**
 * 查询最新任务状态（生成进度轮询；与旧页面轮询逻辑同契约）
 * @param petId 宠物 ID
 */
export async function getLatestStatus(petId: string): Promise<MemoirTaskStatus | null> {
  try {
    const task = await api.get<MemoirTaskStatus>(`/api/pets/${petId}/memoir/status`)
    return task ? normalizeTaskStatus(task) : null
  } catch {
    // 无任务（404）或瞬时网络错误：返回 null 由调用方继续/终止轮询
    return null
  }
}

/**
 * 确认分镜剧本（剧本确认闸门：确认后任务回队，此时才发生视频生成成本）
 * @param petId 宠物 ID
 * @param taskId 任务 ID
 */
export async function confirmScript(petId: string, taskId: string): Promise<void> {
  await api.post(`/api/pets/${petId}/memoir/${taskId}/confirm`)
}

/**
 * 放弃分镜剧本（视频生成前放弃，不产生视频费用；服务端自动退款付费订单）
 * @param petId 宠物 ID
 * @param taskId 任务 ID
 */
export async function rejectScript(petId: string, taskId: string): Promise<void> {
  await api.post(`/api/pets/${petId}/memoir/${taskId}/reject`)
}

// ==================== 提示词人机协同（2026-09-09 块①） ====================

/** 单段分镜提示词（与后端 MemoirSegmentScript 字段对齐） */
export interface PromptSegment {
  photo_index: number
  seedance_prompt: string
  narration?: string
  shot_type?: string
  camera?: string
  lighting?: string
  transition?: string
  duration_sec?: number
}

/** 完整分镜脚本（提示词预览/确认用） */
export interface MemoirPromptScript {
  title: string
  theme: string
  emotion_curve?: string[]
  music_mood?: string
  segments: PromptSegment[]
  [k: string]: unknown
}

/** 生成前提示词预览入参（与 createMemoirOrder 一致的素材/风格） */
export interface PromptPreviewParams {
  memoir_type: string
  tier: string
  source_photos: string[]
  source_text?: string
  music_style?: string
  style_preset?: string
  selected_moment_ids?: string[]
  tags?: string[]
}

/**
 * 生成前提示词预览：按 照片+画风+BGM 取「将用提示词」给用户看（防扯皮第一环）。
 * 不落库/不创建任务/不产生支付；触发服务端视觉+LLM（有成本，服务端已限流）。
 */
export async function getPromptPreview(petId: string, params: PromptPreviewParams): Promise<MemoirPromptScript> {
  return api.post<MemoirPromptScript>(`/api/pets/${petId}/memoir/prompt-preview`, params)
}

/**
 * 提示词改写：用户对当前提示词提修改要求 → LLM 出下一版（预览给第一版，本方法出二版/三版…）。
 */
export async function refinePrompt(
  petId: string,
  segments: PromptSegment[],
  userRequest: string,
): Promise<PromptSegment[]> {
  return api.post<PromptSegment[]>(`/api/pets/${petId}/memoir/prompt-refine`, {
    segments,
    user_request: userRequest,
  })
}

/**
 * 提示词确认：用户确认「这就是最终版提示词」→ 服务端按 (user,pet,tier) 留存作证，
 * 生成管线将优先采用该确认版（不再重新生成）。
 */
export async function confirmPrompt(
  petId: string,
  tier: string,
  script: MemoirPromptScript,
): Promise<{ confirmed: boolean }> {
  return api.post<{ confirmed: boolean }>(`/api/pets/${petId}/memoir/prompt-confirm`, { tier, script })
}
