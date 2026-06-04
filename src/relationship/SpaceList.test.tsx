import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SpaceList, CreateSpaceForm, JoinSpaceForm } from './SpaceList'

vi.mock('./relationshipService', () => ({
  relationshipService: {
    getSpaces: vi.fn(() => [
      {
        id: 'space-1',
        name: '测试空间',
        type: 'couple' as const,
        ownerId: 'user-1',
        members: [{ userId: 'user-1', role: 'owner', joinedAt: '2026-01-01' }],
        inviteCode: 'TEST123',
        createdAt: '2026-01-01',
        stats: { intimacyScore: 85, synergyScore: 0, totalTasks: 10, completedTasks: 8 }
      },
      {
        id: 'space-2',
        name: '学习小组',
        type: 'study' as const,
        ownerId: 'user-1',
        members: [{ userId: 'user-1', role: 'owner', joinedAt: '2026-01-01' }],
        inviteCode: 'STUDY1',
        createdAt: '2026-01-01',
        stats: { intimacyScore: 0, synergyScore: 72, totalTasks: 20, completedTasks: 15 }
      }
    ]),
    canUseFeature: vi.fn(() => true),
    createSpace: vi.fn((type, name, userId) => ({
      id: 'new-space',
      name,
      type,
      ownerId: userId,
      members: [{ userId, role: 'owner', joinedAt: new Date().toISOString() }],
      inviteCode: 'NEW123',
      createdAt: new Date().toISOString(),
      stats: { intimacyScore: 0, synergyScore: 0, totalTasks: 0, completedTasks: 0 }
    })),
    joinSpace: vi.fn((code, userId) => {
      if (code === 'VALID') {
        return {
          id: 'joined-space',
          name: '已加入的空间',
          type: 'study' as const,
          ownerId: 'other-user',
          members: [{ userId, role: 'member', joinedAt: new Date().toISOString() }],
          inviteCode: code,
          createdAt: new Date().toISOString(),
          stats: { intimacyScore: 0, synergyScore: 50, totalTasks: 5, completedTasks: 3 }
        }
      }
      return null
    })
  }
}))

describe('SpaceList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders space list component', () => {
    render(<SpaceList userId="user-1" onSelectSpace={() => {}} onCreateSpace={() => {}} />)
    expect(screen.getByText('关系空间')).toBeInTheDocument()
  })

  it('renders create button when user can create space', () => {
    render(<SpaceList userId="user-1" onSelectSpace={() => {}} onCreateSpace={() => {}} />)
    expect(screen.getByText('+ 创建空间')).toBeInTheDocument()
  })

  it('renders space cards', () => {
    render(<SpaceList userId="user-1" onSelectSpace={() => {}} onCreateSpace={() => {}} />)
    expect(screen.getByText('测试空间')).toBeInTheDocument()
    expect(screen.getByText('学习小组')).toBeInTheDocument()
  })

  it('calls onSelectSpace when space is clicked', () => {
    const onSelectSpace = vi.fn()
    render(<SpaceList userId="user-1" onSelectSpace={onSelectSpace} onCreateSpace={() => {}} />)
    
    fireEvent.click(screen.getByText('测试空间'))
    expect(onSelectSpace).toHaveBeenCalledWith('space-1')
  })

  it('renders member count', () => {
    render(<SpaceList userId="user-1" onSelectSpace={() => {}} onCreateSpace={() => {}} />)
    const memberCounts = screen.getAllByText(/1 成员/)
    expect(memberCounts.length).toBe(2)
  })

  it('renders intimacy score for couple space', () => {
    render(<SpaceList userId="user-1" onSelectSpace={() => {}} onCreateSpace={() => {}} />)
    expect(screen.getByText(/❤️ 85/)).toBeInTheDocument()
  })

  it('renders synergy score for study space', () => {
    render(<SpaceList userId="user-1" onSelectSpace={() => {}} onCreateSpace={() => {}} />)
    expect(screen.getByText(/🤝 72/)).toBeInTheDocument()
  })

  it('calls onCreateSpace when create button is clicked', () => {
    const onCreateSpace = vi.fn()
    render(<SpaceList userId="user-1" onSelectSpace={() => {}} onCreateSpace={onCreateSpace} />)
    
    fireEvent.click(screen.getByText('+ 创建空间'))
    expect(onCreateSpace).toHaveBeenCalled()
  })
})

