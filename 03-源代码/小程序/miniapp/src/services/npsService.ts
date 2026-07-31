/**
 * NPS 满意度调查服务
 *
 * 用户净推荐值（NPS）评分/反馈提交与统计
 */
import Taro from '@tarojs/taro';
import { api } from './api';
import {
  NPS_COOLDOWN_DAYS,
  NPS_DAY7_TRIGGER,
  NPS_MIN_SCORE,
  NPS_MAX_SCORE,
} from '../constants';
import type { NpsTriggerEvent, NpsResponse, NpsStatus } from '../types/npsTypes';

const NPS_STATUS_KEY = 'xhh_nps_status';
const NPS_DISMISSED_KEY = 'xhh_nps_dismissed_at';

export function checkNpsEligibility(userId: string, signupDate: string): NpsStatus {
  const dismissedAt = Taro.getStorageSync(NPS_DISMISSED_KEY);
  const statusData = Taro.getStorageSync(NPS_STATUS_KEY);

  const lastSurveyAt: string | null = statusData?.lastSurveyAt || null;
  const lastScore: number | null = statusData?.lastScore ?? null;
  const totalSurveys: number = statusData?.totalSurveys || 0;

  const now = new Date();
  const signup = new Date(signupDate);
  const daysSinceSignup = Math.floor((now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24));

  let isEligible = false;
  let nextSurveyAt: string | null = null;

  if (lastSurveyAt) {
    const lastSurvey = new Date(lastSurveyAt);
    const cooldownEnd = new Date(lastSurvey.getTime() + NPS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    if (now >= cooldownEnd) {
      isEligible = true;
    } else {
      nextSurveyAt = cooldownEnd.toISOString();
    }
  } else if (dismissedAt) {
    const dismissed = new Date(dismissedAt);
    const cooldownEnd = new Date(dismissed.getTime() + NPS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    if (now >= cooldownEnd && daysSinceSignup >= NPS_DAY7_TRIGGER) {
      isEligible = true;
    } else {
      nextSurveyAt = cooldownEnd.toISOString();
    }
  } else if (daysSinceSignup >= NPS_DAY7_TRIGGER) {
    isEligible = true;
  } else {
    const day7Date = new Date(signup.getTime() + NPS_DAY7_TRIGGER * 24 * 60 * 60 * 1000);
    nextSurveyAt = day7Date.toISOString();
  }

  return { lastSurveyAt, lastScore, totalSurveys, nextSurveyAt, isEligible };
}

export function getTriggerEvent(signupDate: string): NpsTriggerEvent {
  const now = new Date();
  const signup = new Date(signupDate);
  const daysSinceSignup = Math.floor((now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceSignup >= 30) return 'day_30';
  if (daysSinceSignup >= NPS_DAY7_TRIGGER) return 'day_7';
  return 'manual';
}

export async function submitNpsResponse(
  userId: string,
  score: number,
  triggerEvent: NpsTriggerEvent,
  feedback: string
): Promise<NpsResponse | null> {
  if (score < NPS_MIN_SCORE || score > NPS_MAX_SCORE) {
    return null;
  }

  try {
    const response = await api.post<NpsResponse>('/api/nps/responses', {
      user_id: userId,
      score,
      trigger_event: triggerEvent,
      feedback,
    });

    const statusData = Taro.getStorageSync(NPS_STATUS_KEY) || {};
    Taro.setStorageSync(NPS_STATUS_KEY, {
      lastSurveyAt: new Date().toISOString(),
      lastScore: score,
      totalSurveys: (statusData.totalSurveys || 0) + 1,
    });

    Taro.removeStorageSync(NPS_DISMISSED_KEY);

    return response;
  } catch {
    const statusData = Taro.getStorageSync(NPS_STATUS_KEY) || {};
    Taro.setStorageSync(NPS_STATUS_KEY, {
      lastSurveyAt: new Date().toISOString(),
      lastScore: score,
      totalSurveys: (statusData.totalSurveys || 0) + 1,
    });

    Taro.removeStorageSync(NPS_DISMISSED_KEY);

    return null;
  }
}

export function dismissNpsSurvey(): void {
  Taro.setStorageSync(NPS_DISMISSED_KEY, new Date().toISOString());
}

export function getNpsStatus(): NpsStatus {
  const statusData = Taro.getStorageSync(NPS_STATUS_KEY);
  const dismissedAt = Taro.getStorageSync(NPS_DISMISSED_KEY);

  return {
    lastSurveyAt: statusData?.lastSurveyAt || null,
    lastScore: statusData?.lastScore ?? null,
    totalSurveys: statusData?.totalSurveys || 0,
    nextSurveyAt: null,
    isEligible: !dismissedAt,
  };
}
