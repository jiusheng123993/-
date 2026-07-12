// 星寰海 v2.0 - memory-body 统一导出

// 核心存储
export { MiniProgramMemoryBodyStore } from './store/miniProgramMemoryBodyStore';

// 适配器
export { EmotionIndexAdapter } from './adapters/emotionIndexAdapter';
export { InterventionTrackerAdapter } from './adapters/interventionTrackerAdapter';
export { CrisisSafetyNetAdapter } from './adapters/crisisSafetyNetAdapter';
export { OutreachCoordinatorAdapter } from './adapters/outreachCoordinatorAdapter';
export { PatternDiscoveryAdapter } from './adapters/patternDiscoveryAdapter';

// 类型
export type {
  MoodTag,
  ContextTag,
  EmotionIntensity,
  MoodEntry,
  EmergencyState,
  EmergencyStepConfig,
  EmergencyFlowConfig,
  EmergencySession,
  OutreachTriggerType,
  OutreachCondition,
  AiOutreachMessage,
  CrisisLevel,
  CrisisDetectionResult,
  InterventionRecord,
  EmotionPattern,
  // 适配器专用类型
  EmotionProfile,
  InterventionRecordDetail,
  CrisisAssessment,
  OutreachPlan,
  DiscoveredPattern,
  EmotionTrendPoint,
  CrisisKeywordConfig
} from './types/memoryBodyTypes';