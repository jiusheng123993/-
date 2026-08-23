-- 回忆补记日期类型修正：TIMESTAMPTZ → DATE
-- 背景：happened_at 语义是"发生日期"（无时间），用 TIMESTAMPTZ 会引入时区歧义——
-- pg 按会话时区把 '2026-07-20' 解析成 00:00 本地时间，非 UTC 服务器存成前一天的
-- UTC 时间戳，前端 slice(0,10) 显示差一天，与"去年今天"的 EXTRACT 匹配两端不一致。
-- DATE 类型无时区，pg 直接返回 'YYYY-MM-DD' 字符串，展示/排序/匹配全部无歧义。
-- 幂等设计：migrate.ts 每次启动重跑全部 SQL，ALTER TYPE 重复执行无副作用。
ALTER TABLE pet_moments ALTER COLUMN happened_at TYPE DATE USING happened_at::date;
-- 默认值同步改为"今天"（DATE 语义下 now() 的时间部分无意义）
ALTER TABLE pet_moments ALTER COLUMN happened_at SET DEFAULT CURRENT_DATE;
