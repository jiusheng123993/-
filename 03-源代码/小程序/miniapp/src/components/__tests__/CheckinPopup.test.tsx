/**
 * 健康打卡弹窗卡片组件单元测试
 * 覆盖：表单渲染与进度、选项→落库等级映射、异常信号、多宠选择、
 * 多宠一键打卡、结果回调、中途退出的二次确认
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { createElement } from 'react'
// 被测组件正常置于顶部导入；vi.mock 由 vitest 自动提升到文件最前，mock 生效不受影响
import CheckinPopup from '../CheckinPopup'

// ============================================================
// vi.hoisted — mock 工厂中引用的可变状态与 spy
// ============================================================
const {
  mockShowToast,
  mockShowModal,
  mockCreateCheckin,
  mockBatchCreate,
  mockGetToday,
  mockOnClose,
  mockOnComplete,
  petState,
} = vi.hoisted(() => {
  return {
    mockShowToast: vi.fn(),
    mockShowModal: vi.fn(),
    mockCreateCheckin: vi.fn(),
    mockBatchCreate: vi.fn(),
    mockGetToday: vi.fn(),
    mockOnClose: vi.fn(),
    mockOnComplete: vi.fn(),
    /** petStore 可变状态（beforeEach 重置） */
    petState: {
      currentPet: null as any,
      pets: [] as any[],
    },
  }
})

// ============================================================
// Taro 组件 / API mock
// ============================================================
vi.mock('@tarojs/components', () => ({
  View: ({ children, className, onClick }: any) =>
    createElement('div', { className, onClick }, children),
  Text: ({ children, className }: any) =>
    createElement('span', { className }, children),
  ScrollView: ({ children, className }: any) =>
    createElement('div', { className }, children),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    showToast: mockShowToast,
    showModal: mockShowModal,
  },
}))

vi.mock('../CheckinPopup/index.scss', () => ({}))

// ============================================================
// store / service mock
// ============================================================
vi.mock('../../stores/petStore', () => ({
  usePetStore: Object.assign(
    (selector: (s: any) => any) => selector(petState),
    { getState: () => petState },
  ),
}))

vi.mock('../../stores/authStore', () => ({
  // 组件内同时用 hook 与 getState 两种取值方式，统一返回同一份状态
  useAuthStore: Object.assign(
    (selector: (s: any) => any) => selector({ user: { id: 'user_1' } }),
    { getState: () => ({ user: { id: 'user_1' } }) },
  ),
}))

vi.mock('../../services/checkinService', () => ({
  createCheckin: (...args: any[]) => mockCreateCheckin(...args),
  batchCreateCheckins: (...args: any[]) => mockBatchCreate(...args),
  getTodayCheckin: (...args: any[]) => mockGetToday(...args),
}))

// ============================================================
// 测试工具
// ============================================================
/** 构造宠物数据 */
function makePet(id: string, name: string, species: 'cat' | 'dog' = 'dog') {
  return { id, name, species, breed: '金毛', birthDate: '2023-03-15', createdAt: '', updatedAt: '' }
}

/** 在容器里按文案找到选项 chip 并点击 */
function clickOption(container: HTMLElement, label: string) {
  const el = Array.from(container.querySelectorAll('.ckp-opt')).find(
    x => x.textContent === label
  )
  expect(el, `未找到选项：${label}`).toBeTruthy()
  fireEvent.click(el!)
}

/** 默认渲染参数 */
function renderPopup() {
  return render(
    createElement(CheckinPopup, { open: true, onClose: mockOnClose, onComplete: mockOnComplete })
  )
}

