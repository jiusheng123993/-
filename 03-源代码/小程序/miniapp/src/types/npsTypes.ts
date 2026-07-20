export type NpsTriggerEvent = 'day_7' | 'day_30' | 'after_share' | 'after_export' | 'manual';

export interface NpsQuestion {
  id: string;
  score: number;
  category: string;
  text: string;
}

export interface NpsSurveyConfig {
  triggerEvent: NpsTriggerEvent;
  minDaysSinceSignup: number;
  cooldownDays: number;
  questions: NpsQuestion[];
}

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
