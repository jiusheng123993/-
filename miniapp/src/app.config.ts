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
    navigationBarBackgroundColor: '#f7f4ed',
    navigationBarTitleText: '星寰海',
    navigationBarTextStyle: 'black'
  }
})
