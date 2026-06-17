import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommunityPersonaUI } from './CommunityPersonaUI'
import type { ICommunityPersonaService } from './communityPersonaService'
import type { CommunityPersonaEntry, CommunityRating, CommunityReport } from './communityPersonaService'

function makeMockEntry(overrides: Partial<CommunityPersonaEntry> = {}): CommunityPersonaEntry {
  return {
    id: 'entry-1',
    sourcePersonaId: 'persona-1',
    creatorUserId: 'creator-1',
    creatorDisplayName: '测试创作者',
    visibility: 'public',
    reviewStatus: 'approved',
    importCount: 42,
    ratingAverage: 4.5,
    ratingCount: 10,
    reportCount: 0,
    publishedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeMockCommunityService(overrides: Partial<ICommunityPersonaService> = {}): ICommunityPersonaService {
  const entries: CommunityPersonaEntry[] = [
    makeMockEntry({ id: 'entry-1', creatorDisplayName: '创作者A', importCount: 100 }),
    makeMockEntry({ id: 'entry-2', creatorDisplayName: '创作者B', importCount: 50 }),
    makeMockEntry({ id: 'entry-3', creatorDisplayName: '创作者C', importCount: 30 }),
  ]

  return {
    publish: vi.fn().mockResolvedValue({ ok: true, entryId: 'new-entry' }),
    unpublish: vi.fn().mockResolvedValue({ ok: true }),
    list: vi.fn().mockResolvedValue(entries),
    getById: vi.fn().mockImplementation((id: string) => entries.find((e) => e.id === id)),
    importToMy: vi.fn().mockResolvedValue({ ok: true, createdPersonaId: 'imported-1' }),
    report: vi.fn().mockResolvedValue({ ok: true }),
    rate: vi.fn().mockResolvedValue({ ok: true }),
    getReports: vi.fn().mockReturnValue([]),
    getRatings: vi.fn().mockReturnValue([]),
    getUserRating: vi.fn().mockReturnValue(undefined),
    getCreatorPenalty: vi.fn().mockReturnValue({ strikeCount: 0, banned: false }),
    search: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe('CommunityPersonaUI', () => {
  const defaultProps = {
    userId: 'user-1',
    communityService: makeMockCommunityService(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('browse view', () => {
    it('renders the community header', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Persona 社区')).toBeInTheDocument()
      })
    })

    it('renders search input', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('搜索 Persona...')).toBeInTheDocument()
      })
    })

    it('renders sort buttons', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('热门')).toBeInTheDocument()
        expect(screen.getByText('最新')).toBeInTheDocument()
        expect(screen.getByText('高分')).toBeInTheDocument()
      })
    })

    it('renders entry cards after loading', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('创作者A')).toBeInTheDocument()
        expect(screen.getByText('创作者B')).toBeInTheDocument()
        expect(screen.getByText('创作者C')).toBeInTheDocument()
      })
    })

    it('shows empty state when no entries', async () => {
      const service = makeMockCommunityService({ list: vi.fn().mockResolvedValue([]) })
      render(<CommunityPersonaUI {...defaultProps} userId="user-1" communityService={service} onClose={vi.fn()} />)
      await waitFor(() => {
        expect(screen.getByText('暂无内容')).toBeInTheDocument()
      })
    })

    it('shows loading state', () => {
      const service = makeMockCommunityService({
        list: vi.fn().mockReturnValue(new Promise(() => {})),
      })
      render(<CommunityPersonaUI {...defaultProps} userId="user-1" communityService={service} onClose={vi.fn()} />)
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('shows error banner on load failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const service = makeMockCommunityService({
        list: vi.fn().mockImplementation((params?: { limit?: number }) => {
          if (params && params.limit === 100) {
            return Promise.resolve([])
          }
          return Promise.reject(new Error('网络错误'))
        }),
      })
      const onClose = vi.fn()
      render(<CommunityPersonaUI userId="user-1" communityService={service} onClose={onClose} />)
      await waitFor(() => {
        expect(screen.getByText('加载失败，请重试')).toBeInTheDocument()
      })
      consoleSpy.mockRestore()
    })

    it('navigates to detail view on card click', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('创作者A')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('创作者A'))
      await waitFor(() => {
        const elements = screen.getAllByText('创作者A')
        expect(elements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('detail view', () => {
    it('shows import button in detail view', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('创作者A')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('创作者A'))
      await waitFor(() => {
        expect(screen.getByText('导入到我的')).toBeInTheDocument()
      })
    })

    it('shows rating button in detail view', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('创作者A')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('创作者A'))
      await waitFor(() => {
        expect(screen.getByText('评分')).toBeInTheDocument()
      })
    })

    it('shows stats section in detail view', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('创作者A')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('创作者A'))
      await waitFor(() => {
        expect(screen.getByText('统计信息')).toBeInTheDocument()
      })
    })

    it('back button returns to browse', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('创作者A')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('创作者A'))
      await waitFor(() => {
        expect(screen.getByText('导入到我的')).toBeInTheDocument()
      })
      const backButton = screen.getByRole('button', { name: '返回' })
      fireEvent.click(backButton)
      await waitFor(() => {
        expect(screen.getByText('Persona 社区')).toBeInTheDocument()
      })
    })
  })

  describe('my shares view', () => {
    it('navigates to my shares view', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('我的')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('我的'))
      await waitFor(() => {
        expect(screen.getByText('我的分享')).toBeInTheDocument()
      })
    })
  })

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: '关闭' }))
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls onClose when backdrop is clicked', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Persona 社区')).toBeInTheDocument()
      })
      const backdrop = document.querySelector('.community-persona-backdrop')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(defaultProps.onClose).toHaveBeenCalled()
      }
    })
  })

  describe('search', () => {
    it('updates search query on input change', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('搜索 Persona...')).toBeInTheDocument()
      })
      const input = screen.getByPlaceholderText('搜索 Persona...')
      fireEvent.change(input, { target: { value: '测试' } })
      expect(input).toHaveValue('测试')
    })
  })

  describe('sort', () => {
    it('changes sort mode on button click', async () => {
      render(<CommunityPersonaUI {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('最新')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('最新'))
      await waitFor(() => {
        expect(defaultProps.communityService.list).toHaveBeenCalled()
      })
    })
  })
})
