/**
 * 本地提醒服务
 *
 * 疫苗/驱虫等本地提醒的调度、查询、过期管理
 */
import Taro from '@tarojs/taro';
import type { VaccineRecord } from './vaccineService';
import { getStorage, setStorage } from '../utils/storage';
import { VACCINE_REMINDER_TEMPLATE_ID } from '../constants/templateIds';
import { sendSubscribeMessage, hasAcceptedSubscribe } from './subscribeService';
import { logger } from '../logger';

export interface ReminderItem {
  record: VaccineRecord;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface LocalReminder {
  recordId: string;
  petId: string;
  category: string;
  nextDate: string;
  daysBefore: number;
  scheduledAt: number;
  triggered: boolean;
}

export interface VaccineReminderConfig {
  petId: string;
  petName: string;
  vaccineName: string;
  nextDate: string;
  daysUntilDue: number;
}

const SUBSCRIPTION_STATUS_KEY = 'vaccine_reminder_subscribed';
const LOCAL_REMINDERS_KEY = 'vaccine_local_reminders';
const VACCINE_REMINDER_SENT_KEY = 'vaccine_reminder_sent';

function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calcDaysUntil(dateStr: string): number {
  const todayStr = getTodayStr();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);
  const targetMs = Date.UTC(dy, dm - 1, dd);
  return Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));
}

export function checkUpcomingReminders(petId: string): ReminderItem[] {
  const storageKey = `vaccines_${petId}`;
  const records = getStorage<VaccineRecord[]>(storageKey) || [];
  const today = getTodayStr();

  return records
    .filter((r) => r.status !== 'completed' && r.nextDate < today)
    .map((r) => {
      const daysUntilDue = calcDaysUntil(r.nextDate);
      return {
        record: r,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
      };
    });
}

export async function requestSubscribeMessage(): Promise<boolean> {
  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: [VACCINE_REMINDER_TEMPLATE_ID],
    } as Parameters<typeof Taro.requestSubscribeMessage>[0]);
    const result = res as Record<string, string>;
    const accepted = result[VACCINE_REMINDER_TEMPLATE_ID] === 'accept';
    saveSubscriptionStatus(accepted);
    return accepted;
  } catch {
    return false;
  }
}

export function saveSubscriptionStatus(subscribed: boolean): void {
  setStorage(SUBSCRIPTION_STATUS_KEY, {
    subscribed,
    updatedAt: Date.now(),
  });
}

export function getSubscriptionStatus(): boolean {
  const data = getStorage<{ subscribed: boolean; updatedAt: number }>(SUBSCRIPTION_STATUS_KEY);
  return data?.subscribed ?? false;
}

export function scheduleLocalReminder(record: VaccineRecord, daysBefore: number): LocalReminder {
  const reminders = getStorage<LocalReminder[]>(LOCAL_REMINDERS_KEY) || [];

  const existingIndex = reminders.findIndex(
    (r) => r.recordId === record.id && r.daysBefore === daysBefore
  );

  const reminder: LocalReminder = {
    recordId: record.id,
    petId: record.petId,
    category: record.category,
    nextDate: record.nextDate,
    daysBefore,
    scheduledAt: Date.now(),
    triggered: false,
  };

  if (existingIndex >= 0) {
    reminders[existingIndex] = reminder;
  } else {
    reminders.push(reminder);
  }

  setStorage(LOCAL_REMINDERS_KEY, reminders);
  return reminder;
}

export function getOverdueReminders(petId: string): ReminderItem[] {
  const storageKey = `vaccines_${petId}`;
  const records = getStorage<VaccineRecord[]>(storageKey) || [];

  return records
    .filter((r) => r.status !== 'completed' && r.nextDate < getTodayStr())
    .map((r) => ({
      record: r,
      daysUntilDue: calcDaysUntil(r.nextDate),
      isOverdue: true,
    }));
}

export function getUpcomingReminders(petId: string, days: number): ReminderItem[] {
  const storageKey = `vaccines_${petId}`;
  const records = getStorage<VaccineRecord[]>(storageKey) || [];
  const today = getTodayStr();

  const [ty, tm, td] = today.split('-').map(Number);
  const futureMs = Date.UTC(ty, tm - 1, td) + days * 24 * 60 * 60 * 1000;
  const futureDate = new Date(futureMs);
  const futureStr = `${futureDate.getUTCFullYear()}-${String(futureDate.getUTCMonth() + 1).padStart(2, '0')}-${String(futureDate.getUTCDate()).padStart(2, '0')}`;

  return records
    .filter((r) => r.status !== 'completed' && r.nextDate >= today && r.nextDate <= futureStr)
    .map((r) => ({
      record: r,
      daysUntilDue: calcDaysUntil(r.nextDate),
      isOverdue: false,
    }));
}

