# 宠物照片上传生成形象 - 设计文档

> 日期：2026-07-24
> 状态：已确认
> 项目：星寰海 AI 宠物管家小程序

---

## 1. 需求概述

用户可拍照或上传宠物照片，系统生成：
- **2D 形象包**：12 种表情 × 6 角度 + 8 动作 × 3 角度 = 96 张 2D 图
- **3D 模型**：.glb 格式，可预览旋转 + 下载

### 用户确认点

| 决策 | 结果 |
|------|------|
| 3D 模型形式 | 真正的 3D 模型文件 + 小程序内渲染预览 |
| 生成模式 | 文字描述 + 参考照片（手动可调参数） |
| 3D 交付 | 小程序内预览旋转 + 下载 .glb |
| 3D 生成路径 | 先 AI 生 2D 多角度图 → 再图生 3D |
| 2D 形象 | 多角度 + 多表情 |
| 技术方案 | 分步异步 + 可中断（方案 B） |
| 表情动作 | 共 12 表情 + 8 动作，一次性全量生成（方案 C） |

---

## 2. 整体架构

```
拍照/上传 → 照片预处理 → 2D 生成(3批异步) → 用户预览 → 触发生成 3D → 3D 预览 + 下载
```

### 2.1 数据流

```
Step 1: 拍照/上传
  → 微信 chooseImage API
  → 上传到 Supabase Storage

Step 2: 2D 多表情+多动作形象包生成
  → 后端 Seedream 以图生图（参考图作为 init_image）
  → 分 3 批：核心表情(24张) → 扩展表情(48张) → 动作(24张)
  → 进度回调/轮询

Step 3: 用户预览 2D 形象包
  → 角度切换 + 表情切换画廊
  → 可保存为头像
  → 手动触发"生成 3D 模型"

Step 4: 3D 模型生成 (Meshy API)
  → 4 张正面角度 2D 图 → Meshy Image-to-3D
  → 异步生成，轮询获取结果
  → 存储到 Supabase Storage

Step 5: 3D 预览 + 下载
  → three.js 加载 .glb 模型
  → 旋转/缩放查看
  → 下载 .glb 文件
```

---

## 3. 前端设计

### 3.1 页面改造：avatar-customize

改造为双 Tab 结构：

- **Tab 1**: 文字描述生成（现有功能保留）
- **Tab 2**: 照片生成（新增）

### 3.2 新增组件

| 组件 | 路径 | 职责 |
|------|------|------|
| `PhotoUploader` | `components/PetAvatar/PhotoUploader.tsx` | 拍照/相册选择 + 图片预览 |
| `ImageGallery` | `components/PetAvatar/ImageGallery.tsx` | 表情+角度切换画廊（12表情 × 6角度 + 8动作 × 3角度） |
| `Model3DViewer` | `components/PetAvatar/Model3DViewer.tsx` | three.js 3D 模型渲染 |
| `GenerationProgress` | `components/PetAvatar/GenerationProgress.tsx` | 2D/3D 生成进度条 |

### 3.3 2D 形象画廊交互

```
┌──────────────────────────────────┐
│  角度选择器（横向滑动）             │
│  [正面] [左侧] [右侧] [背面]       │
│  [45°左] [45°右]                  │
├──────────────────────────────────┤
│         ┌──────────┐             │
│         │          │             │
│         │ 2D 预览  │  ← 当前角度  │
│         │          │    当前表情  │
│         └──────────┘             │
├──────────────────────────────────┤
│  表情/动作选择器（横向滑动）        │
│  😊开心 😢难过 🤩兴奋 😴困倦 🥰爱心 │
│  😎得意 😤生气 🤔思考 😱惊讶 😭哭泣 │
│  🥳庆祝 😜调皮                       │
│  ── 动作 ──                        │
│  🧘坐着 🧍站着 🛌趴着 🦘跳跃 🐾招手 │
│  🍖吃东西 🎾玩球 💤睡觉              │
├──────────────────────────────────┤
│  [保存为头像]  [生成 3D 模型]      │
└──────────────────────────────────┘
```

### 3.4 3D 模型预览

- 引擎：three.js + 微信小程序 WebGL Canvas
- 交互：单指旋转、双指缩放、3 秒无操作自动旋转
- 工具栏：重置视角、截图分享、下载 .glb
- 降级：不支持 WebGL 时显示静态预览图

---

## 4. 后端设计

