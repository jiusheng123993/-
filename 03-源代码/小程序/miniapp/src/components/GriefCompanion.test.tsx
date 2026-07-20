import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, style, onClick }: any) => (
    <div className={className} style={style} onClick={onClick}>{children}</div>
  ),
  Text: ({ children, className, style }: any) => (
    <span className={className} style={style}>{children}</span>
  ),
  Input: ({ className, type, placeholder, value, onInput, onConfirm }: any) => (
    <input
      className={className}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onInput && onInput({ detail: { value: e.target.value } })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onConfirm) {
          onConfirm()
        }
      }}
    />
  ),
  ScrollView: ({ children, className, scrollY, scrollIntoView, scrollWithAnimation }: any) => (
    <div className={className}>{children}</div>
  ),
}))

import GriefCompanion from './GriefCompanion'

describe('GriefCompanion', () => {
  const baseProps = {
    petName: '旺财',
    petAvatar: 'https://example.com/dog.png',
    species: 'dog' as const,
    deceasedDate: '2024-01-15',
    onStageChange: vi.fn(),
  }

  it('正确渲染宠物信息和阶段指示器', () => {
    render(<GriefCompanion {...baseProps} />)

    expect(screen.getByText('旺财')).toBeDefined()
    expect(screen.getByText('离世日期：2024-01-15')).toBeDefined()
  })

  it('5个阶段指示器全部渲染', () => {
    render(<GriefCompanion {...baseProps} />)

    const stageLabels = ['否认', '愤怒', '讨价还价', '抑郁', '接纳']
    stageLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeDefined()
    })
  })

  it('点击阶段切换器切换阶段', () => {
    render(<GriefCompanion {...baseProps} />)

    const stageDots = document.querySelectorAll('.grief-companion__stage-dot')
    fireEvent.click(stageDots[1])

    expect(baseProps.onStageChange).toHaveBeenCalledWith('anger')
  })

  it('发送消息后消息列表更新', async () => {
    render(<GriefCompanion {...baseProps} />)

    const input = screen.getByPlaceholderText('说说你的感受...')
    fireEvent.change(input, { target: { value: '我很想念旺财' } })

    const sendBtn = screen.getByText('➤').closest('div')
    fireEvent.click(sendBtn!)

    await waitFor(() => {
      expect(screen.getByText('我很想念旺财')).toBeDefined()
    })
  })

  it('AI 开场白正确显示（包含宠物名字）', () => {
    render(<GriefCompanion {...baseProps} />)

    const openingText = screen.getByText((content: string) =>
      content.includes('失去旺财')
    )
    expect(openingText).toBeDefined()
  })

  it('输入框和发送按钮交互正常', () => {
    render(<GriefCompanion {...baseProps} />)

    const input = screen.getByPlaceholderText('说说你的感受...')
    expect(input).toBeDefined()

    fireEvent.change(input, { target: { value: '测试消息' } })

    const sendBtn = screen.getByText('➤').closest('div')
    fireEvent.click(sendBtn!)

    expect(screen.getByText('测试消息')).toBeDefined()
  })
})