export function getLocalReminders(): LocalReminder[] {
  return getStorage<LocalReminder[]>(LOCAL_REMINDERS_KEY) || [];
}

export function markReminderTriggered(recordId: string): void {
  const reminders = getStorage<LocalReminder[]>(LOCAL_REMINDERS_KEY) || [];
  const index = reminders.findIndex((r) => r.recordId === recordId);
  if (index >= 0) {
    reminders[index].triggered = true;
    setStorage(LOCAL_REMINDERS_KEY, reminders);
  }
}

export function clearLocalReminders(petId: string): void {
  const reminders = getStorage<LocalReminder[]>(LOCAL_REMINDERS_KEY) || [];
  const filtered = reminders.filter((r) => r.petId !== petId);
  setStorage(LOCAL_REMINDERS_KEY, filtered);
}

export { VACCINE_REMINDER_TEMPLATE_ID } from '../constants/templateIds'

/**
 * 发送疫苗提醒订阅消息
 * 在疫苗到期前触发，通过微信订阅消息推送
 */
export async function sendVaccineReminder(config: VaccineReminderConfig): Promise<boolean> {
  try {
    // 检查用户是否已接受订阅
    const hasAccepted = await hasAcceptedSubscribe(VACCINE_REMINDER_TEMPLATE_ID)
    if (!hasAccepted) {
      logger.info('vaccineReminder', '用户未接受订阅，跳过疫苗提醒推送')
      return false
    }

    // 检查今日是否已发送过该疫苗的提醒
    const sentKey = `${VACCINE_REMINDER_SENT_KEY}_${config.petId}_${config.vaccineName}`
    const lastSent = getStorage<string>(sentKey)
    const today = getTodayStr()
    if (lastSent === today) {
      logger.info('vaccineReminder', '今日已发送过该疫苗提醒，跳过')
      return false
    }

    // 构建订阅消息数据
    const messageData = {
      thing1: { value: config.petName },
      thing2: { value: config.vaccineName },
      time3: { value: config.nextDate },
      thing4: { value: config.daysUntilDue <= 0 ? '已逾期，请尽快安排' : `还有${config.daysUntilDue}天到期` },
    }

    // 发送订阅消息
    const success = await sendSubscribeMessage( VACCINE_REMINDER_TEMPLATE_ID, messageData)

    if (success) {
      // 记录发送时间
      setStorage(sentKey, today)
      logger.info('vaccineReminder', `疫苗提醒订阅消息发送成功, petId=${config.petId}, vaccineName=${config.vaccineName}`)
    }

    return success
  } catch (error) {
    logger.error('vaccineReminder', `发送疫苗提醒订阅消息失败, config=${JSON.stringify(config)}`, error)
    return false
  }
}

/**
 * 检查并发送即将到期的疫苗提醒
 * 应在小程序启动或页面显示时调用
 */
export async function checkAndSendVaccineReminders(petId: string, petName: string): Promise<void> {
  try {
    const upcoming = getUpcomingReminders(petId, 7)
    const overdue = getOverdueReminders(petId)
    const allReminders = [...upcoming, ...overdue]

    for (const item of allReminders) {
      const config: VaccineReminderConfig = {
        petId,
        petName,
        vaccineName: item.record.category,
        nextDate: item.record.nextDate,
        daysUntilDue: item.daysUntilDue,
      }

      await sendVaccineReminder(config)
    }
  } catch (error) {
    logger.error('vaccineReminder', `检查并发送疫苗提醒失败, petId=${petId}`, error)
  }
}

/**
 * 获取疫苗提醒订阅状态
 */
export function getVaccineReminderStatus(): boolean {
  return getStorage<boolean>(SUBSCRIPTION_STATUS_KEY) || false
}

/**
 * 设置疫苗提醒订阅状态
 */
export function setVaccineReminderStatus(subscribed: boolean): void {
  setStorage(SUBSCRIPTION_STATUS_KEY, subscribed)
}
