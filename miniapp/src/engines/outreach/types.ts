// 星寰海 v2.0 - AI主动推送引擎类型定义
import type { OutreachTriggerType } from '../../memory-body/types/memoryBodyTypes';

/** 推送触发条件 */
export interface OutreachCondition {
  type: OutreachTriggerType;
  threshold: number;
  cooldownHours: number;
}

/** 预设建议库条目 */
export interface SuggestionEntry {
  id: string;
  triggerType: OutreachTriggerType;
  title: string;
  body: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
