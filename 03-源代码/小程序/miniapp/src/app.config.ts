export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/pet-profile/index',
    'pages/member/index',
    'pages/mine/index',
    'pages/login/index'
  ],
  subPackages: [
    {
      root: 'pagesPet',
      pages: [
        'add/index',
        'edit/index',
        'checkin/index',
        'food-query/index',
        'vaccine/index',
        'symptom-check/index',
        'trends/index',
        'breed/index',
        'breed-detail/index',
        'avatar-customize/index',
        'diary/index'
      ]
    },
    {
      root: 'pagesUser',
      pages: [
        'profile/index',
        'onboarding/index',
        'settings/index',
        'invite/index',
        'agreement/index'
      ]
    }
  ],
  tabBar: {
    color: '#8C8C8C',
    selectedColor: '#FF8C42',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/pet-profile/index',
        text: '我的宠物',
        iconPath: 'assets/tabbar/calendar.png',
        selectedIconPath: 'assets/tabbar/calendar-active.png'
      },
      {
        pagePath: 'pages/member/index',
        text: '会员',
        iconPath: 'assets/tabbar/health.png',
        selectedIconPath: 'assets/tabbar/health-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f7f4ed',
    navigationBarTitleText: '星寰海',
    navigationBarTextStyle: 'black'
  },
  __usePrivacyCheck__: true
})
