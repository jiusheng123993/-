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
