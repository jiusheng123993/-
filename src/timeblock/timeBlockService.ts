import { createStorageService } from '../data/storageFactory'

export interface TimeBlock {
  id: string
  title: string
  startHour: number
  endHour: number
  color: string
  category: 'work' | 'study' | 'exercise' | 'rest' | 'other'
  date: string
  completed: boolean
}

export interface TimeBlockState {
  blocks: TimeBlock[]
}

const storage = createStorageService<TimeBlockState>(
  'xinghuanhai-timeblocks-state',
  { blocks: [] }
)

const categoryColors = {
  work: '#3b82f6',
  study: '#8b5cf6',
  exercise: '#22c55e',
  rest: '#f59e0b',
  other: '#6b7280'
}

export interface TimeBlockService {
  getState(): TimeBlockState
  addBlock(title: string, startHour: number, endHour: number, category: TimeBlock['category']): TimeBlock
  updateBlock(id: string, updates: Partial<Pick<TimeBlock, 'title' | 'startHour' | 'endHour' | 'completed'>>): void
  removeBlock(id: string): void
  getBlocksByDate(date: string): TimeBlock[]
  getTodayBlocks(): TimeBlock[]
}

export function createTimeBlockService(): TimeBlockService {
  const getState = (): TimeBlockState => storage.load()

  const save = (state: TimeBlockState): void => storage.save(state)

  const addBlock = (title: string, startHour: number, endHour: number, category: TimeBlock['category']): TimeBlock => {
    const state = getState()
    const today = new Date().toISOString().split('T')[0]
    const block: TimeBlock = {
      id: crypto.randomUUID(),
      title,
      startHour,
      endHour,
      color: categoryColors[category],
      category,
      date: today,
      completed: false
    }
    save({ blocks: [...state.blocks, block] })
    return block
  }

  const updateBlock = (id: string, updates: Partial<Pick<TimeBlock, 'title' | 'startHour' | 'endHour' | 'completed'>>): void => {
    const state = getState()
    save({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
    })
  }

  const removeBlock = (id: string): void => {
    const state = getState()
    save({ blocks: state.blocks.filter((b) => b.id !== id) })
  }

  const getBlocksByDate = (date: string): TimeBlock[] => {
    const state = getState()
    return state.blocks.filter((b) => b.date === date).sort((a, b) => a.startHour - b.startHour)
  }

  const getTodayBlocks = (): TimeBlock[] => {
    const today = new Date().toISOString().split('T')[0]
    return getBlocksByDate(today)
  }

  return {
    getState,
    addBlock,
    updateBlock,
    removeBlock,
    getBlocksByDate,
    getTodayBlocks
  }
}

export { categoryColors }