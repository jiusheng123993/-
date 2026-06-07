import type { BackgroundTheme } from './types'

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    category: 'nature',
    cssClass: 'bg-forest',
    gradient: 'linear-gradient(180deg, #1a3a2a 0%, #2d5a3f 30%, #3d7a4f 60%, #5a9a6a 100%)'
  },
  {
    id: 'ocean',
    name: '海洋',
    icon: '🌊',
    category: 'nature',
    cssClass: 'bg-ocean',
    gradient: 'linear-gradient(180deg, #0a1628 0%, #0d3b66 40%, #1a6b8a 70%, #4a9ebd 100%)'
  },
  {
    id: 'night-sky',
    name: '夜空',
    icon: '🌌',
    category: 'sky',
    cssClass: 'bg-night-sky',
    gradient: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 30%, #2a2a6e 60%, #1a1a4e 100%)'
  },
  {
    id: 'sky',
    name: '天空',
    icon: '☁️',
    category: 'sky',
    cssClass: 'bg-sky',
    gradient: 'linear-gradient(180deg, #4a90d9 0%, #7ab8f5 40%, #a8d8ff 70%, #d4eaff 100%)'
  },
  {
    id: 'autumn',
    name: '落叶',
    icon: '🍂',
    category: 'season',
    cssClass: 'bg-autumn',
    gradient: 'linear-gradient(180deg, #5a3a1a 0%, #8a5a2a 30%, #b87a3a 60%, #d4a05a 100%)'
  },
  {
    id: 'sakura',
    name: '樱花',
    icon: '🌸',
    category: 'season',
    cssClass: 'bg-sakura',
    gradient: 'linear-gradient(180deg, #f5d5e0 0%, #fad5e5 30%, #fce5ef 60%, #fff0f5 100%)'
  },
  {
    id: 'desert',
    name: '沙漠',
    icon: '🏜️',
    category: 'nature',
    cssClass: 'bg-desert',
    gradient: 'linear-gradient(180deg, #d4a05a 0%, #e0b86a 30%, #e8c87a 60%, #f0d890 100%)'
  },
  {
    id: 'snow-mountain',
    name: '雪山',
    icon: '🏔️',
    category: 'nature',
    cssClass: 'bg-snow-mountain',
    gradient: 'linear-gradient(180deg, #c8d8e8 0%, #d8e4f0 30%, #e8eef5 60%, #f5f8fc 100%)'
  },
  {
    id: 'sunrise',
    name: '日出',
    icon: '🌅',
    category: 'sky',
    cssClass: 'bg-sunrise',
    gradient: 'linear-gradient(180deg, #f5a060 0%, #f5c080 20%, #f5d8a0 40%, #a8c8f0 70%, #6a9ad0 100%)'
  },
  {
    id: 'sunset',
    name: '日落',
    icon: '🌇',
    category: 'sky',
    cssClass: 'bg-sunset',
    gradient: 'linear-gradient(180deg, #2a1a4e 0%, #5a2a6e 20%, #c85a4a 50%, #f5a060 80%, #f5c880 100%)'
  },
  {
    id: 'grassland',
    name: '草原',
    icon: '🌿',
    category: 'nature',
    cssClass: 'bg-grassland',
    gradient: 'linear-gradient(180deg, #4a8ad9 0%, #6aaaf0 30%, #8ac8a0 60%, #5aaa5a 100%)'
  },
  {
    id: 'starry',
    name: '星空',
    icon: '✨',
    category: 'sky',
    cssClass: 'bg-starry',
    gradient: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 30%, #0a0a2a 60%, #000010 100%)'
  },
  {
    id: 'after-rain',
    name: '雨后',
    icon: '🌈',
    category: 'nature',
    cssClass: 'bg-after-rain',
    gradient: 'linear-gradient(180deg, #4a6a8a 0%, #6a8aaa 30%, #8ab8c8 60%, #c8e8d8 100%)'
  },
  {
    id: 'city',
    name: '城市',
    icon: '🏙️',
    category: 'urban',
    cssClass: 'bg-city',
    gradient: 'linear-gradient(180deg, #1a1a2e 0%, #2a2a4e 30%, #3a3a6e 60%, #1a1a3e 100%)'
  },
  {
    id: 'mountain',
    name: '山脉',
    icon: '⛰️',
    category: 'nature',
    cssClass: 'bg-mountain',
    gradient: 'linear-gradient(180deg, #2a4a6a 0%, #3a5a7a 30%, #5a7a9a 60%, #8aaa c8 100%)'
  },
  {
    id: 'lake',
    name: '湖泊',
    icon: '🏞️',
    category: 'nature',
    cssClass: 'bg-lake',
    gradient: 'linear-gradient(180deg, #2a5a8a 0%, #3a7aaa 30%, #5a9ac8 60%, #8ac8e8 100%)'
  },
  {
    id: 'flower-field',
    name: '花田',
    icon: '🌻',
    category: 'nature',
    cssClass: 'bg-flower-field',
    gradient: 'linear-gradient(180deg, #5a8a3a 0%, #7aaa5a 30%, #c8d85a 60%, #f0e8a0 100%)'
  },
  {
    id: 'minimal',
    name: '极简',
    icon: '◻️',
    category: 'minimal',
    cssClass: 'bg-minimal',
    gradient: 'linear-gradient(180deg, #f5f5f5 0%, #eaeaea 50%, #f0f0f0 100%)'
  }
]

export function getThemeById(id: string): BackgroundTheme | undefined {
  return BACKGROUND_THEMES.find(t => t.id === id)
}
