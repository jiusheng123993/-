import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyCompanionUI } from './StudyCompanionUI'

function clearStorage() {
  window.localStorage.removeItem('xinghuanhai-studycompanion-state')
}

describe('StudyCompanionUI', () => {
  beforeEach(() => {
    clearStorage()
  })

  it('renders the companion header', () => {
    render(<StudyCompanionUI />)
    expect(screen.getByText('小寰')).toBeTruthy()
    expect(screen.getByText('你的 AI 备考陪伴伙伴')).toBeTruthy()
  })

  it('renders quick action buttons when no messages', () => {
    render(<StudyCompanionUI />)
    expect(screen.getByText('考前焦虑')).toBeTruthy()
    expect(screen.getByText('学习复盘')).toBeTruthy()
    expect(screen.getByText('需要鼓励')).toBeTruthy()
    expect(screen.getByText('呼吸放松')).toBeTruthy()
    expect(screen.getByText('正念练习')).toBeTruthy()
    expect(screen.getByText('找回动力')).toBeTruthy()
  })

  it('renders breath exercise button', () => {
    render(<StudyCompanionUI />)
    expect(screen.getByText(/开始呼吸练习/)).toBeTruthy()
  })

  it('renders input field', () => {
    render(<StudyCompanionUI />)
    const input = screen.getByPlaceholderText('和小寰说说你的心情...')
    expect(input).toBeTruthy()
  })

  it('renders send button', () => {
    render(<StudyCompanionUI />)
    expect(screen.getByText('发送')).toBeTruthy()
  })

  it('sends a message and gets fallback response when no API key', () => {
    render(<StudyCompanionUI />)
    const input = screen.getByPlaceholderText('和小寰说说你的心情...') as HTMLInputElement
    fireEvent.change(input, { target: { value: '我今天有点焦虑' } })
    fireEvent.click(screen.getByText('发送'))

    expect(screen.getByText('我今天有点焦虑')).toBeTruthy()
    expect(screen.getByText(/我能感受到你的焦虑/)).toBeTruthy()
  })

  it('hides quick actions after sending message', () => {
    render(<StudyCompanionUI />)
    const input = screen.getByPlaceholderText('和小寰说说你的心情...') as HTMLInputElement
    fireEvent.change(input, { target: { value: '你好' } })
    fireEvent.click(screen.getByText('发送'))

    expect(screen.queryByText('考前焦虑')).toBeFalsy()
  })

  it('triggers quick action and gets response', () => {
    render(<StudyCompanionUI />)
    fireEvent.click(screen.getByText('考前焦虑'))

    expect(screen.getByText(/我最近因为考试很焦虑/)).toBeTruthy()
    expect(screen.getByText(/我能感受到你的焦虑/)).toBeTruthy()
  })

  it('shows permission hint when no API key', async () => {
    const user = userEvent.setup()
    render(<StudyCompanionUI />)
    const input = screen.getByPlaceholderText('和小寰说说你的心情...')
    await user.type(input, '你好')
    await user.click(screen.getByRole('button', { name: '发送' }))
    expect(screen.getByText(/尚未配置 AI API Key/)).toBeTruthy()
  })

  it('renders check-in button when not checked in today', () => {
    render(<StudyCompanionUI />)
    expect(screen.getByText(/今日打卡/)).toBeTruthy()
  })

  it('renders clear button', () => {
    render(<StudyCompanionUI />)
    const clearBtn = screen.getByTitle('清空对话')
    expect(clearBtn).toBeTruthy()
  })

  it('clears messages when clear button is clicked', () => {
    render(<StudyCompanionUI />)
    const input = screen.getByPlaceholderText('和小寰说说你的心情...') as HTMLInputElement
    fireEvent.change(input, { target: { value: '你好' } })
    fireEvent.click(screen.getByText('发送'))

    expect(screen.getByText('你好')).toBeTruthy()

    fireEvent.click(screen.getByTitle('清空对话'))
    expect(screen.queryByText('你好')).toBeFalsy()
  })

  it('shows breath guide when starting breath exercise', () => {
    render(<StudyCompanionUI />)
    fireEvent.click(screen.getByText(/开始呼吸练习/))

    expect(screen.getByText('结束练习')).toBeTruthy()
    expect(screen.getByText(/4-7-8 呼吸法/)).toBeTruthy()
  })
})