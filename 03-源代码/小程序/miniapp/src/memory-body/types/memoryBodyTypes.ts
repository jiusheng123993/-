// 星寰海 v2.0 - memory-body 记忆引擎类型定义

/** 情绪标签 */
export type MoodTag =
  | 'sad' | 'anxious' | 'tired' | 'lonely' | 'unclear'
  | 'happy' | 'calm' | 'angry' | 'fearful' | 'joyful'
  | 'stressed' | 'relaxed' | 'frustrated' | 'hopeful'
  | 'guilty' | 'ashamed' | 'grateful' | 'disappointed'
  | 'nervous' | 'confident' | 'lonely_deep' | 'empty'
  | 'overwhelmed';

/** 情境标签 */
export type ContextTag =
  | 'work' | 'family' | 'relationship' | 'health'
  | 'finance' | 'social' | 'self_growth' | 'other';

/** 情绪强度（1-10） */
export type EmotionIntensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** 情绪记录条目 */
export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodTag;
  intensity: EmotionIntensity;
  context?: ContextTag[];
  note?: string;
  createdAt: Date;
}

/** 急救会话状态机 */
export type EmergencyState =
  | 'idle'
  | 'entry'
  | 'naming'
  | 'writing'
  | 'action'
  | 'connect'
  | 'closing'
  | 'crisis'
  | 'completed'
  | 'followup';

/** 急救步骤配置 */
export interface EmergencyStepConfig {
  stepId: string;
  title: string;
  description: string;
  component: string;
  durationEstimate: number; // 预估秒数
}

/** 急救流程配置 */
export interface EmergencyFlowConfig {
  flowId: string;
  mood: MoodTag;
  displayName: string;
  color: string; // 主题色
  steps: EmergencyStepConfig[];
}

/** 急救会话数据 */
export interface EmergencySession {
  id: string;
  userId: string;
  flowId: string;
  state: EmergencyState;
  currentStep: number;
  preIntensity: EmotionIntensity;
  postIntensity?: EmotionIntensity;
  content: Record<string, unknown>;
  crisisLevel?: 'mild' | 'moderate' | 'severe';
  createdAt: Date;
  updatedAt: Date;
}

/** AI主动推送触发类型 */
export type OutreachTriggerType =
  | 'prediction'
  | 'silence'
  | 'pattern'
  | 'followup'
  | 'good_news'
  | 'crisis';

/** 推送触发条件 */
export interface OutreachCondition {
  type: OutreachTriggerType;
  threshold: number;
  cooldownHours: number;
}

/** AI主动推送消息 */
export interface AiOutreachMessage {
  id: string;
  userId: string;
  triggerType: OutreachTriggerType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  body: string;
  actionUrl?: string;
  sentAt: Date;
  readAt?: Date;
}

/** 高危关键词级别 */
export type CrisisLevel = 'mild' | 'moderate' | 'severe';

/** 高危检测结果 */
export interface CrisisDetectionResult {
  detected: boolean;
  level: CrisisLevel;
  matchedKeywords: string[];
  suggestion: string;
}

/** 干预记录 */
export interface InterventionRecord {
  id: string;
  userId: string;
  eventId: string;
  interventionType: 'preemptive' | 'emergency' | 'outreach';
  effectivenessScore: number;
  createdAt: Date;
}

/** 情绪模式 */
export interface EmotionPattern {
  id: string;
  userId: string;
  patternType: 'weekly' | 'monthly' | 'trigger';
  description: string;
  confidence: number;
  createdAt: Date;
}

// ==================== 适配器专用类型 ====================

/** 情绪档案 - 用户情绪聚合分析结果 */
export interface EmotionProfile {
  dominantMoods: Array<{
    mood: MoodTag;
    count: number;
    percentage: number;
  }>;
  intensityTrend: Array<{
    date: string;
    avgIntensity: number;
    maxIntensity: number;
  }>;
  recentChanges: Array<{
    from: MoodTag;
    to: MoodTag;
    timestamp: Date;
  }>;
  summary: {
    totalEntries: number;
    averateIntensity: number;
    mostActiveContext: ContextTag | null;
  };
}

