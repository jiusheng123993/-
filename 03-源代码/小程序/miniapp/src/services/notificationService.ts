import Taro from '@tarojs/taro';
import { getStorage, setStorage } from '../utils/storage';
import { logger } from '../logger';
import {
  hasAcceptedSubscribe,
  FOLLOWUP_TEMPLATE_ID,
  CARE_PLAN_REMINDER_TEMPLATE_ID,
  requestFollowupSubscribe,
  sendSubscribeMessage,
  type SubscribeMessageData,
} from './subscribeService';
import { checkFrequency, recordSend } from './frequencyControlService';

const PENDING_FOLLOWUPS_KEY = 'pending_followups';

export interface PendingFollowup {
  sessionId: string;
  flowId: string;
  healthStatus: string;
  scheduledDate: string;
  createdAt: number;
  status: 'pending' | 'sent' | 'responded' | 'cancelled' | 'expired';
  respondedAt?: number;
  response?: 'better' | 'okay' | 'still_bad';
  sendAttempts: number;
  lastAttemptAt?: number;
  subscribeAccepted: boolean;
}

export interface FollowupScheduleOptions {
  delayHours?: number;
  preferredHour?: number;
  requestSubscribeOnSchedule?: boolean;
}

export function scheduleFollowup(
  sessionId: string,
  flowId: string,
  healthStatus: string,
  options: FollowupScheduleOptions = {}
): PendingFollowup {
  const followups = getPendingFollowups();

  const existingIndex = followups.findIndex(f => f.sessionId === sessionId);
  if (existingIndex >= 0) {
    const existing = followups[existingIndex];
    if (existing.status === 'pending' || existing.status === 'sent') {
      return existing;
    }
  }

  const { delayHours = 24, preferredHour = 9 } = options;

  const now = new Date();
  const scheduled = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

  if (preferredHour > 0) {
    scheduled.setHours(preferredHour, 0, 0, 0);
    if (scheduled.getTime() <= now.getTime()) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
  }

  const subscribeAccepted = hasAcceptedSubscribe(FOLLOWUP_TEMPLATE_ID);

  const followup: PendingFollowup = {
    sessionId,
    flowId,
    healthStatus,
    scheduledDate: scheduled.toISOString(),
    createdAt: Date.now(),
    status: 'pending',
    sendAttempts: 0,
    subscribeAccepted,
  };

  followups.push(followup);
  setStorage(PENDING_FOLLOWUPS_KEY, followups);

  if (options.requestSubscribeOnSchedule && !subscribeAccepted) {
    requestFollowupSubscribe().then(accepted => {
      if (accepted) {
        followup.subscribeAccepted = true;
        setStorage(PENDING_FOLLOWUPS_KEY, followups);
      }
    }).catch(() => {});
  }

  return followup;
}

export function cancelFollowup(sessionId: string): boolean {
  const followups = getPendingFollowups();
  const index = followups.findIndex((f) => f.sessionId === sessionId);

  if (index >= 0) {
    followups[index].status = 'cancelled';
    setStorage(PENDING_FOLLOWUPS_KEY, followups);
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
  for (const followup of followups) {
    try {
      // 频率检查
      const freqCheck = checkFrequency(FOLLOWUP_TEMPLATE_ID);
      if (!freqCheck.allowed) {
        logger.warn('notificationService', `Followup blocked: ${freqCheck.reason}`);
        followup.status = 'cancelled';
        continue;
      }

      const sent = await sendSingleFollowup(followup);
      followup.sendAttempts++;
      followup.lastAttemptAt = Date.now();

      if (sent) {
        followup.status = 'sent';
        recordSend(FOLLOWUP_TEMPLATE_ID, true);
      } else {
        recordSend(FOLLOWUP_TEMPLATE_ID, false);
        if (followup.sendAttempts >= 3) {
          followup.status = 'expired';
        } else {
          const retryDelay = Math.pow(2, followup.sendAttempts) * 60 * 60 * 1000;
          const retryDate = new Date(Date.now() + retryDelay);
          followup.scheduledDate = retryDate.toISOString();
        }
      }
    } catch (error) {
      followup.sendAttempts++;
      followup.lastAttemptAt = Date.now();
    }
  }

  setStorage(PENDING_FOLLOWUPS_KEY, followups);
}

async function sendSingleFollowup(followup: PendingFollowup): Promise<boolean> {
  const moodDisplay = followup.healthStatus;

  const data: SubscribeMessageData = {
    thing1: { value: truncateForTemplate(moodDisplay, 20) },
    time2: { value: formatDateTime(followup.createdAt) },
    thing3: { value: truncateForTemplate('昨天的健康提醒，今天感觉怎么样？', 20) },
  };

  const page = `/pagesPet/checkin/index?followupSessionId=${followup.sessionId}`;

  if (followup.subscribeAccepted) {
    const sent = await sendSubscribeMessage(FOLLOWUP_TEMPLATE_ID, data, page);
    if (sent) return true;
  }

  try {
    Taro.showToast({
      title: `跟进提醒：昨天的健康提醒，今天感觉怎么样？`,
      icon: 'none',
      duration: 3000,
    });
  } catch {}

  return true;
}

export async function sendCarePlanReminder(
  planId: string,
  day: 1 | 2 | 3,
  taskTitle: string,
  taskDescription: string
): Promise<boolean> {
  const data: SubscribeMessageData = {
    thing1: { value: truncateForTemplate(`第${day}天：${taskTitle}`, 20) },
    time2: { value: formatDateTime(Date.now()) },
    thing3: { value: truncateForTemplate(taskDescription, 20) },
  };

  const page = `/pages/index/index?carePlanId=${planId}&day=${day}`;

  return sendSubscribeMessage(CARE_PLAN_REMINDER_TEMPLATE_ID, data, page);
}

export function updateFollowupStatus(
  sessionId: string,
  status: PendingFollowup['status'],
  response?: PendingFollowup['response']
): boolean {
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
  }

  return removedCount;
}

export function getFollowupStats(): {
  total: number;
  pending: number;
  sent: number;
  responded: number;
  responseRate: number;
  betterRate: number;
} {
  const followups = getPendingFollowups();
  const total = followups.length;
  const pending = followups.filter(f => f.status === 'pending').length;
  const sent = followups.filter(f => f.status === 'sent').length;
  const responded = followups.filter(f => f.status === 'responded').length;
  const better = followups.filter(f => f.response === 'better').length;

  const respondedOrSent = sent + responded;
  const responseRate = respondedOrSent > 0 ? Math.round((responded / respondedOrSent) * 100) : 0;
  const betterRate = responded > 0 ? Math.round((better / responded) * 100) : 0;

  return { total, pending, sent, responded, responseRate, betterRate };
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

function truncateForTemplate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}
