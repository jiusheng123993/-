# 模块锁目录

用于管理多窗口并行开发时的模块锁定状态。

## 锁文件格式

每个模块一个锁文件，文件名格式：`{模块名}.lock`

```json
{
  "module": "auth-module",
  "lockedBy": "session-123",
  "lockedAt": "2026-07-01T10:30:00Z",
  "expectedEnd": "2026-07-01T12:00:00Z",
  "status": "locked",
  "description": "用户认证模块开发"
}
```

## 锁状态

- `locked`: 已锁定，其他窗口禁止开发此模块
- `unlocked`: 已释放，可重新锁定
- `completed`: 已完成，锁已失效

## 使用规则

1. 开发前必须先检查锁状态
2. 锁定模块时创建锁文件
3. 开发完成后删除锁文件或更新状态为 completed
4. 锁超时后自动失效（默认 2 小时）