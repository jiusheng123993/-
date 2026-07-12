# 星寰海小程序 - T3任务技术方案

## 任务概述
实现完整的紧急入口和状态机，包括首页UI、EmergencyEngine状态机、Zustand Store、Hook、Service和数据定义。

## 技术方案

### 1. EmergencyEngine 状态机增强
- 位置: `src/engines/emergency/EmergencyEngine.ts`
- 新增功能:
  - 完整状态转换逻辑（idle → entry → naming → writing → action → connect → closing → completed）
  - 步骤配置加载方法
  - 危机检测集成
  - 会话恢复支持

### 2. emergencyStore 完善
- 位置: `src/stores/emergencyStore.ts`
- 已有基础实现，需增强:
  - 与EmergencyEngine同步
  - 持久化到memory-body
  - 错误处理

### 3. useEmergency Hook 完善
- 位置: `src/hooks/useEmergency.ts`
- 已有基础实现，需增强:
  - 连接EmergencyEngine和Zustand store
  - 返回完整接口

### 4. emergencyService 实现
- 位置: `src/services/emergencyService.ts`
- 实现真实API调用:
  - createEmergencySession(flowId, preIntensity)
  - updateEmergencyStep(sessionId, step, content)
  - completeEmergencySession(sessionId, postIntensity)

### 5. emergencyFlows 数据定义（新建）
- 位置: `src/data/emergencyFlows.ts`
- 定义5条急救流程:
  - sad（难过）: 命名→书写→行动→连接→收尾
  - anxious（焦虑）: 身体→书写→区分→控制圈→收尾
  - tired（累）: 允许→归因→行动→收尾
  - lonely（孤独）: 接住→连接→互动→收尾
  - unclear（说不出来）: 接住→非语言→回应→感官→收尾

### 6. 首页 UI 完善
- 位置: `src/pages/index/index.tsx` + `index.scss`
- 功能:
  - 全屏"你怎么了？"问题
  - 5个情绪选项按钮（带颜色心理学背景）
  - 点击导航到紧急流程

### 7. 紧急页面骨架
- 位置: `src/pages/emergency/index.tsx` + `index.scss`
- 功能:
  - 显示当前步骤标题和组件
  - 进度指示器（步骤X / 总数）
  - 下一步/上一步按钮
  - 危机检测集成

## 文件清单

### 更新文件:
1. `src/engines/emergency/EmergencyEngine.ts` - 增强状态机
2. `src/engines/emergency/types.ts` - 添加缺失类型
3. `src/stores/emergencyStore.ts` - 完善实现
4. `src/hooks/useEmergency.ts` - 完善实现
5. `src/services/emergencyService.ts` - 实现API调用
6. `src/pages/index/index.tsx` - 完整首页UI
7. `src/pages/index/index.scss` - 首页样式
8. `src/pages/emergency/index.tsx` - 紧急页面骨架
9. `src/pages/emergency/index.scss` - 紧急页面样式

### 新建文件:
1. `src/data/emergencyFlows.ts` - 5条急救流程配置

## 验收标准
- 首页显示"你怎么了？"和5个情绪按钮
- 点击按钮启动紧急流程，传递正确的flowId
- 状态机正确转换状态
- 每个步骤显示适当UI
- 危机检测触发危险关键词
- 会话数据保存到memory-body
- 可中途退出并恢复
