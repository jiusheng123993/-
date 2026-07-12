// 星寰海 v2.0 - 急救引擎类型定义

/** 命名步骤配置 */
export interface NamingStepConfig {
  subtitle?: string;
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
}

/** 书写步骤配置 */
export interface WritingStepConfig {
  subtitle?: string;
  prompts: Array<{
    id: string;
    text: string;
  }>;
  crisisKeywords?: string[];
}

/** 行动步骤配置选项 */
export interface ActionOption {
  id: string;
  title: string;
  description: string;
}

/** 行动步骤配置 */
export interface ActionStepConfig {
  subtitle?: string;
  options: ActionOption[];
  defaultOptionId?: string;
}

/** 资源链接 */
export interface ResourceLink {
  id: string;
  title: string;
  description: string;
  url?: string;
  icon?: string;
}

/** 支持消息 */
export interface SupportMessage {
  id: string;
  text: string;
  author?: string;
}

/** 连接步骤配置 */
export interface ConnectStepConfig {
  subtitle?: string;
  resourceType: 'peer' | 'professional' | 'community' | 'sleep' | 'counseling';
  resources: ResourceLink[];
  supportMessages?: SupportMessage[];
}

/** 步骤总结 */
export interface StepSummary {
  stepNumber: number;
  title: string;
  content?: string;
}

/** 鼓励消息 */
export interface EncouragementMessage {
  id: string;
  text: string;
  icon?: string;
}

/** 结束步骤配置 */
export interface ClosingStepConfig {
  subtitle?: string;
  summaries: StepSummary[];
  encouragements: EncouragementMessage[];
  showGratitude?: boolean;
}

/** 通用步骤配置（可扩展） */
export type EmergencyStepConfig =
  | NamingStepConfig
  | WritingStepConfig
  | ActionStepConfig
  | ConnectStepConfig
  | ClosingStepConfig
  | Record<string, unknown>;

/** 急救流程步骤 */
export interface EmergencyStep {
  stepId: string;
  title: string;
  description: string;
  component: string;
  durationEstimate: number;
  config?: EmergencyStepConfig;
}

/** 急救流程配置 */
export interface EmergencyFlow {
  flowId: string;
  mood: string;
  displayName: string;
  color: string;
  steps: EmergencyStep[];
}

/** 高危检测结果 */
export interface CrisisResult {
  detected: boolean;
  level: 'mild' | 'moderate' | 'severe';
  matchedKeywords: string[];
  suggestion: string;
}