// ============================================================
// 测试套件
// ============================================================
describe('CheckinPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const p1 = makePet('pet_1', '旺财')
    petState.pets = [p1]
    petState.currentPet = p1
    // 默认落库成功：低风险反馈
    mockCreateCheckin.mockResolvedValue({
      id: 'entry_1',
      petId: 'pet_1',
      userId: 'user_1',
      riskLevel: 'low',
      aiFeedback: '✅ 您的宠物今天状态不错！继续保持良好的照顾习惯。',
      createdAt: new Date(),
    })
  })

  it('open=false 时不渲染任何内容', () => {
    const { container } = render(
      createElement(CheckinPopup, { open: false, onClose: mockOnClose, onComplete: mockOnComplete })
    )
    expect(container.querySelector('.ckp-overlay')).toBeFalsy()
  })

  it('单宠打开直接显示五项表单，未答完时提交按钮禁用', () => {
    const { container } = renderPopup()

    expect(container.textContent).toContain('旺财的健康打卡')
    for (const label of ['大便情况', '小便情况', '食欲状况', '精神活力', '体重确认']) {
      expect(container.textContent).toContain(label)
    }
    expect(container.textContent).toContain('还剩 5 项')
    expect(container.querySelector('.ckp-submit--disabled')).toBeTruthy()
  })

  it('逐项勾选后提交：等级按口径映射落库，结果卡通过 onComplete 回传', async () => {
    const { container } = renderPopup()

    // 健康组合：成型正常/清亮/正常吃完/正常活动/体重稳定
    clickOption(container, '成型正常')
    clickOption(container, '清亮，次数正常')
    clickOption(container, '正常吃完')
    clickOption(container, '正常活动')
    clickOption(container, '体重稳定')
    expect(container.textContent).toContain('全部就绪')

    fireEvent.click(container.querySelector('.ckp-submit')!)

    await waitFor(() => expect(mockCreateCheckin).toHaveBeenCalledTimes(1))
    const input = mockCreateCheckin.mock.calls[0][0]
    expect(input.petId).toBe('pet_1')
    expect(input.userId).toBe('user_1')
    expect(input.poopLevel).toBe(3)
    expect(input.appetiteLevel).toBe(3)
    expect(input.spiritLevel).toBe(3)
    expect(input.exerciseLevel).toBe(2)
    expect(input.hasAnomaly).toBe(false)
    expect(input.anomalyItems).toEqual([])
    expect(input.note).toBe('体重: 稳定')

    // 结果视图：评分报告 + 服务端反馈
    await waitFor(() => expect(container.textContent).toContain('今日健康报告'))
    expect(container.textContent).toContain('92 分')
    expect(container.textContent).toContain('状态不错')

    // 点「收下啦」→ 回传聊天消息负载 + 关闭
    fireEvent.click(Array.from(container.querySelectorAll('.ckp-submit')).pop()!)
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
    const payload = mockOnComplete.mock.calls[0][0]
    expect(payload.type).toBe('ai')
    expect(payload.card.type).toBe('checkin_result')
    expect(payload.content).toContain('旺财的打卡完成')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('勾选异常项时：hasAnomaly/anomalyItems 正确标记，高风险追加警示语', async () => {
    const { container } = renderPopup()

    mockCreateCheckin.mockResolvedValue({
      id: 'entry_2',
      riskLevel: 'high',
      aiFeedback: '🔔 出现需要关注的症状，建议密切观察。',
      createdAt: new Date(),
    })

    clickOption(container, '拉稀/软便')
    clickOption(container, '频次异常')
    clickOption(container, '完全不吃')
    clickOption(container, '趴着不动，精神差')
    clickOption(container, '今天没称')

    fireEvent.click(container.querySelector('.ckp-submit')!)

    await waitFor(() => expect(mockCreateCheckin).toHaveBeenCalledTimes(1))
    const input = mockCreateCheckin.mock.calls[0][0]
    expect(input.poopLevel).toBe(2)
    expect(input.appetiteLevel).toBe(1)
    expect(input.spiritLevel).toBe(1)
    expect(input.exerciseLevel).toBe(1)
    expect(input.hasAnomaly).toBe(true)
    // anomalyItems 落枚举值（对齐 memory-body AnomalyItem），小便异常归 other
    expect(input.anomalyItems).toEqual(['poop', 'other', 'appetite', 'spirit'])

    // 高风险：聊天消息负载应带 ⚠️ 警示
    await waitFor(() => expect(container.textContent).toContain('密切观察'))
    fireEvent.click(Array.from(container.querySelectorAll('.ckp-submit')).pop()!)
    const payload = mockOnComplete.mock.calls[0][0]
    expect(payload.content).toContain('⚠️')
  })

  it('提交失败时 toast 提示且不进入结果视图', async () => {
    const { container } = renderPopup()

    mockCreateCheckin.mockRejectedValue(new Error('network'))
    for (const label of ['成型正常', '没注意', '正常吃完', '正常活动', '今天没称']) {
      clickOption(container, label)
    }
    fireEvent.click(container.querySelector('.ckp-submit')!)

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith({ title: '打卡失败，请重试', icon: 'none' }))
    expect(container.textContent).not.toContain('今日健康报告')
  })
})

