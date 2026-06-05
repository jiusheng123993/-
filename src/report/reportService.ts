export interface ReportData {
  period: 'weekly' | 'monthly'
  startDate: string
  endDate: string
  focus: {
    totalSessions: number
    totalMinutes: number
    avgPerDay: number
    topTasks: { title: string; minutes: number }[]
  }
  tasks: {
    completed: number
    created: number
    completionRate: number
  }
  habits: {
    totalCheckIns: number
    streakDays: number
    completionRate: number
  }
  journal: {
    entries: number
    avgMood: number
  }
  finance: {
    income: number
    expense: number
    balance: number
  }
  reading: {
    booksCompleted: number
    pagesRead: number
  }
  wellness: {
    totalWater: number
    totalExercise: number
    avgCalories: number
  }
}

export interface ReportService {
  generateWeeklyReport(startDate: string): ReportData
  generateMonthlyReport(year: number, month: number): ReportData
  getSummaryText(report: ReportData): string
}

export function createReportService(getWorkspaceState: () => any, getStudyState: () => any, getHabitState: () => any, getFinanceState: () => any, getReadingState: () => any, getWellnessState: () => any, getJournalState: () => any): ReportService {
  const getDateRange = (period: 'weekly' | 'monthly', startDateOrYear: string | number, month?: number) => {
    let start: Date, end: Date
    if (period === 'weekly') {
      start = new Date(startDateOrYear as string)
      end = new Date(start)
      end.setDate(end.getDate() + 6)
    } else {
      start = new Date(startDateOrYear as number, (month || 1) - 1, 1)
      end = new Date(startDateOrYear as number, month! - 1 + 1, 0)
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }

  const filterByDateRange = <T extends { date?: string; createdAt?: string }>(items: T[], start: string, end: string) => {
    return items.filter((item) => {
      const date = item.date || (item.createdAt ? item.createdAt.split('T')[0] : '')
      return date >= start && date <= end
    })
  }

  const generateWeeklyReport = (startDate: string): ReportData => {
    const { startDate: start, endDate: end } = getDateRange('weekly', startDate)
    const workspaceState = getWorkspaceState()
    const studyState = getStudyState()
    const habitState = getHabitState()
    const financeState = getFinanceState()
    const readingState = getReadingState()
    const wellnessState = getWellnessState()
    const journalState = getJournalState()

    const weekSessions = filterByDateRange(workspaceState.focusSessions || [], start, end)
    const weekTasks = filterByDateRange(workspaceState.tasks || [], start, end)
    const weekHabits = filterByDateRange(habitState?.checkIns || [], start, end)
    const weekFinance = filterByDateRange(financeState?.transactions || [], start, end)
    const weekWellness = filterByDateRange(wellnessState?.water || [], start, end)
    const weekExercises = filterByDateRange(wellnessState?.exercises || [], start, end)
    const weekMeals = filterByDateRange(wellnessState?.meals || [], start, end)
    const weekJournal = filterByDateRange(journalState?.entries || [], start, end)

    const totalFocusMinutes = weekSessions.reduce((sum: number, s: any) => sum + (s.minutes || 0), 0)
    const taskMinutes: Record<string, number> = {}
    weekSessions.forEach((s: any) => {
      taskMinutes[s.taskTitle] = (taskMinutes[s.taskTitle] || 0) + (s.minutes || 0)
    })
    const topTasks = Object.entries(taskMinutes)
      .map(([title, minutes]) => ({ title, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)

    const completedTasks = weekTasks.filter((t: any) => t.status === 'done').length

    return {
      period: 'weekly',
      startDate: start,
      endDate: end,
      focus: {
        totalSessions: weekSessions.length,
        totalMinutes: totalFocusMinutes,
        avgPerDay: Math.round(totalFocusMinutes / 7),
        topTasks
      },
      tasks: {
        completed: completedTasks,
        created: weekTasks.length,
        completionRate: weekTasks.length > 0 ? Math.round((completedTasks / weekTasks.length) * 100) : 0
      },
      habits: {
        totalCheckIns: weekHabits.length,
        streakDays: habitState?.currentStreak || 0,
        completionRate: Math.round((weekHabits.length / 7) * 100)
      },
      journal: {
        entries: weekJournal.length,
        avgMood: 0
      },
      finance: {
        income: weekFinance.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
        expense: weekFinance.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
        balance: 0
      },
      reading: {
        booksCompleted: 0,
        pagesRead: 0
      },
      wellness: {
        totalWater: weekWellness.reduce((sum: number, w: any) => sum + (w.amount || 0), 0),
        totalExercise: weekExercises.reduce((sum: number, e: any) => sum + (e.duration || 0), 0),
        avgCalories: weekMeals.length > 0 ? Math.round(weekMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0) / weekMeals.length) : 0
      }
    }
  }

  const generateMonthlyReport = (year: number, month: number): ReportData => {
    const { startDate: start, endDate: end } = getDateRange('monthly', year, month)
    const workspaceState = getWorkspaceState()
    const studyState = getStudyState()
    const habitState = getHabitState()
    const financeState = getFinanceState()
    const readingState = getReadingState()
    const wellnessState = getWellnessState()
    const journalState = getJournalState()

    const daysInMonth = new Date(year, month, 0).getDate()
    const monthSessions = filterByDateRange(workspaceState.focusSessions || [], start, end)
    const monthTasks = filterByDateRange(workspaceState.tasks || [], start, end)
    const monthHabits = filterByDateRange(habitState?.checkIns || [], start, end)
    const monthFinance = filterByDateRange(financeState?.transactions || [], start, end)
    const monthWellness = filterByDateRange(wellnessState?.water || [], start, end)
    const monthExercises = filterByDateRange(wellnessState?.exercises || [], start, end)
    const monthMeals = filterByDateRange(wellnessState?.meals || [], start, end)
    const monthJournal = filterByDateRange(journalState?.entries || [], start, end)

    const totalFocusMinutes = monthSessions.reduce((sum: number, s: any) => sum + (s.minutes || 0), 0)
    const completedTasks = monthTasks.filter((t: any) => t.status === 'done').length

    const income = monthFinance.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    const expense = monthFinance.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

    const completedBooks = (readingState?.books || []).filter((b: any) => b.status === 'completed' && b.completedAt && b.completedAt.split('-')[0] === String(year) && b.completedAt.split('-')[1] === String(month).padStart(2, '0')).length

    return {
      period: 'monthly',
      startDate: start,
      endDate: end,
      focus: {
        totalSessions: monthSessions.length,
        totalMinutes,
        avgPerDay: Math.round(totalFocusMinutes / daysInMonth),
        topTasks: []
      },
      tasks: {
        completed: completedTasks,
        created: monthTasks.length,
        completionRate: monthTasks.length > 0 ? Math.round((completedTasks / monthTasks.length) * 100) : 0
      },
      habits: {
        totalCheckIns: monthHabits.length,
        streakDays: habitState?.currentStreak || 0,
        completionRate: Math.round((monthHabits.length / daysInMonth) * 100)
      },
      journal: {
        entries: monthJournal.length,
        avgMood: 0
      },
      finance: {
        income,
        expense,
        balance: income - expense
      },
      reading: {
        booksCompleted: completedBooks,
        pagesRead: 0
      },
      wellness: {
        totalWater: monthWellness.reduce((sum: number, w: any) => sum + (w.amount || 0), 0),
        totalExercise: monthExercises.reduce((sum: number, e: any) => sum + (e.duration || 0), 0),
        avgCalories: monthMeals.length > 0 ? Math.round(monthMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0) / monthMeals.length) : 0
      }
    }
  }

  const getSummaryText = (report: ReportData): string => {
    const lines = [
      `📊 ${report.period === 'weekly' ? '周' : '月'}度报告 (${report.startDate} ~ ${report.endDate})`,
      '',
      '🎯 专注数据',
      `   • 专注次数: ${report.focus.totalSessions} 次`,
      `   • 总专注时长: ${report.focus.totalMinutes} 分钟`,
      `   • 日均: ${report.focus.avgPerDay} 分钟`,
      '',
      '✅ 任务完成',
      `   • 完成: ${report.tasks.completed} / ${report.tasks.created} 任务`,
      `   • 完成率: ${report.tasks.completionRate}%`,
      '',
      '💪 习惯养成',
      `   • 打卡: ${report.habits.totalCheckIns} 次`,
      `   • 连续: ${report.habits.streakDays} 天`,
      '',
      '💰 财务收支',
      `   • 收入: ¥${report.finance.income.toLocaleString()}`,
      `   • 支出: ¥${report.finance.expense.toLocaleString()}`,
      `   • 结余: ¥${report.finance.balance.toLocaleString()}`,
      '',
      '📚 阅读',
      `   • 读完: ${report.reading.booksCompleted} 本`,
      '',
      '❤️ 健康',
      `   • 饮水: ${report.wellness.totalWater}ml`,
      `   • 运动: ${report.wellness.totalExercise}分钟`,
    ]
    return lines.join('\n')
  }

  return {
    generateWeeklyReport,
    generateMonthlyReport,
    getSummaryText
  }
}