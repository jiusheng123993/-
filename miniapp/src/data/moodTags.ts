// 星寰海 v2.0 - 情绪类型定义

/** 情绪标签（摄影图风格） */
export const MOOD_TAGS = [
  { key: 'sad', label: '难过', color: '#4fc3f7', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ac3e5?w=400&h=500&fit=crop', icon: 'rain' },
  { key: 'anxious', label: '焦虑', color: '#ff8a65', image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f55?w=400&h=500&fit=crop', icon: 'lightning' },
  { key: 'tired', label: '累', color: '#9fa8da', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f05?w=400&h=500&fit=crop', icon: 'moon' },
  { key: 'lonely', label: '孤独', color: '#80deea', image: 'https://images.unsplash.com/photo-1534447672968-5f1d7e0f9e4c?w=400&h=500&fit=crop', icon: 'star' },
  { key: 'unclear', label: '说不出来', color: '#ce93d8', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', icon: 'cloud' },
  { key: 'happy', label: '开心', color: '#81c784', image: 'https://images.unsplash.com/photo-1490750967868-88aa44f4a3bd?w=400&h=500&fit=crop', icon: 'sun' },
  { key: 'calm', label: '平静', color: '#b0bec5', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d77?w=400&h=500&fit=crop', icon: 'wave' },
  { key: 'angry', label: '愤怒', color: '#ef5350', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=500&fit=crop', icon: 'fire' },
  { key: 'fearful', label: '害怕', color: '#7986cb', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=500&fit=crop', icon: 'ghost' },
  { key: 'joyful', label: '喜悦', color: '#ffcc80', image: 'https://images.unsplash.com/photo-1465146344425-f00d5f9c7f84?w=400&h=500&fit=crop', icon: 'sparkle' },
  { key: 'stressed', label: '压力大', color: '#ffab91', image: 'https://images.unsplash.com/photo-1519681393798-38e43269d877?w=400&h=500&fit=crop', icon: 'cloud-rain' },
  { key: 'relaxed', label: '放松', color: '#a5d6a7', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b84?w=400&h=500&fit=crop', icon: 'leaf' },
  { key: 'frustrated', label: '挫败', color: '#bcaaa4', image: 'https://images.unsplash.com/photo-1506905920876-992e33e1f0bf?w=400&h=500&fit=crop', icon: 'cloud' },
  { key: 'hopeful', label: '充满希望', color: '#80cbc4', image: 'https://images.unsplash.com/photo-1470071459604-6b5e1f9f9c5e?w=400&h=500&fit=crop', icon: 'sunrise' },
  { key: 'guilty', label: '内疚', color: '#ef9a9a', image: 'https://images.unsplash.com/photo-1519681393798-38e43269d877?w=400&h=500&fit=crop', icon: 'heart' },
  { key: 'ashamed', label: '羞愧', color: '#d7ccc8', image: 'https://images.unsplash.com/photo-1506905920876-992e33e1f0bf?w=400&h=500&fit=crop', icon: 'eye-off' },
  { key: 'grateful', label: '感恩', color: '#fff59d', image: 'https://images.unsplash.com/photo-1465146344425-f00d5f9c7f84?w=400&h=500&fit=crop', icon: 'heart' },
  { key: 'disappointed', label: '失望', color: '#cfd8dc', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=500&fit=crop', icon: 'cloud' },
  { key: 'nervous', label: '紧张', color: '#ffe0b2', image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f55?w=400&h=500&fit=crop', icon: 'zap' },
  { key: 'confident', label: '自信', color: '#b2dfdb', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=500&fit=crop', icon: 'crown' },
  { key: 'lonely_deep', label: '深深的孤独', color: '#90caf9', image: 'https://images.unsplash.com/photo-1534447672968-5f1d7e0f9e4c?w=400&h=500&fit=crop', icon: 'moon' },
  { key: 'empty', label: '空虚', color: '#eceff1', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ac3e5?w=400&h=500&fit=crop', icon: 'circle' },
  { key: 'overwhelmed', label: '崩溃边缘', color: '#ffcdd2', image: 'https://images.unsplash.com/photo-1519681393798-38e43269d877?w=400&h=500&fit=crop', icon: 'cloud-lightning' }
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
