import type { FC } from 'react'
import { ApiKeySettingsUI } from '../../settings/ApiKeySettingsUI'

interface ApiKeySettingsModalProps {
  onClose: () => void
}

export const ApiKeySettingsModal: FC<ApiKeySettingsModalProps> = ({ onClose }) => {
  return <ApiKeySettingsUI onClose={onClose} />
}
