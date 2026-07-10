import type { MemoryAtom, RelationType } from '../core/memoryBodyTypes'

export interface MemoryContradiction {
  object: string
  relationTypes: RelationType[]
  atomIds: string[]
}

function contradictionKey(atom: MemoryAtom): string {
  return `${atom.scope.userId}:${atom.scope.projectId}:${atom.object}`
}

export function detectMemoryContradictions(atoms: MemoryAtom[]): MemoryContradiction[] {
  const grouped = atoms.reduce<Record<string, MemoryAtom[]>>((groups, atom) => {
    if (atom.predicate !== 'likes' && atom.predicate !== 'dislikes') return groups
    const key = contradictionKey(atom)
    return { ...groups, [key]: [...(groups[key] ?? []), atom] }
  }, {})

  return Object.values(grouped).flatMap(group => {
    const hasLikes = group.some(atom => atom.predicate === 'likes')
    const hasDislikes = group.some(atom => atom.predicate === 'dislikes')
    if (!hasLikes || !hasDislikes) return []

    return [{
      object: group[0].object,
      relationTypes: ['likes', 'dislikes'],
      atomIds: group.map(atom => atom.id)
    }]
  })
}
