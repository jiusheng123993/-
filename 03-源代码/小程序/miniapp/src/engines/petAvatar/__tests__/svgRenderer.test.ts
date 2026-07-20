import { describe, it, expect } from 'vitest'
import { buildSvgFace, svgToDataUri, getPetFaceDataUri } from '../svgRenderer'
import { EXPRESSION_MAP } from '../expressionEngine'

describe('buildSvgFace', () => {
  it('generates valid SVG for happy dog', () => {
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120)
    expect(svg).toContain('<svg')
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('viewBox="0 0 100 100"')
    expect(svg).toContain('width="120"')
    expect(svg).toContain('height="120"')
    expect(svg).toContain('</svg>')
  })

  it('generates valid SVG for happy cat', () => {
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'cat', 100)
    expect(svg).toContain('<svg')
    expect(svg).toContain('width="100"')
    expect(svg).toContain('height="100"')
  })

  it('dog SVG contains dog-specific ear shapes', () => {
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120)
    expect(svg).toContain('ellipse')
    expect(svg).toContain('F5DEB3')
  })

  it('cat SVG contains cat-specific ear shapes', () => {
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'cat', 120)
    expect(svg).toContain('polygon')
    expect(svg).toContain('D3D3D3')
  })

  it('generates different eyes for different expressions', () => {
    const happySvg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120)
    const worriedSvg = buildSvgFace(EXPRESSION_MAP.worried, 'dog', 120)
    expect(happySvg).not.toBe(worriedSvg)
  })

  it('generates different mouths for different expressions', () => {
    const happySvg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120)
    const anxiousSvg = buildSvgFace(EXPRESSION_MAP.anxious, 'dog', 120)
    expect(happySvg).not.toBe(anxiousSvg)
  })

  it('includes accessory for proud expression (crown)', () => {
    const svg = buildSvgFace(EXPRESSION_MAP.proud, 'dog', 120)
    expect(svg).toContain('👑')
  })

  it('includes confetti for excited expression', () => {
    const svg = buildSvgFace(EXPRESSION_MAP.excited, 'dog', 120)
    expect(svg).toContain('🎉')
  })

  it('includes shadow filter definition', () => {
    const svg = buildSvgFace(EXPRESSION_MAP.happy, 'dog', 120)
    expect(svg).toContain('<filter id="shadow">')
    expect(svg).toContain('feDropShadow')
  })

  it('all 8 expressions generate valid SVG', () => {
    const expressions = Object.values(EXPRESSION_MAP)
    for (const expr of expressions) {
      const svg = buildSvgFace(expr, 'dog', 120)
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    }
  })
})

describe('svgToDataUri', () => {
  it('encodes SVG to data URI', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>'
    const uri = svgToDataUri(svg)
    expect(uri).toContain('data:image/svg+xml,')
  })

  it('encodes special characters', () => {
    const svg = '<svg><text fill="#333">hello</text></svg>'
    const uri = svgToDataUri(svg)
    expect(uri).toContain('%3Csvg%3E')
  })
})

describe('getPetFaceDataUri', () => {
  it('returns a valid data URI', () => {
    const uri = getPetFaceDataUri(EXPRESSION_MAP.happy, 'dog', 120)
    expect(uri).toContain('data:image/svg+xml,')
  })

  it('different expressions produce different URIs', () => {
    const happyUri = getPetFaceDataUri(EXPRESSION_MAP.happy, 'dog', 120)
    const scaredUri = getPetFaceDataUri(EXPRESSION_MAP.scared, 'dog', 120)
    expect(happyUri).not.toBe(scaredUri)
  })

  it('different species produce different URIs', () => {
    const dogUri = getPetFaceDataUri(EXPRESSION_MAP.happy, 'dog', 120)
    const catUri = getPetFaceDataUri(EXPRESSION_MAP.happy, 'cat', 120)
    expect(dogUri).not.toBe(catUri)
  })
})
