import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomPersonaEditorUI } from './CustomPersonaEditorUI'
import type { PersonaSafetyGate } from './personaSafetyGate'
import type { SafetyIncidentLog } from './safetyIncidentLog'
import type { CustomPersonaService } from './customPersonaService'
import type { IPersonaAvatarGen } from './personaAvatarGen'
import type { EntitlementService } from '../entitlement/entitlementService'

function makePassingSafetyGate(): PersonaSafetyGate {
  return {
    validateIdentityRole: () => ({ ok: true }),
    validateName: () => ({ ok: true }),
    validateAddressing: () => ({ ok: true }),
    validateContent: () => ({ ok: true }),
    validateDialogue: () => ({ ok: true }),
    checkConversationHealth: () => ({ ok: true }),
  }
}

function makeMockIncidentLog(): SafetyIncidentLog {
  return {
    log: vi.fn().mockReturnValue('incident-1'),
    getByUser: vi.fn().mockReturnValue([]),
    getByCategory: vi.fn().mockReturnValue([]),
    getRecent: vi.fn().mockReturnValue([]),
    countByUser: vi.fn().mockReturnValue(0),
    clear: vi.fn(),
  }
}

function makeMockCustomPersonaService(): CustomPersonaService {
  return {
    createWithAudit: vi.fn().mockResolvedValue({
      id: 'custom-1',
      name: '测试人格',
      addressing: '你好',
      identityRole: 'friend',
      toneKeywords: ['gentle'],
      catchphrase: '加油',
      backstory: '一个测试人格',
      forbiddenTopics: [],
      avatarSource: 'preset',
      avatarAssetId: 'avatar-1',
      creatorUserId: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [],
    }),
    updateWithAudit: vi.fn(),
    deleteWithAudit: vi.fn(),
  }
}

function makeMockAvatarGen(): IPersonaAvatarGen {
  return {
    generate: vi.fn().mockResolvedValue({ assetId: 'ai-avatar-1', url: 'https://example.com/avatar.png', style: 'anime' }),
    getQuota: vi.fn().mockReturnValue({ remaining: 5, total: 10 }),
  }
}

function makeMockEntitlementService(overrides: Partial<EntitlementService> = {}): EntitlementService {
  return {
    has: vi.fn().mockReturnValue(false),
    consume: vi.fn().mockReturnValue({ ok: false }),
    list: vi.fn().mockReturnValue([]),
    grant: vi.fn(),
    revoke: vi.fn(),
    ...overrides,
  }
}

function makeAgentEntitlementService(): EntitlementService {
  return makeMockEntitlementService({
    has: vi.fn().mockImplementation((_userId: string, code: string) => {
      return code === 'agent' || code === 'agent_plus'
    }),
  })
}

describe('CustomPersonaEditorUI', () => {
  const defaultProps = {
    userId: 'user-1',
    onClose: vi.fn(),
    onCreate: vi.fn(),
    safetyGate: makePassingSafetyGate(),
    incidentLog: makeMockIncidentLog(),
    customPersonaService: makeMockCustomPersonaService(),
    avatarGen: makeMockAvatarGen(),
    entitlementService: makeAgentEntitlementService(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the editor with step 1 (template selection)', () => {
    render(<CustomPersonaEditorUI {...defaultProps} />)
    expect(screen.getByText('选择基础模板')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<CustomPersonaEditorUI {...defaultProps} />)
    const closeButton = screen.getByRole('button', { name: /关闭/ })
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<CustomPersonaEditorUI {...defaultProps} />)
    const closeButton = screen.getByRole('button', { name: /关闭/ })
    fireEvent.click(closeButton)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('shows progress indicator with 3 steps', () => {
    render(<CustomPersonaEditorUI {...defaultProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders template cards in step 1', () => {
    render(<CustomPersonaEditorUI {...defaultProps} />)
    expect(screen.getByText('选择基础模板')).toBeInTheDocument()
  })

  it('renders without optional services', () => {
    render(
      <CustomPersonaEditorUI
        userId="user-1"
        onClose={vi.fn()}
        onCreate={vi.fn()}
        entitlementService={makeAgentEntitlementService()}
      />
    )
    expect(screen.getByText('选择基础模板')).toBeInTheDocument()
  })

  it('shows entitlement block when no custom persona quota', () => {
    render(<CustomPersonaEditorUI {...defaultProps} entitlementService={makeMockEntitlementService()} />)
    expect(screen.getByText('需要开通会员')).toBeInTheDocument()
  })
})