/** 干预记录详情 */
export interface InterventionRecordDetail extends InterventionRecord {
  triggerEvent?: string;
  userResponse?: string;
  followUpActions: string[];
  outcome: 'successful' | 'partial' | 'failed' | 'unknown';
  durationMinutes?: number;
}

/** 危机评估结果 */
export interface CrisisAssessment {
  level: CrisisLevel;
  triggers: Array<{
    type: string;
    value: number;
    threshold: number;
    message: string;
  }>;
  recommendedActions: Array<{
    priority: 'immediate' | 'soon' | 'later';
    action: string;
    reason: string;
  }>;
  riskScore: number; // 0-100
  assessedAt: Date;
}

/** 外展计划 */
export interface OutreachPlan {
  id: string;
  scheduledTime: Date;
  content: {
    title: string;
    body: string;
    suggestedActions: string[];
  };
  triggerReason: string;
  expectedImpact: {
    engagementProbability: number;
    positiveResponseProbability: number;
  };
  status: 'scheduled' | 'sent' | 'delivered' | 'expired';
}

/** 发现的模式 */
export interface DiscoveredPattern {
  id: string;
  name: string;
  frequency: number;
  occurrences: number;
  triggers: Array<{
    context: ContextTag;
    mood: MoodTag;
    timeOfDay?: string;
    dayOfWeek?: string;
  }>;
  typicalDuration: number; // 分钟
  suggestedResponses: Array<{
    strategy: string;
    effectiveness: number;
    description: string;
  }>;
  firstSeen: Date;
  lastSeen: Date;
}

/** 情绪趋势点 */
export interface EmotionTrendPoint {
  date: string;
  avgIntensity: number;
  moodDistribution: Record<MoodTag, number>;
}

/** 高危关键词配置 */
export interface CrisisKeywordConfig {
  keywords: string[];
  severityWeight: number;
  contextBoost: Record<string, number>;
}

/** 3天拆解干预计划状态 */
export type Day3PlanStatus =
  | 'pending'
  | 'day1_active'
  | 'day1_completed'
  | 'day2_active'
  | 'day2_completed'
  | 'day3_active'
  | 'completed'
  | 'abandoned';

/** 3天拆解干预 - 每日任务 */
export interface Day3DailyTask {
  day: 1 | 2 | 3;
  title: string;
  description: string;
  actionType: 'breathing' | 'writing' | 'physical' | 'social' | 'sensory' | 'reflection';
  durationMinutes: number;
  completed: boolean;
  completedAt?: Date;
  userNote?: string;
}

