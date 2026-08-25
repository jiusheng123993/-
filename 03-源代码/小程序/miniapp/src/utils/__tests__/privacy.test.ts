/**
 * chooseImageWithPrivacy 单元测试
 *
 * 覆盖场景（对应 privacy.ts 的主动授权模式 + 失败反馈约定）：
 * - 正常：先 wx.requirePrivacyAuthorize（官方标准弹窗）→ chooseMedia →
 *   返回结构适配回 chooseImage 形状（tempFilePaths / tempFiles[].path）
 * - 用户在官方弹窗拒绝授权：toast 提示需要同意隐私指引
 * - 用户取消选图：静默失败（不弹提示）
 * - errno 112（后台未声明隐私接口）：弹 modal 提示开发者
 * - 其他失败：toast 提示选择照片失败
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Taro from '@tarojs/taro'
import { chooseImageWithPrivacy } from '../privacy'

const mockChooseMedia = vi.mocked(Taro.chooseMedia)
const mockShowToast = vi.mocked(Taro.showToast)
const mockShowModal = vi.mocked(Taro.showModal)

// jsdom 无全局 wx，这里注入可控行为（privacy.ts 用 typeof wx 防御，注入后走真机同路径）
const mockWx = globalThis as any

describe('chooseImageWithPrivacy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWx.wx = {
      requirePrivacyAuthorize: vi.fn(({ success }) => success({ errMsg: 'requirePrivacyAuthorize:ok' })),
    }
  })

  afterEach(() => {
    delete mockWx.wx
  })

  it('正常：先过官方授权，再走 chooseMedia 并把结果适配回 chooseImage 形状', async () => {
    mockChooseMedia.mockResolvedValue({
      tempFiles: [
        { tempFilePath: 'wxfile://tmp_abc.jpg', size: 12345 },
        { tempFilePath: 'wxfile://tmp_def.jpg', size: 678 },
      ],
    } as any)

    const res = await chooseImageWithPrivacy({ count: 2, sizeType: ['compressed'] })

    // 官方授权弹窗必须先于选图调用
    expect(mockWx.wx.requirePrivacyAuthorize).toHaveBeenCalledTimes(1)
    expect(mockChooseMedia).toHaveBeenCalledTimes(1)
    expect(mockChooseMedia).toHaveBeenCalledWith(
      expect.objectContaining({ count: 2, mediaType: ['image'], sourceType: ['album', 'camera'] }),
    )
    // 适配层产出调用方依赖的 chooseImage 契约字段
    expect(res.tempFilePaths).toEqual(['wxfile://tmp_abc.jpg', 'wxfile://tmp_def.jpg'])
    expect(res.tempFiles).toEqual([
      { path: 'wxfile://tmp_abc.jpg', size: 12345 },
      { path: 'wxfile://tmp_def.jpg', size: 678 },
    ])
    expect(mockShowToast).not.toHaveBeenCalled()
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('用户在官方弹窗拒绝授权：toast 提示需要同意隐私指引，不再调选图', async () => {
    mockWx.wx.requirePrivacyAuthorize = vi.fn(({ fail }) =>
      fail({ errMsg: 'requirePrivacyAuthorize:fail privacy permission is not authorized' })
    )

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBeTruthy()
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '需要同意《用户隐私保护指引》才能使用此功能' })
    )
    expect(mockChooseMedia).not.toHaveBeenCalled()
  })

  it('用户取消选图：静默失败，不弹提示（正常交互）', async () => {
    const err = { errMsg: 'chooseMedia:fail cancel' }
    mockChooseMedia.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).not.toHaveBeenCalled()
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('errno 112（后台未声明隐私接口）：弹 modal 提示开发者处理', async () => {
    const err = { errno: 112, errMsg: 'chooseMedia:fail api scope is not declared in the privacy agreement' }
    mockChooseMedia.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowModal).toHaveBeenCalledWith(expect.objectContaining({ title: '功能不可用' }))
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('其他失败（如系统相册权限被禁）：toast 提示选择照片失败，不静默', async () => {
    const err = { errMsg: 'chooseMedia:fail system error' }
    mockChooseMedia.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: '选择照片失败，请重试' }))
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('边界：错误对象缺失 errMsg 时按其他失败处理（toast）', async () => {
    const err = { someUnknownField: true }
    mockChooseMedia.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: '选择照片失败，请重试' }))
  })
})
