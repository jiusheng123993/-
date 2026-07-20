import Taro from '@tarojs/taro';
import { getStorage, setStorage } from '../utils/storage';
import { checkFrequency, recordSend } from './frequencyControlService';

const SUBSCRIBE_STATUS_KEY = 'subscribe_status';

export interface SubscribeStatus {
  templateId: string;
  accepted: boolean;
  acceptedAt?: number;
  lastUsedAt?: number;
  usageCount: number;
}

function getTemplateId(envKey: string, fallback: string): string {
  const value = (process.env as Record<string, string | undefined>)[envKey]
  return value && value !== fallback ? value : fallback
}

export const FOLLOWUP_TEMPLATE_ID = getTemplateId(
  'TARO_APP_FOLLOWUP_TEMPLATE_ID',
  'FOLLOWUP_TEMPLATE_ID_PLACEHOLDER'
);

export const INTERVENTION_REMINDER_TEMPLATE_ID = getTemplateId(
  'TARO_APP_INTERVENTION_TEMPLATE_ID',
  'INTERVENTION_REMINDER_TEMPLATE_ID_PLACEHOLDER'
);

export const MOOD_CHECKIN_TEMPLATE_ID = getTemplateId(
  'TARO_APP_MOOD_CHECKIN_TEMPLATE_ID',
  'MOOD_CHECKIN_TEMPLATE_ID_PLACEHOLDER'
);

export const TEMPLATE_IDS = {
  FOLLOWUP: FOLLOWUP_TEMPLATE_ID,
  INTERVENTION_REMINDER: INTERVENTION_REMINDER_TEMPLATE_ID,
  MOOD_CHECKIN: MOOD_CHECKIN_TEMPLATE_ID,
};

export type TemplateId = typeof TEMPLATE_IDS[keyof typeof TEMPLATE_IDS];

export interface SubscribeMessageData {
  [key: string]: { value: string };
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  requiredFields: string[];
}

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  [FOLLOWUP_TEMPLATE_ID]: {
    id: FOLLOWUP_TEMPLATE_ID,
    name: '急救跟进提醒',
    description: '急救后第二天跟进，询问用户感受',
    requiredFields: ['thing1', 'time2', 'thing3'],
  },
  [INTERVENTION_REMINDER_TEMPLATE_ID]: {
    id: INTERVENTION_REMINDER_TEMPLATE_ID,
    name: '干预任务提醒',
    description: '3天拆解干预每日任务提醒',
    requiredFields: ['thing1', 'time2', 'thing3'],
  },
  [MOOD_CHECKIN_TEMPLATE_ID]: {
    id: MOOD_CHECKIN_TEMPLATE_ID,
    name: '情绪打卡提醒',
    description: '定时情绪记录提醒',
    requiredFields: ['thing1', 'time2', 'thing3'],
  },
};

export async function requestSubscribe(
  templateIds: string[] = [FOLLOWUP_TEMPLATE_ID]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: templateIds,
      entityIds: [],
    });

    templateIds.forEach((id) => {
      const status = (res as Record<string, string>)[id];
      const accepted = status === 'accept';
      results[id] = accepted;

      updateSubscribeStatus(id, accepted);
    });

    return results;
  } catch {
    templateIds.forEach((id) => {
      results[id] = false;
    });
    return results;
  }
}

export async function requestFollowupSubscribe(): Promise<boolean> {
  const results = await requestSubscribe([FOLLOWUP_TEMPLATE_ID]);
  return results[FOLLOWUP_TEMPLATE_ID] ?? false;
}

export async function requestInterventionSubscribe(): Promise<boolean> {
  const results = await requestSubscribe([INTERVENTION_REMINDER_TEMPLATE_ID]);
  return results[INTERVENTION_REMINDER_TEMPLATE_ID] ?? false;
}

export async function requestAllSubscribes(): Promise<Record<string, boolean>> {
  return requestSubscribe([
    FOLLOWUP_TEMPLATE_ID,
    INTERVENTION_REMINDER_TEMPLATE_ID,
    MOOD_CHECKIN_TEMPLATE_ID,
  ]);
}

export function updateSubscribeStatus(templateId: string, accepted: boolean): void {
  const statusList = getStorage<SubscribeStatus[]>(SUBSCRIBE_STATUS_KEY) || [];

  const existingIndex = statusList.findIndex((s) => s.templateId === templateId);
  const newStatus: SubscribeStatus = {
    templateId,
    accepted,
    acceptedAt: accepted ? Date.now() : undefined,
    usageCount: 0,
  };

  if (existingIndex >= 0) {
    const existing = statusList[existingIndex];
    newStatus.usageCount = existing.usageCount;
    if (accepted && !existing.acceptedAt) {
      newStatus.acceptedAt = Date.now();
    } else if (!accepted) {
      newStatus.acceptedAt = undefined;
    }
    statusList[existingIndex] = newStatus;
  } else {
    statusList.push(newStatus);
  }

  setStorage(SUBSCRIBE_STATUS_KEY, statusList);
}

export function getSubscribeStatus(templateId: string): SubscribeStatus | null {
  const statusList = getStorage<SubscribeStatus[]>(SUBSCRIBE_STATUS_KEY) || [];
  return statusList.find((s) => s.templateId === templateId) || null;
}

export function hasAcceptedSubscribe(templateId: string): boolean {
  const status = getSubscribeStatus(templateId);
  return status?.accepted ?? false;
}

export function getAllSubscribeStatus(): SubscribeStatus[] {
  return getStorage<SubscribeStatus[]>(SUBSCRIBE_STATUS_KEY) || [];
}

export function recordTemplateUsage(templateId: string): void {
  const statusList = getStorage<SubscribeStatus[]>(SUBSCRIBE_STATUS_KEY) || [];
  const index = statusList.findIndex((s) => s.templateId === templateId);

  if (index >= 0) {
    statusList[index].lastUsedAt = Date.now();
    statusList[index].usageCount++;
    setStorage(SUBSCRIBE_STATUS_KEY, statusList);
  }
}

export function clearSubscribeStatus(): void {
  setStorage(SUBSCRIBE_STATUS_KEY, []);
}

export async function sendSubscribeMessage(
  templateId: string,
  data: SubscribeMessageData,
  page?: string
): Promise<boolean> {
  if (!hasAcceptedSubscribe(templateId)) {
    return false;
  }

  if (templateId.includes('PLACEHOLDER')) {
    return false;
  }

  // 频率检查
  const freqCheck = checkFrequency(templateId);
  if (!freqCheck.allowed) {
    console.warn(`[subscribeService] Frequency check failed: ${freqCheck.reason}`);
    return false;
  }

  try {
    const token = Taro.getStorageSync('xhh_token');
    const apiBaseUrl = process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000';

    const res = await Taro.request({
      url: `${apiBaseUrl}/api/subscribe/send`,
      method: 'POST',
      data: { templateId, data, page },
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.statusCode === 200) {
      recordTemplateUsage(templateId);
      recordSend(templateId, true); // 记录发送成功
      return true;
    }

    recordSend(templateId, false); // 记录发送失败
    return false;
  } catch {
    recordSend(templateId, false);
    return false;
  }
}
