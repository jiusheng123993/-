import type { FC } from 'react'
import { CommunityPersonaUI } from '../../../ai-partner/personas/community/CommunityPersonaUI'
import type { ICommunityPersonaService } from '../../../ai-partner/personas/community/communityPersonaService'
import type { CustomPersona } from '../../../ai-partner/personas/customPersona'

interface CommunityPersonaModalProps {
  userId: string
  communityService: ICommunityPersonaService
  onImportPersona: (persona: CustomPersona) => void
  onClose: () => void
}

export const CommunityPersonaModal: FC<CommunityPersonaModalProps> = ({
  userId,
  communityService,
  onImportPersona,
  onClose,
}) => {
  return (
    <CommunityPersonaUI
      userId={userId}
      communityService={communityService}
      onImportPersona={onImportPersona}
      onClose={onClose}
    />
  )
}
