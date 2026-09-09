-- 034_drop_token_blacklist.sql
-- 清理僵尸表（审查⏳6，用户「没用的直接删除」先例口径）
--
-- 背景：token_blacklist 由迁移 005（audit_and_token，已被生产等价实现取代并归档）创建，
-- 预期承载 JWT 刷新黑名单语义，但全仓代码零引用（refresh 流程从未实现，登录直接签
-- 长效 JWT），生产实测 0 行——纯僵尸表。
--
-- 安全性：表为空（生产实测 COUNT=0），DROP 无数据损失；代码零引用，删除不影响运行。
-- 幂等：IF EXISTS，可重复执行。

DROP TABLE IF EXISTS token_blacklist;
