import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { ApiKeySettingsUI } from '../../settings/ApiKeySettingsUI'

interface ApiKeySettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ApiKeySettingsModal: FC<ApiKeySettingsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="API 密钥设置"
      subtitle="管理你的 AI 服务密钥"
      ariaLabel="API 密钥设置"
    >
      <ApiKeySettingsUI onClose={onClose} />
    </AdaptiveModal>
  )
}
