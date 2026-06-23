import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'

export interface CognitiveSnapshot {
  id: string
  label: string
  timestamp: string
  state: MemoryBodyState
  atomCount: number
}

export interface AtomChange {
  atomId: string
  changes: string[]
  oldAtom?: MemoryAtom
  newAtom?: MemoryAtom
}

export interface CognitiveDiff {
  addedAtoms: MemoryAtom[]
  removedAtoms: MemoryAtom[]
  modifiedAtoms: AtomChange[]
  summary: string
  oldSnapshotId: string
  newSnapshotId: string
}

export interface RollbackResult {
  state: MemoryBodyState
  auditRecord: {
    action: 'rollback'
    snapshotId: string
    timestamp: string
    previousAtomCount: number
    restoredAtomCount: number
  }
}

export interface TimelineEntry {
  content: string
  lifecycle: string
  confidence: number
  snapshotLabel: string
  snapshotTimestamp: string
}

export interface CorrectionPoint {
  snapshotLabel: string
  fromContent: string
  toContent: string
}

export interface MisunderstandingTrace {
  atomId: string
  timeline: TimelineEntry[]
  correctionPoint: CorrectionPoint | null
}

const snapshotStore: Map<string, CognitiveSnapshot> = new Map()

function generateSnapshotId(): string {
  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function deepCloneState(state: MemoryBodyState): MemoryBodyState {
  return JSON.parse(JSON.stringify(state))
}

export function createSnapshot(state: MemoryBodyState, label: string): CognitiveSnapshot {
  const snapshot: CognitiveSnapshot = {
    id: generateSnapshotId(),
    label,
    timestamp: new Date().toISOString(),
    state: deepCloneState(state),
    atomCount: state.atoms.length
  }
  snapshotStore.set(snapshot.id, snapshot)
  return snapshot
}

export function getSnapshot(id: string): CognitiveSnapshot | null {
  return snapshotStore.get(id) || null
}

function getAtomFields(_a: MemoryAtom): (keyof MemoryAtom)[] {
  return [
    'content', 'lifecycle', 'confidence', 'strength', 'emotionalWeight',
    'sensitivity', 'tags', 'subject', 'predicate', 'object', 'scope',
    'layer', 'type', 'source', 'evidence', 'accessCount', 'contradictionOf'
  ]
}

function compareAtoms(oldAtom: MemoryAtom, newAtom: MemoryAtom): string[] {
  const changes: string[] = []
  const fields = getAtomFields(oldAtom)

  for (const field of fields) {
    const oldVal = JSON.stringify(oldAtom[field])
    const newVal = JSON.stringify(newAtom[field])
    if (oldVal !== newVal) {
      changes.push(field)
    }
  }

  return changes
}

export function compareSnapshots(
  oldSnapshot: CognitiveSnapshot,
  newSnapshot: CognitiveSnapshot
): CognitiveDiff {
  const oldAtomMap = new Map<string, MemoryAtom>()
  const newAtomMap = new Map<string, MemoryAtom>()

  for (const atom of oldSnapshot.state.atoms) {
    oldAtomMap.set(atom.id, atom)
  }
  for (const atom of newSnapshot.state.atoms) {
    newAtomMap.set(atom.id, atom)
  }

  const addedAtoms: MemoryAtom[] = []
  const removedAtoms: MemoryAtom[] = []
  const modifiedAtoms: AtomChange[] = []

  for (const [id, atom] of newAtomMap) {
    if (!oldAtomMap.has(id)) {
      addedAtoms.push(atom)
    }
  }

  for (const [id, atom] of oldAtomMap) {
    if (!newAtomMap.has(id)) {
      removedAtoms.push(atom)
    }
  }

  for (const [id, oldAtom] of oldAtomMap) {
    const newAtom = newAtomMap.get(id)
    if (newAtom) {
      const changes = compareAtoms(oldAtom, newAtom)
      if (changes.length > 0) {
        modifiedAtoms.push({
          atomId: id,
          changes,
          oldAtom,
          newAtom
        })
      }
    }
  }

  const parts: string[] = []
  if (addedAtoms.length > 0) parts.push(`新增 ${addedAtoms.length} 条记忆`)
  if (removedAtoms.length > 0) parts.push(`移除 ${removedAtoms.length} 条记忆`)
  if (modifiedAtoms.length > 0) parts.push(`修改 ${modifiedAtoms.length} 条记忆`)
  const summary = parts.length > 0 ? parts.join('，') : '无变化'

  return {
    addedAtoms,
    removedAtoms,
    modifiedAtoms,
    summary,
    oldSnapshotId: oldSnapshot.id,
    newSnapshotId: newSnapshot.id
  }
}

export function rollbackToSnapshot(
  currentState: MemoryBodyState,
  snapshot: CognitiveSnapshot
): RollbackResult {
  const restoredState = deepCloneState(snapshot.state)

  return {
    state: restoredState,
    auditRecord: {
      action: 'rollback',
      snapshotId: snapshot.id,
      timestamp: new Date().toISOString(),
      previousAtomCount: currentState.atoms.length,
      restoredAtomCount: restoredState.atoms.length
    }
  }
}

export function traceMisunderstanding(
  atomId: string,
  snapshots: CognitiveSnapshot[]
): MisunderstandingTrace {
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const timeline: TimelineEntry[] = []
  let correctionPoint: CorrectionPoint | null = null
  let previousContent: string | null = null

  for (const snapshot of sorted) {
    const atom = snapshot.state.atoms.find(a => a.id === atomId)
    if (!atom) continue

    const entry: TimelineEntry = {
      content: atom.content,
      lifecycle: atom.lifecycle,
      confidence: atom.confidence,
      snapshotLabel: snapshot.label,
      snapshotTimestamp: snapshot.timestamp
    }
    timeline.push(entry)

    if (atom.lifecycle === 'corrected' && previousContent !== null && previousContent !== atom.content) {
      correctionPoint = {
        snapshotLabel: snapshot.label,
        fromContent: previousContent,
        toContent: atom.content
      }
    }

    previousContent = atom.content
  }

  return {
    atomId,
    timeline,
    correctionPoint
  }
}
