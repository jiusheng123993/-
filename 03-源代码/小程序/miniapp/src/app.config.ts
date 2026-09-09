export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/pet-profile/index',
    'pages/timeline/index',
    'pages/family/index',
    'pages/mine/index',
  ],
  window: {
    navigationBarBackgroundColor: '#FFF6EE',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '星河宠记',
    backgroundColor: '#FFF6EE',
    backgroundTextStyle: 'light',
  },
  tabBar: {
    color: '#B69B83',
    selectedColor: '#FF6B3D',
    backgroundColor: '#FFFFFF',
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
        text: '宠物',
        iconPath: 'assets/icons/pet.png',
        selectedIconPath: 'assets/icons/pet-active.png',
      },
      {
        pagePath: 'pages/timeline/index',
        text: '时光',
        iconPath: 'assets/icons/timeline.png',
        selectedIconPath: 'assets/icons/timeline-active.png',
      },
      {
        pagePath: 'pages/family/index',
        text: '家庭',
        iconPath: 'assets/icons/family.png',
        selectedIconPath: 'assets/icons/family-active.png',
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
        'health-report/index',
        'grief/index',
        'hospital/index',
        'chronic-tracking/index',
        'feeding-advice/index',
        'naming/index',
        'family/dashboard/index',
        'family/calendar/index',
        'family/lineage/index',
        'memoir-center/index',
        'memoir-daily/index',
        'memoir-vlog/index',
        'family/feed/index',
        'share-card/index',
        'leaderboard/index',
        'weekly-report/index',
        'yearly-review/index',
        'family-tree/index',
        'achievement/index',
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
        'effect-tracking/index',
        'memory/index',
        'feedback/index',
        // 主包瘦身：登录页/会员中心页原在主包，迁入分包后主包体积降至 1.5M 以下（微信上传代码质量要求）
        'member/index',
        'login/index',
        // 登录后引导绑定微信头像昵称页（chooseAvatar + nickname 官方能力）
        'bind-wechat/index',
      ],
    },
  ],
  // 分包预下载：WiFi 环境进入首页后空闲预拉分包，缩短首次进入分包页的路由耗时
  // （连点触发 routeDone 竞态的根因级缓解；选 wifi 不消耗用户蜂窝流量）。
  // ⚠️ 微信硬限制：单条 preloadRule 预载包合计 ≤ 2MB（上传校验报错码 80058）。
  // 实测 dist 体积：pagesPet 1911KB + pagesUser 873KB 合计经微信计重 ≈2931KB 超限，
  // 故本规则仅保留 pagesUser（873KB 余量充足）；pagesPet 待后续瘦身
  //（如 preset 图片外移/压缩）后再追加预载，切勿直接加回以免再次卡上传。
  preloadRule: {
    'pages/index/index': { network: 'wifi', packages: ['pagesUser'] },
  },
  // 开启"组件按需注入"：微信代码质量检查要求主包启用 lazyCodeLoading，
  // 否则上传时该项"未通过"。开启后页面组件按需加载，也能顺带减小首包体积。
  lazyCodeLoading: 'requiredComponents',
  __usePrivacyCheck__: true,
})
