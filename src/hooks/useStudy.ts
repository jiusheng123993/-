import { useState, useEffect, useCallback } from 'react'
import { studyService } from '../services/studyService'
import type { Exam, CreateExamInput, UpdateExamInput, ErrorBookItem, CreateErrorBookInput, MemoryCard, CreateMemoryCardInput } from '../data/repositories'

export function useStudy(userId: string | null) {
  const [exams, setExams] = useState<Exam[]>([])
  const [errors, setErrors] = useState<ErrorBookItem[]>([])
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [examData, errorData, cardData] = await Promise.all([
        studyService.getExams(userId),
        studyService.getErrorQuestions(userId),
        studyService.getMemoryCards(userId)
      ])
      setExams(examData)
      setErrors(errorData)
      setCards(cardData)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const createExam = useCallback(async (input: Omit<CreateExamInput, 'userId'>): Promise<Exam | null> => {
    if (!userId) return null
    setError(null)
    try {
      const exam = await studyService.createExam(userId, input)
      setExams((prev) => [exam, ...prev])
      return exam
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      return null
    }
  }, [userId])

  const updateExam = useCallback(async (examId: string, patch: UpdateExamInput): Promise<Exam | null> => {
    setError(null)
    try {
      const updated = await studyService.updateExam(examId, patch)
      setExams((prev) => prev.map((e) => (e.id === examId ? updated : e)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败')
      return null
    }
  }, [])

  const deleteExam = useCallback(async (examId: string): Promise<boolean> => {
    setError(null)
    try {
      await studyService.deleteExam(examId)
      setExams((prev) => prev.filter((e) => e.id !== examId))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
      return false
    }
  }, [])

  const addError = useCallback(async (input: Omit<CreateErrorBookInput, 'userId'>): Promise<ErrorBookItem | null> => {
    if (!userId) return null
    setError(null)
    try {
      const item = await studyService.addErrorQuestion(userId, input)
      setErrors((prev) => [item, ...prev])
      return item
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败')
      return null
    }
  }, [userId])

  const markErrorMastered = useCallback(async (errorId: string): Promise<ErrorBookItem | null> => {
    setError(null)
    try {
      const updated = await studyService.markErrorMastered(errorId)
      setErrors((prev) => prev.map((e) => (e.id === errorId ? updated : e)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '标记失败')
      return null
    }
  }, [])

  const createCard = useCallback(async (input: Omit<CreateMemoryCardInput, 'userId'>): Promise<MemoryCard | null> => {
    if (!userId) return null
    setError(null)
    try {
      const card = await studyService.createMemoryCard(userId, input)
      setCards((prev) => [card, ...prev])
      return card
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      return null
    }
  }, [userId])

  const reviewCard = useCallback(async (cardId: string, quality: number): Promise<MemoryCard | null> => {
    setError(null)
    try {
      const updated = await studyService.reviewCard(cardId, quality)
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '复习失败')
      return null
    }
  }, [])

  return {
    exams,
    errors,
    cards,
    loading,
    error,
    createExam,
    updateExam,
    deleteExam,
    addError,
    markErrorMastered,
    createCard,
    reviewCard,
    refresh: loadAll
  }
}