### 4.1 新增 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/pet/photo/upload` | POST | 上传宠物参考照片 |
| `/api/pet/avatar/generate-2d` | POST | 以图生图，生成多表情+多动作 2D 形象包 |
| `/api/pet/avatar/task/:taskId` | GET | 查询生成任务进度 |
| `/api/pet/avatar/generate-3d` | POST | 基于 2D 多视图生成 3D 模型 |
| `/api/pet/avatar/images` | GET | 获取已生成的 2D 形象包列表 |
| `/api/pet/avatar/model` | GET | 获取已生成的 3D 模型信息 |

### 4.2 新增服务

| 文件 | 职责 |
|------|------|
| `server/src/services/photoUploadService.ts` | 照片上传到 Supabase Storage |
| `server/src/services/image2DService.ts` | Seedream 以图生图，批量生成 |
| `server/src/services/model3DService.ts` | Meshy API 生成 3D 模型 + 轮询 |
| `server/src/services/taskQueue.ts` | 异步任务状态管理 |

### 4.3 数据库新增表

```sql
-- 生成任务表
CREATE TABLE avatar_generation_tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  task_type VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  progress INT DEFAULT 0,
  reference_photo_url TEXT,
  result_data JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2D 形象图片表
CREATE TABLE avatar_2d_images (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES avatar_generation_tasks(id),
  angle VARCHAR(10),
  expression VARCHAR(10),
  image_url TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3D 模型表
CREATE TABLE avatar_3d_models (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES avatar_generation_tasks(id),
  model_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.4 2D 生成批次

| 批次 | 内容 | 数量 | 进度 |
|------|------|------|------|
| 第 1 批 | 4 核心表情 × 6 角度 | 24 张 | 0% → 25% |
| 第 2 批 | 8 扩展表情 × 6 角度 | 48 张 | 25% → 75% |
| 第 3 批 | 8 动作 × 3 角度 | 24 张 | 75% → 100% |

- 12 表情：开心、难过、兴奋、困倦、爱心、得意、生气、思考、惊讶、哭泣、庆祝、调皮
- 8 动作：坐着、站着、趴着、跳跃、招手、吃东西、玩球、睡觉
- 6 角度：正面、左侧、右侧、背面、45°左、45°右

---

## 5. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 照片上传失败 | 重试按钮 + 提示"网络不稳定，请重试" |
| Seedream API 限流 | 队列等待 + 指数退避重试，最多 3 次 |
| 单张图生成失败 | 跳过该图，继续生成其他 |
| 全部图生成失败 | 任务标记 failed，通知用户 |
| 3D 生成失败 | 重试一次，仍失败则提示稍后再试 |
| 用户中途退出页面 | 任务不中断，通过通知告知结果 |
| 再次进入页面 | 检测 pending 任务，恢复轮询 |
| 小程序切后台 | 生成不中断，通知栏弹出结果 |

---

## 6. 成本控制

| 控制项 | 策略 |
|------|------|
| 免费用户 | 限 1 次照片生成（含全部表情+动作），会员无限 |
| 单次生成上限 | 96 张 2D 图 |
| 3D 模型 | 仅会员可用，每月限 3 次 |
| 图片存储 | 生成后保留 30 天，过期自动清理 |

---

## 7. 技术依赖

### 已有依赖（复用）
- Taro 3 + React 18 + TypeScript
- Zustand 状态管理
- Supabase (数据库 + Storage)
- Seedream API (豆包 Seedream 4.0)
- 微信小程序 API (chooseImage, downloadFile, saveFile)

### 新增依赖
- **three.js** + three-platformize（小程序 3D 渲染）
- **Meshy API**（Image-to-3D，https://api.meshy.ai）

---

## 8. 涉及文件清单

### 前端新增
- `src/components/PetAvatar/PhotoUploader.tsx`
- `src/components/PetAvatar/ImageGallery.tsx`
- `src/components/PetAvatar/Model3DViewer.tsx`
- `src/components/PetAvatar/GenerationProgress.tsx`

### 前端改动
- `src/pagesPet/avatar-customize/index.tsx` — 双 Tab 改造
- `src/pagesPet/avatar-customize/index.scss` — 新增样式
- `src/services/avatarService.ts` — 新增照片上传、2D/3D 生成接口
- `src/types/avatarTypes.ts` — 新增类型定义
- `src/stores/petStore.ts` — 新增形象相关状态
- `src/constants/index.ts` — 新增常量

### 后端新增
- `server/src/services/photoUploadService.ts`
- `server/src/services/image2DService.ts`
- `server/src/services/model3DService.ts`
- `server/src/services/taskQueue.ts`

### 后端改动
- `server/src/routes/avatar.ts` — 新增路由
- `server/src/config.ts` — 新增 Meshy API 配置
- `server/src/db.ts` — 新增表迁移