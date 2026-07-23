import type { FC } from 'react'
import { CameoStorefrontUI } from '../../../ai-partner/personas/CameoStorefrontUI'
import type { PersonaProvider } from '../../../ai-partner/personas/personaProvider'
import type { PersistentEntitlementService } from '../../../ai-partner/personas/entitlementService'

interface CameoStorefrontModalProps {
  userId: string
  personaProvider: PersonaProvider
  entitlementService: PersistentEntitlementService
  onClose: () => void
  onPurchase: (personaId: string) => void
}

export const CameoStorefrontModal: FC<CameoStorefrontModalProps> = ({
  userId,
  personaProvider,
  entitlementService,
  onClose,
  onPurchase,
}) => {
  return (
    <CameoStorefrontUI
      userId={userId}
      personaProvider={personaProvider}
      entitlementService={entitlementService}
      onClose={onClose}
      onPurchase={onPurchase}
    />
  )
}
