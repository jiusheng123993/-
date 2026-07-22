export enum AnalyticsEventName {
  UserRegister = 'user_register',
  PetCreate = 'pet_create',
  CheckinSubmit = 'checkin_submit',
  CheckinAnomaly = 'checkin_anomaly',
  FoodQuery = 'food_query',
  SymptomCheck = 'symptom_check',
  EmergencyAlert = 'emergency_alert',
  VaccineReminderClick = 'vaccine_reminder_click',
  VaccineDone = 'vaccine_done',
  MemberPageView = 'member_page_view',
  MemberSubscribe = 'member_subscribe',
  ShareAction = 'share_action',
  EmotionTrigger = 'emotion_trigger',
  FindHospital = 'find_hospital',
  PageView = 'page_view',
  FunnelStep = 'funnel_step',
  BreedView = 'breed_view',
}

interface UserRegisterProperties {
  source: string
  method: string
}

interface PetCreateProperties {
  species: string
  breed?: string
  source?: string
}

interface CheckinSubmitProperties {
  petId: string
  items: string
  hasAnomaly: boolean
}

interface CheckinAnomalyProperties {
  petId: string
  anomalyItems: string
  urgency: string
}

interface FoodQueryProperties {
  keyword: string
  resultSafetyLevel: string
  isMember: boolean
}

interface SymptomCheckProperties {
  petId: string
  symptoms: string[]
  urgencyLevel: string
  userAction?: string
}

interface EmergencyAlertProperties {
  petId: string
  symptoms: string[]
  alertType: string
}

interface VaccineReminderClickProperties {
  petId: string
  vaccineType: string
  action: string
}

interface VaccineDoneProperties {
  petId: string
  vaccineName: string
}

interface MemberPageViewProperties {
  source: string
  isFreeUser: boolean
}

interface MemberSubscribeProperties {
  plan: string
  price: number
  source: string
}

interface ShareActionProperties {
  type: string
  platform: string
}

interface EmotionTriggerProperties {
  scene: string
  triggerType: string
  userAction?: string
}

interface FindHospitalProperties {
  petId: string
  urgencyLevel: string
  source: string
}

interface PageViewProperties {
  pageName: string
  duration?: number
}

interface FunnelStepProperties {
  funnelName: string
  stepName: string
  stepIndex: number
}

interface BreedViewProperties {
  breedId: string
  breedName: string
}

export interface AnalyticsEventPropertiesMap {
  [AnalyticsEventName.UserRegister]: UserRegisterProperties
  [AnalyticsEventName.PetCreate]: PetCreateProperties
  [AnalyticsEventName.CheckinSubmit]: CheckinSubmitProperties
  [AnalyticsEventName.CheckinAnomaly]: CheckinAnomalyProperties
  [AnalyticsEventName.FoodQuery]: FoodQueryProperties
  [AnalyticsEventName.SymptomCheck]: SymptomCheckProperties
  [AnalyticsEventName.EmergencyAlert]: EmergencyAlertProperties
  [AnalyticsEventName.VaccineReminderClick]: VaccineReminderClickProperties
  [AnalyticsEventName.VaccineDone]: VaccineDoneProperties
  [AnalyticsEventName.MemberPageView]: MemberPageViewProperties
  [AnalyticsEventName.MemberSubscribe]: MemberSubscribeProperties
  [AnalyticsEventName.ShareAction]: ShareActionProperties
  [AnalyticsEventName.EmotionTrigger]: EmotionTriggerProperties
  [AnalyticsEventName.FindHospital]: FindHospitalProperties
  [AnalyticsEventName.PageView]: PageViewProperties
  [AnalyticsEventName.FunnelStep]: FunnelStepProperties
  [AnalyticsEventName.BreedView]: BreedViewProperties
}

export interface UserProperties {
  isNewUser: boolean
  totalPets: number
  primarySpecies: 'dog' | 'cat' | 'other' | null
  membershipTier: 'free' | 'member'
  daysSinceRegistration: number
}

export interface FunnelStep {
  funnelName: string
  stepName: string
  stepIndex: number
  timestamp: string
}
