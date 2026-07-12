import Taro from '@tarojs/taro';
import { getStorage, setStorage } from '../utils/storage';

const SUBSCRIBE_STATUS_KEY = 'subscribe_status';

export interface SubscribeStatus {
  templateId: string;
  accepted: boolean;
  acceptedAt?: number;
}

export const FOLLOWUP_TEMPLATE_ID = 'FOLLOWUP_TEMPLATE_ID_PLACEHOLDER';

export const TEMPLATE_IDS = {
  FOLLOWUP: FOLLOWUP_TEMPLATE_ID,
};

export async function requestSubscribe(templateIds: string[] = [FOLLOWUP_TEMPLATE_ID]): Promise<Record<string, boolean>> {
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
  } catch (error) {
    console.error('[SubscribeService] 请求订阅失败:', error);
    templateIds.forEach((id) => {
      results[id] = false;
    });
    return results;
  }
}

export function updateSubscribeStatus(templateId: string, accepted: boolean): void {
  const statusList = getStorage<SubscribeStatus[]>(SUBSCRIBE_STATUS_KEY) || [];

  const existingIndex = statusList.findIndex((s) => s.templateId === templateId);
  const newStatus: SubscribeStatus = {
    templateId,
    accepted,
    acceptedAt: accepted ? Date.now() : undefined,
  };

  if (existingIndex >= 0) {
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

export function clearSubscribeStatus(): void {
  setStorage(SUBSCRIBE_STATUS_KEY, []);
}
