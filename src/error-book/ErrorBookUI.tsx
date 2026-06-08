import { useState, useCallback, useEffect } from 'react'
import {
  getErrorItems,
  getSubjects,
  addErrorItem,
  deleteErrorItem,
  updateErrorItem,
  type ErrorItem
} from './errorBookService'
import { sendAgentChatMessageStream } from '../agent/agentRuntime'
import { useApiKeyStatus } from '../hooks/useApiKeyStatus'
import styles from './ErrorBookUI.module.css'

const SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '其他']

interface AIResult {
  analysis: string
  solution: string
  similarQuestions: { question: string; answer: string }[]
}

export function ErrorBookUI() {
  const [items, setItems] = useState<ErrorItem[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('全部')
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  
  const [newQuestion, setNewQuestion] = useState('')
  const [newWrongAnswer, setNewWrongAnswer] = useState('')
  const [newSubject, setNewSubject] = useState('数学')
  const [newTags, setNewTags] = useState('')
  
  const { hasAnyKey } = useApiKeyStatus()

  const loadData = useCallback(() => {
    const allItems = getErrorItems()
    const allSubjects = getSubjects()
    setItems(allItems)
    setSubjects(allSubjects)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredItems = selectedSubject === '全部'
    ? items
    : items.filter(item => item.subject === selectedSubject)

  const handleAdd = () => {
    if (!newQuestion.trim()) return
    
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)
    const newItem = addErrorItem({
      question: newQuestion.trim(),
      wrongAnswer: newWrongAnswer.trim(),
      subject: newSubject,
      tags
    })
    
    setItems(prev => [newItem, ...prev])
    if (!subjects.includes(newSubject)) {
      setSubjects(prev => [...prev, newSubject].sort())
    }
    
    setNewQuestion('')
    setNewWrongAnswer('')
    setNewTags('')
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    deleteErrorItem(id)
    setItems(prev => prev.filter(item => item.id !== id))
    setExpandedId(null)
  }

  const handleAIAnalyze = async (item: ErrorItem) => {
    setExpandedId(item.id)
    setAiLoadingId(item.id)
    setAiError(null)
    
    const controller = new AbortController()
    
    try {
      const systemPrompt = `你是备考教练。用户给你一道做错的题目，你需要：
1. 分析可能的错因
2. 给出正确解法
3. 生成2道同类型变式题（带答案）
用 JSON 格式返回，不要有其他内容。格式：{"analysis":"...","solution":"...","similarQuestions":[{"question":"...","answer":"..."}]}`

      const userPrompt = `题目：${item.question}
错误答案：${item.wrongAnswer}
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

  const allSubjectsList = subjects.length > 0 ? subjects : SUBJECTS.slice(0, 5)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>错题本</h3>
        <span className={styles.count}>{filteredItems.length} 道错题</span>
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
              className={`${styles.item} ${expandedId === item.id ? styles.itemExpanded : ''}`}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemHeader}>
                  <span className={styles.subjectTag}>{item.subject}</span>
                  <span className={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className={styles.question}>{item.question}</div>
                <div className={styles.wrongAnswer}>错误答案：{item.wrongAnswer || '未填写'}</div>
                {item.tags.length > 0 && (
                  <div className={styles.tags}>
                    {item.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {expandedId === item.id && (
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
                          {!hasAnyKey && (
                            <div className={styles.aiHint}>
                              配置 API Key 解锁 AI 分析
                            </div>
                          )}
                          <button
                            className={styles.aiButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAIAnalyze(item)
                            }}
                            disabled={!hasAnyKey}
                          >
                            🤖 AI 分析
                          </button>
                          {aiError && <div className={styles.aiError}>{aiError}</div>}
                        </>
                      )}
                    </div>
                  )}
                  
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
              )}
            </div>
          ))
        )}
      </div>

      {showAddForm ? (
        <div className={styles.addForm}>
          <div className={styles.formTitle}>添加错题</div>
          <textarea
            className={styles.textarea}
            placeholder="请输入题目内容..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={3}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="错误答案（选填）"
            value={newWrongAnswer}
            onChange={(e) => setNewWrongAnswer(e.target.value)}
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
              onClick={() => setShowAddForm(false)}
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
