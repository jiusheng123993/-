/**
 * 宠物形象 SVG 渲染器（换装功能已砍，仅保留底座 + 表情渲染）
 *
 * 用于兜底头像生成（avatarService.getPetFaceDataUri），
 * 不再包含饰品图层合成。
 *
 * 坐标系统：100x100
 * - 头：y≈17-59，眼睛在 y≈38，嘴在 y≈50（表情引擎按此坐标绘制）
 * - 身体：y≈54-95，颈部 y≈52-64
 */
import type { ExpressionConfig, PetSpecies, SvgPetFace } from '../../types/avatarTypes'

export type { SvgPetFace }

/** 狗狗底座渐变（放进 <defs> 使用） */
const DOG_GRADIENT = `
<radialGradient id="dogBodyGrad" cx="50%" cy="35%" r="75%">
  <stop offset="0%" stop-color="#FFF3DA"/>
  <stop offset="55%" stop-color="#F5DEB3"/>
  <stop offset="100%" stop-color="#EBC493"/>
</radialGradient>
`

/** 狗狗底座身体：尾巴→后腿→身体→前爪→耳朵→头→口鼻（颜色含 F5DEB3，兼容旧测试） */
const DOG_BODY = `
<path d="M70 74 Q88 64 86 50 Q92 60 88 74" stroke="#EBC493" stroke-width="7" fill="none" stroke-linecap="round"/>
<ellipse cx="34" cy="92" rx="7" ry="10" fill="#E8C89B"/>
<ellipse cx="66" cy="92" rx="7" ry="10" fill="#E8C89B"/>
<ellipse cx="50" cy="75" rx="24" ry="21" fill="url(#dogBodyGrad)"/>
<ellipse cx="50" cy="66" rx="13" ry="7" fill="#fff" opacity="0.18"/>
<ellipse cx="39" cy="92" rx="5" ry="8" fill="#FFF3DA"/>
<ellipse cx="61" cy="92" rx="5" ry="8" fill="#FFF3DA"/>
<path d="M29 24 Q13 20 13 35 Q13 47 27 42 Q23 30 32 26 Z" fill="#D9A86C"/>
<path d="M71 24 Q87 20 87 35 Q87 47 73 42 Q77 30 68 26 Z" fill="#D9A86C"/>
<ellipse cx="50" cy="38" rx="23" ry="21" fill="url(#dogBodyGrad)"/>
<ellipse cx="50" cy="48" rx="11" ry="8" fill="#FFF8EE"/>
<ellipse cx="50" cy="45" rx="3.6" ry="3" fill="#6B4A32"/>
`

/** 猫咪底座渐变（放进 <defs> 使用） */
const CAT_GRADIENT = `
<radialGradient id="catBodyGrad" cx="50%" cy="35%" r="75%">
  <stop offset="0%" stop-color="#F2F4F7"/>
  <stop offset="55%" stop-color="#D3D3D3"/>
  <stop offset="100%" stop-color="#AEB6C2"/>
</radialGradient>
`

/** 猫咪底座身体：尾巴→后腿→身体→前爪→耳朵→头→口鼻→胡须（颜色含 D3D3D3，兼容旧测试） */
const CAT_BODY = `
<path d="M70 74 Q90 70 92 56 Q94 66 88 74" stroke="#AEB6C2" stroke-width="6" fill="none" stroke-linecap="round"/>
<ellipse cx="35" cy="93" rx="6" ry="9" fill="#AEB6C2"/>
<ellipse cx="65" cy="93" rx="6" ry="9" fill="#AEB6C2"/>
<ellipse cx="50" cy="76" rx="22" ry="20" fill="url(#catBodyGrad)"/>
<ellipse cx="50" cy="68" rx="12" ry="6" fill="#fff" opacity="0.16"/>
<ellipse cx="40" cy="93" rx="4.5" ry="7" fill="#F2F4F7"/>
<ellipse cx="60" cy="93" rx="4.5" ry="7" fill="#F2F4F7"/>
<polygon points="33,22 26,3 45,15" fill="#9AA3B2"/>
<polygon points="67,22 74,3 55,15" fill="#9AA3B2"/>
<polygon points="34,19 30,8 41,15" fill="#F4B8C4"/>
<polygon points="66,19 70,8 59,15" fill="#F4B8C4"/>
<ellipse cx="50" cy="36" rx="21" ry="19" fill="url(#catBodyGrad)"/>
<ellipse cx="50" cy="46" rx="10" ry="7" fill="#F6F7F9"/>
<ellipse cx="50" cy="43" rx="3.2" ry="2.6" fill="#F49BA6"/>
<path d="M36 46 L22 44 M36 49 L22 50 M64 46 L78 44 M64 49 L78 50" stroke="#9AA3B2" stroke-width="1.2" fill="none" stroke-linecap="round"/>
`

/**
 * 眼睛定义（y≈38，配合新底座头部位置）
 * key 与表情引擎的 eyes 字段一一对应
 */
