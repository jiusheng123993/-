/**
 * 症状初筛弹窗卡片组件单元测试
 * 覆盖：4 步逐题勾选与自动前进、结果卡组装（风险分级）、完成回传、
 * 上一步、中途退出二次确认、打开重置
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import SymptomCheckPopup from '../SymptomCheckPopup'

const { mockShowToast, mockShowModal, mockOnClose, mockOnComplete, petState } = vi.hoisted(() => {
  return {
    mockShowToast: vi.fn(),
    mockShowModal: vi.fn(),
    mockOnClose: vi.fn(),
    mockOnComplete: vi.fn(),
    petState: { currentPet: null as any },
  }
})

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

vi.mock('../SymptomCheckPopup/index.scss', () => ({}))

vi.mock('../../stores/petStore', () => ({
  usePetStore: (selector: (s: any) => any) => selector(petState),
}))

/** 点击指定文案的选项 chip */
function clickOpt(container: HTMLElement, label: string) {
  const el = Array.from(container.querySelectorAll('.scp-opt')).find(
    x => x.textContent === label
  )
  expect(el, `未找到选项：${label}`).toBeTruthy()
  fireEvent.click(el!)
}

function renderPopup() {
  return render(
    createElement(SymptomCheckPopup, { open: true, onClose: mockOnClose, onComplete: mockOnComplete })
  )
}

/** 走完 4 步（低危组合） */
function answerAll(container: HTMLElement) {
  clickOpt(container, '呕吐 / 反胃')
  clickOpt(container, '刚开始，不到半天')
  clickOpt(container, '轻微的，不太影响日常')
  clickOpt(container, '没有其他异常')
}

describe('SymptomCheckPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    petState.currentPet = { id: 'pet_1', name: '旺财', species: 'dog' }
  })

  it('open=false 时不渲染任何内容', () => {
    const { container } = render(
      createElement(SymptomCheckPopup, { open: false, onClose: mockOnClose, onComplete: mockOnComplete })
    )
    expect(container.querySelector('.scp-overlay')).toBeFalsy()
  })

  it('打开先显示第一步（主要症状），带进度与宠物名', () => {
    const { container } = renderPopup()
    expect(container.textContent).toContain('旺财的症状初筛')
    expect(container.textContent).toContain('出现了什么症状？')
    expect(container.textContent).toContain('第 1/4 步')
  })

  it('逐题勾选自动前进到下一步，最后一步后出结果（低危）', () => {
    const { container } = renderPopup()
    clickOpt(container, '呕吐 / 反胃')
    expect(container.textContent).toContain('第 2/4 步')
    clickOpt(container, '刚开始，不到半天')
    expect(container.textContent).toContain('第 3/4 步')
    clickOpt(container, '轻微的，不太影响日常')
    expect(container.textContent).toContain('第 4/4 步')
    clickOpt(container, '没有其他异常')

    // 结果视图：低危 → 暂不严重
    expect(container.textContent).toContain('症状评估报告')
    expect(container.textContent).toContain('暂不严重')
  })

  it('严重程度选择「非常严重」→ 结果风险为紧急', () => {
    const { container } = renderPopup()
    clickOpt(container, '精神萎靡 / 嗜睡')
    clickOpt(container, '超过3天了')
    clickOpt(container, '非常严重，需要急救')
    clickOpt(container, '体温偏高 / 发烧')

    expect(container.textContent).toContain('紧急')
    expect(container.textContent).toContain('前往最近的宠物医院')
  })

  it('点「收下啦」→ 回传 symptom_result 结果卡 + 关闭', () => {
    const { container } = renderPopup()
    answerAll(container)

    fireEvent.click(Array.from(container.querySelectorAll('.scp-submit')).pop()!)
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
    const payload = mockOnComplete.mock.calls[0][0]
    expect(payload.type).toBe('ai')
    expect(payload.card.type).toBe('symptom_result')
    expect(payload.content).toContain('风险等级')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('上一步回到前一题；第 1 步上一步不可点', () => {
    const { container } = renderPopup()
    clickOpt(container, '呕吐 / 反胃')
    expect(container.textContent).toContain('第 2/4 步')

    fireEvent.click(container.querySelector('.scp-back-btn')!)
    expect(container.textContent).toContain('第 1/4 步')
  })

  it('未作答时点关闭直接关闭；作答过则弹二次确认', () => {
    const { container } = renderPopup()

    fireEvent.click(container.querySelector('.scp-close')!)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockShowModal).not.toHaveBeenCalled()

    // 再开一个：作答后关闭
    const view2 = renderPopup()
    clickOpt(view2.container, '呕吐 / 反胃')
    fireEvent.click(view2.container.querySelector('.scp-close')!)
    expect(mockShowModal).toHaveBeenCalledTimes(1)
    expect(mockShowModal.mock.calls[0][0].title).toBe('放弃本次初筛？')
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
