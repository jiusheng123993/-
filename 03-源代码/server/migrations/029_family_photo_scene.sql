-- 029: 全家福照片表加 scene 场景列（2026-08-24）
-- 用户可在特定场景（客厅/海边/圣诞树等）生成全家福，记录每张照片所用场景，
-- 相册据此展示"在哪个场景拍的"标签
-- 幂等：IF NOT EXISTS，可重复执行；可空 TEXT：上传/手绘照片无场景语义，存 NULL
ALTER TABLE family_photos ADD COLUMN IF NOT EXISTS scene TEXT;
