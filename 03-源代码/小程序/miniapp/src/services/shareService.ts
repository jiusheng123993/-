/**
 * 分享服务
 *
 * 生成并分享宠物健康报告/动态等内容的图片
 */
import Taro from '@tarojs/taro'
import { CONFIG } from '../config'
import { api } from './api';
import {
  INVITE_CODE_LENGTH,
  INVITE_CODE_MAX_USE,
  SHARE_REWARD_INVITES,
} from '../constants';
import type {
  ShareCardType,
  ShareRecord,
  InviteCode,
  ReferralRecord,
  ShareStats,
  ShareRewardResult,
} from '../types/shareTypes';

const SHARE_HISTORY_KEY = 'xhh_share_history';
const INVITE_CODE_KEY = 'xhh_invite_code';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getOrCreateInviteCode(userId: string): Promise<string> {
  const cached = Taro.getStorageSync(INVITE_CODE_KEY);
  if (cached) return cached;

  try {
    const result = await api.get<{ code: string }>('/api/invite-code')
    if (result.code) {
      Taro.setStorageSync(INVITE_CODE_KEY, result.code);
      return result.code;
    }
  } catch {
    // fall through to local generation
  }

  const code = generateInviteCode();
  Taro.setStorageSync(INVITE_CODE_KEY, code);
  return code;
}

export async function recordShare(
  userId: string,
  cardType: ShareCardType,
  petId: string,
  platform: string
): Promise<ShareRecord | null> {
  const inviteCode = await getOrCreateInviteCode(userId);

  try {
    const record = await api.post<ShareRecord>('/api/shares', {
      user_id: userId,
      card_type: cardType,
      pet_id: petId,
      platform,
      invite_code: inviteCode,
    });

    const history: ShareRecord[] = Taro.getStorageSync(SHARE_HISTORY_KEY) || [];
    history.push(record);
    Taro.setStorageSync(SHARE_HISTORY_KEY, history);

    return record;
  } catch {
    return null;
  }
}

export async function getShareStats(userId: string): Promise<ShareStats> {
  const history: ShareRecord[] = Taro.getStorageSync(SHARE_HISTORY_KEY) || [];

  const foodShares = history.filter(r => r.cardType === 'food').length;
  const trendShares = history.filter(r => r.cardType === 'health_trend').length;
  const vaccineShares = history.filter(r => r.cardType === 'vaccine').length;
  const achievementShares = history.filter(r => r.cardType === 'achievement').length;

  try {
    const referrals = await api.get<ReferralRecord[]>('/api/referrals')
    return {
      totalShares: history.length,
      foodShares,
      trendShares,
      vaccineShares,
      achievementShares,
      totalInvites: referrals.length,
      successfulInvites: referrals.filter(r => r.rewardGranted).length,
    };
  } catch {
    return {
      totalShares: history.length,
      foodShares,
      trendShares,
      vaccineShares,
      achievementShares,
      totalInvites: 0,
      successfulInvites: 0,
    };
  }
}

export async function processReferral(
  inviteCode: string,
  newUserId: string
): Promise<boolean> {
  try {
    await api.post('/api/referrals/process', {
      invite_code: inviteCode,
      invitee_id: newUserId,
    });
    return true;
  } catch {
    return false;
  }
}

/** 待处理邀请码的本地存储 key（启动参数带入，登录成功后消费） */
export const PENDING_INVITE_CODE_KEY = 'xhh_pending_invite_code'

/**
 * 登录成功后消费待处理邀请码，建立推荐关系（邀请裂变链路）
 * @param userId - 当前登录用户 ID
 */
export async function processPendingReferral(userId: string): Promise<void> {
  try {
    const code = Taro.getStorageSync(PENDING_INVITE_CODE_KEY)
    if (!code || typeof code !== 'string') return
    // 仅在服务端确认建立推荐关系后清除；网络失败（processReferral 返回 false）保留供下次重试
    const ok = await processReferral(code, userId)
    if (ok) {
      Taro.removeStorageSync(PENDING_INVITE_CODE_KEY)
    }
  } catch {
    // 处理失败保留邀请码，下次登录再试
  }
}

export function getLocalShareHistory(): ShareRecord[] {
  return Taro.getStorageSync(SHARE_HISTORY_KEY) || [];
}

export function clearLocalShareHistory(): void {
  Taro.removeStorageSync(SHARE_HISTORY_KEY);
}

export async function grantShareReward(userId: string): Promise<ShareRewardResult> {
  try {
    const result = await api.post<{
      success?: boolean;
      rewardType?: string;
      rewardValue?: number;
      error?: string;
    }>('/api/shares/grant-reward')

    if (result.success) {
      return {
        rewardGranted: true,
        rewardType: (result.rewardType as 'membership_days' | 'feature_unlock' | 'none') || 'membership_days',
        rewardValue: result.rewardValue || 7,
        message: `邀请${SHARE_REWARD_INVITES}位好友，奖励7天会员`,
      };
    }

    return {
      rewardGranted: false,
      rewardType: 'none',
      rewardValue: 0,
      message: (result as { error?: string }).error || '奖励发放失败',
    };
  } catch {
    return {
      rewardGranted: false,
      rewardType: 'none',
      rewardValue: 0,
      message: '网络异常，请稍后重试',
    };
  }
}
