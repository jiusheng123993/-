// 星寰海 v2.0 - 白噪音轨道定义

export interface WhiteNoiseTrack {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'ambient' | 'frequency';
  file?: string; // 音频文件路径（可选，用于本地文件）
  generated?: 'white-noise' | 'pink-noise' | 'brown-noise'; // 生成类型（可选）
  description?: string;
}

// 白噪音轨道列表
export const WHITE_NOISE_TRACKS: WhiteNoiseTrack[] = [
  // 自然声音
  {
    id: 'rain',
    name: '雨声',
    icon: '🌧️',
    category: 'nature',
    file: '/audio/rain.mp3',
    description: '轻柔的雨声，帮助放松和入睡',
  },
  {
    id: 'ocean',
    name: '海浪',
    icon: '🌊',
    category: 'nature',
    file: '/audio/ocean.mp3',
    description: '平静的海浪声，带来宁静感',
  },
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    category: 'nature',
    file: '/audio/forest.mp3',
    description: '鸟鸣和树叶声，回归自然',
  },
  {
    id: 'wind',
    name: '风声',
    icon: '🍃',
    category: 'nature',
    file: '/audio/wind.mp3',
    description: '柔和的风声，舒缓焦虑',
  },
  {
    id: 'fire',
    name: '篝火',
    icon: '🔥',
    category: 'nature',
    file: '/audio/fireplace.mp3',
    description: '温暖的篝火声，营造安全感',
  },

  // 环境声音
  {
    id: 'cafe',
    name: '咖啡馆',
    icon: '☕',
    category: 'ambient',
    file: '/audio/cafe.mp3',
    description: '舒适的咖啡馆背景音',
  },
  {
    id: 'train',
    name: '火车',
    icon: '🚂',
    category: 'ambient',
    file: '/audio/train.mp3',
    description: '火车旅途的规律声响',
  },

  // 频率噪音（代码生成）
  {
    id: 'white-noise',
    name: '白噪音',
    icon: '📡',
    category: 'frequency',
    generated: 'white-noise',
    description: '均匀的频率分布，屏蔽干扰',
  },
  {
    id: 'pink-noise',
    name: '粉红噪音',
    icon: '🎚️',
    category: 'frequency',
    generated: 'pink-noise',
    description: '低频更丰富，更自然舒适',
  },
  {
    id: 'brown-noise',
    name: '棕色噪音',
    icon: '🎛️',
    category: 'frequency',
    generated: 'brown-noise',
    description: '更低的频率，深度放松',
  },
];

// 根据ID获取轨道
export function getTrackById(id: string): WhiteNoiseTrack | undefined {
  return WHITE_NOISE_TRACKS.find((track) => track.id === id);
}

// 按分类筛选轨道
export function getTracksByCategory(category: WhiteNoiseTrack['category']): WhiteNoiseTrack[] {
  return WHITE_NOISE_TRACKS.filter((track) => track.category === category);
}
