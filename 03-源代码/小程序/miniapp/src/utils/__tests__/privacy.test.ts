/**
 * chooseImageWithPrivacy 单元测试
 *
 * 覆盖场景（对应 privacy.ts 的失败反馈约定 + chooseMedia 迁移契约）：
 * - 正常选图：内部调 chooseMedia（chooseImage 已随基础库 2.21.0+ 废弃），
 *   返回结构适配回 chooseImage 形状（tempFilePaths / tempFiles[].path）
 * - 用户主动取消：静默失败（不弹提示）
 * - errno 112（后台未声明隐私接口）：弹 modal 提示开发者
 * - 用户拒绝隐私授权：toast 提示需要同意隐私指引
 * - 其他失败（系统相册权限被禁等）：toast 提示选择照片失败
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Taro from '@tarojs/taro'
import { chooseImageWithPrivacy } from '../privacy'

// setup.ts 已全局 mock @tarojs/taro（chooseMedia/showToast/showModal 均为 vi.fn()，
// getEnv → 'WEAPP' 故 isWeapp() 为 true，走微信端 chooseMedia 分支），
// 这里直接通过 vi.mocked 注入各场景行为
const mockChooseMedia = vi.mocked(Taro.chooseMedia)
const mockShowToast = vi.mocked(Taro.showToast)
const mockShowModal = vi.mocked(Taro.showModal)

describe('chooseImageWithPrivacy', () => {
  beforeEach(() => {
    // 每个用例前清空调用记录与 mock 实现，避免用例间相互污染
    vi.clearAllMocks()
  })

  it('正常：已授权用户选图，内部走 chooseMedia 并把结果适配回 chooseImage 形状', async () => {
    // chooseMedia 真实返回形状：tempFiles[].tempFilePath（无顶层 tempFilePaths）
    mockChooseMedia.mockResolvedValue({
      tempFiles: [
        { tempFilePath: 'wxfile://tmp_abc.jpg', size: 12345 },
        { tempFilePath: 'wxfile://tmp_def.jpg', size: 678 },
      ],
    } as any)

    const res = await chooseImageWithPrivacy({ count: 2, sizeType: ['compressed'] })

    // 适配层必须产出调用方依赖的 chooseImage 契约字段
    expect(res.tempFilePaths).toEqual(['wxfile://tmp_abc.jpg', 'wxfile://tmp_def.jpg'])
    expect(res.tempFiles).toEqual([
      { path: 'wxfile://tmp_abc.jpg', size: 12345 },
      { path: 'wxfile://tmp_def.jpg', size: 678 },
    ])
    // 底层必须已是替代接口且锁定图片类型（防回退到废弃 API）
    expect(mockChooseMedia).toHaveBeenCalledWith(
      expect.objectContaining({ count: 2, mediaType: ['image'], sourceType: ['album', 'camera'] }),
    )
    expect(mockShowToast).not.toHaveBeenCalled()
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('用户主动取消：静默失败，不弹提示（正常交互）', async () => {
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

  it('用户拒绝隐私授权：toast 提示需要同意隐私指引', async () => {
    const err = { errMsg: 'chooseMedia:fail privacy permission is not authorized' }
    mockChooseMedia.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '需要同意《用户隐私保护指引》才能使用此功能' })
    )
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('其他失败（如系统相册权限被禁）：toast 提示选择照片失败，不静默', async () => {
    const err = { errMsg: 'chooseMedia:fail system error' }
    mockChooseMedia.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: '选择照片失败，请重试' }))
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('边界：错误对象缺失 errMsg 时按其他失败处理（toast）', async () => {
    // 极低概率：Taro 抛出的错误对象结构异常，仍应给出反馈而非静默
    const err = { someUnknownField: true }
    mockChooseMedia.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: '选择照片失败，请重试' }))
  })
})
