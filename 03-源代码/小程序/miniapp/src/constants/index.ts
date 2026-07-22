export const APP_VERSION = '1.0.0';
export const HOTLINE_NUMBER = '400-161-9995';
export const INVITE_CODE_LENGTH = 6;
export const INVITE_CODE_MAX_USE = 50;
export const NPS_MIN_SCORE = 0;
export const NPS_MAX_SCORE = 10;
export const NPS_COOLDOWN_DAYS = 30;
export const NPS_DAY7_TRIGGER = 7;
export const NPS_DAY30_TRIGGER = 30;
export const SHARE_REWARD_INVITES = 3;

export const AVATAR_STYLES = {
  q_cute: { label: 'Q萌风', key: 'q_cute' as const },
  japanese_healing: { label: '日系治愈风', key: 'japanese_healing' as const },
  american_cartoon: { label: '美式卡通风', key: 'american_cartoon' as const },
} as const;

export const AVATAR_FREE_GENERATIONS = 1;
export const AVATAR_MEMBER_GENERATIONS = -1;

export const AVATAR_BASE_COLORS = [
  { label: '暖黄', value: '#FFD93D' },
  { label: '奶白', value: '#FFF8E7' },
  { label: '浅棕', value: '#D4A574' },
  { label: '深棕', value: '#8B6914' },
  { label: '灰色', value: '#B0B0B0' },
  { label: '黑色', value: '#333333' },
  { label: '橘色', value: '#FF8C42' },
  { label: '奶油', value: '#FFFDD0' },
] as const;

export const ACHIEVEMENT_TYPES = {
  birthday: { title: '生日快乐', subtitle: '毛孩子又长大一岁啦', icon: '🎂', color: '#FF6B9D' },
  vaccine_complete: { title: '疫苗卫士', subtitle: '全部疫苗接种完成', icon: '🛡️', color: '#52C41A' },
  streak_7: { title: '坚持一周', subtitle: '连续打卡7天', icon: '🔥', color: '#FF8C42' },
  streak_30: { title: '月度之星', subtitle: '连续打卡30天', icon: '⭐', color: '#FAAD14' },
  streak_100: { title: '百日守护', subtitle: '连续打卡100天', icon: '💎', color: '#722ED1' },
  rainbow_bridge: { title: '彩虹桥纪念', subtitle: '永远在心中', icon: '🌈', color: '#B37FEB' },
  holiday: { title: '节日快乐', subtitle: '和毛孩子一起过节', icon: '🎄', color: '#F5222D' },
} as const;
