/** NPS 触发事件类型 */
export type NpsTriggerEvent = 'day_7' | 'day_30' | 'after_share' | 'after_export' | 'manual';

/** NPS 调查问题 */
export interface NpsQuestion {
  id: string;
  score: number;
  category: string;
  text: string;
}

/** NPS 调查配置 */
export interface NpsSurveyConfig {
  triggerEvent: NpsTriggerEvent;
  minDaysSinceSignup: number;
  cooldownDays: number;
  questions: NpsQuestion[];
}

/** NPS 用户反馈记录 */
export interface NpsResponse {
  id: string;
  userId: string;
  score: number;
  triggerEvent: NpsTriggerEvent;
  feedback: string;
  submittedAt: string;
}

export interface NpsStatus {
  lastSurveyAt: string | null;
  lastScore: number | null;
  totalSurveys: number;
  nextSurveyAt: string | null;
  isEligible: boolean;
}