describe('CreateSpaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create space form', () => {
    render(<CreateSpaceForm userId="user-1" onCreated={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('创建关系空间')).toBeInTheDocument()
  })

  it('renders space type selector', () => {
    render(<CreateSpaceForm userId="user-1" onCreated={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('空间类型')).toBeInTheDocument()
  })

  it('renders name input', () => {
    render(<CreateSpaceForm userId="user-1" onCreated={() => {}} onCancel={() => {}} />)
    expect(screen.getByPlaceholderText('给空间起个名字')).toBeInTheDocument()
  })

  it('shows error when submitting empty name', async () => {
    render(<CreateSpaceForm userId="user-1" onCreated={() => {}} onCancel={() => {}} />)
    
    fireEvent.click(screen.getByText('创建'))
    
    await waitFor(() => {
      expect(screen.getByText('请输入空间名称')).toBeInTheDocument()
    })
  })

  it('calls onCreated with space id on success', async () => {
    const onCreated = vi.fn()
    render(<CreateSpaceForm userId="user-1" onCreated={onCreated} onCancel={() => {}} />)
    
    const input = screen.getByPlaceholderText('给空间起个名字')
    fireEvent.change(input, { target: { value: '新空间' } })
    fireEvent.click(screen.getByText('创建'))
    
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('new-space')
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<CreateSpaceForm userId="user-1" onCreated={() => {}} onCancel={onCancel} />)
    
    fireEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('allows selecting different space types', () => {
    render(<CreateSpaceForm userId="user-1" onCreated={() => {}} onCancel={() => {}} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

describe('JoinSpaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders join space form', () => {
    render(<JoinSpaceForm userId="user-1" onJoined={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('加入空间')).toBeInTheDocument()
  })

  it('renders invite code input', () => {
    render(<JoinSpaceForm userId="user-1" onJoined={() => {}} onCancel={() => {}} />)
    expect(screen.getByPlaceholderText('输入邀请码')).toBeInTheDocument()
  })

  it('shows error when submitting empty code', async () => {
    render(<JoinSpaceForm userId="user-1" onJoined={() => {}} onCancel={() => {}} />)
    
    fireEvent.click(screen.getByText('加入'))
    
    await waitFor(() => {
      expect(screen.getByText('请输入邀请码')).toBeInTheDocument()
    })
  })

  it('shows error for invalid invite code', async () => {
    render(<JoinSpaceForm userId="user-1" onJoined={() => {}} onCancel={() => {}} />)
    
    const input = screen.getByPlaceholderText('输入邀请码')
    fireEvent.change(input, { target: { value: 'INVALID' } })
    fireEvent.click(screen.getByText('加入'))
    
    await waitFor(() => {
      expect(screen.getByText('邀请码无效或已过期')).toBeInTheDocument()
    })
  })

  it('calls onJoined with space id for valid code', async () => {
    const onJoined = vi.fn()
    render(<JoinSpaceForm userId="user-1" onJoined={onJoined} onCancel={() => {}} />)
    
    const input = screen.getByPlaceholderText('输入邀请码')
    fireEvent.change(input, { target: { value: 'VALID' } })
    fireEvent.click(screen.getByText('加入'))
    
    await waitFor(() => {
      expect(onJoined).toHaveBeenCalledWith('joined-space')
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<JoinSpaceForm userId="user-1" onJoined={() => {}} onCancel={onCancel} />)
    
    fireEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })
})
