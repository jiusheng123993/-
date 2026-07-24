import { describe, it, expect } from 'vitest'
import { buildSvgFace, getPetFaceDataUri } from '../svgRenderer'
import { EXPRESSION_MAP } from '../expressionEngine'
import type { OutfitLayer } from '../../../types/wardrobeTypes'

describe('buildSvgFace with outfitLayers', () => {
  it('preserves original rendering when no outfitLayers', () => {
    const withoutOutfit = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120)
    const withEmptyOutfit = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120, [])
    expect(withoutOutfit).toBe(withEmptyOutfit)
  })

  it('appends outfit layers at the end of SVG before closing tags', () => {
    const outfitLayers: OutfitLayer[] = [
      { slot: 'feet', accessoryId: 'socks_small', svgPath: 'socks.svg', zIndex: 1 },
    ]
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120, outfitLayers)
    const closingGIndex = svg.lastIndexOf('</g>')
    const closingSvgIndex = svg.lastIndexOf('</svg>')
    const outfitContentIndex = svg.indexOf('socks.svg')
    expect(outfitContentIndex).toBeGreaterThan(0)
    expect(outfitContentIndex).toBeLessThan(closingGIndex)
    expect(closingGIndex).toBeLessThan(closingSvgIndex)
  })

  it('renders outfit layers after accessory content', () => {
    const proudExpression = EXPRESSION_MAP.proud
    const outfitLayers: OutfitLayer[] = [
      { slot: 'head', accessoryId: 'hat_bowler', svgPath: 'hat.svg', zIndex: 10 },
    ]
    const svg = buildSvgFace(proudExpression, 'dog', 120, outfitLayers)
    const accessoryIndex = svg.indexOf('👑')
    const outfitIndex = svg.indexOf('hat.svg')
    expect(outfitIndex).toBeGreaterThan(accessoryIndex)
  })

  it('renders multiple outfit layers in zIndex order', () => {
    const outfitLayers: OutfitLayer[] = [
      { slot: 'head', accessoryId: 'hat_bowler', svgPath: 'hat.svg', zIndex: 10 },
      { slot: 'feet', accessoryId: 'socks_small', svgPath: 'socks.svg', zIndex: 1 },
    ]
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120, outfitLayers)
    const feetPos = svg.indexOf('socks.svg')
    const headPos = svg.indexOf('hat.svg')
    expect(feetPos).toBeLessThan(headPos)
  })

  it('wraps each outfit layer in a g tag with transform', () => {
    const outfitLayers: OutfitLayer[] = [
      { slot: 'head', accessoryId: 'hat_bowler', svgPath: 'hat.svg', zIndex: 10, transform: 'scale(0.85, 0.9)' },
    ]
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120, outfitLayers)
    expect(svg).toContain('transform="scale(0.85, 0.9)"')
  })
})

describe('getPetFaceDataUri with outfitLayers', () => {
  it('produces different URI when outfitLayers are provided', () => {
    const noOutfitUri = getPetFaceDataUri(EXPRESSION_MAP.happy, 'dog', 120)
    const outfitLayers: OutfitLayer[] = [
      { slot: 'head', accessoryId: 'hat_bowler', svgPath: 'hat.svg', zIndex: 10 },
    ]
    const withOutfitUri = getPetFaceDataUri(EXPRESSION_MAP.happy, 'dog', 120, outfitLayers)
    expect(noOutfitUri).not.toBe(withOutfitUri)
  })
})
