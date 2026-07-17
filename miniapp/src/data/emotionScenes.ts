export type EmotionSceneType =
  | 'pet_deceased'
  | 'pet_sick'
  | 'anniversary'
  | 'first_checkin'
  | 'streak_milestone'
  | 'anomaly_detected';

export interface EmotionSceneConfig {
  id: string;
  type: EmotionSceneType;
  trigger: string;
  description: string;
  responseFlow: string;
  cooldownHours: number;
  priority: 'low' | 'medium' | 'high';
  memberOnly: boolean;
}

export const EMOTION_SCENE_CONFIGS: EmotionSceneConfig[] = [
  {
    id: 'scene_pet_deceased',
    type: 'pet_deceased',
    trigger: 'pet_deceased_marked',
    description: 'pet_deceased_description',
    responseFlow: 'grief_companion_flow',
    cooldownHours: 0,
    priority: 'high',
    memberOnly: false
  },
  {
    id: 'scene_pet_sick',
    type: 'pet_sick',
    trigger: 'red_urgency_alert',
    description: 'pet_sick_description',
    responseFlow: 'sick_care_flow',
    cooldownHours: 24,
    priority: 'high',
    memberOnly: false
  },
  {
    id: 'scene_anniversary',
    type: 'anniversary',
    trigger: 'pet_anniversary_date',
    description: 'anniversary_description',
    responseFlow: 'anniversary_reminder_flow',
    cooldownHours: 8760,
    priority: 'medium',
    memberOnly: false
  },
  {
    id: 'scene_first_checkin',
    type: 'first_checkin',
    trigger: 'first_checkin_completed',
    description: 'first_checkin_description',
    responseFlow: 'encouragement_flow',
    cooldownHours: 0,
    priority: 'low',
    memberOnly: false
  },
  {
    id: 'scene_streak_milestone',
    type: 'streak_milestone',
    trigger: 'checkin_streak_reached',
    description: 'streak_milestone_description',
    responseFlow: 'celebration_flow',
    cooldownHours: 168,
    priority: 'medium',
    memberOnly: true
  },
  {
    id: 'scene_anomaly_detected',
    type: 'anomaly_detected',
    trigger: 'health_anomaly_detected',
    description: 'anomaly_detected_description',
    responseFlow: 'anomaly_care_flow',
    cooldownHours: 48,
    priority: 'high',
    memberOnly: false
  }
];
