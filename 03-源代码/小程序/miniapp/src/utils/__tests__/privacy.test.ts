/**
 * chooseImageWithPrivacy 单元测试
 *
 * 覆盖场景（对应 privacy.ts 的失败反馈约定）：
 * - 正常选图：直接返回 chooseImage 结果，不弹任何提示
 * - 用户主动取消：静默失败（不弹提示）
 * - errno 112（后台未声明隐私接口）：弹 modal 提示开发者
 * - 用户拒绝隐私授权：toast 提示需要同意隐私指引
 * - 其他失败（系统相册权限被禁等）：toast 提示选择照片失败
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Taro from '@tarojs/taro'
import { chooseImageWithPrivacy } from '../privacy'

// setup.ts 已全局 mock @tarojs/taro（chooseImage/showToast/showModal 均为 vi.fn()），
// 这里直接通过 vi.mocked 注入各场景行为
const mockChooseImage = vi.mocked(Taro.chooseImage)
const mockShowToast = vi.mocked(Taro.showToast)
const mockShowModal = vi.mocked(Taro.showModal)

describe('chooseImageWithPrivacy', () => {
  beforeEach(() => {
    // 每个用例前清空调用记录与 mock 实现，避免用例间相互污染
    vi.clearAllMocks()
  })

  it('正常：已授权用户直接选择照片并返回结果，不弹任何提示', async () => {
    // 微信在用户已同意隐私协议时不会拦截 chooseImage，直接返回临时文件
    const res = { tempFilePaths: ['wxfile://tmp_abc.jpg'], tempFiles: [] as any[] }
    mockChooseImage.mockResolvedValue(res as any)

    await expect(chooseImageWithPrivacy({ count: 1, sizeType: ['compressed'] })).resolves.toBe(res)
    expect(mockChooseImage).toHaveBeenCalledWith({ count: 1, sizeType: ['compressed'] })
    expect(mockShowToast).not.toHaveBeenCalled()
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('用户主动取消：静默失败，不弹提示（正常交互）', async () => {
    const err = { errMsg: 'chooseImage:fail cancel' }
    mockChooseImage.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).not.toHaveBeenCalled()
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('errno 112（后台未声明隐私接口）：弹 modal 提示开发者处理', async () => {
    const err = { errno: 112, errMsg: 'chooseImage:fail api scope is not declared in the privacy agreement' }
    mockChooseImage.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowModal).toHaveBeenCalledWith(expect.objectContaining({ title: '功能不可用' }))
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('用户拒绝隐私授权：toast 提示需要同意隐私指引', async () => {
    const err = { errMsg: 'chooseImage:fail privacy permission is not authorized' }
    mockChooseImage.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '需要同意《用户隐私保护指引》才能使用此功能' })
    )
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('其他失败（如系统相册权限被禁）：toast 提示选择照片失败，不静默', async () => {
    const err = { errMsg: 'chooseImage:fail system error' }
    mockChooseImage.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: '选择照片失败，请重试' }))
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('边界：错误对象缺失 errMsg 时按其他失败处理（toast）', async () => {
    // 极低概率：Taro 抛出的错误对象结构异常，仍应给出反馈而非静默
    const err = { someUnknownField: true }
    mockChooseImage.mockRejectedValue(err)

    await expect(chooseImageWithPrivacy({ count: 1 })).rejects.toBe(err)
    expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: '选择照片失败，请重试' }))
  })
})
