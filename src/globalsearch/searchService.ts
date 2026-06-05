export interface SearchResult {
  type: 'task' | 'note' | 'goal' | 'book' | 'project' | 'habit' | 'journal' | 'finance'
  id: string
  title: string
  description: string
  date: string
  matchedText: string
}

export interface SearchService {
  search(query: string): SearchResult[]
}

export function createSearchService(getWorkspaceState: () => any, getStudyState: () => any, getHabitState: () => any, getFinanceState: () => any, getReadingState: () => any, getJournalState: () => any, getGoalsState: () => any, getProjectState: () => any): SearchService {
  const search = (query: string): SearchResult[] => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    const results: SearchResult[] = []

    const workspaceState = getWorkspaceState()
    ;(workspaceState.tasks || []).forEach((task: any) => {
      if (task.title?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          description: `${task.dueLabel || ''} · ${task.minutes || 0}分钟`,
          date: task.createdAt?.split('T')[0] || '',
          matchedText: task.title
        })
      }
    })

    const studyState = getStudyState()
    ;(studyState.notes || []).forEach((note: any) => {
      if (note.title?.toLowerCase().includes(lowerQuery) || note.content?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'note',
          id: note.id,
          title: note.title,
          description: note.content?.slice(0, 50) || '',
          date: note.createdAt?.split('T')[0] || '',
          matchedText: note.title
        })
      }
    })

    const goalsState = getGoalsState()
    ;(goalsState.goals || []).forEach((goal: any) => {
      if (goal.title?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'goal',
          id: goal.id,
          title: goal.title,
          description: `${goal.progress || 0}% 进度`,
          date: goal.createdAt?.split('T')[0] || '',
          matchedText: goal.title
        })
      }
    })

    const readingState = getReadingState()
    ;(readingState.books || []).forEach((book: any) => {
      if (book.title?.toLowerCase().includes(lowerQuery) || book.author?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'book',
          id: book.id,
          title: book.title,
          description: `${book.author} · ${book.status}`,
          date: book.addedAt?.split('T')[0] || '',
          matchedText: book.title
        })
      }
    })

    const projectState = getProjectState()
    ;(projectState.projects || []).forEach((project: any) => {
      if (project.name?.toLowerCase().includes(lowerQuery) || project.description?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.name,
          description: project.description || '',
          date: project.createdAt?.split('T')[0] || '',
          matchedText: project.name
        })
      }
    })

    const habitState = getHabitState()
    ;(habitState.habits || []).forEach((habit: any) => {
      if (habit.name?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'habit',
          id: habit.id,
          title: habit.name,
          description: `${habit.streak || 0}天连续`,
          date: habit.createdAt?.split('T')[0] || '',
          matchedText: habit.name
        })
      }
    })

    const journalState = getJournalState()
    ;(journalState.entries || []).forEach((entry: any) => {
      if (entry.content?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'journal',
          id: entry.id,
          title: entry.date,
          description: entry.content?.slice(0, 50) || '',
          date: entry.date,
          matchedText: entry.content
        })
      }
    })

    const financeState = getFinanceState()
    ;(financeState.transactions || []).forEach((tx: any) => {
      if (tx.description?.toLowerCase().includes(lowerQuery) || tx.category?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'finance',
          id: tx.id,
          title: `${tx.type === 'income' ? '+' : '-'}¥${tx.amount}`,
          description: `${tx.category} · ${tx.description || ''}`,
          date: tx.date?.split('T')[0] || '',
          matchedText: tx.description || tx.category
        })
      }
    })

    return results.slice(0, 50)
  }

  return { search }
}