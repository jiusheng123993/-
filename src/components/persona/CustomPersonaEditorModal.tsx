import type { FC } from 'react'
import { CustomPersonaEditorUI } from '../../personas/CustomPersonaEditorUI'
import type { EntitlementService } from '../../personas/entitlementService'
import type { PersonaSafetyGate } from '../../personas/personaSafetyGate'
import type { SafetyIncidentLog } from '../../personas/safetyIncidentLog'
import type { IPersonaAvatarGen } from '../../personas/personaAvatarGen'
import type { CustomPersonaService } from '../../personas/customPersonaService'
import type { loadCustomPersonas } from '../../personas/customPersona'

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
