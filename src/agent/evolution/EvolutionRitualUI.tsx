import { useState } from 'react'
import type { EvolutionRitualUIProps, EvolutionEntry } from './evolutionRitualTypes'
import styles from './EvolutionRitualUI.module.css'

const FIELD_PATH_LABELS: Record<string, string> = {
  'identity.nickname': '身份信息.昵称',
  'identity.ageGroup': '身份信息.年龄段',
  'identity.occupation': '身份信息.职业',
  'personality.mbtiTendency': '性格特征.MBTI倾向',
  'personality.workStyle': '性格特征.工作风格',
  'rhythm.energyPeak': '生活节奏.精力高峰',
  'goals.primaryGoal': '目标规划.主要目标',
  'preferences.encouragementStyle': '交互偏好.鼓励风格',
  'emotional.motivationLevel': '情绪状态.动力等级',
  'emotional.currentMoodTrend': '情绪状态.情绪趋势',
  'learning.strongSubjects': '学习特征.擅长科目',
  'learning.weakSubjects': '学习特征.薄弱科目',
}

function getFieldLabel(fieldPath: string): string {
  return FIELD_PATH_LABELS[fieldPath] ?? fieldPath
}

function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

function getConfidenceClass(confidence: number): string {
  const level = getConfidenceLevel(confidence)
  if (level === 'high') return styles.high
  if (level === 'medium') return styles.medium
  return styles.low
}

function getTitle(entry: EvolutionEntry): string {
  if (entry.triggeredBy === 'cron') {
    return '这周我对你的理解又深了一点 🌱'
  }
  if (entry.triggeredBy === 'event_threshold') {
    return entry.triggerDetail || '我注意到你的一些变化...'
  }
  return '让我们一起看看这些变化 🌱'
}

function getDaysSinceCreation(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export function EvolutionRitualUI({
  entry,
  onAccept,
  onReject,
  onModify,
  onViewDetails,
  onClose,
}: EvolutionRitualUIProps) {
  const [isModifying, setIsModifying] = useState(false)
  const [modifiedValues, setModifiedValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const change of entry.proposedChanges) {
      initial[change.fieldPath] = change.newValue
    }
    return initial
  })

  const daysSince = getDaysSinceCreation(entry.createdAt)

  const handleAccept = () => {
    onAccept(entry.id)
  }

  const handleReject = () => {
    onReject(entry.id)
  }

  const handleStartModify = () => {
    setIsModifying(true)
  }

  const handleCancelModify = () => {
    setIsModifying(false)
    const reset: Record<string, unknown> = {}
    for (const change of entry.proposedChanges) {
      reset[change.fieldPath] = change.newValue
    }
    setModifiedValues(reset)
  }

  const handleSaveModify = () => {
    const finalChanges = entry.proposedChanges.map((proposal) => ({
      fieldPath: proposal.fieldPath,
      oldValue: proposal.oldValue,
      newValue: modifiedValues[proposal.fieldPath] ?? proposal.newValue,
    }))
    onModify(entry.id, finalChanges)
    setIsModifying(false)
  }

  const handleModifiedValueChange = (fieldPath: string, value: string) => {
    setModifiedValues((prev) => ({ ...prev, [fieldPath]: value }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{getTitle(entry)}</h2>
        <div className={styles.triggerInfo}>
          {entry.triggeredBy === 'cron' && '每周定期反思'}
          {entry.triggeredBy === 'event_threshold' && '事件触发反思'}
          {entry.triggeredBy === 'manual' && '手动触发反思'}
        </div>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        )}
      </div>

      <div className={styles.content}>
        {entry.proposedChanges.map((proposal) => (
          <div key={proposal.fieldPath} className={styles.proposal}>
            <div className={styles.proposalField}>{getFieldLabel(proposal.fieldPath)}</div>
            <div className={styles.proposalChange}>
              <span className={styles.oldValue}>{String(proposal.oldValue)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.newValue}>{String(proposal.newValue)}</span>
            </div>
            <div className={styles.proposalReason}>{proposal.reasoning}</div>
            <div className={styles.confidence}>
              <div className={styles.confidenceBar}>
                <div
                  className={`${styles.confidenceFill} ${getConfidenceClass(proposal.confidence)}`}
                  data-testid={`confidence-fill-${getConfidenceLevel(proposal.confidence)}`}
                  style={{ width: `${proposal.confidence * 100}%` }}
                />
              </div>
              <span className={styles.confidenceText}>
                {Math.round(proposal.confidence * 100)}%
              </span>
            </div>
            <div className={styles.evidence}>
              基于 {proposal.evidenceEventIds.length} 条行为证据
            </div>
          </div>
        ))}

        {entry.reflectionNote && (
          <div className={styles.reflectionNote}>{entry.reflectionNote}</div>
        )}

        {isModifying && (
          <div className={styles.modifyForm}>
            {entry.proposedChanges.map((proposal) => (
              <div key={proposal.fieldPath} className={styles.modifyField}>
                <label className={styles.modifyLabel}>
                  {getFieldLabel(proposal.fieldPath)}
                </label>
                <input
                  className={styles.modifyInput}
                  value={String(modifiedValues[proposal.fieldPath] ?? '')}
                  onChange={(e) => handleModifiedValueChange(proposal.fieldPath, e.target.value)}
                />
              </div>
            ))}
            <div className={styles.modifyActions}>
              <button className={styles.cancelModify} onClick={handleCancelModify}>
                取消
              </button>
              <button className={styles.saveModify} onClick={handleSaveModify}>
                保存修改
              </button>
            </div>
          </div>
        )}

        {!isModifying && (
          <div className={styles.actions}>
            <button className={styles.acceptButton} onClick={handleAccept}>
              ✅ 接受
            </button>
            <button className={styles.rejectButton} onClick={handleReject}>
              ❌ 不对
            </button>
            <button className={styles.modifyButton} onClick={handleStartModify}>
              ✏️ 改一下
            </button>
          </div>
        )}

        {onViewDetails && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '13px',
                textDecoration: 'underline',
              }}
              onClick={() => onViewDetails(entry.id)}
            >
              查看详细分析
            </button>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        这些理解基于你最近 {daysSince} 天的行为和对话，你随时可以在设置→我的画像中修改
      </div>
    </div>
  )
}
