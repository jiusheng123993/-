export type ShareCardType = 'food' | 'health_trend' | 'vaccine';

export interface ShareRecord {
  id: string;
  userId: string;
  cardType: ShareCardType;
  petId: string;
  sharedAt: string;
  platform: string;
  inviteCode: string;
}

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
  totalInvites: number;
  successfulInvites: number;
}

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
