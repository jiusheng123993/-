/**
 * 自定义 Hooks 统一导出入口
 * 集中导出所有业务 Hook，便于外部模块引用
 */
export { useAuth } from './useAuth'
export { usePet } from './usePet'
export { useCheckin } from './useCheckin'
export { useFoodQuery } from './useFoodQuery'
export { useSymptom } from './useSymptom'
export { useTrend } from './useTrend'
export { useVaccine } from './useVaccine'
export { useReminder } from './useReminder'
export { useUserStats, getUsageDays, getPetCount, getCheckinCount, getVaccineCount, getSymptomCheckCount, getAllStats } from './useUserStats'
export { useChat } from './useChat'