const EYE_DEFS: Record<string, string> = {
  happy: '<path d="M32 38 Q38 32 44 38" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M56 38 Q62 32 68 38" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  half: '<ellipse cx="38" cy="38" rx="5" ry="4" fill="#4A3728"/><ellipse cx="62" cy="38" rx="5" ry="4" fill="#4A3728"/><rect x="32" y="34" width="12" height="6" fill="#F5DEB3" rx="2"/><rect x="56" y="34" width="12" height="6" fill="#F5DEB3" rx="2"/>',
  round: '<circle cx="38" cy="38" r="6" fill="#4A3728"/><circle cx="62" cy="38" r="6" fill="#4A3728"/><circle cx="39" cy="37" r="2" fill="#fff"/><circle cx="63" cy="37" r="2" fill="#fff"/>',
  wide: '<circle cx="38" cy="38" r="7" fill="#4A3728"/><circle cx="62" cy="38" r="7" fill="#4A3728"/><circle cx="40" cy="36" r="2.5" fill="#fff"/><circle cx="64" cy="36" r="2.5" fill="#fff"/>',
  closed: '<path d="M32 38 Q38 42 44 38" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M56 38 Q62 42 68 38" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  sparkle: '<polygon points="38,32 40,36 44,36 41,39 42,43 38,41 34,43 35,39 32,36 36,36" fill="#FFD700"/><polygon points="62,32 64,36 68,36 65,39 66,43 62,41 58,43 59,39 56,36 60,36" fill="#FFD700"/>',
  star: '<text x="38" y="42" font-size="16" fill="#FFD700" text-anchor="middle">⭐</text><text x="62" y="42" font-size="16" fill="#FFD700" text-anchor="middle">⭐</text>',
  shocked: '<circle cx="38" cy="38" r="8" fill="#fff" stroke="#4A3728" stroke-width="2"/><circle cx="62" cy="38" r="8" fill="#fff" stroke="#4A3728" stroke-width="2"/><circle cx="38" cy="38" r="3" fill="#4A3728"/><circle cx="62" cy="38" r="3" fill="#4A3728"/>',
}

/** 嘴巴定义（y≈50，配合新底座头部位置） */
const MOUTH_DEFS: Record<string, string> = {
  smile: '<path d="M38 50 Q50 60 62 50" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  frown: '<path d="M38 54 Q50 46 62 54" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  worried: '<path d="M38 52 Q44 48 50 52 Q56 48 62 52" stroke="#4A3728" stroke-width="2" fill="none" stroke-linecap="round"/>',
  gasp: '<circle cx="50" cy="51" r="6" fill="#4A3728"/><circle cx="49" cy="49" r="1.5" fill="#fff"/>',
  zzz: '<text x="70" y="20" font-size="12" fill="#9E9E9E" font-weight="bold">Z</text><text x="78" y="12" font-size="14" fill="#9E9E9E" font-weight="bold">Z</text><text x="86" y="4" font-size="16" fill="#9E9E9E" font-weight="bold">Z</text>',
  big_smile: '<path d="M35 46 Q50 66 65 46" stroke="#4A3728" stroke-width="2.5" fill="#FF6B6B" stroke-linecap="round"/><path d="M42 51 Q46 55 50 51" stroke="#fff" stroke-width="1" fill="none"/><path d="M50 51 Q54 55 58 51" stroke="#fff" stroke-width="1" fill="none"/>',
  open_smile: '<ellipse cx="50" cy="50" rx="12" ry="8" fill="#FF6B6B"/><path d="M42 48 Q50 56 58 48" stroke="#fff" stroke-width="1.5" fill="none"/>',
}

/** 表情装饰（腮红/气泡/皇冠等），坐标按新底座头部位置微调 */
const ACCESSORY_DEFS: Record<string, string> = {
  blush: '<circle cx="26" cy="46" r="5" fill="#FFB6C1" opacity="0.55"/><circle cx="74" cy="46" r="5" fill="#FFB6C1" opacity="0.55"/>',
  cold_bubble: '<ellipse cx="75" cy="20" rx="10" ry="6" fill="#B3E5FC" opacity="0.7"/><text x="75" y="23" font-size="8" fill="#0288D1" text-anchor="middle">🤧</text>',
  hospital: '<text x="25" y="26" font-size="14">🏥</text>',
  sweat: '<text x="25" y="30" font-size="10">💧</text><text x="75" y="34" font-size="8">💧</text>',
  drool: '<ellipse cx="50" cy="62" rx="4" ry="6" fill="#B3E5FC" opacity="0.6"/>',
  crown: '<text x="50" y="16" font-size="18" text-anchor="middle">👑</text>',
  confetti: '<text x="20" y="18" font-size="10">🎉</text><text x="80" y="22" font-size="8">✨</text>',
  warning: '<text x="75" y="24" font-size="14">⚠️</text>',
}

/**
 * 构建宠物形象 SVG（底座 + 表情）
 * @param expression - 表情配置（眼睛/嘴/装饰）
 * @param species - 物种（dog/cat）
 * @param size - 输出尺寸（px）
 */
export function buildSvgFace(
  expression: ExpressionConfig,
  species: PetSpecies = 'dog',
  size: number = 120
): string {
  const eyes = EYE_DEFS[expression.eyes] || EYE_DEFS.happy
  const mouth = MOUTH_DEFS[expression.mouth] || MOUTH_DEFS.smile
  const accessory = ACCESSORY_DEFS[expression.accessory] || ''

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <defs>
        ${species === 'cat' ? CAT_GRADIENT : DOG_GRADIENT}
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.12"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        ${species === 'cat' ? CAT_BODY : DOG_BODY}
        ${eyes}
        ${mouth}
        ${accessory}
      </g>
    </svg>
  `.trim()

  return svg
}

/** 将 SVG 字符串编码为 data URI */
export function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml,${encoded}`
}

/** 直接获取宠物形象的 data URI */
export function getPetFaceDataUri(
  expression: ExpressionConfig,
  species: PetSpecies = 'dog',
  size: number = 120
): string {
  const svg = buildSvgFace(expression, species, size)
  return svgToDataUri(svg)
}
