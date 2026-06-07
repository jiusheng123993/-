import type { AudioOption } from './types'

export const AUDIO_OPTIONS: AudioOption[] = [
  {
    id: 'none',
    name: '关闭',
    icon: '🔇',
    category: 'none'
  },
  {
    id: 'rain',
    name: '雨声',
    icon: '🌧️',
    category: 'nature',
    file: '/audio/rain.mp3'
  },
  {
    id: 'thunder',
    name: '雷雨',
    icon: '⛈️',
    category: 'nature',
    file: '/audio/thunder.mp3'
  },
  {
    id: 'ocean',
    name: '海浪',
    icon: '🌊',
    category: 'nature',
    file: '/audio/ocean.mp3'
  },
  {
    id: 'stream',
    name: '溪流',
    icon: '💧',
    category: 'nature',
    file: '/audio/stream.mp3'
  },
  {
    id: 'forest-sound',
    name: '森林',
    icon: '🌲',
    category: 'nature',
    file: '/audio/forest.mp3'
  },
  {
    id: 'wind',
    name: '风声',
    icon: '🍃',
    category: 'nature',
    file: '/audio/wind.mp3'
  },
  {
    id: 'fireplace',
    name: '壁炉',
    icon: '🔥',
    category: 'nature',
    file: '/audio/fireplace.mp3'
  },
  {
    id: 'cicada',
    name: '蝉鸣夏夜',
    icon: '🦗',
    category: 'nature',
    file: '/audio/cicada.mp3'
  },
  {
    id: 'cafe',
    name: '咖啡馆',
    icon: '☕',
    category: 'ambient',
    file: '/audio/cafe.mp3'
  },
  {
    id: 'library',
    name: '图书馆',
    icon: '📚',
    category: 'ambient',
    file: '/audio/library.mp3'
  },
  {
    id: 'train',
    name: '火车旅途',
    icon: '🚂',
    category: 'ambient',
    file: '/audio/train.mp3'
  },
  {
    id: 'city-rain',
    name: '城市雨夜',
    icon: '🌃',
    category: 'ambient',
    file: '/audio/city-rain.mp3'
  },
  {
    id: 'spaceship',
    name: '太空舱',
    icon: '🚀',
    category: 'ambient',
    file: '/audio/spaceship.mp3'
  },
  {
    id: 'deep-ocean',
    name: '深海',
    icon: '🐋',
    category: 'ambient',
    file: '/audio/deep-ocean.mp3'
  },
  {
    id: 'white-noise',
    name: '白噪音',
    icon: '📡',
    category: 'frequency',
    generated: 'white-noise'
  },
  {
    id: 'pink-noise',
    name: '粉红噪音',
    icon: '🎚️',
    category: 'frequency',
    generated: 'pink-noise'
  },
  {
    id: 'brown-noise',
    name: '棕色噪音',
    icon: '🎛️',
    category: 'frequency',
    generated: 'brown-noise'
  },
  {
    id: 'hz432',
    name: '432Hz 纯音',
    icon: '🎵',
    category: 'frequency',
    generated: 'hz432'
  },
  {
    id: 'piano',
    name: '钢琴轻音',
    icon: '🎹',
    category: 'instrumental',
    file: '/audio/piano.mp3'
  },
  {
    id: 'guitar',
    name: '吉他指弹',
    icon: '🎸',
    category: 'instrumental',
    file: '/audio/guitar.mp3'
  },
  {
    id: 'cello',
    name: '大提琴',
    icon: '🎻',
    category: 'instrumental',
    file: '/audio/cello.mp3'
  },
  {
    id: 'ambient-music',
    name: '氛围电子',
    icon: '🎧',
    category: 'instrumental',
    file: '/audio/ambient.mp3'
  }
]

export function getAudioById(id: string): AudioOption | undefined {
  return AUDIO_OPTIONS.find(a => a.id === id)
}
