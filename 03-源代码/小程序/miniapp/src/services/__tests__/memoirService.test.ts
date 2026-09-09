/**
 * 回忆录 service 层测试（B2 前端）
 * 覆盖：下单参数 snake_case 映射 / 402 message 透传 / 照片池 URL 补全且提交保留原始路径 /
 * 新任务识别（id 快照对比）/ 上传成功失败 / mock 模式分支
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMaterialCheck,
  getPhotoPool,
  getMemoirPricing,
  createMemoirOrder,
  payWithWechat,
  waitForNewTask,
  uploadLocalPhoto,
  getLatestStatus,
  snapshotLatestTaskId,
  confirmScript,
  rejectScript,
  getPromptPreview,
  refinePrompt,
  confirmPrompt,
} from '../memoirService'

// vi.mock 工厂提升到 const 声明前执行 —— 必须用 vi.hoisted 共享 mock 实例（项目既有模式）
const { mockApi, mockRequestPayment, mockUploadFile } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn() },
  mockRequestPayment: vi.fn(),
  mockUploadFile: vi.fn(),
}))

// api 层 mock（业务请求都走它；USE_MOCK 判定也在其 config 依赖里）
vi.mock('../api', () => ({
  api: mockApi,
  resolveAvatarUrl: (u: string) => (u?.startsWith('/') ? `https://api.test.com${u}` : u),
}))

// platform mock（requestPayment 只断言参数透传，不触 Taro）——platform 在 src/platform，从本文件需 ../../
vi.mock('../../platform', () => ({
  isWeapp: () => true,
  requestPayment: (...args: unknown[]) => mockRequestPayment(...args),
}))

// Taro mock（uploadFile 用）
vi.mock('@tarojs/taro', () => ({
  default: { uploadFile: (...args: unknown[]) => mockUploadFile(...args) },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMaterialCheck 素材盘点', () => {
  it('透传服务端数据', async () => {
    const data = {
      profile_photo_count: 8,
      moment_count: 4,
      moment_with_description_count: 3,
      moment_photo_count: 5,
      moments: [{ id: 'm1', type: 'diary', day: '2026-09-01', summary: '回忆', has_photo: true }],
      suggested_tier: 'full',
      suggestion_reason: '素材充足',
    }
    mockApi.get.mockResolvedValueOnce(data)

    const res = await getMaterialCheck('pet-1')
    expect(mockApi.get).toHaveBeenCalledWith('/api/pets/pet-1/memoir/material-check')
    expect(res.suggested_tier).toBe('full')
    expect(res.moments).toHaveLength(1)
  })

  it('服务端错误透传 message（402/404 等）', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('宠物不存在'))
    await expect(getMaterialCheck('pet-x')).rejects.toThrow('宠物不存在')
  })

  it('非 Error 异常兜底默认文案', async () => {
    mockApi.get.mockRejectedValueOnce('boom')
    await expect(getMaterialCheck('pet-1')).rejects.toThrow('素材盘点失败，请重试')
  })
})

describe('getPhotoPool 照片池', () => {
  it('展示 URL 补全为绝对地址，同时保留原始相对路径供提交', async () => {
    mockApi.get.mockResolvedValueOnce({
      profile_photos: ['/uploads/profile/a.jpg'],
      moment_photos: [{ moment_id: 'm1', day: '2026-09-01', url: '/uploads/moment-photos/u1/b.jpg' }],
    })

    const res = await getPhotoPool('pet-1')
    expect(res.profile_photos[0]).toBe('https://api.test.com/uploads/profile/a.jpg')
    expect(res.moment_photos[0].url).toBe('https://api.test.com/uploads/moment-photos/u1/b.jpg')
    // 提交用原始值（source_photos 白名单信任 /uploads/ 相对路径）
    expect(res.momentPhotosRaw[0].url).toBe('/uploads/moment-photos/u1/b.jpg')
    expect(res.momentPhotosRaw[0].moment_id).toBe('m1')
  })
})

describe('getMemoirPricing 三档价格', () => {
  it('透传 isMember 与 memoirPrices', async () => {
    const prices = {
      light: { member: 1890, free: 2590 },
      standard: { member: 4500, free: 5900 },
      full: { member: 7900, free: 9900 },
    }
    mockApi.get.mockResolvedValueOnce({ isMember: true, memoirPrices: prices })

    const res = await getMemoirPricing('pet-1')
    expect(res.isMember).toBe(true)
    expect(res.prices?.full.member).toBe(7900)
  })

  it('价格查询失败不阻断流程（容错返回 null 价格）', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('网络异常'))
    const res = await getMemoirPricing('pet-1')
    expect(res.isMember).toBe(false)
    expect(res.prices).toBeNull()
  })

  it('响应缺 memoirPrices 容错（旧版后端兼容）', async () => {
    mockApi.get.mockResolvedValueOnce({ isMember: false })
    const res = await getMemoirPricing('pet-1')
    expect(res.prices).toBeNull()
  })
})

describe('createMemoirOrder 下单', () => {
  it('驼峰参数映射为 snake_case 契约字段，提取 orderId', async () => {
    mockApi.post.mockResolvedValueOnce({
      need_payment: true,
      amount: 5900,
      payment: { timeStamp: '1', nonceStr: 'n', package: 'prepay_id=x', signType: 'RSA', paySign: 's', orderId: 'order-9' },
    })

    const res = await createMemoirOrder({
      petId: 'pet-1',
      memoirType: 'memorial',
      tier: 'standard',
      sourcePhotos: ['/uploads/a.jpg'],
      sourceText: '我们的故事',
      tags: ['daily'],
      selectedMomentIds: ['3f2b8a1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b'],
    })

    expect(res.orderId).toBe('order-9')
    expect(res.amount).toBe(5900)
    expect(mockApi.post).toHaveBeenCalledWith('/api/payment/memoir/order', {
      pet_id: 'pet-1',
      memoir_type: 'memorial',
      tier: 'standard',
      source_photos: ['/uploads/a.jpg'],
      source_text: '我们的故事',
      music_style: undefined,
      style_preset: undefined,
      tags: ['daily'],
      selected_moment_ids: ['3f2b8a1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b'],
    })
  })

  it('402 PAYMENT_REQUIRED 透传服务端 message（含档位价格）', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('轻纪念需付费生成（会员价：18.9元）'))
    await expect(
      createMemoirOrder({ petId: 'pet-1', memoirType: 'daily', tier: 'light', sourcePhotos: ['/uploads/a.jpg'] }),
    ).rejects.toThrow('轻纪念需付费生成（会员价：18.9元）')
  })

  it('响应缺 payment.orderId 视为异常', async () => {
    mockApi.post.mockResolvedValueOnce({ need_payment: true, amount: 100 })
    await expect(
      createMemoirOrder({ petId: 'pet-1', memoirType: 'daily', tier: 'light', sourcePhotos: ['/uploads/a.jpg'] }),
    ).rejects.toThrow('下单响应异常')
  })
})

describe('payWithWechat 拉起支付', () => {
  const payment = { timeStamp: '1', nonceStr: 'n', package: 'prepay_id=x', signType: 'RSA', paySign: 's' }

  it('支付参数原样透传给 platform.requestPayment', async () => {
    mockRequestPayment.mockResolvedValueOnce(true)
    const ok = await payWithWechat(payment)
    expect(ok).toBe(true)
    expect(mockRequestPayment).toHaveBeenCalledWith(payment)
  })

  it('用户取消返回 false', async () => {
    mockRequestPayment.mockResolvedValueOnce(false)
    expect(await payWithWechat(payment)).toBe(false)
  })
})

describe('waitForNewTask 新任务识别（id 快照对比防旧任务干扰）', () => {
  it('latest.id 与提交前快照不同 → 识别为新任务', async () => {
    mockApi.get.mockResolvedValueOnce({ id: 'task-new', status: 'pending' })
    const task = await waitForNewTask('pet-1', 'task-old', { intervalMs: 1, maxAttempts: 3 })
    expect(task?.id).toBe('task-new')
  })

  it('快照为 null（此前无任务）→ 任何任务出现即新任务', async () => {
    mockApi.get.mockResolvedValueOnce({ id: 'task-first', status: 'pending' })
    const task = await waitForNewTask('pet-1', null, { intervalMs: 1, maxAttempts: 3 })
    expect(task?.id).toBe('task-first')
  })

  it('latest.id 与快照相同（旧任务）→ 跳过继续轮询', async () => {
    mockApi.get
      .mockResolvedValueOnce({ id: 'task-old', status: 'completed' }) // 旧任务，跳过
      .mockResolvedValueOnce({ id: 'task-old', status: 'completed' }) // 仍旧任务
      .mockResolvedValueOnce({ id: 'task-new', status: 'pending' }) // 新任务出现
    const task = await waitForNewTask('pet-1', 'task-old', { intervalMs: 1, maxAttempts: 5 })
    expect(task?.id).toBe('task-new')
  })

  it('无任务（404→null）持续轮询，超时返回 null', async () => {
    mockApi.get.mockResolvedValue(null)
    const task = await waitForNewTask('pet-1', null, { intervalMs: 1, maxAttempts: 3 })
    expect(task).toBeNull()
    expect(mockApi.get).toHaveBeenCalledTimes(3)
  })
})

describe('uploadLocalPhoto 本地照片上传', () => {
  it('上传成功返回服务端相对路径', async () => {
    mockUploadFile.mockImplementationOnce(({ success }: { success: (r: { data: string }) => void }) => {
      success({ data: JSON.stringify({ success: true, data: { url: '/uploads/moment-photos/u1/x.jpg' } }) })
    })
    const url = await uploadLocalPhoto('wxfile://tmp/x.jpg')
    expect(url).toBe('/uploads/moment-photos/u1/x.jpg')
  })

  it('上传失败抛出服务端 message', async () => {
    mockUploadFile.mockImplementationOnce(({ success }: { success: (r: { data: string }) => void }) => {
      success({ data: JSON.stringify({ success: false, message: '文件过大' }) })
    })
    await expect(uploadLocalPhoto('wxfile://tmp/x.jpg')).rejects.toThrow('文件过大')
  })

  it('响应非 JSON 容错', async () => {
    mockUploadFile.mockImplementationOnce(({ success }: { success: (r: { data: string }) => void }) => {
      success({ data: '<html>502</html>' })
    })
    await expect(uploadLocalPhoto('wxfile://tmp/x.jpg')).rejects.toThrow('照片上传失败，请重试')
  })

  it('网络失败统一文案', async () => {
    mockUploadFile.mockImplementationOnce(({ fail }: { fail: () => void }) => {
      fail()
    })
    await expect(uploadLocalPhoto('wxfile://tmp/x.jpg')).rejects.toThrow('照片上传失败，请检查网络')
  })
})

// ==================== 审查补充：BGM 映射锁 + 零覆盖函数 ====================

describe('mapBGMKeyToMusicStyle BGM key → 后端枚举映射（审查 P0 锁：daily 曾漏映射直传 piano 被 schema 400）', () => {
  it('四个 BGM key 均映射到后端枚举值', async () => {
    const { mapBGMKeyToMusicStyle } = await import('../memoirService')
    expect(mapBGMKeyToMusicStyle('piano')).toBe('peaceful')
    expect(mapBGMKeyToMusicStyle('guitar')).toBe('warm')
    expect(mapBGMKeyToMusicStyle('strings')).toBe('nostalgic')
    expect(mapBGMKeyToMusicStyle('upbeat')).toBe('cheerful')
  })

  it('未知值原样透传（兼容直传后端枚举）', async () => {
    const { mapBGMKeyToMusicStyle } = await import('../memoirService')
    expect(mapBGMKeyToMusicStyle('warm')).toBe('warm')
  })

  it('createMemoirOrder 请求体 music_style 为转换后的枚举值', async () => {
    mockApi.post.mockResolvedValueOnce({
      payment: { orderId: 'ord-1', timeStamp: '0', nonceStr: 'n', package: 'p', signType: 'RSA', paySign: 's' },
      amount: 2590,
    })
    await createMemoirOrder({
      petId: 'pet-1', memoirType: 'daily', tier: 'light',
      sourcePhotos: ['/uploads/a.jpg'], musicStyle: 'piano',
    })
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/payment/memoir/order',
      expect.objectContaining({ music_style: 'peaceful' }),
    )
  })
})

describe('getLatestStatus / snapshotLatestTaskId / confirmScript / rejectScript（审查补充零覆盖）', () => {
  it('getLatestStatus 正常透传并规范化 video_url 相对路径', async () => {
    mockApi.get.mockResolvedValueOnce({ id: 't1', status: 'completed', video_url: '/uploads/memoir/t1/final.mp4' })
    const task = await getLatestStatus('pet-1')
    expect(task?.id).toBe('t1')
    expect(task?.video_url).toBe('https://api.test.com/uploads/memoir/t1/final.mp4')
  })

  it('getLatestStatus 无任务/网络失败返回 null 不抛错', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('404'))
    expect(await getLatestStatus('pet-1')).toBeNull()
  })

  it('snapshotLatestTaskId：有任务返回 id', async () => {
    mockApi.get.mockResolvedValueOnce({ id: 'task-old', status: 'pending' })
    expect(await snapshotLatestTaskId('pet-1')).toBe('task-old')
  })

  it('snapshotLatestTaskId：服务端 404（暂无任务）返回 null（首次购买用户不被阻断——审查 P0 修复锁）', async () => {
    // 模拟 api.ts 真实行为：404 返回体 success=false → 抛带 statusCode 的 Error（不会 resolve null）
    mockApi.get.mockRejectedValue(
      Object.assign(new Error('暂无回忆录任务'), { statusCode: 404 }),
    )
    expect(await snapshotLatestTaskId('pet-1')).toBeNull()
  })

  it('snapshotLatestTaskId：网络失败重试后仍失败返回 undefined（调用方须阻断支付）', async () => {
    mockApi.get.mockRejectedValue(new Error('request:fail'))
    expect(await snapshotLatestTaskId('pet-1')).toBeUndefined()
  })

  it('confirmScript / rejectScript 请求正确的确认与放弃端点', async () => {
    mockApi.post.mockResolvedValue({})
    await confirmScript('pet-1', 'task-9')
    expect(mockApi.post).toHaveBeenNthCalledWith(1, '/api/pets/pet-1/memoir/task-9/confirm')
    await rejectScript('pet-1', 'task-9')
    expect(mockApi.post).toHaveBeenNthCalledWith(2, '/api/pets/pet-1/memoir/task-9/reject')
  })
})

describe('提示词人机协同三接口（2026-09-09 块①前端封装）', () => {
  it('getPromptPreview 走 prompt-preview 端点并透传素材/风格', async () => {
    mockApi.post.mockResolvedValueOnce({ title: 'T', segments: [{ photo_index: 0, seedance_prompt: '一只橘猫' }] })
    const r = await getPromptPreview('pet-1', {
      memoir_type: 'memorial', tier: 'standard',
      source_photos: ['/uploads/a.jpg'], music_style: 'warm', style_preset: 'cinematic',
    })
    expect(r.segments[0].photo_index).toBe(0)
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/pets/pet-1/memoir/prompt-preview',
      expect.objectContaining({ memoir_type: 'memorial', tier: 'standard', style_preset: 'cinematic' }),
    )
  })

  it('refinePrompt 走 prompt-refine 端点并携带用户修改要求', async () => {
    mockApi.post.mockResolvedValueOnce([{ photo_index: 0, seedance_prompt: '更温馨的黄昏猫' }])
    const r = await refinePrompt('pet-1', [{ photo_index: 0, seedance_prompt: 'old' }], '氛围更温馨')
    expect(r[0].seedance_prompt).toContain('温馨')
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/pets/pet-1/memoir/prompt-refine',
      expect.objectContaining({ user_request: '氛围更温馨' }),
    )
  })

  it('confirmPrompt 走 prompt-confirm 端点并携带 tier 与确认版脚本', async () => {
    mockApi.post.mockResolvedValueOnce({ confirmed: true })
    const r = await confirmPrompt('pet-1', 'standard', { title: 'T', theme: '陪伴', segments: [{ photo_index: 0, seedance_prompt: 's' }] })
    expect(r.confirmed).toBe(true)
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/pets/pet-1/memoir/prompt-confirm',
      expect.objectContaining({ tier: 'standard' }),
    )
  })
})
