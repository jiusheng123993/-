import { useState, useCallback, useEffect } from 'react'
import {
  getExamRecords,
  addExamRecord,
  deleteExamRecord,
  updateExamRecord,
  getLatestTwoRecords,
  getSubjectsFromRecords,
  getExamStats,
  getComparison,
  type ExamRecord,
  type ExamScore,
  type ComparisonResult
} from './examTrackerService'
import { sendAgentChatMessageStream } from '../../ai-partner/agent/agentRuntime'
import { useApiKeyStatus } from '../../shared/hooks/useApiKeyStatus'
import { useMembership } from '../../shared/hooks/useMembership'
import styles from './ExamTrackerUI.module.css'

const DEFAULT_SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

interface ExamTrackerUIProps {
  userId?: string
}

export function ExamTrackerUI({ userId }: ExamTrackerUIProps) {
  const [records, setRecords] = useState<ExamRecord[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [newScores, setNewScores] = useState<ExamScore[]>([
    { subject: '数学', score: 0, totalScore: 150 }
  ])
  const [newNotes, setNewNotes] = useState('')

  const [compareIdA, setCompareIdA] = useState<string>('')
  const [compareIdB, setCompareIdB] = useState<string>('')
  const [customComparison, setCustomComparison] = useState<ComparisonResult | null>(null)

  const { hasAnyKey } = useApiKeyStatus()
  const { isMember } = useMembership(userId)

  const loadData = useCallback(() => {
    setRecords(getExamRecords())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const subjects = getSubjectsFromRecords()

  const latestTwo = getLatestTwoRecords()

  const handleAddScoreRow = () => {
    setNewScores(prev => [...prev, { subject: '', score: 0, totalScore: 100 }])
  }

  const handleRemoveScoreRow = (index: number) => {
    setNewScores(prev => prev.filter((_, i) => i !== index))
  }

  const handleScoreChange = (index: number, field: keyof ExamScore, value: string | number) => {
    setNewScores(prev => prev.map((s, i) => {
      if (i !== index) return s
      return { ...s, [field]: field === 'subject' ? String(value) : Number(value) || 0 }
    }))
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const validScores = newScores.filter(s => s.subject.trim() && s.score > 0)
    if (validScores.length === 0) return

    addExamRecord({
      name: newName.trim(),
      date: newDate,
      scores: validScores,
      notes: newNotes.trim() || undefined
    })

    setRecords(getExamRecords())
    setNewName('')
    setNewDate(new Date().toISOString().slice(0, 10))
    setNewScores([{ subject: '数学', score: 0, totalScore: 150 }])
    setNewNotes('')
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    deleteExamRecord(id)
    setRecords(prev => prev.filter(r => r.id !== id))
    setExpandedId(null)
  }

  const startEditing = (record: ExamRecord) => {
    setEditingId(record.id)
    setNewName(record.name)
    setNewDate(record.date)
    setNewScores(record.scores.map(s => ({ ...s })))
    setNewNotes(record.notes || '')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setNewName('')
    setNewDate(new Date().toISOString().slice(0, 10))
    setNewScores([{ subject: '数学', score: 0, totalScore: 150 }])
    setNewNotes('')
  }

  const handleUpdate = () => {
    if (!editingId || !newName.trim()) return
    const validScores = newScores.filter(s => s.subject.trim() && s.score > 0)
    if (validScores.length === 0) return

    updateExamRecord(editingId, {
      name: newName.trim(),
      date: newDate,
      scores: validScores,
      notes: newNotes.trim() || undefined
    })

    setRecords(getExamRecords())
    cancelEditing()
  }

  const handleAIAnalyze = async () => {
    if (!latestTwo) return
    setAiLoading(true)
    setAiError(null)

    const [latest, previous] = latestTwo

    const buildScoreText = (record: ExamRecord) =>
      record.scores.map(s => `${s.subject}: ${s.score}/${s.totalScore}`).join(', ')

    try {
      const userPrompt = `最近考试：《${latest.name}》（${latest.date}）- ${buildScoreText(latest)}
上一次：《${previous.name}》（${previous.date}）- ${buildScoreText(previous)}`

      let fullResponse = ''

      await sendAgentChatMessageStream({
        message: userPrompt,
        personaId: 'exam-student',
        useXFYunCoding: true,
        onChunk: (chunk) => {
          fullResponse += chunk
        }
      })

      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        updateExamRecord(latest.id, { aiAnalysis: fullResponse.trim() })
        setRecords(getExamRecords())
      } else {
        setAiError('AI 返回格式解析失败')
      }
    } catch {
      setAiError('AI 分析失败，请重试')
    } finally {
      setAiLoading(false)
    }
  }

  const handleCustomCompare = () => {
    if (!compareIdA || !compareIdB || compareIdA === compareIdB) return
    const recordA = records.find(r => r.id === compareIdA)
    const recordB = records.find(r => r.id === compareIdB)
    if (!recordA || !recordB) return
    setCustomComparison(getComparison(recordA, recordB))
  }

  const computeComparison = () => {
    if (!latestTwo) return null
    const [latest, previous] = latestTwo
    return getComparison(latest, previous)
  }

  const comparison = computeComparison()

  const computeTrend = () => {
    const reversed = [...records].reverse()
    const trendMap = new Map<string, number[]>()
    for (const record of reversed) {
      for (const score of record.scores) {
        if (!trendMap.has(score.subject)) {
          trendMap.set(score.subject, [])
        }
        trendMap.get(score.subject)!.push(score.totalScore > 0 ? score.score / score.totalScore : 0)
      }
    }
    return Array.from(trendMap.entries()).map(([subject, values]) => {
      const maxVal = Math.max(...values, 0.01)
      return { subject, values, maxVal }
    })
  }

  const trend = computeTrend()

  const renderScoreForm = (isEdit: boolean) => (
    <div className={styles.addForm}>
      <div className={styles.formTitle}>{isEdit ? '编辑考试记录' : '添加考试记录'}</div>
      <input
        className={styles.input}
        type="text"
        placeholder="考试名称（如：一模、期中考试）"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <input
        className={styles.input}
        type="date"
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
      />
      <div className={styles.scoresSection}>
        <span className={styles.scoresLabel}>各科分数</span>
        {newScores.map((score, index) => (
          <div key={index} className={styles.scoreRow}>
            <select
              className={styles.select}
              value={score.subject}
              onChange={(e) => handleScoreChange(index, 'subject', e.target.value)}
            >
              <option value="">选择科目</option>
              {[...new Set([...DEFAULT_SUBJECTS, ...subjects])].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              className={styles.input}
              type="number"
              placeholder="分数"
              value={score.score || ''}
              onChange={(e) => handleScoreChange(index, 'score', e.target.value)}
              min={0}
            />
            <input
              className={styles.input}
              type="number"
              placeholder="满分"
              value={score.totalScore || ''}
              onChange={(e) => handleScoreChange(index, 'totalScore', e.target.value)}
              min={1}
            />
            <input
              className={styles.input}
              type="number"
              placeholder="目标"
              value={score.targetScore ?? ''}
              onChange={(e) => {
                const val = e.target.value
                setNewScores(prev => prev.map((s, i) => {
                  if (i !== index) return s
                  return { ...s, targetScore: val === '' ? undefined : Number(val) || 0 }
                }))
              }}
              min={0}
            />
            {newScores.length > 1 && (
              <button
                className={styles.removeScoreButton}
                onClick={() => handleRemoveScoreRow(index)}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          className={styles.addScoreButton}
          onClick={handleAddScoreRow}
          type="button"
        >
          + 添加科目
        </button>
      </div>
      <textarea
        className={styles.textarea}
        placeholder="复盘笔记（可选）"
        value={newNotes}
        onChange={(e) => setNewNotes(e.target.value)}
        rows={3}
      />
      <div className={styles.formActions}>
        <button
          className={styles.cancelButton}
          onClick={() => {
            if (isEdit) cancelEditing()
            else setShowAddForm(false)
          }}
        >
          取消
        </button>
        <button
          className={styles.submitButton}
          onClick={() => isEdit ? handleUpdate() : handleAdd()}
          disabled={!newName.trim()}
        >
          保存
        </button>
      </div>
    </div>
  )

  const renderComparisonTable = (result: ComparisonResult) => (
    <div className={styles.comparisonSection}>
      <div className={styles.comparisonTitle}>
        📊 {result.recordA.name} vs {result.recordB.name}
      </div>
      <table className={styles.comparisonTable}>
        <thead>
          <tr>
            <th>科目</th>
            <th>{result.recordB.name}</th>
            <th>{result.recordA.name}</th>
            <th>变化</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map(row => (
            <tr key={row.subject}>
              <td>{row.subject}</td>
              <td>{row.prevScore}/{row.prevTotal}</td>
              <td>{row.currScore}/{row.currTotal}</td>
              <td className={row.change > 0 ? styles.changeUp : row.change < 0 ? styles.changeDown : styles.changeNone}>
                {row.change > 0 ? '+' : ''}{row.change.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>考试记录</h3>
        <span className={styles.count}>{records.length} 次考试</span>
      </div>

      {records.length >= 2 && (
        <div className={styles.customCompareSection}>
          <div className={styles.customCompareTitle}>🔍 任意两次对比</div>
          <div className={styles.customCompareRow}>
            <select
              className={styles.compareSelect}
              value={compareIdA}
              onChange={(e) => setCompareIdA(e.target.value)}
            >
              <option value="">选择考试 A</option>
              {records.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.date})</option>
              ))}
            </select>
            <span className={styles.compareVs}>vs</span>
            <select
              className={styles.compareSelect}
              value={compareIdB}
              onChange={(e) => setCompareIdB(e.target.value)}
            >
              <option value="">选择考试 B</option>
              {records.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.date})</option>
              ))}
            </select>
            <button
              className={styles.compareButton}
              onClick={handleCustomCompare}
              disabled={!compareIdA || !compareIdB || compareIdA === compareIdB}
            >
              对比
            </button>
          </div>
          {customComparison && renderComparisonTable(customComparison)}
        </div>
      )}

      {comparison && (
        renderComparisonTable(comparison)
      )}

      {trend.length > 0 && records.length >= 2 && (
        <div className={styles.trendSection}>
          <div className={styles.trendTitle}>📈 分数趋势</div>
          <div className={styles.trendChart}>
            {trend.map(({ subject, values, maxVal }) => (
              <div key={subject} className={styles.trendRow}>
                <span className={styles.trendSubject}>{subject}</span>
                <div className={styles.trendBars}>
                  {values.map((v, i) => (
                    <div
                      key={i}
                      className={styles.trendBar}
                      style={{ height: `${Math.max((v / maxVal) * 100, 4)}%` }}
                      data-tooltip={`${Math.round(v * 100)}%`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.list}>
        {records.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <div className={styles.emptyText}>还没有考试记录</div>
            <div className={styles.emptyHint}>记录每次考试的各科分数，追踪进步轨迹</div>
          </div>
        ) : (
          records.map(record => {
            const stats = getExamStats(record)
            return (
              <div
                key={record.id}
                className={`${styles.record} ${expandedId === record.id ? styles.recordExpanded : ''}`}
                onClick={() => {
                  if (editingId !== record.id) {
                    setExpandedId(expandedId === record.id ? null : record.id)
                  }
                }}
              >
                <div className={styles.recordHeader}>
                  <span className={styles.recordName}>{record.name}</span>
                  <span className={styles.recordDate}>
                    {new Date(record.date).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className={styles.recordSummary}>
                  <span className={styles.totalScoreTag}>
                    📊 总分 {stats.totalScore}/{stats.totalMaxScore}
                    <span className={styles.avgRate}>
                      （{Math.round(stats.averageRate * 100)}%）
                    </span>
                  </span>
                  {record.scores.map(s => (
                    <span key={s.subject} className={styles.scoreTag}>
                      {s.subject} {s.score}/{s.totalScore}
                    </span>
                  ))}
                </div>

                {expandedId === record.id && editingId !== record.id && (
                  <div className={styles.recordDetail}>
                    <table className={styles.scoreTable}>
                      <thead>
                        <tr>
                          <th>科目</th>
                          <th>分数</th>
                          <th>得分率</th>
                          <th>目标</th>
                          <th>差距</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.scores.map(s => {
                          const rate = s.totalScore > 0 ? Math.round((s.score / s.totalScore) * 100) : 0
                          const targetRate = s.targetScore && s.totalScore > 0
                            ? Math.round((s.targetScore / s.totalScore) * 100)
                            : null
                          const gap = s.targetScore != null ? s.score - s.targetScore : null
                          return (
                            <tr key={s.subject}>
                              <td>{s.subject}</td>
                              <td className={styles.scoreValue}>
                                {s.score}
                                <span className={styles.scorePercent}>/ {s.totalScore}</span>
                              </td>
                              <td>{rate}%</td>
                              <td className={styles.targetCell}>
                                {s.targetScore != null ? `${s.targetScore} (${targetRate}%)` : '-'}
                              </td>
                              <td className={gap != null ? (gap >= 0 ? styles.gapMet : styles.gapMiss) : styles.gapNone}>
                                {gap != null ? (gap >= 0 ? `+${gap}` : `${gap}`) : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {record.notes && (
                      <div className={styles.notes}>
                        <div className={styles.notesLabel}>复盘笔记</div>
                        {record.notes}
                      </div>
                    )}

                    {record.aiAnalysis ? (
                      <div className={styles.aiSection}>
                        <div className={styles.aiLabel}>🤖 AI 对比分析</div>
                        <div className={styles.aiContent}>{record.aiAnalysis}</div>
                      </div>
                    ) : aiLoading ? (
                      <div className={styles.aiActions}>
                        <div className={styles.aiLoading}>
                          <span className={styles.spinner}></span>
                          AI 分析中...
                        </div>
                      </div>
                    ) : records.length >= 2 && record === records[0] ? (
                      <div className={styles.aiActions}>
                        {!isMember ? (
                          <div className={styles.aiHint}>
                            🔒 AI 分析为会员功能，升级会员即可使用
                          </div>
                        ) : !hasAnyKey ? (
                          <div className={styles.aiHint}>
                            配置 API Key 解锁 AI 分析
                          </div>
                        ) : null}
                        <button
                          className={styles.aiButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAIAnalyze()
                          }}
                          disabled={!isMember || !hasAnyKey}
                        >
                          🤖 AI 对比分析
                        </button>
                        {aiError && <div className={styles.aiError}>{aiError}</div>}
                      </div>
                    ) : null}

                    <div className={styles.detailActions}>
                      <button
                        className={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(record)
                        }}
                      >
                        ✏️ 编辑
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(record.id)
                        }}
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                )}

                {editingId === record.id && renderScoreForm(true)}
              </div>
            )
          })
        )}
      </div>

      {showAddForm && !editingId && renderScoreForm(false)}

      {!showAddForm && !editingId && (
        <button
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          + 添加考试记录
        </button>
      )}
    </div>
  )
}