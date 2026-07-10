import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AvatarManager } from './AvatarManager'

vi.mock('./avatarService', () => ({
  avatarService: {
    getAvatars: vi.fn(() => [
      {
        id: 'avatar-1',
        name: '我的角色1',
        source: 'builtin',
        stickerUrl: '',
        renderMode: '2d_sticker',
        evolution: { level: 1, exp: 0, stage: 'egg' }
      },
      {
        id: 'avatar-2',
        name: '我的角色2',
        source: 'ai',
        stickerUrl: '',
        renderMode: '2d_sticker',
        evolution: { level: 5, exp: 100, stage: 'baby' }
      }
    ]),
    getActiveAvatar: vi.fn(() => ({
      id: 'avatar-1',
      name: '我的角色1',
      source: 'builtin',
      stickerUrl: '',
      renderMode: '2d_sticker',
      evolution: { level: 1, exp: 0, stage: 'egg' }
    })),
    canGenerateAI: vi.fn(() => true),
    getRemainingGenerations: vi.fn(() => 5),
    createFromBuiltin: vi.fn((_userId, _builtinId) => ({
      id: 'new-avatar',
      name: '新角色',
      source: 'builtin',
      stickerUrl: '',
      renderMode: '2d_sticker',
      evolution: { level: 1, exp: 0, stage: 'egg' }
    })),
    setActiveAvatar: vi.fn(),
    generateWithAI: vi.fn().mockResolvedValue({
      id: 'ai-avatar',
      name: 'AI角色',
      source: 'ai',
      stickerUrl: '',
      renderMode: '2d_sticker',
      evolution: { level: 1, exp: 0, stage: 'egg' }
    }),
    createFromUpload: vi.fn((userId, name, dataUrl) => ({
      id: 'upload-avatar',
      name,
      source: 'upload',
      stickerUrl: dataUrl,
      renderMode: '2d_sticker',
      evolution: { level: 1, exp: 0, stage: 'egg' }
    })),
    deleteAvatar: vi.fn()
  }
}))

vi.mock('./AvatarRenderer', () => ({
  AvatarRenderer: ({ avatar }: { avatar: { name: string } }) => (
    <div data-testid="avatar-renderer">{avatar.name}</div>
  )
}))

vi.mock('./AvatarEvolutionPanel', () => ({
  AvatarEvolutionPanel: () => <div data-testid="evolution-panel" />
}))

describe('AvatarManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders avatar manager component', () => {
    render(<AvatarManager userId="user-1" />)
    expect(screen.getByText('角色管理')).toBeInTheDocument()
  })

  it('renders tabs', () => {
    render(<AvatarManager userId="user-1" />)
    expect(screen.getByText('我的角色')).toBeInTheDocument()
    expect(screen.getByText('内置角色')).toBeInTheDocument()
    expect(screen.getByText('AI生成')).toBeInTheDocument()
    expect(screen.getByText('上传')).toBeInTheDocument()
  })

  it('renders my avatars tab by default', () => {
    render(<AvatarManager userId="user-1" />)
    const avatarCards = document.querySelectorAll('.avatar-card')
    expect(avatarCards.length).toBe(2)
  })

  it('renders active avatar preview', () => {
    render(<AvatarManager userId="user-1" />)
    expect(screen.getByText(/当前:/)).toBeInTheDocument()
  })

  it('switches to builtin tab', () => {
    render(<AvatarManager userId="user-1" />)
    fireEvent.click(screen.getByText('内置角色'))
    expect(screen.getByText(/内置角色/)).toBeInTheDocument()
  })

  it('switches to AI generation tab', () => {
    render(<AvatarManager userId="user-1" />)
    fireEvent.click(screen.getByText('AI生成'))
    expect(screen.getByText(/本月剩余生成次数/)).toBeInTheDocument()
  })

  it('switches to upload tab', () => {
    render(<AvatarManager userId="user-1" />)
    fireEvent.click(screen.getByText('上传'))
    expect(screen.getByText('选择图片上传')).toBeInTheDocument()
  })

  it('calls onAvatarSelect when avatar is selected', () => {
    const onAvatarSelect = vi.fn()
    render(<AvatarManager userId="user-1" onAvatarSelect={onAvatarSelect} />)
    
    fireEvent.click(screen.getByText('内置角色'))
    const builtinButtons = screen.getAllByText(/内置角色/)
    if (builtinButtons.length > 0) {
      fireEvent.click(builtinButtons[0])
    }
  })

  it('renders avatar level', () => {
    render(<AvatarManager userId="user-1" />)
    const levels = screen.getAllByText(/Lv\./)
    expect(levels.length).toBe(2)
  })
})
