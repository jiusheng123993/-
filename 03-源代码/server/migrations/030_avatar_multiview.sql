-- 迁移 030：全方位角色设定图（multiview sheet）支持
-- 背景：形象生成升级为"一套两张"（头像 + 四视图设定图），设定图用作回忆录/全家福的角色参考图。
-- 1) pet_avatar_library.view_type：区分形象库条目类型（headshot=头像 / multiview=全方位设定图），
--    NOT NULL + DEFAULT 保证历史行自动归为头像，筛选逻辑对老数据天然兼容
-- 2) pet_profiles.avatar_multiview_url：当前生效的全方位设定图（"设为当前"时写入），
--    全家福 collectMemberPhotos 参考图优先级 = 真实照片 > 全方位设定图 > 卡通头像
-- 幂等：IF NOT EXISTS，可重复执行

ALTER TABLE pet_avatar_library ADD COLUMN IF NOT EXISTS view_type TEXT NOT NULL DEFAULT 'headshot';
ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS avatar_multiview_url TEXT;
