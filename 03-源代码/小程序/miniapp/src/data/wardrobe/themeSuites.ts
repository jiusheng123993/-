import type { ThemeSuiteDef } from '../../types/wardrobeTypes'

export const THEME_SUITES: ThemeSuiteDef[] = [
  { id: 'christmas', name: '圣诞主题', category: 'festival', promptTemplate: 'A {species} {breed} wearing a Santa hat and red scarf, standing in a snowy Christmas scene with decorated tree and gifts, warm holiday lighting', festivalDate: '12-25', previewUrl: null, sortOrder: 1, isActive: true },
  { id: 'spring_festival', name: '春节主题', category: 'festival', promptTemplate: 'A {species} {breed} wearing traditional Chinese red outfit with gold trim, surrounded by lanterns and fireworks, festive spring celebration atmosphere', festivalDate: '01-01', previewUrl: null, sortOrder: 2, isActive: true },
  { id: 'halloween', name: '万圣节主题', category: 'festival', promptTemplate: 'A {species} {breed} wearing a pumpkin hat and bat wings, in a spooky Halloween night scene with jack-o-lanterns and flying bats, eerie moonlight', festivalDate: '10-31', previewUrl: null, sortOrder: 3, isActive: true },
  { id: 'birthday', name: '生日主题', category: 'birthday', promptTemplate: 'A {species} {breed} wearing a party hat and bow tie, celebrating birthday with colorful balloons, confetti, and a birthday cake with candles, joyful party atmosphere', festivalDate: null, previewUrl: null, sortOrder: 4, isActive: true },
  { id: 'sakura', name: '樱花主题', category: 'season', promptTemplate: 'A {species} {breed} wearing a sakura hairpin and pink scarf, under blooming cherry blossom trees with petals falling, soft spring sunlight, dreamy pink atmosphere', festivalDate: null, previewUrl: null, sortOrder: 5, isActive: true },
  { id: 'summer_beach', name: '夏日海滩主题', category: 'season', promptTemplate: 'A {species} {breed} wearing sunglasses and a Hawaiian lei, on a sunny tropical beach with palm trees, ocean waves, and sand, bright summer vibes', festivalDate: null, previewUrl: null, sortOrder: 6, isActive: true },
  { id: 'autumn_maple', name: '秋枫主题', category: 'season', promptTemplate: 'A {species} {breed} wearing a cozy scarf and small backpack, walking on a path covered with golden and red maple leaves, warm autumn afternoon light', festivalDate: null, previewUrl: null, sortOrder: 7, isActive: true },
  { id: 'winter_snow', name: '冬日雪景主题', category: 'season', promptTemplate: 'A {species} {breed} wearing a knitted beanie and snowflake scarf, playing in fresh snow with snowflakes falling, serene winter wonderland, soft overcast light', festivalDate: null, previewUrl: null, sortOrder: 8, isActive: true },
  { id: 'astronaut', name: '宇航员主题', category: 'special', promptTemplate: 'A {species} {breed} wearing a space helmet and rocket backpack, floating in outer space with stars and planets, zero gravity, cosmic nebula background', festivalDate: null, previewUrl: null, sortOrder: 9, isActive: true },
  { id: 'hanfu', name: '汉服主题', category: 'special', promptTemplate: 'A {species} {breed} wearing elegant traditional Chinese hanfu with flowing sleeves and jade pendant, in a classical Chinese garden with pavilion and lotus pond, misty poetic atmosphere', festivalDate: null, previewUrl: null, sortOrder: 10, isActive: true },
]

export function getThemeById(id: string): ThemeSuiteDef | undefined {
  return THEME_SUITES.find(t => t.id === id)
}

export function getActiveThemes(): ThemeSuiteDef[] {
  return THEME_SUITES.filter(t => t.isActive)
}
