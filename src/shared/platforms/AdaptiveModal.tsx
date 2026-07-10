import { type ReactNode } from 'react'
import { usePlatform } from './usePlatform'
import { DraggableModal } from '../canvas/DraggableModal'
import { FullScreenModal } from './FullScreenModal'

interface AdaptiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  ariaLabel: string
  children: ReactNode
  className?: string
}

export const AdaptiveModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  ariaLabel,
  children,
  className
}: AdaptiveModalProps) => {
  const { deviceCategory } = usePlatform()

  if (deviceCategory === 'desktop') {
    return (
      <DraggableModal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        ariaLabel={ariaLabel}
        className={className}
      >
        {children}
      </DraggableModal>
    )
  }

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      ariaLabel={ariaLabel}
      className={className}
    >
      {children}
    </FullScreenModal>
  )
}
