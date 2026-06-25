import type { FutureGuard } from '../repair/trustRepairProtocol'

export interface MisunderstandingMemory {
  id: string
  userSaid: string
  assistantInterpreted: string
  userCorrection: string
  lesson: string
  futureGuard: FutureGuard | null
  createdAt: string
  relatedTaskIds: string[]
}

export interface MisunderstandingMemoryInput {
  userSaid: string
  assistantInterpreted: string
  userCorrection: string
  lesson: string
  futureGuard?: FutureGuard | null
  relatedTaskIds?: string[]
}

let idCounter = 0

function generateId(): string {
  idCounter++
  return `misunderstanding-${Date.now()}-${idCounter}`
}

export function createMisunderstandingMemory(
  input: MisunderstandingMemoryInput
): MisunderstandingMemory {
  return {
    id: generateId(),
    userSaid: input.userSaid,
    assistantInterpreted: input.assistantInterpreted,
    userCorrection: input.userCorrection,
    lesson: input.lesson,
    futureGuard: input.futureGuard ?? null,
    createdAt: new Date().toISOString(),
    relatedTaskIds: input.relatedTaskIds ?? []
  }
}

export function addRelatedTask(
  memory: MisunderstandingMemory,
  taskId: string
): MisunderstandingMemory {
  if (memory.relatedTaskIds.includes(taskId)) {
    return memory
  }
  return {
    ...memory,
    relatedTaskIds: [...memory.relatedTaskIds, taskId]
  }
}

export function summarizeMisunderstandingMemory(
  memory: MisunderstandingMemory
): string {
  return `用户说: "${memory.userSaid}" → AI理解为: "${memory.assistantInterpreted}" → 用户纠正: "${memory.userCorrection}" → 教训: ${memory.lesson}`
}

export function findRelevantMisunderstandings(
  memories: MisunderstandingMemory[],
  keyword: string
): MisunderstandingMemory[] {
  const lower = keyword.toLowerCase()
  return memories.filter(
    (m) =>
      m.userSaid.toLowerCase().includes(lower) ||
      m.assistantInterpreted.toLowerCase().includes(lower) ||
      m.userCorrection.toLowerCase().includes(lower) ||
      m.lesson.toLowerCase().includes(lower)
  )
}
