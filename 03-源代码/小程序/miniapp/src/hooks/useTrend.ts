import { useCallback } from 'react'
import { useTrendStore } from '../stores/trendStore'

export function useTrend() {
  const trendData = useTrendStore((s) => s.trendData)
  const summary = useTrendStore((s) => s.summary)
  const monthlyReport = useTrendStore((s) => s.monthlyReport)
  const isLoading = useTrendStore((s) => s.isLoading)
  const error = useTrendStore((s) => s.error)

  const fetchTrendData = useCallback((petId: string, startDate: string, endDate: string) => {
    return useTrendStore.getState().fetchTrendData(petId, startDate, endDate)
  }, [])

  const fetchSummary = useCallback((petId: string, period: 'week' | 'month' | 'quarter') => {
    return useTrendStore.getState().fetchSummary(petId, period)
  }, [])

  const fetchMonthlyReport = useCallback((petId: string, month: string) => {
    return useTrendStore.getState().fetchMonthlyReport(petId, month)
  }, [])

  const fetchWeightTrend = useCallback((petId: string, months?: number) => {
    return useTrendStore.getState().fetchWeightTrend(petId, months)
  }, [])

  const fetchAppetiteTrend = useCallback((petId: string, months?: number) => {
    return useTrendStore.getState().fetchAppetiteTrend(petId, months)
  }, [])

  const fetchStoolTrend = useCallback((petId: string, months?: number) => {
    return useTrendStore.getState().fetchStoolTrend(petId, months)
  }, [])

  const clearError = useCallback(() => {
    useTrendStore.getState().clearError()
  }, [])

  return {
    trendData,
    summary,
    monthlyReport,
    isLoading,
    error,
    fetchTrendData,
    fetchSummary,
    fetchMonthlyReport,
    fetchWeightTrend,
    fetchAppetiteTrend,
    fetchStoolTrend,
    clearError
  }
}
