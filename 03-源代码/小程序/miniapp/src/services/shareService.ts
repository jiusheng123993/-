import Taro from '@tarojs/taro';
import { supabaseClient } from './supabaseClient';
import {
  INVITE_CODE_LENGTH,
  INVITE_CODE_MAX_USE,
  SHARE_REWARD_INVITES,
} from '../constants';
import { getEdgeFunctionUrl } from '../config/supabase';
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

  const result = await supabaseClient.select<InviteCode>(
    'invite_codes',
    { user_id: `eq.${userId}` }
  );
  if (result.data && result.data.length > 0) {
    Taro.setStorageSync(INVITE_CODE_KEY, result.data[0].code);
    return result.data[0].code;
  }

  const code = generateInviteCode();
  await supabaseClient.insert(
    'invite_codes',
    { code, user_id: userId, use_count: 0, max_use_count: INVITE_CODE_MAX_USE }
  );
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

  const result = await supabaseClient.insert(
    'share_records',
    {
      user_id: userId,
      card_type: cardType,
      pet_id: petId,
      platform,
      invite_code: inviteCode,
    }
  );

  const record = (result.data as ShareRecord[] | null)?.[0] || null;

  const history: ShareRecord[] = Taro.getStorageSync(SHARE_HISTORY_KEY) || [];
  if (record) {
    history.push(record);
    Taro.setStorageSync(SHARE_HISTORY_KEY, history);
  }

  return record;
}

export async function getShareStats(userId: string): Promise<ShareStats> {
  const history: ShareRecord[] = Taro.getStorageSync(SHARE_HISTORY_KEY) || [];

  const foodShares = history.filter(r => r.cardType === 'food').length;
  const trendShares = history.filter(r => r.cardType === 'health_trend').length;
  const vaccineShares = history.filter(r => r.cardType === 'vaccine').length;
  const achievementShares = history.filter(r => r.cardType === 'achievement').length;

  const referralsResult = await supabaseClient.select<ReferralRecord>(
    'referral_records',
    { inviter_id: `eq.${userId}` }
  );

  const referrals = referralsResult.data || [];

  return {
    totalShares: history.length,
    foodShares,
    trendShares,
    vaccineShares,
    achievementShares,
    totalInvites: referrals.length,
    successfulInvites: referrals.filter(r => r.rewardGranted).length,
  };
}

export async function processReferral(
  inviteCode: string,
  newUserId: string
): Promise<boolean> {
  const codeResult = await supabaseClient.selectOne<InviteCode>(
    'invite_codes',
    { code: `eq.${inviteCode}` }
  );

  if (!codeResult.data || codeResult.data.useCount >= codeResult.data.maxUseCount) {
    return false;
  }

  await supabaseClient.insert(
    'referral_records',
    {
      inviter_id: codeResult.data.userId,
      invitee_id: newUserId,
      invite_code: inviteCode,
      reward_granted: false,
    }
  );

  await supabaseClient.update(
    'invite_codes',
    { use_count: codeResult.data.useCount + 1 },
    { code: `eq.${inviteCode}` }
  );

  return true;
}

export function getLocalShareHistory(): ShareRecord[] {
  return Taro.getStorageSync(SHARE_HISTORY_KEY) || [];
}

export function clearLocalShareHistory(): void {
  Taro.removeStorageSync(SHARE_HISTORY_KEY);
}

export async function grantShareReward(userId: string): Promise<ShareRewardResult> {
  try {
    const token = Taro.getStorageSync('xhh_token');

    const res = await Taro.request({
      url: getEdgeFunctionUrl('share-grant-reward'),
      method: 'POST',
      data: {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.statusCode === 200 && res.data?.success) {
      return {
        rewardGranted: true,
        rewardType: res.data.rewardType || 'membership_days',
        rewardValue: res.data.rewardValue || 7,
        message: `邀请${SHARE_REWARD_INVITES}位好友，奖励7天会员`,
      };
    }

    if (res.statusCode === 200 && res.data?.error) {
      return {
        rewardGranted: false,
        rewardType: 'none',
        rewardValue: 0,
        message: res.data.error as string,
      };
    }

    return {
      rewardGranted: false,
      rewardType: 'none',
      rewardValue: 0,
      message: '奖励发放失败',
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
