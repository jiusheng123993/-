import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryProfileEditorUI } from './MemoryProfileEditorUI'
import type { MemoryProfile } from './memoryTypes'

function createMockProfile(overrides: Partial<MemoryProfile> = {}): MemoryProfile {
  return {
    version: 1,
    scope: { userId: 'user-1', projectId: 'proj-1' },
    identity: {
      nickname: '测试用户',
      ageGroup: 'young_adult',
      occupation: '工程师',
      currentRole: '开发者',
      organization: '测试组织',
      lifeStage: 'career_building',
    },
    personality: {
      mbtiTendency: 'MBTI_INTJ',
      workStyle: 'independent',
      planningStyle: 'structured',
      motivationStyle: 'achievement',
      feedbackStyle: 'direct',
      stressResponse: 'push_harder',
      selfDescription: '我是一个测试用户',
    },
    rhythm: {
      energyPeak: 'morning',
      typicalStudyHours: '9:00-12:00',
      sleepPattern: 'early_bird',
      preferredSessionLength: 45,
      breakPreference: 'pomodoro_25',
      weeklyActiveDays: 5,
    },
    goals: {
      primaryGoal: '通过考试',
      secondaryGoals: ['学习TypeScript', '提升算法'],
      targetExams: ['AWS认证'],
      targetDate: '2025-12-31',
      careerDirection: '全栈工程师',
    },
    preferences: {
      encouragementStyle: 'coach',
      reminderFrequency: 'medium',
      detailLevel: 'moderate',
      languageStyle: 'casual',
    },
    boundaries: {
      tabooTopics: ['政治'],
      triggerWords: ['失败'],
      dontMention: ['前任公司'],
      sensitiveAreas: ['薪资'],
    },
    learning: {
      strongSubjects: ['数学', '编程'],
      weakSubjects: ['英语写作'],
      learningStyle: 'visual',
      commonBlockers: ['拖延'],
      effectiveStrategies: ['番茄工作法', '间隔重复'],
    },
    emotional: {
      currentMoodTrend: 'stable',
      motivationLevel: 'high',
      supportNeeds: ['鼓励'],
      recentWins: ['完成项目'],
    },
    meta: {
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      totalEventsProcessed: 10,
      sourceBreakdown: { manual: 5, conversation: 3, behavior: 2 },
    },
    ...overrides,
  }
}

function renderEditor(props: Partial<React.ComponentProps<typeof MemoryProfileEditorUI>> = {}) {
  const onSave = vi.fn()
  const onCancel = vi.fn()
  const result = render(
    <MemoryProfileEditorUI
      profile={createMockProfile()}
      onSave={onSave}
      onCancel={onCancel}
      {...props}
    />
  )
  return { ...result, onSave, onCancel }
}

function expandSection(name: string) {
  fireEvent.click(screen.getByText(name))
}

