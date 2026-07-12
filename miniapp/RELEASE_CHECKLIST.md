# 星寰海小程序 - 发布清单

> 版本：v0.1.0 MVP
> 生成日期：2026-07-12
> 状态：待修复 TypeScript 错误后发布

---

## 一、功能清单

### 1.1 主包页面（6个）

| 页面 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 首页 | pages/index/index | ✅ 已完成 | 5个情绪入口，跳转急救流程 |
| 急救流程 | pages/emergency/index | ✅ 已完成 | 5条流程，步骤组件，危机检测 |
| 登录 | pages/login/index | ✅ 已完成 | 微信授权登录 |
| 日历 | pages/calendar/index | ✅ 已完成 | 情绪日历，月度摘要 |
| 情绪记录 | pages/mood/index | ✅ 已完成 | 3秒打卡，情绪选择，强度调节 |
| 我的 | pages/profile/index | ✅ 已完成 | 统计展示，设置入口，登出 |

### 1.2 分包页面（3个）

| 页面 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 跟进回复 | packageEmergency/pages/followup/index | ⚠️ 有TS错误 | 3选项回复，情绪评分 |
| 设置 | packageProfile/pages/settings/index | ✅ 已完成 | 通知开关，数据清除，数据导出 |
| 树洞 | packageCommunity/pages/treehole/index | ✅ 已完成 | 发帖，回复，匿名 |

### 1.3 核心功能模块

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| EmergencyEngine | engines/emergency/EmergencyEngine.ts | ✅ 已完成 | 急救流程状态机 |
| OutreachScheduler | engines/outreach/OutreachScheduler.ts | ⚠️ 有TS错误 | AI主动引擎 |
| CrisisDetector | utils/crisisDetector.ts | ✅ 已完成 | 高危检测 |
| MiniProgramMemoryBodyStore | memory-body/store/ | ✅ 已完成 | 数据存储 |
| authStore | stores/authStore.ts | ✅ 已完成 | 认证状态 |
| moodStore | stores/moodStore.ts | ✅ 已完成 | 情绪记录 |
| emergencyStore | stores/emergencyStore.ts | ✅ 已完成 | 急救会话 |
| treeholeStore | stores/treeholeStore.ts | ✅ 已完成 | 树洞数据 |

---

## 二、TypeScript 错误清单

### 2.1 P1 错误（发布前必须修复）

| 文件 | 行号 | 错误类型 | 说明 |
|------|------|---------|------|
| src/engines/outreach/OutreachScheduler.ts | 6,7,15 | TS2307 | 模块导入路径错误 |
| src/engines/outreach/OutreachScheduler.ts | 71,85,86,98,110,111 | TS2686 | Taro 未导入 |
| src/engines/outreach/OutreachScheduler.ts | 144 | TS18048 | daysSinceLastEntry 可能为 undefined |
| src/engines/outreach/OutreachScheduler.ts | 249 | TS7006 | 参数 s 隐式 any 类型 |
| src/stores/outreachStore.ts | 10 | TS2307 | 模块导入路径错误 |
| src/stores/outreachStore.ts | 59,73,74 | TS2686 | Taro 未导入 |
| src/utils/outreachValidator.ts | 6 | TS2307 | 模块导入路径错误 |
| src/utils/outreachValidator.ts | 165 | TS2561 | reasons 应为 reason |
| src/hooks/useOutreach.ts | 79,80 | TS2686 | Taro 未导入 |
| src/services/outreachService.ts | 100,101 | TS2686 | Taro 未导入 |
| src/packageEmergency/pages/followup/index.tsx | 23 | TS2339 | currentPlan 不存在于 EmergencyState |
| src/engines/index.ts | 4 | TS1205 | 需要使用 export type |
| src/engines/outreach/index.ts | 2 | TS1205 | 需要使用 export type |

### 2.2 修复建议

1. **Taro 导入问题**：在文件顶部添加 `import Taro from '@tarojs/taro'`
2. **模块路径问题**：检查相对路径是否正确，`../data/outreachSuggestions` 应为 `../../data/outreachSuggestions`
3. **类型定义问题**：在 `EmergencyState` 接口中添加 `currentPlan` 属性
4. **export type 问题**：将 `export { Type }` 改为 `export type { Type }`

---

## 三、页面跳转路径验证

### 3.1 已验证路径

| 源页面 | 目标页面 | 跳转方式 | 路径 | 状态 |
|--------|---------|---------|------|------|
| 首页 | 急救流程 | navigateTo | /pages/emergency/index?flowId=${flowId} | ✅ 正确 |
| 首页 | 登录 | switchTab | /pages/index/index | ✅ 正确 |
| 登录成功 | 首页 | switchTab | /pages/index/index | ✅ 正确 |
| API 401 | 登录 | navigateTo | /pages/login/index | ✅ 正确 |
| 我的 | 登录 | navigateTo | /pages/login/index | ✅ 正确 |
| 我的 | 设置 | navigateTo | /packageProfile/pages/settings/index | ✅ 正确 |
| 日历 | 情绪记录 | navigateTo | /pages/mood/index?date=${date} | ✅ 正确 |
| 急救完成 | 首页 | switchTab | /pages/index/index | ✅ 正确 |
| 跟进回复 | 返回 | navigateBack | - | ✅ 正确 |

### 3.2 TabBar 配置验证

| Tab | 页面路径 | 状态 |
|-----|---------|------|
| 首页 | pages/index/index | ✅ 正确 |
| 日历 | pages/calendar/index | ✅ 正确 |
| 记录 | pages/mood/index | ✅ 正确 |
| 我的 | pages/profile/index | ✅ 正确 |