/** 3天拆解干预计划 */
export interface Day3InterventionPlan {
  id: string;
  userId: string;
  sourceEventId: string;
  sourceMood: MoodTag;
  sourceIntensity: EmotionIntensity;
  status: Day3PlanStatus;
  tasks: Day3DailyTask[];
  startedAt: Date;
  currentDay: 1 | 2 | 3;
  day1CompletedAt?: Date;
  day2CompletedAt?: Date;
  day3CompletedAt?: Date;
  overallOutcome?: 'improved' | 'stable' | 'worsened' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

/** 3天拆解干预 - 日历事件关联 */
export interface Day3CalendarLink {
  id: string;
  planId: string;
  eventId: string;
  day: 1 | 2 | 3;
  autoCreated: boolean;
  createdAt: Date;
}

/** 3天拆解干预 - 触发条件 */
export interface Day3TriggerCondition {
  minIntensity: EmotionIntensity;
  targetMoods: MoodTag[];
  minConsecutiveDays: number;
  cooldownDays: number;
}

export type PetSpecies = 'dog' | 'cat';

export type PetGender = 'male' | 'female' | 'unknown';

export type PoopLevel = 1 | 2 | 3 | 4 | 5;

export type AppetiteLevel = 1 | 2 | 3 | 4 | 5;

export type SpiritLevel = 1 | 2 | 3 | 4 | 5;

export type ExerciseLevel = 1 | 2 | 3;

export type HealthRiskLevel = 'low' | 'medium' | 'high' | 'emergency';

export type AnomalyItem = 'poop' | 'appetite' | 'spirit' | 'exercise' | 'weight' | 'other';

export interface PetProfile {
  id: string;
  userId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  breedId: string;
  gender: PetGender;
  birthDate: string;
  weight: number;
  avatarPhotoUrl?: string;
  avatarCartoonUrl?: string;
  avatarStyle?: string;
  avatarGeneratedAt?: Date;
  photos: string[];
  isNeutered: boolean;
  microchipId: string;
  notes: string;
  isDeceased: boolean;
  deceasedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PetHealthEntry {
  id: string;
  petId: string;
  userId: string;
  poopLevel: PoopLevel;
  appetiteLevel: AppetiteLevel;
  spiritLevel: SpiritLevel;
  exerciseLevel: ExerciseLevel;
  weight?: number;
  hasAnomaly: boolean;
  anomalyItems: AnomalyItem[];
  aiFeedback?: string;
  riskLevel: HealthRiskLevel;
  note?: string;
  createdAt: Date;
}

export interface PetVaccination {
  id: string;
  petId: string;
  userId: string;
  vaccineName: string;
  vaccineType: string;
  scheduledDate: string;
  completedDate?: string;
  isOverdue: boolean;
  reminderEnabled: boolean;
  createdAt: Date;
}

export interface PetSymptomCheck {
  id: string;
  petId: string;
  userId: string;
  symptoms: string[];
  duration: string;
  severity: string;
  additionalInfo?: string;
  aiUrgencyLevel: 'green' | 'yellow' | 'orange' | 'red';
  aiSuggestion?: string;
  knowledgeMatch?: Record<string, unknown>;
  createdAt: Date;
}

export interface PetFoodQuery {
  id: string;
  userId: string;
  foodName: string;
  safetyLevel: 'safe' | 'caution' | 'dangerous' | 'toxic';
  detail?: string;
  dangerousCompounds?: string[];
  toxicDoses?: string;
  symptoms?: string[];
  breedWarnings?: string[];
  firstAid?: string;
  isMemberQuery: boolean;
  createdAt: Date;
}

export interface HealthTrendPoint {
  date: string;
  petId: string;
  poopAvg: number;
  appetiteAvg: number;
  spiritAvg: number;
  exerciseAvg: number;
  weight?: number;
  anomalyCount: number;
  riskLevel: HealthRiskLevel;
}

export interface HealthProfile {
  petId: string;
  totalEntries: number;
  dateRange: {
    start: string;
    end: string;
  };
  trends: HealthTrendPoint[];
  summary: {
    avgPoop: number;
    avgAppetite: number;
    avgSpirit: number;
    avgExercise: number;
    totalAnomalies: number;
    dominantRiskLevel: HealthRiskLevel;
    weightChange?: number;
  };
  recentAnomalies: Array<{
    date: string;
    items: AnomalyItem[];
    riskLevel: HealthRiskLevel;
  }>;
}

export type HealthPatternType = 'recurring_anomaly' | 'improvement' | 'decline' | 'seasonal' | 'weight_trend';

export interface HealthEvolutionPattern {
  id: string;
  petId: string;
  type: HealthPatternType;
  description: string;
  frequency: number;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  relatedMetrics: string[];
  evidence: Array<{
    entryId: string;
    timestamp: Date;
    metrics: Record<string, number>;
  }>;
}

export interface HealthEvolutionReport {
  petId: string;
  patterns: HealthEvolutionPattern[];
  insights: string[];
  recommendations: string[];
  summary: {
    totalPatterns: number;
    byType: Record<HealthPatternType, number>;
    averageConfidence: number;
  };
}

export interface VaccineScheduleTemplate {
  vaccineName: string;
  vaccineType: string;
  species: PetSpecies;
  firstDoseAge: number;
  boosterInterval: number;
  annualBooster: boolean;
  description: string;
}

export type VaccineReminderStatus = 'upcoming' | 'due' | 'overdue' | 'completed' | 'skipped';

export interface VaccineReminder {
  id: string;
  petId: string;
  vaccinationId: string;
  vaccineName: string;
  scheduledDate: string;
  status: VaccineReminderStatus;
  daysUntilDue: number;
  isOverdue: boolean;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  emotionTag?: MoodTag;
  intensity?: EmotionIntensity;
  contextTags?: ContextTag[];
  riskLevel: RiskLevel;
  anxietyEstimate?: number;
  note?: string;
  createdAt: Date;
}
