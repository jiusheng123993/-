/** 绑定微信头像昵称页配置 */
export default definePageConfig({
  navigationBarTitleText: '绑定微信头像昵称',
  enablePullDownRefresh: false,
  // 引入微信原生组件（chooseAvatar + nickname 能力，Taro 3.6 编译层不支持这两个属性，
  // 必须用原生组件绕开，否则 errno 112 / 属性丢失），与个人资料页共用同一组件
  usingComponents: {
    'wechat-profile': '../../components/WechatProfile/index',
  }
})
