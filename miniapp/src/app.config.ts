export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/emergency/index',
    'pages/login/index',
    'pages/calendar/index',
    'pages/mood/index',
    'pages/profile/index'
  ],
  subPackages: [
    {
      root: 'packageEmergency',
      name: 'emergency',
      pages: [
        'pages/followup/index'
      ]
    },
    {
      root: 'packageProfile',
      name: 'profile',
      pages: [
        'pages/settings/index'
      ]
    },
    {
      root: 'packageCommunity',
      name: 'community',
      pages: [
        'pages/treehole/index'
      ]
    }
  ],
  preloadRule: {
    'pages/emergency/index': {
      network: 'all',
      packages: ['emergency']
    },
    'pages/profile/index': {
      network: 'all',
      packages: ['profile']
    }
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '星寰海',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#7c4dff',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/calendar/index',
        text: '日历',
        iconPath: 'assets/tabbar/calendar.png',
        selectedIconPath: 'assets/tabbar/calendar-active.png'
      },
      {
        pagePath: 'pages/mood/index',
        text: '记录',
        iconPath: 'assets/tabbar/mood.png',
        selectedIconPath: 'assets/tabbar/mood-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  },
  permission: {
    'scope.userInfo': {
      desc: '你的信息将用于完善个人资料'
    }
  }
})
