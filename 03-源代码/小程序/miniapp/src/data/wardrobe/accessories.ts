import type { AccessoryDef } from '../../types/wardrobeTypes'
import type { PetSpecies } from '../../types/avatarTypes'

const CDN_BASE = 'https://cdn.example.com/wardrobe'

export const ACCESSORIES: AccessoryDef[] = [
  { id: 'hat_bowler', name: '礼帽', slot: 'head', svgPath: 'svgFragments/hat_bowler.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 101, isActive: true },
  { id: 'hat_baseball', name: '棒球帽', slot: 'head', svgPath: 'svgFragments/hat_baseball.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 102, isActive: true },
  { id: 'scarf_red', name: '红围巾', slot: 'neck', svgPath: 'svgFragments/scarf_red.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 201, isActive: true },
  { id: 'bell_small', name: '小铃铛', slot: 'neck', svgPath: 'svgFragments/bell_small.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 202, isActive: true },
  { id: 'backpack_small', name: '小背包', slot: 'back', svgPath: 'svgFragments/backpack_small.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 301, isActive: true },
  { id: 'tshirt_blue', name: '蓝T恤', slot: 'body', svgPath: 'svgFragments/tshirt_blue.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 401, isActive: true },
  { id: 'socks_small', name: '小袜子', slot: 'feet', svgPath: 'svgFragments/socks_small.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 501, isActive: true },
  { id: 'shoes_canvas', name: '帆布鞋', slot: 'feet', svgPath: 'svgFragments/shoes_canvas.svg', speciesCompat: [] as PetSpecies[], unlockSource: 'default', unlockCondition: {}, sortOrder: 502, isActive: true },

  { id: 'crown_gold', name: '金皇冠', slot: 'head', svgPath: `${CDN_BASE}/crown_gold.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'crown_gold' }, sortOrder: 103, isActive: true },
  { id: 'bow_ribbon', name: '蝴蝶结', slot: 'head', svgPath: `${CDN_BASE}/bow_ribbon.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'bow_ribbon' }, sortOrder: 104, isActive: true },
  { id: 'medal_star', name: '星星勋章', slot: 'neck', svgPath: `${CDN_BASE}/medal_star.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'medal_star' }, sortOrder: 203, isActive: true },
  { id: 'chain_star', name: '星星项链', slot: 'neck', svgPath: `${CDN_BASE}/chain_star.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'chain_star' }, sortOrder: 204, isActive: true },
  { id: 'wings_butterfly', name: '蝴蝶翅膀', slot: 'back', svgPath: `${CDN_BASE}/wings_butterfly.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'wings_butterfly' }, sortOrder: 302, isActive: true },
  { id: 'balloon_red', name: '红气球', slot: 'back', svgPath: `${CDN_BASE}/balloon_red.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'balloon_red' }, sortOrder: 303, isActive: true },
  { id: 'suit_superhero', name: '超级英雄装', slot: 'body', svgPath: `${CDN_BASE}/suit_superhero.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'suit_superhero' }, sortOrder: 402, isActive: true },
  { id: 'shoes_sport', name: '运动鞋', slot: 'feet', svgPath: `${CDN_BASE}/shoes_sport.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'achievement', unlockCondition: { achievementId: 'shoes_sport' }, sortOrder: 503, isActive: true },

  { id: 'hat_christmas', name: '圣诞帽', slot: 'head', svgPath: `${CDN_BASE}/hat_christmas.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 6 }, sortOrder: 105, isActive: true },
  { id: 'hat_graduation', name: '学士帽', slot: 'head', svgPath: `${CDN_BASE}/hat_graduation.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 8 }, sortOrder: 106, isActive: true },
  { id: 'hat_lady', name: '淑女帽', slot: 'head', svgPath: `${CDN_BASE}/hat_lady.svg`, speciesCompat: ['cat'] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 10 }, sortOrder: 107, isActive: true },
  { id: 'scarf_christmas', name: '圣诞围巾', slot: 'neck', svgPath: `${CDN_BASE}/scarf_christmas.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 6 }, sortOrder: 205, isActive: true },
  { id: 'bowtie', name: '领结', slot: 'neck', svgPath: `${CDN_BASE}/bowtie.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 5 }, sortOrder: 206, isActive: true },
  { id: 'necklace_gem', name: '宝石项链', slot: 'neck', svgPath: `${CDN_BASE}/necklace_gem.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 12 }, sortOrder: 207, isActive: true },
  { id: 'backpack_rocket', name: '火箭背包', slot: 'back', svgPath: `${CDN_BASE}/backpack_rocket.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 15 }, sortOrder: 304, isActive: true },
  { id: 'guitar_small', name: '小吉他', slot: 'back', svgPath: `${CDN_BASE}/guitar_small.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 10 }, sortOrder: 305, isActive: true },
  { id: 'wings_angel', name: '天使翅膀', slot: 'back', svgPath: `${CDN_BASE}/wings_angel.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 18 }, sortOrder: 306, isActive: true },
  { id: 'kimono', name: '和服', slot: 'body', svgPath: `${CDN_BASE}/kimono.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 20 }, sortOrder: 403, isActive: true },
  { id: 'boots_hiking', name: '登山靴', slot: 'feet', svgPath: `${CDN_BASE}/boots_hiking.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 8 }, sortOrder: 504, isActive: true },
  { id: 'shoes_princess', name: '公主鞋', slot: 'feet', svgPath: `${CDN_BASE}/shoes_princess.svg`, speciesCompat: ['cat'] as PetSpecies[], unlockSource: 'paid', unlockCondition: { price: 12 }, sortOrder: 505, isActive: true },

  { id: 'horn_unicorn', name: '独角兽角', slot: 'head', svgPath: `${CDN_BASE}/horn_unicorn.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 1 }, sortOrder: 108, isActive: true },
  { id: 'hairpin_sakura', name: '樱花发簪', slot: 'head', svgPath: `${CDN_BASE}/hairpin_sakura.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 1 }, sortOrder: 109, isActive: true },
  { id: 'hat_pumpkin', name: '南瓜帽', slot: 'head', svgPath: `${CDN_BASE}/hat_pumpkin.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 2 }, sortOrder: 110, isActive: true },
  { id: 'ribbon_rainbow', name: '彩虹缎带', slot: 'neck', svgPath: `${CDN_BASE}/ribbon_rainbow.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 1 }, sortOrder: 208, isActive: true },
  { id: 'pendant_moon', name: '月亮吊坠', slot: 'neck', svgPath: `${CDN_BASE}/pendant_moon.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 2 }, sortOrder: 209, isActive: true },
  { id: 'scarf_snowflake', name: '雪花围巾', slot: 'neck', svgPath: `${CDN_BASE}/scarf_snowflake.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 1 }, sortOrder: 210, isActive: true },
  { id: 'wings_bat', name: '蝙蝠翅膀', slot: 'back', svgPath: `${CDN_BASE}/wings_bat.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 2 }, sortOrder: 307, isActive: true },
  { id: 'wings_fairy', name: '精灵翅膀', slot: 'back', svgPath: `${CDN_BASE}/wings_fairy.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 3 }, sortOrder: 308, isActive: true },
  { id: 'wings_dragon', name: '龙翅膀', slot: 'back', svgPath: `${CDN_BASE}/wings_dragon.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 3 }, sortOrder: 309, isActive: true },
  { id: 'suit_rainbow', name: '彩虹套装', slot: 'body', svgPath: `${CDN_BASE}/suit_rainbow.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 2 }, sortOrder: 404, isActive: true },
  { id: 'suit_starry', name: '星空套装', slot: 'body', svgPath: `${CDN_BASE}/suit_starry.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 3 }, sortOrder: 405, isActive: true },
  { id: 'paws_glow', name: '发光爪垫', slot: 'feet', svgPath: `${CDN_BASE}/paws_glow.svg`, speciesCompat: [] as PetSpecies[], unlockSource: 'member', unlockCondition: { memberLevel: 2 }, sortOrder: 506, isActive: true },
]

export function getAccessoriesBySlot(slot: AccessoryDef['slot']): AccessoryDef[] {
  return ACCESSORIES.filter(a => a.slot === slot)
}

export function getDefaultAccessories(): AccessoryDef[] {
  return ACCESSORIES.filter(a => a.unlockSource === 'default')
}

export function getAccessoryById(id: string): AccessoryDef | undefined {
  return ACCESSORIES.find(a => a.id === id)
}
