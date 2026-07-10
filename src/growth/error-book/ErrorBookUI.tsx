import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getErrorItems,
  getSubjects,
  addErrorItem,
  deleteErrorItem,
  updateErrorItem,
  getErrorStats,
  type ErrorItem,
  type ErrorBookStats
} from './errorBookService'
import { sendAgentChatMessageStream } from '../../ai-partner/agent/agentRuntime'
import { useApiKeyStatus } from '../../shared/hooks/useApiKeyStatus'
import { useMembership } from '../../shared/hooks/useMembership'
import { loadState as loadMCState, saveState as saveMCState, addCard } from '../memory-cards/memoryCardsService'
import styles from './ErrorBookUI.module.css'

const SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '其他']
const MAX_IMAGE_SIZE = 800
const MAX_IMAGE_BYTES = 500 * 1024

type SortMode = 'time-desc' | 'time-asc' | 'subject' | 'mastered'

interface AIResult {
  analysis: string
  solution: string
  similarQuestions: { question: string; answer: string }[]
}

interface ErrorBookUIProps {
  userId?: string
}

export function ErrorBookUI({ userId }: ErrorBookUIProps) {
  const [items, setItems] = useState<ErrorItem[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('全部')
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('time-desc')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [convertLoadingId, setConvertLoadingId] = useState<string | null>(null)
  const [convertSuccessId, setConvertSuccessId] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState<ErrorBookStats | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewAnswer, setReviewAnswer] = useState('')
  const [reviewRevealed, setReviewRevealed] = useState(false)
  const [reviewResults, setReviewResults] = useState<Record<string, 'correct' | 'wrong' | null>>({})

  const [newQuestion, setNewQuestion] = useState('')
  const [newQuestionImage, setNewQuestionImage] = useState<string | null>(null)
  const [newWrongAnswer, setNewWrongAnswer] = useState('')
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('')
  const [newSubject, setNewSubject] = useState('数学')
  const [newTags, setNewTags] = useState('')

  const [editQuestion, setEditQuestion] = useState('')
  const [editWrongAnswer, setEditWrongAnswer] = useState('')
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('')
  const [editSubject, setEditSubject] = useState('数学')
  const [editTags, setEditTags] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { hasAnyKey } = useApiKeyStatus()
  const { isMember } = useMembership(userId)

  const loadData = useCallback(() => {
    const allItems = getErrorItems()
    const allSubjects = getSubjects()
    setItems(allItems)
    setSubjects(allSubjects)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredItems = (() => {
    let result = selectedSubject === '全部' ? [...items] : items.filter(item => item.subject === selectedSubject)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(item =>
        item.question.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.subject.toLowerCase().includes(q)
      )
    }
    switch (sortMode) {
      case 'time-desc':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'time-asc':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'subject':
        result.sort((a, b) => a.subject.localeCompare(b.subject, 'zh'))
        break
      case 'mastered':
        result.sort((a, b) => {
          if (a.mastered === b.mastered) return 0
          return a.mastered ? 1 : -1
        })
        break
    }
    return result
  })()

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > height && width > MAX_IMAGE_SIZE) {
            height = Math.round((height * MAX_IMAGE_SIZE) / width)
            width = MAX_IMAGE_SIZE
          } else if (height > MAX_IMAGE_SIZE) {
            width = Math.round((width * MAX_IMAGE_SIZE) / height)
            height = MAX_IMAGE_SIZE
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)
          let quality = 0.7
          let dataUrl = canvas.toDataURL('image/jpeg', quality)
          while (dataUrl.length > MAX_IMAGE_BYTES && quality > 0.2) {
            quality -= 0.1
            dataUrl = canvas.toDataURL('image/jpeg', quality)
          }
          resolve(dataUrl)
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setOcrLoading(true)
      setOcrError(null)
      const dataUrl = await compressImage(file)
      setNewQuestionImage(dataUrl)

      if (hasAnyKey) {
        try {
          const userPrompt = `请识别这张图片中的题目文字内容。`

          let fullResponse = ''
          await sendAgentChatMessageStream({
            message: userPrompt,
            personaId: 'exam-student',
            useXFYunCoding: true,
            onChunk: (chunk) => {
              fullResponse += chunk
            }
          })

          const recognized = fullResponse.trim()
          if (recognized && recognized.length > 2) {
            setNewQuestion(recognized)
          }
        } catch {
          setOcrError('OCR 识别失败，请手动输入题目')
        }
      }
    } catch {
      setOcrError('图片处理失败')
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAdd = () => {
    if (!newQuestion.trim()) return

    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)
    const newItem = addErrorItem({
      question: newQuestion.trim(),
      questionImage: newQuestionImage || undefined,
      wrongAnswer: newWrongAnswer.trim(),
      correctAnswer: newCorrectAnswer.trim() || undefined,
      subject: newSubject,
      tags
    })

    setItems(prev => [newItem, ...prev])
    if (!subjects.includes(newSubject)) {
      setSubjects(prev => [...prev, newSubject].sort())
    }

    setNewQuestion('')
    setNewQuestionImage(null)
    setNewWrongAnswer('')
    setNewCorrectAnswer('')
    setNewTags('')
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    deleteErrorItem(id)
    setItems(prev => prev.filter(item => item.id !== id))
    setExpandedId(null)
  }

  const handleToggleMastered = (id: string, currentMastered?: boolean) => {
    updateErrorItem(id, { mastered: !currentMastered })
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, mastered: !currentMastered } : i
    ))
  }

  const startEdit = (item: ErrorItem) => {
    setEditingId(item.id)
    setEditQuestion(item.question)
    setEditWrongAnswer(item.wrongAnswer)
    setEditCorrectAnswer(item.correctAnswer || '')
    setEditSubject(item.subject)
    setEditTags(item.tags.join(', '))
  }

  const handleSaveEdit = () => {
    if (!editingId || !editQuestion.trim()) return
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
    updateErrorItem(editingId, {
      question: editQuestion.trim(),
      wrongAnswer: editWrongAnswer.trim(),
      correctAnswer: editCorrectAnswer.trim() || undefined,
      subject: editSubject,
      tags
    })
    setItems(prev => prev.map(i =>
      i.id === editingId
        ? { ...i, question: editQuestion.trim(), wrongAnswer: editWrongAnswer.trim(), correctAnswer: editCorrectAnswer.trim() || undefined, subject: editSubject, tags }
        : i
    ))
    setEditingId(null)
    if (!subjects.includes(editSubject)) {
      setSubjects(prev => [...prev, editSubject].sort())
    }
  }

  const handleAIAnalyze = async (item: ErrorItem) => {
    setExpandedId(item.id)
    setAiLoadingId(item.id)
    setAiError(null)

    const controller = new AbortController()

    try {
      const userPrompt = `题目：${item.question}
错误答案：${item.wrongAnswer}
${item.correctAnswer ? `正确答案：${item.correctAnswer}` : ''}
科目：${item.subject}
标签：${item.tags.join(', ')}`

      let fullResponse = ''

      await sendAgentChatMessageStream({
        message: userPrompt,
        personaId: 'exam-student',
        useXFYunCoding: true,
        signal: controller.signal,
        onChunk: (chunk) => {
          fullResponse += chunk
        }
      })

      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as AIResult
        updateErrorItem(item.id, {
          aiAnalysis: result.analysis,
          aiSolution: result.solution,
          aiSimilarQuestions: result.similarQuestions
        })
        setItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, aiAnalysis: result.analysis, aiSolution: result.solution, aiSimilarQuestions: result.similarQuestions }
            : i
        ))
      } else {
        setAiError('AI 返回格式解析失败')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setAiError('AI 分析失败，请重试')
      }
    } finally {
      setAiLoadingId(null)
    }
  }

  const handleExportJSON = () => {
    const data = JSON.stringify(items, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `错题本_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportCSV = () => {
    const headers = ['题目', '错误答案', '正确答案', '科目', '标签', '已掌握', '创建时间']
    const rows = items.map(item => [
      item.question.replace(/"/g, '""'),
      item.wrongAnswer.replace(/"/g, '""'),
      (item.correctAnswer || '').replace(/"/g, '""'),
      item.subject,
      item.tags.join(';'),
      item.mastered ? '是' : '否',
      new Date(item.createdAt).toLocaleDateString('zh-CN')
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => `"${row.join('","')}"`)
    ].join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `错题本_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleConvertToMemoryCard = (item: ErrorItem) => {
    setConvertLoadingId(item.id)
    setConvertSuccessId(null)

    try {
      const mcState = loadMCState()
      const deckId = mcState.activeDeckId || mcState.decks[0]?.id
      if (!deckId) {
        setConvertLoadingId(null)
        return
      }

      const front = item.question
      const backParts: string[] = []
      if (item.correctAnswer) {
        backParts.push(`正确答案：${item.correctAnswer}`)
      }
      if (item.wrongAnswer) {
        backParts.push(`错误答案：${item.wrongAnswer}`)
      }
      if (item.aiSolution) {
        backParts.push(`解法：${item.aiSolution}`)
      }
      const back = backParts.join('\n') || item.wrongAnswer

      const newState = addCard(mcState, deckId, front, back, [...item.tags, item.subject])
      saveMCState(newState)

      setConvertSuccessId(item.id)
      setTimeout(() => setConvertSuccessId(null), 2000)
    } catch {
      /* ignore */
    } finally {
      setConvertLoadingId(null)
    }
  }

  const handleOpenStats = () => {
    setStats(getErrorStats())
    setShowStats(true)
  }

  const handleStartReview = () => {
    const unmastered = items.filter(i => !i.mastered)
    if (unmastered.length === 0) return
    setReviewMode(true)
    setReviewIndex(0)
    setReviewAnswer('')
    setReviewRevealed(false)
    setReviewResults({})
  }

  const reviewItems = items.filter(i => !i.mastered)

  const handleReviewSubmit = () => {
    const item = reviewItems[reviewIndex]
    if (!item) return
    const isCorrect = reviewAnswer.trim().toLowerCase() === (item.correctAnswer || '').trim().toLowerCase()
    setReviewResults(prev => ({ ...prev, [item.id]: isCorrect ? 'correct' : 'wrong' }))
    setReviewRevealed(true)
  }

  const handleReviewNext = () => {
    const item = reviewItems[reviewIndex]
    if (!item) return
    const result = reviewResults[item.id]
    if (result === 'correct') {
      updateErrorItem(item.id, { mastered: true })
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, mastered: true } : i))
    }
    const remainingItems = reviewItems.filter(i => i.id !== item.id)
    if (remainingItems.length > 0) {
      if (result !== 'correct') {
        setReviewIndex(prev => prev + 1)
      }
      setReviewAnswer('')
      setReviewRevealed(false)
    } else {
      setReviewMode(false)
      setReviewIndex(0)
    }
  }

  const handleExitReview = () => {
    setReviewMode(false)
    setReviewIndex(0)
    setReviewAnswer('')
    setReviewRevealed(false)
    setReviewResults({})
  }

  const allSubjectsList = subjects.length > 0 ? subjects : SUBJECTS.slice(0, 5)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>错题本</h3>
        <div className={styles.headerActions}>
          <button className={styles.statsButton} onClick={handleOpenStats}>
            📊 统计
          </button>
          <button
            className={styles.reviewButton}
            onClick={handleStartReview}
            disabled={items.filter(i => !i.mastered).length === 0}
          >
            📝 复习 ({items.filter(i => !i.mastered).length})
          </button>
          <span className={styles.count}>{filteredItems.length} 道错题</span>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="搜索题目、标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {reviewMode && reviewItems.length > 0 && (
        <div className={styles.reviewPanel}>
          <div className={styles.reviewHeader}>
            <span className={styles.reviewTitle}>
              📝 错题复习 ({reviewIndex + 1}/{reviewItems.length})
            </span>
            <button className={styles.reviewExitButton} onClick={handleExitReview}>
              ✕ 退出
            </button>
          </div>
          <div className={styles.reviewProgress}>
            <div
              className={styles.reviewProgressBar}
              style={{ width: `${((reviewIndex + (reviewRevealed ? 1 : 0)) / reviewItems.length) * 100}%` }}
            />
          </div>
          <div className={styles.reviewCard}>
            <div className={styles.reviewSubject}>{reviewItems[reviewIndex].subject}</div>
            <div className={styles.reviewQuestion}>{reviewItems[reviewIndex].question}</div>
            {reviewItems[reviewIndex].questionImage && (
              <div className={styles.reviewImage}>
                <img src={reviewItems[reviewIndex].questionImage} alt="题目图片" loading="lazy" />
              </div>
            )}
            <div className={styles.reviewWrongAnswer}>
              你的错误答案：{reviewItems[reviewIndex].wrongAnswer}
            </div>
            {!reviewRevealed ? (
              <div className={styles.reviewInputArea}>
                <input
                  className={styles.reviewInput}
                  type="text"
                  placeholder="请输入正确答案..."
                  value={reviewAnswer}
                  onChange={(e) => setReviewAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleReviewSubmit() }}
                />
                <button
                  className={styles.reviewSubmitButton}
                  onClick={handleReviewSubmit}
                  disabled={!reviewAnswer.trim()}
                >
                  提交
                </button>
              </div>
            ) : (
              <div className={styles.reviewResult}>
                <div className={`${styles.reviewResultBadge} ${reviewResults[reviewItems[reviewIndex].id] === 'correct' ? styles.reviewCorrect : styles.reviewWrong}`}>
                  {reviewResults[reviewItems[reviewIndex].id] === 'correct' ? '✅ 回答正确！' : '❌ 回答错误'}
                </div>
                {reviewItems[reviewIndex].correctAnswer && (
                  <div className={styles.reviewCorrectAnswer}>
                    正确答案：{reviewItems[reviewIndex].correctAnswer}
                  </div>
                )}
                {reviewItems[reviewIndex].aiSolution && (
                  <div className={styles.reviewAiSolution}>
                    <div className={styles.reviewAiLabel}>💡 解法：</div>
                    <div>{reviewItems[reviewIndex].aiSolution}</div>
                  </div>
                )}
                <button className={styles.reviewNextButton} onClick={handleReviewNext}>
                  {reviewIndex + 1 < reviewItems.length ? '下一题 →' : '✅ 完成复习'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showStats && stats && (
        <div className={styles.statsPanel}>
          <div className={styles.statsHeader}>
            <span className={styles.statsTitle}>📊 错题统计</span>
            <button className={styles.statsCloseButton} onClick={() => setShowStats(false)}>
              ✕
            </button>
          </div>
          <div className={styles.statsOverview}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>总错题</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.mastered}</div>
              <div className={styles.statLabel}>已掌握</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.unmastered}</div>
              <div className={styles.statLabel}>未掌握</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.masteryRate}%</div>
              <div className={styles.statLabel}>掌握率</div>
            </div>
          </div>
          {stats.bySubject.length > 0 && (
            <div className={styles.statsSection}>
              <div className={styles.statsSectionTitle}>按科目分布</div>
              <div className={styles.statsSubjectList}>
                {stats.bySubject.map(s => (
                  <div key={s.subject} className={styles.statsSubjectRow}>
                    <span className={styles.statsSubjectName}>{s.subject}</span>
                    <div className={styles.statsSubjectBar}>
                      <div
                        className={styles.statsSubjectBarFill}
                        style={{ width: `${s.masteryRate}%` }}
                      />
                    </div>
                    <span className={styles.statsSubjectCount}>
                      {s.mastered}/{s.total} ({s.masteryRate}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.topTags.length > 0 && (
            <div className={styles.statsSection}>
              <div className={styles.statsSectionTitle}>高频错误标签 Top 5</div>
              <div className={styles.statsTagList}>
                {stats.topTags.map((t, idx) => (
                  <div key={t.tag} className={styles.statsTagRow}>
                    <span className={styles.statsTagRank}>#{idx + 1}</span>
                    <span className={styles.statsTagName}>{t.tag}</span>
                    <span className={styles.statsTagCount}>{t.count} 次</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.sortGroup}>
          <span className={styles.toolbarLabel}>排序：</span>
          <button
            className={`${styles.sortButton} ${sortMode === 'time-desc' ? styles.sortButtonActive : ''}`}
            onClick={() => setSortMode('time-desc')}
          >
            ⏱ 最新
          </button>
          <button
            className={`${styles.sortButton} ${sortMode === 'time-asc' ? styles.sortButtonActive : ''}`}
            onClick={() => setSortMode('time-asc')}
          >
            🕐 最早
          </button>
          <button
            className={`${styles.sortButton} ${sortMode === 'subject' ? styles.sortButtonActive : ''}`}
            onClick={() => setSortMode('subject')}
          >
            📚 科目
          </button>
          <button
            className={`${styles.sortButton} ${sortMode === 'mastered' ? styles.sortButtonActive : ''}`}
            onClick={() => setSortMode('mastered')}
          >
            ✅ 掌握
          </button>
        </div>
        <div className={styles.exportGroup}>
          <button
            className={styles.exportButton}
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            📤 导出
          </button>
          {showExportMenu && (
            <div className={styles.exportMenu}>
              <button className={styles.exportMenuItem} onClick={handleExportJSON}>
                📄 导出 JSON
              </button>
              <button className={styles.exportMenuItem} onClick={handleExportCSV}>
                📊 导出 CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selectedSubject === '全部' ? styles.tabActive : ''}`}
          onClick={() => setSelectedSubject('全部')}
        >
          全部
        </button>
        {allSubjectsList.map(subject => (
          <button
            key={subject}
            className={`${styles.tab} ${selectedSubject === subject ? styles.tabActive : ''}`}
            onClick={() => setSelectedSubject(subject)}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filteredItems.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyText}>还没有错题记录</div>
            <div className={styles.emptyHint}>点击下方添加按钮记录第一道错题</div>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className={`${styles.item} ${expandedId === item.id ? styles.itemExpanded : ''} ${item.mastered ? styles.itemMastered : ''}`}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemHeader}>
                  <span className={styles.subjectTag}>{item.subject}</span>
                  {item.mastered && <span className={styles.masteredBadge}>✓ 已掌握</span>}
                  <span className={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {item.questionImage && (
                  <div className={styles.questionImage}>
                    <img src={item.questionImage} alt="题目图片" loading="lazy" />
                  </div>
                )}
                <div className={styles.question}>{item.question}</div>
                <div className={styles.wrongAnswer}>❌ 错误答案：{item.wrongAnswer || '未填写'}</div>
                {item.correctAnswer && (
                  <div className={styles.correctAnswer}>✅ 正确答案：{item.correctAnswer}</div>
                )}
                {item.tags.length > 0 && (
                  <div className={styles.tags}>
                    {item.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {expandedId === item.id && editingId !== item.id && (
                <div className={styles.itemDetail}>
                  {item.aiAnalysis ? (
                    <div className={styles.aiResult}>
                      <div className={styles.aiSection}>
                        <div className={styles.aiLabel}>📍 错因分析</div>
                        <div className={styles.aiContent}>{item.aiAnalysis}</div>
                      </div>
                      <div className={styles.aiSection}>
                        <div className={styles.aiLabel}>✅ 正确解法</div>
                        <div className={styles.aiContent}>{item.aiSolution}</div>
                      </div>
                      {item.aiSimilarQuestions && item.aiSimilarQuestions.length > 0 && (
                        <div className={styles.aiSection}>
                          <div className={styles.aiLabel}>🔄 同类变式题</div>
                          {item.aiSimilarQuestions.map((sq, idx) => (
                            <div key={idx} className={styles.similarQuestion}>
                              <div className={styles.sqQuestion}>Q{idx + 1}: {sq.question}</div>
                              <div className={styles.sqAnswer}>A: {sq.answer}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.aiActions}>
                      {aiLoadingId === item.id ? (
                        <div className={styles.aiLoading}>
                          <span className={styles.spinner}></span>
                          AI 分析中...
                        </div>
                      ) : (
                        <>
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
                              handleAIAnalyze(item)
                            }}
                            disabled={!isMember || !hasAnyKey}
                          >
                            🤖 AI 分析
                          </button>
                          {aiError && <div className={styles.aiError}>{aiError}</div>}
                        </>
                      )}
                    </div>
                  )}

                  <div className={styles.detailActions}>
                    <button
                      className={styles.masteredButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleMastered(item.id, item.mastered)
                      }}
                    >
                      {item.mastered ? '↩ 标记未掌握' : '✅ 标记已掌握'}
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(item)
                      }}
                    >
                      ✏️ 编辑
                    </button>
                    <button
                      className={styles.convertButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConvertToMemoryCard(item)
                      }}
                      disabled={convertLoadingId === item.id}
                    >
                      {convertLoadingId === item.id ? '⏳ 转换中...' : convertSuccessId === item.id ? '✅ 已转换' : '🔄 转记忆卡'}
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              )}

              {expandedId === item.id && editingId === item.id && (
                <div className={styles.itemDetail}>
                  <div className={styles.editForm}>
                    <div className={styles.formTitle}>编辑错题</div>
                    <textarea
                      className={styles.textarea}
                      placeholder="题目内容"
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      rows={3}
                    />
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="错误答案"
                      value={editWrongAnswer}
                      onChange={(e) => setEditWrongAnswer(e.target.value)}
                    />
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="正确答案"
                      value={editCorrectAnswer}
                      onChange={(e) => setEditCorrectAnswer(e.target.value)}
                    />
                    <select
                      className={styles.select}
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                    >
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="标签（用逗号分隔）"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                    />
                    <div className={styles.formActions}>
                      <button
                        className={styles.cancelButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(null)
                        }}
                      >
                        取消
                      </button>
                      <button
                        className={styles.submitButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveEdit()
                        }}
                        disabled={!editQuestion.trim()}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showAddForm ? (
        <div className={styles.addForm}>
          <div className={styles.formTitle}>添加错题</div>

          <div className={styles.imageUploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className={styles.fileInput}
              id="error-book-image-upload"
            />
            <label htmlFor="error-book-image-upload" className={styles.uploadLabel}>
              {ocrLoading ? (
                <span className={styles.uploadLoading}>⏳ 识别中...</span>
              ) : newQuestionImage ? (
                <img src={newQuestionImage} alt="已上传题目" className={styles.uploadPreview} loading="lazy" />
              ) : (
                <span className={styles.uploadPlaceholder}>📷 拍照或上传题目图片</span>
              )}
            </label>
            {newQuestionImage && (
              <button
                className={styles.removeImageButton}
                onClick={() => setNewQuestionImage(null)}
                type="button"
              >
                ✕ 移除图片
              </button>
            )}
            {ocrError && <div className={styles.ocrError}>{ocrError}</div>}
          </div>

          <textarea
            className={styles.textarea}
            placeholder="请输入题目内容（拍照可自动识别）..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={3}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="错误答案"
            value={newWrongAnswer}
            onChange={(e) => setNewWrongAnswer(e.target.value)}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="正确答案"
            value={newCorrectAnswer}
            onChange={(e) => setNewCorrectAnswer(e.target.value)}
          />
          <select
            className={styles.select}
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          >
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className={styles.input}
            type="text"
            placeholder="标签（用逗号分隔）"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
          <div className={styles.formActions}>
            <button
              className={styles.cancelButton}
              onClick={() => {
                setShowAddForm(false)
                setNewQuestionImage(null)
              }}
            >
              取消
            </button>
            <button
              className={styles.submitButton}
              onClick={handleAdd}
              disabled={!newQuestion.trim()}
            >
              添加
            </button>
          </div>
        </div>
      ) : (
        <button
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          + 添加错题
        </button>
      )}
    </div>
  )
}
