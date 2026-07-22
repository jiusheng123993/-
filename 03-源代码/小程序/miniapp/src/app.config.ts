export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/pet-profile/index',
    'pages/member/index',
    'pages/mine/index',
    'pages/login/index',
  ],
  window: {
    navigationBarBackgroundColor: '#F5F7FA',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '星寰海',
    backgroundColor: '#F5F7FA',
    backgroundTextStyle: 'light',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#4A90D9',
    backgroundColor: '#FFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png',
      },
      {
        pagePath: 'pages/pet-profile/index',
        text: '我的宠物',
        iconPath: 'assets/icons/pet.png',
        selectedIconPath: 'assets/icons/pet-active.png',
      },
      {
        pagePath: 'pages/member/index',
        text: '会员',
        iconPath: 'assets/icons/member.png',
        selectedIconPath: 'assets/icons/member-active.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/icons/mine.png',
        selectedIconPath: 'assets/icons/mine-active.png',
      },
    ],
  },
  subPackages: [
    {
      root: 'pagesPet',
      pages: [
        'add/index',
        'edit/index',
        'breed/index',
        'breed-detail/index',
        'checkin/index',
        'diary/index',
        'food-query/index',
        'symptom-check/index',
        'trends/index',
        'vaccine/index',
        'avatar-customize/index',
      ],
    },
    {
      root: 'pagesUser',
      pages: [
        'profile/index',
        'settings/index',
        'onboarding/index',
        'agreement/index',
        'invite/index',
      ],
    },
  ],
  __usePrivacyCheck__: true,
})