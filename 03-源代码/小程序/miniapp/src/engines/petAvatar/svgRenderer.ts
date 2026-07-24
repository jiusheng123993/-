import type { ExpressionConfig, PetSpecies, SvgPetFace } from '../../types/avatarTypes'
import type { OutfitLayer } from '../../types/wardrobeTypes'
import { composeOutfitLayers } from './outfitRenderer'

export type { SvgPetFace }

const DOG_BASE = {
  body: '<ellipse cx="50" cy="55" rx="42" ry="38" fill="#F5DEB3"/>',
  ears: '<ellipse cx="18" cy="25" rx="12" ry="18" fill="#D2B48C" transform="rotate(-15 18 25)"/><ellipse cx="82" cy="25" rx="12" ry="18" fill="#D2B48C" transform="rotate(15 82 25)"/>',
}

const CAT_BASE = {
  body: '<ellipse cx="50" cy="55" rx="40" ry="36" fill="#D3D3D3"/>',
  ears: '<polygon points="15,30 10,8 30,22" fill="#A9A9A9"/><polygon points="85,30 90,8 70,22" fill="#A9A9A9"/>',
}

const EYE_DEFS: Record<string, string> = {
  happy: '<path d="M32 48 Q38 42 44 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M56 48 Q62 42 68 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  half: '<ellipse cx="38" cy="48" rx="5" ry="4" fill="#333"/><ellipse cx="62" cy="48" rx="5" ry="4" fill="#333"/><rect x="32" y="44" width="12" height="6" fill="#F5DEB3" rx="2"/><rect x="56" y="44" width="12" height="6" fill="#F5DEB3" rx="2"/>',
  round: '<circle cx="38" cy="48" r="6" fill="#333"/><circle cx="62" cy="48" r="6" fill="#333"/><circle cx="39" cy="47" r="2" fill="#fff"/><circle cx="63" cy="47" r="2" fill="#fff"/>',
  wide: '<circle cx="38" cy="48" r="7" fill="#333"/><circle cx="62" cy="48" r="7" fill="#333"/><circle cx="40" cy="46" r="2.5" fill="#fff"/><circle cx="64" cy="46" r="2.5" fill="#fff"/>',
  closed: '<path d="M32 48 Q38 52 44 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M56 48 Q62 52 68 48" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  sparkle: '<polygon points="38,42 40,46 44,46 41,49 42,53 38,51 34,53 35,49 32,46 36,46" fill="#FFD700"/><polygon points="62,42 64,46 68,46 65,49 66,53 62,51 58,53 59,49 56,46 60,46" fill="#FFD700"/>',
  star: '<text x="38" y="52" font-size="16" fill="#FFD700" text-anchor="middle">⭐</text><text x="62" y="52" font-size="16" fill="#FFD700" text-anchor="middle">⭐</text>',
  shocked: '<circle cx="38" cy="48" r="8" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="62" cy="48" r="8" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="38" cy="48" r="3" fill="#333"/><circle cx="62" cy="48" r="3" fill="#333"/>',
}

const MOUTH_DEFS: Record<string, string> = {
  smile: '<path d="M38 62 Q50 72 62 62" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  frown: '<path d="M38 66 Q50 58 62 66" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  worried: '<path d="M38 64 Q44 60 50 64 Q56 60 62 64" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>',
  gasp: '<circle cx="50" cy="63" r="6" fill="#333"/><circle cx="49" cy="61" r="1.5" fill="#fff"/>',
  zzz: '<text x="70" y="30" font-size="12" fill="#9E9E9E" font-weight="bold">Z</text><text x="78" y="22" font-size="14" fill="#9E9E9E" font-weight="bold">Z</text><text x="86" y="14" font-size="16" fill="#9E9E9E" font-weight="bold">Z</text>',
  big_smile: '<path d="M35 58 Q50 78 65 58" stroke="#333" stroke-width="2.5" fill="#FF6B6B" stroke-linecap="round"/><path d="M42 63 Q46 67 50 63" stroke="#fff" stroke-width="1" fill="none"/><path d="M50 63 Q54 67 58 63" stroke="#fff" stroke-width="1" fill="none"/>',
  open_smile: '<ellipse cx="50" cy="62" rx="12" ry="8" fill="#FF6B6B"/><path d="M42 60 Q50 68 58 60" stroke="#fff" stroke-width="1.5" fill="none"/>',
}

const ACCESSORY_DEFS: Record<string, string> = {
  blush: '<circle cx="28" cy="54" r="6" fill="#FFB6C1" opacity="0.5"/><circle cx="72" cy="54" r="6" fill="#FFB6C1" opacity="0.5"/>',
  cold_bubble: '<ellipse cx="75" cy="20" rx="10" ry="6" fill="#B3E5FC" opacity="0.7"/><text x="75" y="23" font-size="8" fill="#0288D1" text-anchor="middle">🤧</text>',
  hospital: '<text x="25" y="30" font-size="14">🏥</text>',
  sweat: '<text x="25" y="35" font-size="10">💧</text><text x="75" y="38" font-size="8">💧</text>',
  drool: '<ellipse cx="50" cy="72" rx="4" ry="6" fill="#B3E5FC" opacity="0.6"/>',
  crown: '<text x="50" y="15" font-size="18" text-anchor="middle">👑</text>',
  confetti: '<text x="20" y="20" font-size="10">🎉</text><text x="80" y="25" font-size="8">✨</text>',
  warning: '<text x="75" y="25" font-size="14">⚠️</text>',
}

export function buildSvgFace(
  expression: ExpressionConfig,
  species: PetSpecies = 'dog',
  size: number = 120,
  outfitLayers: OutfitLayer[] = []
): string {
  const base = species === 'cat' ? CAT_BASE : DOG_BASE
  const eyes = EYE_DEFS[expression.eyes] || EYE_DEFS.happy
  const mouth = MOUTH_DEFS[expression.mouth] || MOUTH_DEFS.smile
  const accessory = ACCESSORY_DEFS[expression.accessory] || ''
  const outfitSvg = composeOutfitLayers(outfitLayers)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.1"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        ${base.body}
        ${base.ears}
        <ellipse cx="38" cy="45" rx="12" ry="10" fill="#fff" opacity="0.3"/>
        <ellipse cx="62" cy="45" rx="12" ry="10" fill="#fff" opacity="0.3"/>
        <ellipse cx="50" cy="50" rx="8" ry="5" fill="#333" opacity="0.15"/>
        ${eyes}
        ${mouth}
        ${accessory}
      </g>
      ${outfitSvg}
    </svg>
  `.trim()

  return svg
}

export function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml,${encoded}`
}

export function getPetFaceDataUri(
  expression: ExpressionConfig,
  species: PetSpecies = 'dog',
  size: number = 120,
  outfitLayers: OutfitLayer[] = []
): string {
  const svg = buildSvgFace(expression, species, size, outfitLayers)
  return svgToDataUri(svg)
}
