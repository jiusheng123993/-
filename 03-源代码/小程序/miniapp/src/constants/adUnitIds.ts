export const AD_UNIT_IDS = {
  BANNER_HOME: '',
  BANNER_FAMILY: '',
  BANNER_TIMELINE: '',
  BANNER_MINE: '',
  BANNER_HOSPITAL: '',
  BANNER_PRODUCT: '',

  REWARDED_VIDEO_AVATAR: '',
  REWARDED_VIDEO_REPORT: '',
  REWARDED_VIDEO_ANALYSIS: '',

  INTERSTITIAL_PAGE_SWITCH: '',
  INTERSTITIAL_HOSPITAL_NAV: '',
  INTERSTITIAL_PRODUCT_CLICK: '',
} as const

export type AdUnitId = typeof AD_UNIT_IDS[keyof typeof AD_UNIT_IDS]

export const AD_SCENE_CONFIG = {
  home: { banner: AD_UNIT_IDS.BANNER_HOME },
  family: { banner: AD_UNIT_IDS.BANNER_FAMILY },
  timeline: { banner: AD_UNIT_IDS.BANNER_TIMELINE },
  mine: { banner: AD_UNIT_IDS.BANNER_MINE },
  hospital: {
    banner: AD_UNIT_IDS.BANNER_HOSPITAL,
    interstitialNav: AD_UNIT_IDS.INTERSTITIAL_HOSPITAL_NAV,
  },
  product: {
    banner: AD_UNIT_IDS.BANNER_PRODUCT,
    interstitialClick: AD_UNIT_IDS.INTERSTITIAL_PRODUCT_CLICK,
  },
  avatar: { rewardedVideo: AD_UNIT_IDS.REWARDED_VIDEO_AVATAR },
  report: { rewardedVideo: AD_UNIT_IDS.REWARDED_VIDEO_REPORT },
  analysis: { rewardedVideo: AD_UNIT_IDS.REWARDED_VIDEO_ANALYSIS },
} as const