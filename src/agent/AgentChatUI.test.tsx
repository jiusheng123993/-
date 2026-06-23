import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentChatUI, AgentChatToggle } from './AgentChatUI'
import { createAgentChatMemoryAdapter, createBrowserMemoryBodyStore } from '../memory-body'
import type { MemoryProfile, MemoryEvent } from '../memory/memoryTypes'
import type { MemoryObserver } from '../memory/memoryObserver'

vi.mock('./agentRuntime', () => ({
  agentRuntime: {
    sendMessageStream: vi.fn(),
  },
}))

import { agentRuntime } from './agentRuntime'

const mockedAgentRuntime = vi.mocked(agentRuntime)

function makeProfile(overrides: Partial<MemoryProfile> = {}): MemoryProfile {
  return {
    version: 1,
    scope: { userId: 'u1', projectId: 'p1' },
    identity: { nickname: '测试用户', currentRole: '学生' },
    personality: { traits: [], planningStyle: 'structured', workStyle: 'morning' },
    rhythm: { energyPeak: 'morning' },
    goals: { primaryGoal: '通过考试', secondaryGoals: ['每天学习2小时'] },
    preferences: { encouragementStyle: 'warm', languageStyle: 'casual' },
    boundaries: { tabooTopics: [] },
    learning: { learningStyle: 'visual', effectiveStrategies: ['笔记法'] },
    emotional: { motivationLevel: 'medium' },
    meta: {
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      lastReflectionAt: '2026-05-25T00:00:00Z',
      totalEventsProcessed: 10,
      sourceBreakdown: { manual: 3, conversation: 4, behavior: 3 },
    },
    ...overrides,
  }
}

function makeEvent(overrides: Partial<MemoryEvent> & { id: string }): MemoryEvent {
  return {
    scope: { userId: 'u1', projectId: 'p1' },
    kind: 'habit',
    content: 'test event',
    source: 'behavior',
    confidence: 0.8,
    status: 'active',
    tags: [],
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    expiresAt: null,
    ...overrides,
  }
}

function makeObserver(overrides: Partial<MemoryObserver> = {}): MemoryObserver {
  return {
    onConversationComplete: vi.fn(),
    onUserPreferenceLearned: vi.fn(),
    onGoalProgress: vi.fn(),
    onHabitStreak: vi.fn(),
    onFocusSession: vi.fn(),
    onReflectionCreated: vi.fn(),
    onMoodRecorded: vi.fn(),
    ...overrides,
  }
}

