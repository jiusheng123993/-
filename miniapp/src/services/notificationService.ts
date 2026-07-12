import Taro from '@tarojs/taro';
import { getStorage, setStorage } from '../utils/storage';
import { hasAcceptedSubscribe, FOLLOWUP_TEMPLATE_ID } from './subscribeService';
import { getMoodDisplayName } from '../utils/moodHelper';

const PENDING_FOLLOWUPS_KEY = 'pending_followups';

export interface PendingFollowup {
  sessionId: string;
  flowId: string;
  mood: string;
  scheduledDate: string;
  createdAt: number;
  status: 'pending' | 'sent' | 'responded' | 'cancelled';
  respondedAt?: number;
  response?: 'better' | 'okay' | 'still_bad';
}

export function scheduleFollowup(sessionId: string, flowId: string, mood: string, scheduledDate?: string): PendingFollowup {
  const followups = getPendingFollowups();

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
  const scheduledTimestamp = tomorrow.getTime();

  const followup: PendingFollowup = {
    sessionId,
    flowId,
    mood,
    scheduledDate: scheduledDate || new Date(scheduledTimestamp).toISOString(),
    createdAt: Date.now(),
    status: 'pending',
  };

  followups.push(followup);
  setStorage(PENDING_FOLLOWUPS_KEY, followups);

  console.log('[NotificationService] 已安排跟进推送:', followup);
  return followup;
}

export function cancelFollowup(sessionId: string): boolean {
  const followups = getPendingFollowups();
  const index = followups.findIndex((f) => f.sessionId === sessionId);

  if (index >= 0) {
    followups[index].status = 'cancelled';
    setStorage(PENDING_FOLLOWUPS_KEY, followups);
    console.log('[NotificationService] 已取消跟进推送:', sessionId);
    return true;
  }

  return false;
}

export function getPendingFollowups(): PendingFollowup[] {
  return getStorage<PendingFollowup[]>(PENDING_FOLLOWUPS_KEY) || [];
}

export function getFollowupBySessionId(sessionId: string): PendingFollowup | null {
  const followups = getPendingFollowups();
  return followups.find((f) => f.sessionId === sessionId) || null;
}

export function checkAndSendFollowups(): PendingFollowup[] {
  const followups = getPendingFollowups();
  const now = new Date();
  const toSend: PendingFollowup[] = [];

  followups.forEach((followup) => {
    if (followup.status !== 'pending') return;

    const scheduledTime = new Date(followup.scheduledDate);
    if (now >= scheduledTime) {
      toSend.push(followup);
    }
  });

  if (toSend.length > 0) {
    sendFollowupNotifications(toSend);
  }

  return toSend;
}

async function sendFollowupNotifications(followups: PendingFollowup[]): Promise<void> {
  const hasAccepted = hasAcceptedSubscribe(FOLLOWUP_TEMPLATE_ID);

  if (!hasAccepted) {
    console.log('[NotificationService] 用户未接受订阅消息，无法发送');
    return;
  }

  for (const followup of followups) {
    try {
      await sendSingleFollowup(followup);
      followup.status = 'sent';
      console.log('[NotificationService] 跟进推送已发送:', followup.sessionId);
    } catch (error) {
      console.error('[NotificationService] 发送失败:', followup.sessionId, error);
    }
  }

  setStorage(PENDING_FOLLOWUPS_KEY, followups);
}

async function sendSingleFollowup(followup: PendingFollowup): Promise<void> {
  const moodDisplay = getMoodDisplayName(followup.mood);

  const data = {
    thing1: { value: moodDisplay },
    time2: { value: formatDateTime(followup.createdAt) },
    thing3: { value: '昨天的情绪急救，今天感觉怎么样？' },
  };

  console.log('[NotificationService] 模拟发送订阅消息:', {
    templateId: FOLLOWUP_TEMPLATE_ID,
    data,
    page: `/packageEmergency/pages/followup/index?sessionId=${followup.sessionId}`,
  });

  Taro.showToast({
    title: '跟进提醒已触发',
    icon: 'none',
    duration: 2000,
  });
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function updateFollowupStatus(sessionId: string, status: PendingFollowup['status'], response?: PendingFollowup['response']): boolean {
  const followups = getPendingFollowups();
  const index = followups.findIndex((f) => f.sessionId === sessionId);

  if (index >= 0) {
    followups[index].status = status;
    if (response) {
      followups[index].response = response;
      followups[index].respondedAt = Date.now();
    }
    setStorage(PENDING_FOLLOWUPS_KEY, followups);
    return true;
  }

  return false;
}

export function clearExpiredFollowups(): number {
  const followups = getPendingFollowups();
  const now = Date.now();
  const expireThreshold = 7 * 24 * 60 * 60 * 1000;
  const pendingExpireThreshold = 14 * 24 * 60 * 60 * 1000;

  const validFollowups = followups.filter((f) => {
    const age = now - f.createdAt;
    if (f.status === 'pending') {
      return age < pendingExpireThreshold;
    }
    return age < expireThreshold;
  });

  const removedCount = followups.length - validFollowups.length;
  if (removedCount > 0) {
    setStorage(PENDING_FOLLOWUPS_KEY, validFollowups);
    console.log('[NotificationService] 清理过期跟进记录:', removedCount);
  }

  return removedCount;
}