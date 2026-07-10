import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CameoStorefrontUI } from './CameoStorefrontUI'
import type { PersonaProvider } from '../../shared/entitlement/personaProvider'
import type { PersistentEntitlementService } from '../../shared/entitlement/persistentEntitlementService'

function makeMockPersonaProvider(overrides: Partial<PersonaProvider> = {}): PersonaProvider {
  return {
    canUsePreset: vi.fn().mockReturnValue(true),
    canUseCameo: vi.fn().mockReturnValue(false),
    canCreateCustom: vi.fn().mockReturnValue(true),
    getCustomSlotCount: vi.fn().mockReturnValue(3),
    canGenerateAvatar: vi.fn().mockReturnValue(true),
    getAvailablePresets: vi.fn().mockReturnValue(['preset-1', 'preset-2']),
    ...overrides,
  }
}

function makeMockEntitlementService(overrides: Partial<PersistentEntitlementService> = {}): PersistentEntitlementService {
  return {
    has: vi.fn().mockReturnValue(false),
    consume: vi.fn().mockReturnValue({ ok: true, remaining: 5 }),
    list: vi.fn().mockReturnValue([]),
    grant: vi.fn(),
    revoke: vi.fn(),
    loadForUser: vi.fn().mockResolvedValue(undefined),
    saveForUser: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('CameoStorefrontUI', () => {
  const defaultProps = {
    userId: 'user-1',
    personaProvider: makeMockPersonaProvider(),
    entitlementService: makeMockEntitlementService(),
    onClose: vi.fn(),
    onPurchase: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('store view', () => {
    it('renders the store header', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('客串商店')).toBeInTheDocument()
    })

    it('renders store and purchased tabs', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('商店')).toBeInTheDocument()
      expect(screen.getByText('已购')).toBeInTheDocument()
    })

    it('renders free products section', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('限时免费')).toBeInTheDocument()
    })

    it('renders paid products section', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('付费客串')).toBeInTheDocument()
    })

    it('renders product cards with names', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('元气啦啦队')).toBeInTheDocument()
      expect(screen.getByText('睡前故事家')).toBeInTheDocument()
      expect(screen.getByText('硬核激励师')).toBeInTheDocument()
    })

    it('shows free claim button for free products', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      const claimButtons = screen.getAllByText('免费领取')
      expect(claimButtons.length).toBeGreaterThan(0)
    })

    it('shows price for paid products', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('¥9.9')).toBeInTheDocument()
    })

    it('shows original price with strikethrough for discounted products', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('¥19.9')).toBeInTheDocument()
    })

    it('shows new badge on new products', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      const newBadges = screen.getAllByText('新品')
      expect(newBadges.length).toBeGreaterThan(0)
    })

    it('shows popular badge on popular products', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      const popularBadges = screen.getAllByText('热门')
      expect(popularBadges.length).toBeGreaterThan(0)
    })

    it('shows limited badge on limited products', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      const limitedBadges = screen.getAllByText('限定')
      expect(limitedBadges.length).toBeGreaterThan(0)
    })

    it('shows owned badge for purchased products', () => {
      const provider = makeMockPersonaProvider({
        canUseCameo: vi.fn().mockImplementation((_userId: string, cameoId: string) => {
          return cameoId === 'cameo_cheerleader'
        }),
      })
      render(<CameoStorefrontUI {...defaultProps} personaProvider={provider} />)
      expect(screen.getByText('已拥有')).toBeInTheDocument()
    })

    it('shows footer note about permanent ownership', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      expect(screen.getByText('购买后永久有效，可在 Persona 切换中随时使用')).toBeInTheDocument()
    })
  })

  describe('purchased view', () => {
    it('switches to purchased view on tab click', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('已购'))
      expect(screen.getByText('还没有已购客串')).toBeInTheDocument()
    })

    it('shows empty state when no purchases', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('已购'))
      expect(screen.getByText('去商店逛逛，发现更多有趣的客串角色')).toBeInTheDocument()
    })

    it('shows go to store button in empty state', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('已购'))
      expect(screen.getByText('去商店')).toBeInTheDocument()
    })

    it('shows purchased products when available', () => {
      const provider = makeMockPersonaProvider({
        canUseCameo: vi.fn().mockReturnValue(true),
      })
      render(<CameoStorefrontUI {...defaultProps} personaProvider={provider} />)
      fireEvent.click(screen.getByText('已购'))
      expect(screen.getByText('已解锁客串')).toBeInTheDocument()
    })
  })

  describe('product detail dialog', () => {
    it('opens detail dialog on product card click', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('硬核激励师'))
      expect(screen.getByText('身份：motivator')).toBeInTheDocument()
    })

    it('shows product details in dialog', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('硬核激励师'))
      expect(screen.getByText('身份：motivator')).toBeInTheDocument()
      expect(screen.getByText('年龄限制：16+')).toBeInTheDocument()
    })

    it('shows limited until date for limited products', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('节日限定·暖心伙伴'))
      expect(screen.getByText('限时截止：2026-07-15')).toBeInTheDocument()
    })

    it('shows discount savings in dialog', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('元气啦啦队'))
      expect(screen.getByText('省¥10.0')).toBeInTheDocument()
    })

    it('closes dialog on close button click', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('硬核激励师'))
      const overlay = document.querySelector('.cameo-storefront-modal-overlay')
      expect(overlay).toBeInTheDocument()
      const dialogClose = document.querySelector('.cameo-storefront-dialog-close')
      expect(dialogClose).toBeInTheDocument()
      fireEvent.click(dialogClose!)
      expect(document.querySelector('.cameo-storefront-modal-overlay')).not.toBeInTheDocument()
    })

    it('closes dialog on overlay click', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('硬核激励师'))
      const overlay = document.querySelector('.cameo-storefront-modal-overlay')
      expect(overlay).toBeInTheDocument()
      fireEvent.click(overlay!)
      expect(document.querySelector('.cameo-storefront-modal-overlay')).not.toBeInTheDocument()
    })
  })

  describe('purchase flow', () => {
    it('handles free claim successfully', async () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      const claimButtons = screen.getAllByText('免费领取')
      fireEvent.click(claimButtons[0])
      await waitFor(() => {
        expect(defaultProps.entitlementService.grant).toHaveBeenCalled()
      })
    })

    it('handles purchase from dialog', async () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('硬核激励师'))
      const buyButton = screen.getByText('立即解锁')
      fireEvent.click(buyButton)
      await waitFor(() => {
        expect(defaultProps.entitlementService.grant).toHaveBeenCalled()
      })
    })

    it('calls onPurchase callback after successful purchase', async () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      fireEvent.click(screen.getByText('硬核激励师'))
      const buyButton = screen.getByText('立即解锁')
      fireEvent.click(buyButton)
      await waitFor(() => {
        expect(defaultProps.onPurchase).toHaveBeenCalledWith('cameo_motivator')
      })
    })
  })

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', () => {
      render(<CameoStorefrontUI {...defaultProps} />)
      const headerClose = document.querySelector('.cameo-storefront-close-btn')
      expect(headerClose).toBeInTheDocument()
      fireEvent.click(headerClose!)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})
