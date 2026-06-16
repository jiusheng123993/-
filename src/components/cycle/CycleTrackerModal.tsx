import type { FC } from 'react'
import { CycleTracker } from '../../cycle/CycleTracker'

interface CycleTrackerModalProps {
  onClose: () => void
}

export const CycleTrackerModal: FC<CycleTrackerModalProps> = ({ onClose }) => (
  <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="membership-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="周期追踪"
      style={{ maxWidth: 800 }}
    >
      <header className="membership-modal-hero">
        <div className="membership-modal-hero-text">
          <p className="eyebrow">Cycle Tracker · 周期追踪</p>
          <h2>了解你的身体节奏</h2>
        </div>
        <button className="membership-modal-close" onClick={onClose} type="button" aria-label="关闭周期追踪">
          ×
        </button>
      </header>
      <div className="membership-modal-content">
        <CycleTracker />
      </div>
    </section>
  </div>
)
