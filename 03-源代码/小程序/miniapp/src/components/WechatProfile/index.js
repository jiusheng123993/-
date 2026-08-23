/* global Component */
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
 *     - chooseavatar: 用户选择头像后触发，detail = { avatarUrl }
 *                     avatarUrl 有值 = 微信 chooseAvatar 选的临时路径；
 *                     avatarUrl 为空串 = 用户点了"从相册选自定义图"，
 *                     页面侧需回退到相册选图（项目统一走 chooseImageWithPrivacy）
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
      // 微信原生 chooseAvatar 回调：e.detail.avatarUrl 是临时文件路径（仅微信头像可选）
      this.triggerEvent('chooseavatar', { avatarUrl: e.detail.avatarUrl })
    },
    // 自定义头像：从手机相册选图（微信不允许 chooseAvatar 面板选相册图，需单独入口）。
    // 复用 chooseavatar 事件通道（avatarUrl 传空串），页面侧 handleChooseAvatar
    // 已有"空值→相册选图"的回退逻辑（chooseImageWithPrivacy 处理隐私授权与 errno 112），
    // 这样两个使用页（绑定页/资料页）无需新增事件绑定。
    onChooseFromAlbum() {
      this.triggerEvent('chooseavatar', { avatarUrl: '' })
    },
    onNickInput(e) {
      this.triggerEvent('nickchange', { value: e.detail.value })
    },
  },
})
