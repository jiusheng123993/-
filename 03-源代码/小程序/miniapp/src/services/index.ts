/** 认证服务 - 登录/登出/Token 刷新 */
export { loginWithCode, getUserProfile, refreshToken, logout, type LoginResult } from './authService'
/** 宠物管理 - 宠物资料的 CRUD 操作 */
export { getPets, getPetById, createPet, updatePet, deletePet, markDeceased, getCurrentPet, setCurrentPet, type PetProfile } from './petService'
/** 健康打卡 - 打卡记录查询与创建 */
export { getCheckins, getCheckinsByDateRange, createCheckin, batchCreateCheckins, getTodayCheckin, getCheckinStats, getLatestCheckin, type HealthCheckinStats, type CheckinInput } from './checkinService'
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
/** 排行榜 - 家庭排行榜与角色分配 */
export { leaderboardService, type LeaderboardPeriod, type RankingItem, type LeaderboardResponse, type RoleType, type RoleResponse, type FamilyRolesResponse } from './leaderboardService'
/** 家族图谱 - 图谱数据/关系管理/快照/血亲树 */
export {
  familyTreeService,
  type TreeNode,
  type TreeEdge,
  type TreeResponse,
  type RelationshipRow,
  type CreateRelationshipInput,
  type UpdateRelationshipInput,
  type CreateLineageInput,
  type SnapshotRow,
  type CreateSnapshotInput,
  type SnapshotListResponse,
  type LineageTreeResponse,
} from './familyTreeService'
/** 家庭动态墙 - 动态列表/发布/编辑/删除/精选 */
export {
  feedService,
  type FeedType,
  type Feed,
  type FeedWithPet,
  type PaginatedFeeds,
  type GetFeedsParams,
  type CreateFeedInput,
  type UpdateFeedInput,
} from './feedService'
/** 分享卡片 - 卡片生成/列表/详情/删除/分享记录 */
export {
  shareCardService,
  type ShareCardSourceData,
  type ShareCardStyle,
  type ShareChannel,
  type ShareCardRow,
  type GenerateShareCardInput,
  type PaginatedShareCards,
  type GetShareCardsParams,
  type RecordShareInput,
} from './shareCardService'
