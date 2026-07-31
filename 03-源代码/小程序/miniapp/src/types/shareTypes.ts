/** 分享卡片类型 */
export type ShareCardType = 'food' | 'health_trend' | 'vaccine' | 'achievement';

/** 分享记录 */
export interface ShareRecord {
  id: string;
  userId: string;
  cardType: ShareCardType;
  petId: string;
  sharedAt: string;
  platform: string;
  inviteCode: string;
}

/** 邀请码 */
export interface InviteCode {
  code: string;
  userId: string;
  createdAt: string;
  useCount: number;
  maxUseCount: number;
}

export interface ReferralRecord {
  id: string;
  inviterId: string;
  inviteeId: string;
  inviteCode: string;
  registeredAt: string;
  rewardGranted: boolean;
}

export interface ShareStats {
  totalShares: number;
  foodShares: number;
  trendShares: number;
  vaccineShares: number;
  achievementShares: number;
  totalInvites: number;
  successfulInvites: number;
}

/** 健康趋势分享数据 */
export interface HealthTrendShareData {
  petName: string;
  petAvatar: string;
  dateRange: string;
  trendSummary: string;
  aiInsight: string;
}

export interface VaccineShareData {
  petName: string;
  petAvatar: string;
  vaccineName: string;
  completedDate: string;
  badgeTitle: string;
}

/** 成就分享数据 */
export interface AchievementShareData {
  petName: string;
  petAvatar: string;
  achievementType: string;
  achievementTitle: string;
  achievementSubtitle: string;
  achievementIcon: string;
}

export interface ShareRewardResult {
  rewardGranted: boolean;
  rewardType: 'membership_days' | 'feature_unlock' | 'none';
  rewardValue: number;
  message: string;
}