describe('AgentChatUI', () => {
  beforeEach(() => {
    HTMLDivElement.prototype.scrollIntoView = vi.fn()
    localStorage.clear()
    mockedAgentRuntime.sendMessageStream.mockReset()
    mockedAgentRuntime.sendMessageStream.mockImplementation(async request => {
      request.onChunk('Response')
    })
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
    expect(screen.queryByText('AI 助手')).not.toBeInTheDocument()
  })

  it('renders greeting message when opened', () => {
    render(<AgentChatUI isOpen onClose={() => {}} />)
    expect(screen.getByText('AI 助手')).toBeInTheDocument()
    expect(screen.getByText('在线')).toBeInTheDocument()
  })

  it('shows custom aiRole when provided', () => {
    render(<AgentChatUI isOpen onClose={() => {}} aiRole="AI 备考教练" />)
    expect(screen.getByText('AI 备考教练')).toBeInTheDocument()
  })

  it('shows default AI 助手 when no aiRole provided', () => {
    render(<AgentChatUI isOpen onClose={() => {}} />)
    expect(screen.getByText('AI 助手')).toBeInTheDocument()
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

  describe('memory context injection', () => {
    it('renders with profile and memoryEvents without crashing', () => {
      const profile = makeProfile()
      const events = [makeEvent({ id: 'e1' })]

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          profile={profile}
          memoryEvents={events}
        />
      )

      expect(screen.getByText('AI 助手')).toBeInTheDocument()
    })

    it('renders with memoryObserver without crashing', () => {
      const observer = makeObserver()

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          memoryObserver={observer}
        />
      )

      expect(screen.getByText('AI 助手')).toBeInTheDocument()
    })

    it('renders with all memory props without crashing', () => {
      const profile = makeProfile()
      const events = [makeEvent({ id: 'e1' })]
      const observer = makeObserver()

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          profile={profile}
          memoryEvents={events}
          memoryObserver={observer}
        />
      )

      expect(screen.getByText('AI 助手')).toBeInTheDocument()
    })

    it('uses custom onSendMessage when provided', async () => {
      const onSendMessage = vi.fn().mockResolvedValue('Custom response')

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          onSendMessage={onSendMessage}
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: 'Hello' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalledWith('Hello')
      })
    })

    it('calls memoryObserver.onConversationComplete after send', async () => {
      const onSendMessage = vi.fn().mockResolvedValue('Response')
      const observer = makeObserver()

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          onSendMessage={onSendMessage}
          memoryObserver={observer}
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: 'Hello world' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(observer.onConversationComplete).toHaveBeenCalled()
      })
    })

    it('calls memoryObserver.onUserPreferenceLearned when response contains MEMORY tags', async () => {
      const onSendMessage = vi.fn().mockResolvedValue(
        '好的！[MEMORY: goals.primaryGoal = 通过考试] 我会记住的。'
      )
      const observer = makeObserver()

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          onSendMessage={onSendMessage}
          memoryObserver={observer}
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: '我的目标是考试' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(observer.onUserPreferenceLearned).toHaveBeenCalledWith(
          'goals.primaryGoal=通过考试',
          expect.any(String)
        )
      })
    })

    it('does not call memoryObserver when not provided', async () => {
      const onSendMessage = vi.fn().mockResolvedValue('Response')

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          onSendMessage={onSendMessage}
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: 'Hello' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalled()
      })
    })

    it('passes MemoryBody context to agent runtime after remembering chat preference', async () => {
      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          userId="user-1"
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: '我喜欢吃西瓜' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(mockedAgentRuntime.sendMessageStream).toHaveBeenCalledWith(expect.objectContaining({
          memoryBodyContext: expect.stringContaining('用户喜欢西瓜')
        }))
      })
    })

    it('handles MemoryBody feedback commands locally without sending them as normal chat', async () => {
      const userId = 'feedback-user'
      const onSendMessage = vi.fn().mockResolvedValue('Normal response')
      const store = createBrowserMemoryBodyStore(userId, 'xinghuanhai-growth-workbench')
      const adapter = createAgentChatMemoryAdapter({
        store,
        scope: { userId, projectId: 'xinghuanhai-growth-workbench' }
      })

      adapter.rememberUserMessage('我喜欢吃西瓜', '2026-06-22T00:00:00.000Z')

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          userId={userId}
          onSendMessage={onSendMessage}
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: '忘掉西瓜，不要记这个' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(screen.getByText('已按你的要求忘掉这条记忆。')).toBeInTheDocument()
      })
      expect(onSendMessage).not.toHaveBeenCalled()
      const refreshedAdapter = createAgentChatMemoryAdapter({
        store: createBrowserMemoryBodyStore(userId, 'xinghuanhai-growth-workbench'),
        scope: { userId, projectId: 'xinghuanhai-growth-workbench' }
      })
      expect(refreshedAdapter.buildPromptContext('我喜欢吃什么水果')).not.toContain('用户喜欢西瓜')
    })

    it('handles MemoryBody correction commands locally without sending them as normal chat', async () => {
      const userId = 'correction-user'
      const onSendMessage = vi.fn().mockResolvedValue('Normal response')
      const store = createBrowserMemoryBodyStore(userId, 'xinghuanhai-growth-workbench')
      const adapter = createAgentChatMemoryAdapter({
        store,
        scope: { userId, projectId: 'xinghuanhai-growth-workbench' }
      })

      adapter.rememberUserMessage('我喜欢吃西瓜', '2026-06-22T00:00:00.000Z')

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          userId={userId}
          onSendMessage={onSendMessage}
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: '我喜欢的是芒果，不是西瓜' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(screen.getByText('已按你的纠正更新记忆。')).toBeInTheDocument()
      })
      expect(onSendMessage).not.toHaveBeenCalled()
      const refreshedAdapter = createAgentChatMemoryAdapter({
        store: createBrowserMemoryBodyStore(userId, 'xinghuanhai-growth-workbench'),
        scope: { userId, projectId: 'xinghuanhai-growth-workbench' }
      })
      const promptContext = refreshedAdapter.buildPromptContext('我喜欢吃什么水果')
      expect(promptContext).toContain('用户喜欢芒果')
      expect(promptContext).not.toContain('用户喜欢西瓜')
    })

    it('handles MemoryBody confirm commands locally without sending them as normal chat', async () => {
      const userId = 'confirm-user'
      const onSendMessage = vi.fn().mockResolvedValue('Normal response')
      const store = createBrowserMemoryBodyStore(userId, 'xinghuanhai-growth-workbench')
      const adapter = createAgentChatMemoryAdapter({
        store,
        scope: { userId, projectId: 'xinghuanhai-growth-workbench' }
      })

      adapter.rememberUserMessage('我喜欢吃西瓜', '2026-06-22T00:00:00.000Z')
      const seededAtom = store.load().atoms.find(atom => atom.object === '西瓜')
      expect(seededAtom).toBeDefined()

      render(
        <AgentChatUI
          isOpen
          onClose={() => {}}
          userId={userId}
          onSendMessage={onSendMessage}
        />
      )

      const input = screen.getByPlaceholderText('输入消息...')
      fireEvent.change(input, { target: { value: '确认这条记忆，没错' } })
      fireEvent.click(screen.getByLabelText('发送消息'))

      await waitFor(() => {
        expect(screen.getByText('已确认这条记忆。')).toBeInTheDocument()
      })
      expect(onSendMessage).not.toHaveBeenCalled()
      const refreshedStore = createBrowserMemoryBodyStore(userId, 'xinghuanhai-growth-workbench')
      const confirmedAtom = refreshedStore.load().atoms.find(atom => atom.object === '西瓜')
      expect(confirmedAtom).toMatchObject({ lifecycle: 'confirmed' })
      expect(confirmedAtom?.confidence).toBeGreaterThan(seededAtom?.confidence ?? 0)
      expect(confirmedAtom?.strength).toBeGreaterThan(seededAtom?.strength ?? 0)
    })
  })
})