describe('CheckinPopup — 多宠场景', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const p1 = makePet('pet_1', '旺财', 'dog')
    const p2 = makePet('pet_2', '咪咪', 'cat')
    petState.pets = [p1, p2]
    petState.currentPet = p1
  })

  it('多宠打开先选宠物，点击后进入对应表单', () => {
    const { container } = renderPopup()

    expect(container.textContent).toContain('要为谁打卡？')
    expect(container.textContent).toContain('旺财')
    expect(container.textContent).toContain('咪咪')

    const mimiChip = Array.from(container.querySelectorAll('.ckp-pet-chip')).find(
      el => el.textContent?.includes('咪咪')
    )!
    fireEvent.click(mimiChip)

    expect(container.textContent).toContain('咪咪的健康打卡')
  })

  it('一键打卡：为今天未打卡宠物批量提交"全部正常"默认指标', async () => {
    const { container } = renderPopup()
    mockGetToday.mockResolvedValue(null)
    mockBatchCreate.mockResolvedValue([])

    fireEvent.click(
      Array.from(container.querySelectorAll('.ckp-batch-btn')).find(
        el => el.textContent?.includes('全部正常')
      )!
    )

    await waitFor(() => expect(mockBatchCreate).toHaveBeenCalledTimes(1))
    const items = mockBatchCreate.mock.calls[0][0]
    expect(items).toHaveLength(2)
    for (const item of items) {
      expect(item.poopLevel).toBe(3)
      expect(item.appetiteLevel).toBe(3)
      expect(item.spiritLevel).toBe(3)
      expect(item.exerciseLevel).toBe(2)
      expect(item.hasAnomaly).toBe(false)
    }

    // 批量结果无评分卡：纯文本消息回传聊天
    expect(container.textContent).toContain('打卡完成')
    fireEvent.click(Array.from(container.querySelectorAll('.ckp-submit')).pop()!)
    const payload = mockOnComplete.mock.calls[0][0]
    expect(payload.card).toBeUndefined()
    expect(payload.content).toContain('旺财')
    expect(payload.content).toContain('咪咪')
  })

  it('所有宠物今天都已打卡时只 toast 提示，不重复提交', async () => {
    const { container } = renderPopup()
    mockGetToday.mockResolvedValue({ id: 'entry_x' } as any)

    fireEvent.click(container.querySelector('.ckp-batch-btn')!)

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith({ title: '今天都打过卡啦 🎉', icon: 'none' })
    )
    expect(mockBatchCreate).not.toHaveBeenCalled()
  })
})

describe('CheckinPopup — 关闭交互', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const p1 = makePet('pet_1', '旺财')
    petState.pets = [p1]
    petState.currentPet = p1
  })

  it('未作答时点关闭直接关闭，不弹确认', () => {
    const { container } = renderPopup()

    fireEvent.click(container.querySelector('.ckp-close')!)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockShowModal).not.toHaveBeenCalled()
  })

  it('填了一半点关闭需二次确认放弃', () => {
    const { container } = renderPopup()

    clickOption(container, '成型正常')
    fireEvent.click(container.querySelector('.ckp-close')!)

    expect(mockShowModal).toHaveBeenCalledTimes(1)
    expect(mockShowModal.mock.calls[0][0].title).toBe('放弃本次打卡？')
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})

describe('CheckinPopup — 提交守卫与防重入', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const p1 = makePet('pet_1', '旺财')
    petState.pets = [p1]
    petState.currentPet = p1
    mockCreateCheckin.mockResolvedValue({
      id: 'entry_1',
      riskLevel: 'low',
      aiFeedback: '✅ 状态不错',
      createdAt: new Date(),
    })
  })

  it('未答完点击提交按钮不落库并 toast 剩余项（按钮禁用态兜底守卫）', () => {
    const { container } = renderPopup()

    // 只答 1 项就点提交
    clickOption(container, '成型正常')
    fireEvent.click(container.querySelector('.ckp-submit')!)

    expect(mockCreateCheckin).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith({ title: '还有 4 项未选', icon: 'none' })
  })

  it('一项未答直接点提交同样被拦截', () => {
    const { container } = renderPopup()

    fireEvent.click(container.querySelector('.ckp-submit')!)

    expect(mockCreateCheckin).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith({ title: '还有 5 项未选', icon: 'none' })
  })

  it('结果态快速重复触发关闭只回传一次结果卡（防重入）', async () => {
    const { container } = renderPopup()

    for (const label of ['成型正常', '没注意', '正常吃完', '正常活动', '今天没称']) {
      clickOption(container, label)
    }
    fireEvent.click(container.querySelector('.ckp-submit')!)
    await waitFor(() => expect(container.textContent).toContain('今日健康报告'))

    // 第一次点击正常回传；第二次对"已卸载"的旧节点再派发事件（模拟小程序双线程 WXML 移除滞后）
    const doneBtn = Array.from(container.querySelectorAll('.ckp-submit')).pop()!
    fireEvent.click(doneBtn)
    doneBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(mockOnComplete).toHaveBeenCalledTimes(1)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('关闭后重新打开：勾选状态重置，不残留上次作答', () => {
    const makeElem = (open: boolean) =>
      createElement(CheckinPopup, { open, onClose: mockOnClose, onComplete: mockOnComplete })

    const view = render(makeElem(true))
    clickOption(view.container, '成型正常')
    expect(view.container.textContent).toContain('还剩 4 项')

    view.rerender(makeElem(false))
    expect(view.container.querySelector('.ckp-overlay')).toBeFalsy()

    view.rerender(makeElem(true))
    expect(view.container.textContent).toContain('还剩 5 项')
  })
})