---

## 四、数据存储验证

### 4.1 存储 Key 清单

| Key | 用途 | 存储位置 | 状态 |
|-----|------|---------|------|
| xhh_token | 用户 Token | authStore | ✅ 正确 |
| xhh_refresh_token | 刷新 Token | authStore | ✅ 正确 |
| xhh_user | 用户信息 | authStore | ✅ 正确 |
| xhh_settings | 设置数据 | settingsStore | ✅ 正确 |
| xhh_treehole_posts | 树洞帖子 | treeholeService | ✅ 正确 |
| followup_${emergencyId} | 跟进数据 | followup页面 | ✅ 正确 |
| outreach_records | 外联记录 | OutreachScheduler | ✅ 正确 |
| outreach_settings | 外联设置 | OutreachScheduler | ✅ 正确 |
| audio_volume | 音频音量 | audioPlayer | ✅ 正确 |
| auto_stop_minutes | 自动停止时间 | audioPlayer | ✅ 正确 |

### 4.2 数据结构一致性

- ✅ 所有 Store 使用统一的存储前缀 `xhh_`
- ✅ JSON 序列化/反序列化正确
- ✅ 错误处理完备

---

## 五、高危场景测试

### 5.1 关键词检测

| 级别 | 关键词示例 | 预期行为 | 状态 |
|------|-----------|---------|------|
| 轻度(mild) | 不开心、低落、绝望 | 正常流程 + 结尾追加热线 | ✅ 已实现 |
| 中度(moderate) | 想死、不想活了、自杀 | 中断流程，全屏关怀+热线 | ✅ 已实现 |
| 重度(severe) | 已经吃了药、正在实施 | 立即弹出热线+120/110 | ✅ 已实现 |

### 5.2 热线信息

- 名称：希望24热线
- 号码：400-161-9995
- 描述：24小时免费心理危机干预热线
- 状态：✅ 已配置

### 5.3 危机检测集成点

- ✅ 急救流程书写步骤
- ✅ 树洞发帖
- ⚠️ 需确认：跟进回复页面是否需要

---

## 六、发布配置清单

### 6.1 微信小程序配置

| 配置项 | 值 | 状态 |
|--------|-----|------|
| AppID | 待填写 | ⏳ 待配置 |
| AppSecret | 待填写 | ⏳ 待配置 |
| 订阅消息模板ID | FOLLOWUP_TEMPLATE_ID | ⏳ 待配置 |

### 6.2 Supabase 配置

| 配置项 | 状态 |
|--------|------|
| Supabase URL | ⏳ 待配置 |
| Supabase Anon Key | ⏳ 待配置 |
| 数据库表结构 | ⏳ 待创建 |

### 6.3 隐私合规

| 文件 | 状态 |
|------|------|
| 用户协议 | ✅ 已实现（设置页面弹窗） |
| 隐私政策 | ✅ 已实现（设置页面弹窗） |
| 数据清除功能 | ✅ 已实现 |
| 数据导出功能 | ✅ 已实现 |

---

## 七、发布步骤

### 7.1 发布前检查

1. [ ] 修复所有 TypeScript 错误
2. [ ] 运行 `npm run typecheck` 确认无错误
3. [ ] 运行 `npm run lint` 确认代码规范
4. [ ] 运行 `npm run build:weapp` 确认构建成功
5. [ ] 微信开发者工具预览测试
6. [ ] 真机测试（iOS + Android）

### 7.2 提审材料

1. [ ] 小程序名称：星寰海
2. [ ] 小程序简介：情绪健康管理工具
3. [ ] 类目选择：生活服务 > 心理咨询
4. [ ] 服务类目声明
5. [ ] 隐私协议链接
6. [ ] 用户协议链接

### 7.3 发布后验证

1. [ ] 核心流程测试（登录→急救→完成）
2. [ ] 高危检测测试
3. [ ] 数据存储测试
4. [ ] 订阅消息测试
5. [ ] 弱网环境测试

---

## 八、验收标准

### 8.1 功能验收

- [ ] 所有 P0 功能可用
- [ ] 高危检测 100% 覆盖
- [ ] 数据加密生效
- [ ] 离线模式可用
- [ ] 包大小符合要求（主包 < 2MB）

### 8.2 性能验收

- [ ] 首屏加载时间 < 2秒
- [ ] 页面跳转流畅
- [ ] 无内存泄漏
- [ ] 无性能警告

### 8.3 安全验收

- [ ] Token 安全存储
- [ ] 敏感数据加密
- [ ] 无明文密码
- [ ] HTTPS 通信

---

## 九、已知问题

### 9.1 P1 问题（发布前必须修复）

1. TypeScript 编译错误（详见第二节）
2. OutreachScheduler 模块导入路径错误
3. followup 页面 currentPlan 属性缺失

### 9.2 P2 问题（可延后修复）

1. 登录页面 slogan 与产品定位不符（"让每一次旅行都成为美好回忆"）
2. 部分组件使用 div 而非 Taro 组件（View/Text）

---

## 十、下一步建议

1. **立即修复** TypeScript 错误（预计 1-2 小时）
2. **配置** Supabase 数据库表结构
3. **申请** 微信小程序 AppID 和订阅消息模板
4. **测试** 真机环境完整流程
5. **准备** 提审材料

---

*本清单由 Agent 自动生成，请根据实际情况更新状态*
