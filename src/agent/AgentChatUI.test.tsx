import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentChatUI, AgentChatToggle } from './AgentChatUI'

describe('AgentChatUI', () => {
  beforeEach(() => {
    HTMLDivElement.prototype.scrollIntoView = vi.fn()
  })

  it('renders chat toggle button', () => {
    render(<AgentChatToggle onClick={() => {}} />)
    expect(screen.getByLabelText('打开 AI 聊天')).toBeInTheDocument()
  })

  it('calls onClick when toggle is clicked', () => {
    const onClick = vi.fn()
    render(<AgentChatToggle onClick={onClick} />)
    fireEvent.click(screen.getByLabelText('打开 AI 聊天'))
    expect(onClick).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', () => {
    render(<AgentChatUI isOpen={false} onClose={() => {}} />)
    expect(screen.queryByText('AI 学习搭子')).not.toBeInTheDocument()
  })

  it('renders greeting message when opened', () => {
    render(<AgentChatUI isOpen onClose={() => {}} />)
    expect(screen.getByText('AI 学习搭子')).toBeInTheDocument()
    expect(screen.getByText('在线')).toBeInTheDocument()
  })

  it('shows different greeting for different persona', () => {
    render(<AgentChatUI isOpen onClose={() => {}} personaId="exam_prep" />)
    expect(screen.getByText(/备考助手/)).toBeInTheDocument()
  })

  it('allows message input', () => {
    render(<AgentChatUI isOpen onClose={() => {}} />)
    const input = screen.getByPlaceholderText('输入消息...')
    fireEvent.change(input, { target: { value: 'Hello' } })
    expect(input).toHaveValue('Hello')
  })

  it('does not send message on Enter with Shift', () => {
    const onSendMessage = vi.fn()
    render(<AgentChatUI isOpen onClose={() => {}} onSendMessage={onSendMessage} />)
    
    const input = screen.getByPlaceholderText('输入消息...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    
    expect(onSendMessage).not.toHaveBeenCalled()
  })

  it('closes chat when close button is clicked', () => {
    const onClose = vi.fn()
    render(<AgentChatUI isOpen onClose={onClose} />)
    
    fireEvent.click(screen.getByLabelText('关闭聊天'))
    expect(onClose).toHaveBeenCalled()
  })

  it('disables send button when input is empty', () => {
    render(<AgentChatUI isOpen onClose={() => {}} />)
    const sendButton = screen.getByLabelText('发送消息')
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when input has content', () => {
    render(<AgentChatUI isOpen onClose={() => {}} />)
    const input = screen.getByPlaceholderText('输入消息...')
    fireEvent.change(input, { target: { value: 'Test' } })
    
    const sendButton = screen.getByLabelText('发送消息')
    expect(sendButton).not.toBeDisabled()
  })
})
