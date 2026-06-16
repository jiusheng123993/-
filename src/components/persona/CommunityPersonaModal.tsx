import type { FC } from 'react'
import { CommunityPersonaUI } from '../../personas/community/CommunityPersonaUI'
import type { ICommunityPersonaService } from '../../personas/community/communityPersonaService'
import type { CustomPersona } from '../../personas/customPersona'

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
