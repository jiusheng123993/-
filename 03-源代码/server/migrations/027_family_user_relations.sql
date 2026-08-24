-- 027 家庭成员（人）关系表（2026-08-24）：任意两名家庭成员之间可设关系（情侣/父女等）
-- 背景：pet_family_users 只有 owner/member 角色，无法表达"情侣/父女/父子"等人际关系；
-- 本表新增"人 ↔ 人"关系（有向：user_id_a 是关系主体，user_id_b 是被关系对象，
-- 例如父女关系：a=父亲、b=女儿；情侣/兄弟姐妹/朋友为对等关系，方向仅作展示基准）。
-- 8 种标准关系：couple 情侣 / father_daughter 父女 / father_son 父子 /
--              mother_daughter 母女 / mother_son 母子 / siblings 兄弟姐妹 /
--              friends 朋友 / other 其他
CREATE TABLE IF NOT EXISTS family_user_relations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  user_id_a     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 关系主体
  user_id_b     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 被关系对象
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'couple', 'father_daughter', 'father_son',
    'mother_daughter', 'mother_son', 'siblings', 'friends', 'other'
  )),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  -- 同一对成员之间只允许一条关系（a-b 与 b-a 视为同一对，用 LEAST/GREATEST 归一化去重）
  UNIQUE (family_id, LEAST(user_id_a, user_id_b), GREATEST(user_id_a, user_id_b))
);

CREATE INDEX IF NOT EXISTS idx_family_user_relations_family ON family_user_relations(family_id);
