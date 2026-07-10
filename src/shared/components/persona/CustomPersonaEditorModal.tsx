import type { FC } from 'react'
import { CustomPersonaEditorUI } from '../../../ai-partner/personas/CustomPersonaEditorUI'
import type { EntitlementService } from '../../../ai-partner/personas/entitlementService'
import type { PersonaSafetyGate } from '../../../ai-partner/personas/personaSafetyGate'
import type { SafetyIncidentLog } from '../../../ai-partner/personas/safetyIncidentLog'
import type { IPersonaAvatarGen } from '../../../ai-partner/personas/personaAvatarGen'
import type { CustomPersonaService } from '../../../ai-partner/personas/customPersonaService'
import type { loadCustomPersonas } from '../../../ai-partner/personas/customPersona'

interface CustomPersonaEditorModalProps {
  userId: string
  onClose: () => void
  onCreate: (persona: ReturnType<typeof loadCustomPersonas>[number]) => void
  entitlementService: EntitlementService
  safetyGate: PersonaSafetyGate
  incidentLog: SafetyIncidentLog
  avatarGen: IPersonaAvatarGen
  customPersonaService: CustomPersonaService
}

export const CustomPersonaEditorModal: FC<CustomPersonaEditorModalProps> = ({
  userId,
  onClose,
  onCreate,
  entitlementService,
  safetyGate,
  incidentLog,
  avatarGen,
  customPersonaService,
}) => {
  return (
    <CustomPersonaEditorUI
      userId={userId}
      onClose={onClose}
      onCreate={onCreate}
      entitlementService={entitlementService}
      safetyGate={safetyGate}
      incidentLog={incidentLog}
      avatarGen={avatarGen}
      customPersonaService={customPersonaService}
    />
  )
}
