export interface TreeState {
  stage: number
  progress: number
  isBlooming: boolean
  isWithering: boolean
}

const STAGES = [
  { min: 0, max: 0.05, label: '种子', stemHeight: 0, branches: 0, leaves: 0 },
  { min: 0.05, max: 0.15, label: '发芽', stemHeight: 15, branches: 0, leaves: 0 },
  { min: 0.15, max: 0.3, label: '幼苗', stemHeight: 35, branches: 1, leaves: 3 },
  { min: 0.3, max: 0.5, label: '小树', stemHeight: 55, branches: 2, leaves: 8 },
  { min: 0.5, max: 0.7, label: '成长', stemHeight: 75, branches: 3, leaves: 15 },
  { min: 0.7, max: 0.9, label: '茂盛', stemHeight: 90, branches: 4, leaves: 25 },
  { min: 0.9, max: 0.99, label: '开花', stemHeight: 100, branches: 5, leaves: 35 },
  { min: 0.99, max: 1.0, label: '结果', stemHeight: 100, branches: 5, leaves: 40 }
]

export function getTreeStage(progress: number) {
  const stage = STAGES.find(s => progress >= s.min && progress < s.max) || STAGES[STAGES.length - 1]
  return {
    ...stage,
    progress
  }
}

export function generateTreeSVG(progress: number, isWithering: boolean = false): string {
  const stage = getTreeStage(progress)
  const cx = 100
  const cy = 180
  const stemColor = isWithering ? '#8a7a6a' : '#5a4a3a'
  const leafColor = isWithering ? '#c8b878' : '#4ade80'
  const bloomColor = isWithering ? '#d4a0a0' : '#f472b6'

  const parts: string[] = []

  if (stage.stemHeight > 0) {
    const stemW = 6 + stage.stage * 1.5
    const topY = cy - stage.stemHeight
    parts.push(`<rect x="${cx - stemW / 2}" y="${topY}" width="${stemW}" height="${stage.stemHeight}" rx="3" fill="${stemColor}" />`)
  }

  for (let i = 0; i < stage.branches; i++) {
    const angle = -60 + (i / (stage.branches - 1 || 1)) * 120
    const branchY = cy - stage.stemHeight * (0.4 + (i / stage.branches) * 0.5)
    const branchLen = 20 + stage.stage * 8
    const rad = (angle * Math.PI) / 180
    const endX = cx + Math.cos(rad) * branchLen
    const endY = branchY + Math.sin(rad) * branchLen
    const branchW = 3 + stage.stage * 0.5
    parts.push(`<line x1="${cx}" y1="${branchY}" x2="${endX}" y2="${endY}" stroke="${stemColor}" stroke-width="${branchW}" stroke-linecap="round" />`)
  }

  for (let i = 0; i < stage.leaves; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 15 + Math.random() * (stage.stemHeight * 0.6)
    const leafX = cx + Math.cos(angle) * dist
    const leafY = cy - stage.stemHeight * 0.3 - Math.random() * stage.stemHeight * 0.7
    const leafR = 4 + Math.random() * 6
    const color = stage.stage >= 6 && Math.random() > 0.5 ? bloomColor : leafColor
    parts.push(`<circle cx="${leafX}" cy="${leafY}" r="${leafR}" fill="${color}" opacity="0.85" />`)
  }

  if (stage.stage >= 6) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 10 + Math.random() * (stage.stemHeight * 0.5)
      const bx = cx + Math.cos(angle) * dist
      const by = cy - stage.stemHeight * 0.3 - Math.random() * stage.stemHeight * 0.6
      parts.push(`<circle cx="${bx}" cy="${by}" r="${3 + Math.random() * 4}" fill="${bloomColor}" opacity="0.9" />`)
    }
  }

  if (stage.stemHeight > 0) {
    parts.push(`<ellipse cx="${cx}" cy="${cy + 5}" rx="${20 + stage.stage * 3}" ry="6" fill="#3a2a1a" opacity="0.3" />`)
  }

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`
}
