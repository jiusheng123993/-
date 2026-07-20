export interface SearchResult {
  type: 'task' | 'note' | 'goal' | 'book' | 'project' | 'habit' | 'journal' | 'finance'
  id: string
  title: string
  description: string
  date: string
  matchedText: string
  snippet?: string
}

export interface SearchService {
  search(query: string): SearchResult[]
}

function matchField(value: string | undefined | null, lowerQuery: string): boolean {
  if (!value) return false
  return value.toLowerCase().includes(lowerQuery)
}

function extractMatchSnippet(text: string, query: string, maxLen = 80): string {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, maxLen)
  const start = Math.max(0, idx - 20)
  const end = Math.min(text.length, idx + query.length + 30)
  let snippet = text.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  return snippet
}

export function createSearchService(getWorkspaceState: () => Record<string, unknown>, getStudyState: () => Record<string, unknown>, getHabitState: () => Record<string, unknown>, getFinanceState: () => Record<string, unknown>, getReadingState: () => Record<string, unknown>, getJournalState: () => Record<string, unknown>, getGoalsState: () => Record<string, unknown>, getProjectState: () => Record<string, unknown>): SearchService {
  const search = (query: string): SearchResult[] => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    const results: SearchResult[] = []

    const workspaceState = getWorkspaceState()
    ;(workspaceState.tasks as Array<Record<string, unknown>> || []).forEach((task) => {
      if (matchField(task.title, lowerQuery) || matchField(task.description, lowerQuery) || matchField(task.tags?.join(' '), lowerQuery)) {
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          description: `${task.dueLabel || ''} · ${task.minutes || 0}分钟`,
          date: task.createdAt?.split('T')[0] || '',
          matchedText: task.title,
          snippet: extractMatchSnippet(task.description || task.title, query)
        })
      }
    })

    const studyState = getStudyState()
    ;(studyState.notes as Array<Record<string, unknown>> || []).forEach((note) => {
      if (matchField(note.title, lowerQuery) || matchField(note.content, lowerQuery)) {
        results.push({
          type: 'note',
          id: note.id,
          title: note.title,
          description: note.content?.slice(0, 100) || '',
          date: note.createdAt?.split('T')[0] || '',
          matchedText: note.title,
          snippet: extractMatchSnippet(note.content || note.title, query)
        })
      }
    })

    const goalsState = getGoalsState()
    ;(goalsState.goals as Array<Record<string, unknown>> || []).forEach((goal) => {
      if (matchField(goal.title, lowerQuery) || matchField(goal.description, lowerQuery)) {
        results.push({
          type: 'goal',
          id: goal.id,
          title: goal.title,
          description: `${goal.progress || 0}% 进度`,
          date: goal.createdAt?.split('T')[0] || '',
          matchedText: goal.title,
          snippet: extractMatchSnippet(goal.description || goal.title, query)
        })
      }
    })

    const readingState = getReadingState()
    ;(readingState.books as Array<Record<string, unknown>> || []).forEach((book) => {
      if (matchField(book.title, lowerQuery) || matchField(book.author, lowerQuery) || matchField(book.notes, lowerQuery)) {
        results.push({
          type: 'book',
          id: book.id,
          title: book.title,
          description: `${book.author} · ${book.status}`,
          date: book.addedAt?.split('T')[0] || '',
          matchedText: book.title,
          snippet: extractMatchSnippet(book.notes || book.title, query)
        })
      }
    })

    const projectState = getProjectState()
    ;(projectState.projects as Array<Record<string, unknown>> || []).forEach((project) => {
      if (matchField(project.name, lowerQuery) || matchField(project.description, lowerQuery)) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.name,
          description: project.description || '',
          date: project.createdAt?.split('T')[0] || '',
          matchedText: project.name,
          snippet: extractMatchSnippet(project.description || project.name, query)
        })
      }
    })

    const habitState = getHabitState()
    ;(habitState.habits as Array<Record<string, unknown>> || []).forEach((habit) => {
      if (matchField(habit.name, lowerQuery) || matchField(habit.description, lowerQuery)) {
        results.push({
          type: 'habit',
          id: habit.id,
          title: habit.name,
          description: `${habit.streak || 0}天连续`,
          date: habit.createdAt?.split('T')[0] || '',
          matchedText: habit.name,
          snippet: extractMatchSnippet(habit.description || habit.name, query)
        })
      }
    })

    const journalState = getJournalState()
    ;(journalState.entries as Array<Record<string, unknown>> || []).forEach((entry) => {
      if (matchField(entry.content, lowerQuery) || matchField(entry.title, lowerQuery) || matchField(entry.mood, lowerQuery)) {
        results.push({
          type: 'journal',
          id: entry.id,
          title: entry.date,
          description: entry.content?.slice(0, 100) || '',
          date: entry.date,
          matchedText: entry.content,
          snippet: extractMatchSnippet(entry.content || '', query)
        })
      }
    })

    const financeState = getFinanceState()
    ;(financeState.transactions as Array<Record<string, unknown>> || []).forEach((tx) => {
      if (matchField(tx.description, lowerQuery) || matchField(tx.category, lowerQuery) || matchField(tx.note, lowerQuery)) {
        results.push({
          type: 'finance',
          id: tx.id,
          title: `${tx.type === 'income' ? '+' : '-'}¥${tx.amount}`,
          description: `${tx.category} · ${tx.description || ''}`,
          date: tx.date?.split('T')[0] || '',
          matchedText: tx.description || tx.category,
          snippet: extractMatchSnippet(tx.note || tx.description || '', query)
        })
      }
    })

    return results.slice(0, 50)
  }

  return { search }
}