// 星寰海 v2.0 - 高危关键词库（三级）

export interface CrisisKeyword {
  word: string;
  level: 'mild' | 'moderate' | 'severe';
}

/** 轻度：需要追加热线信息 */
const MILD_KEYWORDS: string[] = [
  '不开心', '低落', '郁闷', '烦', '烦躁', '难受', '痛苦',
  '压力', '累', '疲惫', '绝望', '无助', '迷茫', '孤独',
  '想哭', '哭泣', '失眠', '睡不着', '吃不下', '没有动力'
];

/** 中度：中断流程，全屏关怀+热线 */
const MODERATE_KEYWORDS: string[] = [
  '想死', '不想活了', '活着没意思', '死了算了', '结束生命',
  '自杀', '自残', '伤害自己', '割腕', '跳楼', '吃药',
  '消失', '离开这个世界', '解脱', '放弃', '撑不下去',
  '太累了不想继续', '没有人在乎我', '我是多余的'
];

/** 重度：立即弹出热线+120/110 */
const SEVERE_KEYWORDS: string[] = [
  '已经吃了药', '正在实施', '马上要跳', '刀', '绳子',
  '遗书', '最后一次', '告别', '永别了', '再见了世界',
  '我已经决定了', '马上就结束了'
];

export const CRISIS_KEYWORDS: CrisisKeyword[] = [
  ...MILD_KEYWORDS.map(w => ({ word: w, level: 'mild' as const })),
  ...MODERATE_KEYWORDS.map(w => ({ word: w, level: 'moderate' as const })),
  ...SEVERE_KEYWORDS.map(w => ({ word: w, level: 'severe' as const }))
];

/** 热线信息 */
export const HOTLINE_INFO = {
  name: '希望24热线',
  number: '400-161-9995',
  description: '24小时免费心理危机干预热线'
};
