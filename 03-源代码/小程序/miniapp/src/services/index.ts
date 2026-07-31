/** 认证服务 - 登录/登出/Token 刷新 */
export { loginWithCode, getUserProfile, refreshToken, logout, type LoginResult } from './authService'
/** 宠物管理 - 宠物资料的 CRUD 操作 */
export { getPets, getPetById, createPet, updatePet, deletePet, markDeceased, getCurrentPet, setCurrentPet, type PetProfile } from './petService'
/** 健康打卡 - 打卡记录查询与创建 */
export { getCheckins, getCheckinsByDateRange, createCheckin, getTodayCheckin, getCheckinStats, getLatestCheckin, type HealthCheckinStats, type CheckinInput } from './checkinService'
/** 食物安全查询 - 食物百科/查询统计 */
export { queryFood, getQueryHistory, getQueryStats, getTodayQueryCount, type FoodQueryStats } from './foodService'
/** 症状查询 - 症状分类/搜索 */
export { getSymptomCategories, getSymptomsByCategory, searchSymptoms } from './symptomService'
/** 健康趋势 - 数据点/汇总/月报 */
export { getTrendData, getTrendSummary, getMonthlyReport, getWeightTrend, getAppetiteTrend, getStoolTrend, getAbnormalDays, type TrendDataPoint, type TrendSummary, type MonthlyReport } from './trendService'
/** 疫苗管理 - 接种记录/提醒计划 */
export { getVaccineRecords, createVaccineRecord, updateVaccineRecord, deleteVaccineRecord, getUpcomingRecords, getOverdueRecords, markAsCompleted, getRecordsByMonth, generateInitialPlan, VACCINE_INTERVAL_RULES, calculateNextDate, type VaccineRecord, type CreateVaccineData } from './vaccineService'
/** 订阅消息 - 模板配置/订阅状态管理 */
export { FOLLOWUP_TEMPLATE_ID, CARE_PLAN_REMINDER_TEMPLATE_ID, HEALTH_CHECKIN_TEMPLATE_ID, TEMPLATE_IDS, TEMPLATE_CONFIGS, updateSubscribeStatus, getSubscribeStatus, hasAcceptedSubscribe, getAllSubscribeStatus, recordTemplateUsage, clearSubscribeStatus } from './subscribeService'
/** 本地提醒 - 待办/过期提醒管理 */
export { checkUpcomingReminders, saveSubscriptionStatus, getSubscriptionStatus, scheduleLocalReminder, getOverdueReminders, getUpcomingReminders, getLocalReminders, markReminderTriggered, clearLocalReminders } from './reminderService'
/** 通知跟进 - 随访/跟进任务管理 */
export { scheduleFollowup, cancelFollowup, getPendingFollowups, getFollowupBySessionId, checkAndSendFollowups, updateFollowupStatus, clearExpiredFollowups, getFollowupStats } from './notificationService'
/** 会员配置 - 会员方案和权益定义 */
export { MEMBERSHIP_PLANS, MEMBERSHIP_BENEFITS, type MembershipPlanConfig, type MembershipBenefit } from './membershipService'
/** 数据同步 - 本地与云端数据同步服务 */
export { SyncService, getSyncService, type SyncRecord, type SyncStatus, type SyncResult, type SyncTable } from './syncService'
/** 家庭服务 - 宠物家庭/成员管理 */
export { familyService } from './familyService'
/** 时间线 - 宠物动态时间线服务 */
export { timelineService } from './timelineService'
/** 健康报告 - 报告生成与格式化 */
export { generateHealthReport, formatReportAsText, type HealthReport } from './reportService'
/** 衣橱系统 - 宠物配饰的装备/卸载/搭配 */
export { getWardrobeOverview, getAccessoriesBySlot, equipAccessory, unequipAccessory, saveTryOnSnapshot, unlockAccessory, getLocalOutfitForPet, updateLocalOutfit, debouncedEquipAccessory, debouncedUnequipAccessory, clearOutfitSaveTimer, createWardrobeError, mapWardrobeErrorCode } from './wardrobeService'
/** 主题套装 - 主题生成/配额管理 */
export { getThemeSuiteOverview, generateThemeSuite, getThemeSuiteTaskStatus, pollThemeSuiteTask, saveThemeSuiteResult, getThemeQuota, canGenerateTheme, getActiveThemeTask } from './themeSuiteService'
/** 穿搭预览 - 套装组合/槽位管理 */
export { buildOutfitPreview, toggleSlotInOutfit, clearAllSlots, getEquippedCount, getEmptySlots, getSlotLabel, isOutfitEmpty, areOutfitsEqual, mergeOutfitSlots, type OutfitPreview } from './outfitComposition'
