import { useMemo } from 'react'
import type { CyclePhase } from './cycleTypes'
import { PHASE_LABELS } from './cycleTypes'
import { cycleService } from './cycleService'
import { generateEnergySuggestion } from './energySuggestionEngine'
import { formatDate } from './cyclePredictionEngine'
import { Droplets, Zap, AlertTriangle } from 'lucide-react'

const PHASE_ICONS: Record<CyclePhase, string> = {
  menstrual: '🩸',
  follicular: '🌱',
  ovulation: '🌸',
  luteal: '🌙'
}

const ENERGY_COLORS: Record<string, string> = {
  low: '#e74c3c',
  medium: '#f39c12',
  high: '#2ecc71'
}

type CycleTodayCardProps = {
  onQuickRecord: () => void
}

export function CycleTodayCard({ onQuickRecord }: CycleTodayCardProps) {
  const today = useMemo(() => formatDate(new Date()), [])
  const prediction = useMemo(() => cycleService.getPrediction(today), [today])
  const suggestion = useMemo(() => generateEnergySuggestion(prediction.currentPhase, today), [prediction, today])

  const daysUntilPeriod = useMemo(() => {
    const todayDate = new Date(today)
    const nextDate = new Date(prediction.nextPeriodStart)
    const diff = Math.ceil((nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [today, prediction])

  return (
    <div className="cycle-today-card">
      <div className="cycle-today-header">
        <span className="cycle-phase-icon">{PHASE_ICONS[prediction.currentPhase]}</span>
        <div className="cycle-today-info">
          <span className="cycle-phase-label">{PHASE_LABELS[prediction.currentPhase]}</span>
          <span className="cycle-days-until">
            {daysUntilPeriod > 0
              ? `距下次经期约 ${daysUntilPeriod} 天`
              : daysUntilPeriod === 0
                ? '经期预计今天开始'
                : '经期中'}
          </span>
        </div>
      </div>

      {suggestion && (
        <div className="cycle-energy-section">
          <div className="cycle-energy-level">
            <Zap size={14} style={{ color: ENERGY_COLORS[suggestion.energyLevel] }} />
            <span>能量水平：{suggestion.energyLevel === 'low' ? '低' : suggestion.energyLevel === 'medium' ? '中' : '高'}</span>
          </div>
          <div className="cycle-suggestions">
            {suggestion.suggestions.map((s, i) => (
              <p key={i} className="cycle-suggestion-item">{s}</p>
            ))}
          </div>
          {suggestion.avoidTypes.length > 0 && (
            <div className="cycle-avoid-section">
              <AlertTriangle size={12} />
              <span>建议避免：{suggestion.avoidTypes.join('、')}</span>
            </div>
          )}
        </div>
      )}

      <button className="cycle-quick-record-btn" onClick={onQuickRecord} type="button">
        <Droplets size={14} />
        <span>快捷记录</span>
      </button>

      {prediction.confidence < 0.5 && prediction.confidence > 0 && (
        <p className="cycle-confidence-note">
          预测置信度较低（{Math.round(prediction.confidence * 100)}%），建议持续记录以提高准确性
        </p>
      )}
    </div>
  )
}
