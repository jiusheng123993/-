/**
 * 微信原生组件：头像 + 昵称（跟随微信）
 *
 * 为什么需要原生组件：Taro 3.6 编译层不支持 chooseAvatar / showNicknameAccessory
 * 这两个微信原生属性（openType 白名单只有 share/getPhoneNumber 等少数几个，
 * Input 属性表没有 showNicknameAccessory），即使 JSX 传了也会被模板丢弃。
 * 因此这里直接用微信原生 wxml 实现，事件通过 triggerEvent 回传给 Taro 页面。
 *
 * 组件对外接口：
 *   properties:
 *     - nickname: string    当前昵称
 *     - avatar: string      当前头像 URL
 *   events:
 *     - chooseavatar: 用户选择微信头像后触发，detail = { avatarUrl }
 *     - nickchange:   昵称输入变化，detail = { value }
 */
Component({
  properties: {
    nickname: { type: String, value: '' },
    avatar: { type: String, value: '' },
  },
  data: {},
  methods: {
    onChooseAvatar(e) {
      // 微信原生 chooseAvatar 回调：e.detail.avatarUrl 是临时文件路径
      this.triggerEvent('chooseavatar', { avatarUrl: e.detail.avatarUrl })
    },
    onNickInput(e) {
      this.triggerEvent('nickchange', { value: e.detail.value })
    },
  },
})
