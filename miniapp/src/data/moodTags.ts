// 星寰海 v2.0 - 情绪类型定义

/** 情绪标签（24个） */
export const MOOD_TAGS = [
  { key: 'sad', label: '难过', color: '#4fc3f7' },
  { key: 'anxious', label: '焦虑', color: '#ff8a65' },
  { key: 'tired', label: '累', color: '#9fa8da' },
  { key: 'lonely', label: '孤独', color: '#80deea' },
  { key: 'unclear', label: '说不出来', color: '#ce93d8' },
  { key: 'happy', label: '开心', color: '#81c784' },
  { key: 'calm', label: '平静', color: '#b0bec5' },
  { key: 'angry', label: '愤怒', color: '#ef5350' },
  { key: 'fearful', label: '害怕', color: '#7986cb' },
  { key: 'joyful', label: '喜悦', color: '#ffcc80' },
  { key: 'stressed', label: '压力大', color: '#ffab91' },
  { key: 'relaxed', label: '放松', color: '#a5d6a7' },
  { key: 'frustrated', label: '挫败', color: '#bcaaa4' },
  { key: 'hopeful', label: '充满希望', color: '#80cbc4' },
  { key: 'guilty', label: '内疚', color: '#ef9a9a' },
  { key: 'ashamed', label: '羞愧', color: '#d7ccc8' },
  { key: 'grateful', label: '感恩', color: '#fff59d' },
  { key: 'disappointed', label: '失望', color: '#cfd8dc' },
  { key: 'nervous', label: '紧张', color: '#ffe0b2' },
  { key: 'confident', label: '自信', color: '#b2dfdb' },
  { key: 'lonely_deep', label: '深深的孤独', color: '#90caf9' },
  { key: 'empty', label: '空虚', color: '#eceff1' },
  { key: 'overwhelmed', label: '崩溃边缘', color: '#ffcdd2' }
] as const;

export type MoodTagKey = typeof MOOD_TAGS[number]['key'];

/** 情境标签 */
export const CONTEXT_TAGS = [
  { key: 'work', label: '工作' },
  { key: 'family', label: '家庭' },
  { key: 'relationship', label: '感情' },
  { key: 'health', label: '健康' },
  { key: 'finance', label: '财务' },
  { key: 'social', label: '社交' },
  { key: 'self_growth', label: '自我成长' },
  { key: 'other', label: '其他' }
] as const;

export type ContextTagKey = typeof CONTEXT_TAGS[number]['key'];
