import { AnalyticsEventName } from '../types/analyticsTypes'

/**
 * 分析事件常量映射
 * 将枚举值映射为便捷常量，统一全站分析事件引用
 */
export const EVENT = {
  USER_REGISTER: AnalyticsEventName.UserRegister,
  PET_CREATE: AnalyticsEventName.PetCreate,
  CHECKIN_SUBMIT: AnalyticsEventName.CheckinSubmit,
  CHECKIN_ANOMALY: AnalyticsEventName.CheckinAnomaly,
  FOOD_QUERY: AnalyticsEventName.FoodQuery,
  SYMPTOM_CHECK: AnalyticsEventName.SymptomCheck,
  EMERGENCY_ALERT: AnalyticsEventName.EmergencyAlert,
  VACCINE_REMINDER_CLICK: AnalyticsEventName.VaccineReminderClick,
  VACCINE_DONE: AnalyticsEventName.VaccineDone,
  MEMBER_PAGE_VIEW: AnalyticsEventName.MemberPageView,
  MEMBER_SUBSCRIBE: AnalyticsEventName.MemberSubscribe,
  SHARE_ACTION: AnalyticsEventName.ShareAction,
  EMOTION_TRIGGER: AnalyticsEventName.EmotionTrigger,
  FIND_HOSPITAL: AnalyticsEventName.FindHospital,
  PAGE_VIEW: AnalyticsEventName.PageView,
  FUNNEL_STEP: AnalyticsEventName.FunnelStep,
  BREED_VIEW: AnalyticsEventName.BreedView,
} as const