describe('MemoryProfileEditorUI', () => {
  it('renders all sections collapsed by default', () => {
    renderEditor()

    expect(screen.getByText('身份信息')).toBeInTheDocument()
    expect(screen.getByText('性格特征')).toBeInTheDocument()
    expect(screen.getByText('生活节奏')).toBeInTheDocument()
    expect(screen.getByText('目标规划')).toBeInTheDocument()
    expect(screen.getByText('交互偏好')).toBeInTheDocument()
    expect(screen.getByText('边界与禁忌')).toBeInTheDocument()
    expect(screen.getByText('学习特征')).toBeInTheDocument()
    expect(screen.getByText('情绪状态')).toBeInTheDocument()

    const { container } = renderEditor()
    const expandedContents = container.querySelectorAll(`.expanded`)
    expect(expandedContents.length).toBe(0)
  })

  it('expands section when clicking header', () => {
    renderEditor()

    expandSection('身份信息')

    expect(screen.getByLabelText('昵称')).toBeInTheDocument()
  })

  it('renders identity fields correctly', () => {
    renderEditor()
    expandSection('身份信息')

    expect(screen.getByLabelText('昵称')).toHaveValue('测试用户')
    expect(screen.getByLabelText('职业')).toHaveValue('工程师')
    expect(screen.getByLabelText('当前角色')).toHaveValue('开发者')
    expect(screen.getByLabelText('组织')).toHaveValue('测试组织')
    expect(screen.getByLabelText('人生阶段')).toHaveValue('career_building')
  })

  it('renders personality fields with MBTI dropdown', () => {
    renderEditor()
    expandSection('性格特征')

    expect(screen.getByLabelText('MBTI 倾向')).toBeInTheDocument()
    expect(screen.getByLabelText('工作风格')).toBeInTheDocument()
    expect(screen.getByLabelText('自我描述')).toHaveValue('我是一个测试用户')

    const mbtiSelect = screen.getByLabelText('MBTI 倾向') as HTMLSelectElement
    expect(mbtiSelect.value).toBe('MBTI_INTJ')
    const mbtiOptions = Array.from(mbtiSelect.options).map(o => o.value)
    expect(mbtiOptions).toContain('MBTI_ENTP')
    expect(mbtiOptions).toContain('MBTI_INFP')
    expect(mbtiOptions).toContain('unknown')
  })

  it('renders rhythm fields with number inputs', () => {
    renderEditor()
    expandSection('生活节奏')

    expect(screen.getByLabelText('偏好学习时长(分钟)')).toHaveValue(45)
    expect(screen.getByLabelText('每周活跃天数')).toHaveValue(5)
    expect(screen.getByLabelText('典型学习时段')).toHaveValue('9:00-12:00')
  })

  it('renders goals fields with comma-separated inputs', () => {
    renderEditor()
    expandSection('目标规划')

    expect(screen.getByLabelText('主要目标')).toHaveValue('通过考试')
    expect(screen.getByLabelText('职业方向')).toHaveValue('全栈工程师')
    expect(screen.getByText('学习TypeScript')).toBeInTheDocument()
    expect(screen.getByText('提升算法')).toBeInTheDocument()
    expect(screen.getByText('AWS认证')).toBeInTheDocument()
  })

  it('renders preferences fields with dropdowns', () => {
    renderEditor()
    expandSection('交互偏好')

    expect(screen.getByLabelText('鼓励风格')).toBeInTheDocument()
    expect(screen.getByLabelText('提醒频率')).toBeInTheDocument()
    expect(screen.getByLabelText('详细程度')).toBeInTheDocument()
    expect(screen.getByLabelText('语言风格')).toBeInTheDocument()
  })

  it('renders boundaries fields with chip inputs', () => {
    renderEditor()
    expandSection('边界与禁忌')

    expect(screen.getByText('政治')).toBeInTheDocument()
    expect(screen.getByText('失败')).toBeInTheDocument()
    expect(screen.getByText('前任公司')).toBeInTheDocument()
    expect(screen.getByText('薪资')).toBeInTheDocument()
  })

  it('renders learning fields correctly', () => {
    renderEditor()
    expandSection('学习特征')

    expect(screen.getByText('数学')).toBeInTheDocument()
    expect(screen.getByText('编程')).toBeInTheDocument()
    expect(screen.getByText('英语写作')).toBeInTheDocument()
    expect(screen.getByLabelText('学习风格')).toBeInTheDocument()
    expect(screen.getByText('拖延')).toBeInTheDocument()
    expect(screen.getByText('番茄工作法')).toBeInTheDocument()
  })

  it('renders emotional fields correctly', () => {
    renderEditor()
    expandSection('情绪状态')

    expect(screen.getByLabelText('当前情绪趋势')).toBeInTheDocument()
    expect(screen.getByLabelText('动机水平')).toBeInTheDocument()
    expect(screen.getByText('鼓励')).toBeInTheDocument()
    expect(screen.getByText('完成项目')).toBeInTheDocument()
  })

  it('calls onSave with updated profile when clicking save', () => {
    const { onSave } = renderEditor()
    expandSection('身份信息')

    const nicknameInput = screen.getByLabelText('昵称')
    fireEvent.change(nicknameInput, { target: { value: '新昵称' } })

    fireEvent.click(screen.getByText('保存'))

    expect(onSave).toHaveBeenCalledTimes(1)
    const savedProfile = onSave.mock.calls[0][0] as MemoryProfile
    expect(savedProfile.identity.nickname).toBe('新昵称')
    expect(savedProfile.scope.userId).toBe('user-1')
  })

  it('calls onCancel when clicking cancel', () => {
    const { onCancel } = renderEditor()

    fireEvent.click(screen.getByText('取消'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables all inputs when readOnly is true', () => {
    renderEditor({ readOnly: true })
    expandSection('身份信息')
    expandSection('性格特征')

    expect(screen.getByLabelText('昵称')).toBeDisabled()
    expect(screen.getByLabelText('职业')).toBeDisabled()
    expect(screen.getByLabelText('自我描述')).toBeDisabled()
    expect(screen.getByLabelText('MBTI 倾向')).toBeDisabled()
    expect(screen.queryByText('保存')).not.toBeInTheDocument()
    expect(screen.queryByText('取消')).not.toBeInTheDocument()
  })

  it('shows existing profile values in fields', () => {
    const profile = createMockProfile({
      identity: {
        nickname: '已有用户',
        ageGroup: 'adult',
        occupation: '设计师',
      },
      rhythm: {
        preferredSessionLength: 60,
        weeklyActiveDays: 3,
      },
    })
    renderEditor({ profile })
    expandSection('身份信息')
    expandSection('生活节奏')

    expect(screen.getByLabelText('昵称')).toHaveValue('已有用户')
    expect(screen.getByLabelText('职业')).toHaveValue('设计师')
    expect(screen.getByLabelText('偏好学习时长(分钟)')).toHaveValue(60)
    expect(screen.getByLabelText('每周活跃天数')).toHaveValue(3)
  })
})
