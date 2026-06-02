import { useState } from 'react'
import type {
  MemoryProfile,
  MemoryProfileIdentity,
  MemoryProfilePersonality,
  MemoryProfileRhythm,
  MemoryProfileGoals,
  MemoryProfilePreferences,
  MemoryProfileBoundaries,
  MemoryProfileLearning,
  MemoryProfileEmotional,
  PersonalityTrait,
  AgeGroup,
  WorkStyle,
  PlanningStyle,
  MotivationStyle,
  FeedbackStyle,
  StressResponse,
  EnergyPeak,
  SleepPattern,
  BreakPreference,
  EncouragementStyle,
  ReminderFrequency,
  DetailLevel,
  LanguageStyle,
  LearningStyle,
  MoodTrend,
  MotivationLevel,
} from './memoryTypes'
import styles from './MemoryProfileEditorUI.module.css'

export interface MemoryProfileEditorUIProps {
  profile: MemoryProfile
  onSave: (profile: MemoryProfile) => void
  onCancel?: () => void
  readOnly?: boolean
}

const MBTI_OPTIONS: PersonalityTrait[] = [
  'MBTI_INTJ', 'MBTI_INTP', 'MBTI_ENTJ', 'MBTI_ENTP',
  'MBTI_INFJ', 'MBTI_INFP', 'MBTI_ENFJ', 'MBTI_ENFP',
  'MBTI_ISTJ', 'MBTI_ISFJ', 'MBTI_ESTJ', 'MBTI_ESFJ',
  'MBTI_ISTP', 'MBTI_ISFP', 'MBTI_ESTP', 'MBTI_ESFP',
  'unknown',
]

const AGE_GROUP_OPTIONS: AgeGroup[] = ['teen', 'young_adult', 'adult', 'middle_age', 'senior']
const WORK_STYLE_OPTIONS: WorkStyle[] = ['independent', 'collaborative', 'mixed']
const PLANNING_STYLE_OPTIONS: PlanningStyle[] = ['structured', 'flexible', 'minimal', 'adaptive']
const MOTIVATION_STYLE_OPTIONS: MotivationStyle[] = ['achievement', 'growth', 'connection', 'autonomy']
const FEEDBACK_STYLE_OPTIONS: FeedbackStyle[] = ['direct', 'gentle', 'humorous', 'data_driven']
const STRESS_RESPONSE_OPTIONS: StressResponse[] = ['push_harder', 'need_break', 'seek_help', 'avoid']
const ENERGY_PEAK_OPTIONS: EnergyPeak[] = ['morning', 'afternoon', 'evening', 'night_owl', 'flexible']
const SLEEP_PATTERN_OPTIONS: SleepPattern[] = ['early_bird', 'night_owl', 'irregular', 'stable']
const BREAK_PREFERENCE_OPTIONS: BreakPreference[] = ['pomodoro_25', 'pomodoro_50', 'flexible', 'long_deep']
const ENCOURAGEMENT_STYLE_OPTIONS: EncouragementStyle[] = ['cheerleader', 'coach', 'philosopher', 'silent_partner']
const REMINDER_FREQUENCY_OPTIONS: ReminderFrequency[] = ['high', 'medium', 'low', 'none']
const DETAIL_LEVEL_OPTIONS: DetailLevel[] = ['brief', 'moderate', 'detailed']
const LANGUAGE_STYLE_OPTIONS: LanguageStyle[] = ['casual', 'formal', 'academic', 'playful']
const LEARNING_STYLE_OPTIONS: LearningStyle[] = ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed']
const MOOD_TREND_OPTIONS: MoodTrend[] = ['improving', 'stable', 'declining', 'volatile']
const MOTIVATION_LEVEL_OPTIONS: MotivationLevel[] = ['high', 'medium', 'low', 'burnout_risk']

type SectionKey = 'identity' | 'personality' | 'rhythm' | 'goals' | 'preferences' | 'boundaries' | 'learning' | 'emotional'

const SECTION_LABELS: Record<SectionKey, string> = {
  identity: '身份信息',
  personality: '性格特征',
  rhythm: '生活节奏',
  goals: '目标规划',
  preferences: '交互偏好',
  boundaries: '边界与禁忌',
  learning: '学习特征',
  emotional: '情绪状态',
}

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ChipInput({ values, onChange, disabled, placeholder }: {
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault()
      const newValues = [...values, inputValue.trim()]
      onChange(newValues)
      setInputValue('')
    }
    if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  const handleRemove = (index: number) => {
    if (disabled) return
    onChange(values.filter((_, i) => i !== index))
  }

  const handleBlur = () => {
    if (disabled) return
    if (inputValue.trim()) {
      onChange([...values, inputValue.trim()])
      setInputValue('')
    }
  }

  return (
    <div className={styles.chipInput}>
      {values.map((value, index) => (
        <span key={index} className={styles.chip}>
          {value}
          {!disabled && (
            <span className={styles.chipRemove} onClick={() => handleRemove(index)}>×</span>
          )}
        </span>
      ))}
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={values.length === 0 ? placeholder : ''}
      />
    </div>
  )
}

function SelectField({ label, value, options, onChange, disabled }: {
  label: string
  value: string | undefined
  options: string[]
  onChange: (value: string | undefined) => void
  disabled?: boolean
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select
        className={styles.select}
        value={value ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        disabled={disabled}
      >
        <option value="">未选择</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{formatEnumLabel(opt)}</option>
        ))}
      </select>
    </div>
  )
}

function InputField({ label, value, onChange, disabled, type, placeholder }: {
  label: string
  value: string | number | undefined
  onChange: (value: string | number | undefined) => void
  disabled?: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type ?? 'text'}
        value={value ?? ''}
        onChange={e => {
          if (type === 'number') {
            onChange(e.target.value ? Number(e.target.value) : undefined)
          } else {
            onChange(e.target.value || undefined)
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, disabled, placeholder }: {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <textarea
        className={styles.textarea}
        value={value ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  )
}

function Section({ sectionKey, expanded, onToggle, children }: {
  sectionKey: SectionKey
  expanded: boolean
  onToggle: (key: SectionKey) => void
  children: React.ReactNode
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => onToggle(sectionKey)}>
        <span>{SECTION_LABELS[sectionKey]}</span>
        <span className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}>▼</span>
      </div>
      <div className={`${styles.sectionContent} ${expanded ? styles.expanded : ''}`}>
        {children}
      </div>
    </div>
  )
}

export function MemoryProfileEditorUI({ profile, onSave, onCancel, readOnly }: MemoryProfileEditorUIProps) {
  const [localProfile, setLocalProfile] = useState<MemoryProfile>(() => structuredClone(profile))
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set())

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const updateIdentity = (patch: Partial<MemoryProfileIdentity>) => {
    setLocalProfile(prev => ({ ...prev, identity: { ...prev.identity, ...patch } }))
  }

  const updatePersonality = (patch: Partial<MemoryProfilePersonality>) => {
    setLocalProfile(prev => ({ ...prev, personality: { ...prev.personality, ...patch } }))
  }

  const updateRhythm = (patch: Partial<MemoryProfileRhythm>) => {
    setLocalProfile(prev => ({ ...prev, rhythm: { ...prev.rhythm, ...patch } }))
  }

  const updateGoals = (patch: Partial<MemoryProfileGoals>) => {
    setLocalProfile(prev => ({ ...prev, goals: { ...prev.goals, ...patch } }))
  }

  const updatePreferences = (patch: Partial<MemoryProfilePreferences>) => {
    setLocalProfile(prev => ({ ...prev, preferences: { ...prev.preferences, ...patch } }))
  }

  const updateBoundaries = (patch: Partial<MemoryProfileBoundaries>) => {
    setLocalProfile(prev => ({ ...prev, boundaries: { ...prev.boundaries, ...patch } }))
  }

  const updateLearning = (patch: Partial<MemoryProfileLearning>) => {
    setLocalProfile(prev => ({ ...prev, learning: { ...prev.learning, ...patch } }))
  }

  const updateEmotional = (patch: Partial<MemoryProfileEmotional>) => {
    setLocalProfile(prev => ({ ...prev, emotional: { ...prev.emotional, ...patch } }))
  }

  const handleSave = () => {
    onSave(localProfile)
  }

  const isDisabled = readOnly === true

  return (
    <div className={`${styles.container} ${isDisabled ? styles.readOnly : ''}`}>
      <Section sectionKey="identity" expanded={expandedSections.has('identity')} onToggle={toggleSection}>
        <InputField label="昵称" value={localProfile.identity.nickname} onChange={v => updateIdentity({ nickname: v as string })} disabled={isDisabled} />
        <SelectField label="年龄段" value={localProfile.identity.ageGroup} options={AGE_GROUP_OPTIONS} onChange={v => updateIdentity({ ageGroup: v as AgeGroup })} disabled={isDisabled} />
        <InputField label="职业" value={localProfile.identity.occupation} onChange={v => updateIdentity({ occupation: v as string })} disabled={isDisabled} />
        <InputField label="当前角色" value={localProfile.identity.currentRole} onChange={v => updateIdentity({ currentRole: v as string })} disabled={isDisabled} />
        <InputField label="组织" value={localProfile.identity.organization} onChange={v => updateIdentity({ organization: v as string })} disabled={isDisabled} />
        <InputField label="人生阶段" value={localProfile.identity.lifeStage} onChange={v => updateIdentity({ lifeStage: v as string })} disabled={isDisabled} />
      </Section>

      <Section sectionKey="personality" expanded={expandedSections.has('personality')} onToggle={toggleSection}>
        <SelectField label="MBTI 倾向" value={localProfile.personality.mbtiTendency} options={MBTI_OPTIONS} onChange={v => updatePersonality({ mbtiTendency: v as PersonalityTrait })} disabled={isDisabled} />
        <SelectField label="工作风格" value={localProfile.personality.workStyle} options={WORK_STYLE_OPTIONS} onChange={v => updatePersonality({ workStyle: v as WorkStyle })} disabled={isDisabled} />
        <SelectField label="规划风格" value={localProfile.personality.planningStyle} options={PLANNING_STYLE_OPTIONS} onChange={v => updatePersonality({ planningStyle: v as PlanningStyle })} disabled={isDisabled} />
        <SelectField label="动机风格" value={localProfile.personality.motivationStyle} options={MOTIVATION_STYLE_OPTIONS} onChange={v => updatePersonality({ motivationStyle: v as MotivationStyle })} disabled={isDisabled} />
        <SelectField label="反馈风格" value={localProfile.personality.feedbackStyle} options={FEEDBACK_STYLE_OPTIONS} onChange={v => updatePersonality({ feedbackStyle: v as FeedbackStyle })} disabled={isDisabled} />
        <SelectField label="压力反应" value={localProfile.personality.stressResponse} options={STRESS_RESPONSE_OPTIONS} onChange={v => updatePersonality({ stressResponse: v as StressResponse })} disabled={isDisabled} />
        <TextareaField label="自我描述" value={localProfile.personality.selfDescription} onChange={v => updatePersonality({ selfDescription: v as string })} disabled={isDisabled} />
      </Section>

      <Section sectionKey="rhythm" expanded={expandedSections.has('rhythm')} onToggle={toggleSection}>
        <SelectField label="精力高峰" value={localProfile.rhythm.energyPeak} options={ENERGY_PEAK_OPTIONS} onChange={v => updateRhythm({ energyPeak: v as EnergyPeak })} disabled={isDisabled} />
        <InputField label="典型学习时段" value={localProfile.rhythm.typicalStudyHours} onChange={v => updateRhythm({ typicalStudyHours: v as string })} disabled={isDisabled} />
        <SelectField label="睡眠模式" value={localProfile.rhythm.sleepPattern} options={SLEEP_PATTERN_OPTIONS} onChange={v => updateRhythm({ sleepPattern: v as SleepPattern })} disabled={isDisabled} />
        <InputField label="偏好学习时长(分钟)" value={localProfile.rhythm.preferredSessionLength} onChange={v => updateRhythm({ preferredSessionLength: v as number })} disabled={isDisabled} type="number" />
        <SelectField label="休息偏好" value={localProfile.rhythm.breakPreference} options={BREAK_PREFERENCE_OPTIONS} onChange={v => updateRhythm({ breakPreference: v as BreakPreference })} disabled={isDisabled} />
        <InputField label="每周活跃天数" value={localProfile.rhythm.weeklyActiveDays} onChange={v => updateRhythm({ weeklyActiveDays: v as number })} disabled={isDisabled} type="number" />
      </Section>

      <Section sectionKey="goals" expanded={expandedSections.has('goals')} onToggle={toggleSection}>
        <InputField label="主要目标" value={localProfile.goals.primaryGoal} onChange={v => updateGoals({ primaryGoal: v as string })} disabled={isDisabled} />
        <div className={styles.field}>
          <label className={styles.label}>次要目标</label>
          <ChipInput values={localProfile.goals.secondaryGoals ?? []} onChange={v => updateGoals({ secondaryGoals: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>目标考试</label>
          <ChipInput values={localProfile.goals.targetExams ?? []} onChange={v => updateGoals({ targetExams: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <InputField label="目标日期" value={localProfile.goals.targetDate} onChange={v => updateGoals({ targetDate: v as string })} disabled={isDisabled} type="date" />
        <InputField label="职业方向" value={localProfile.goals.careerDirection} onChange={v => updateGoals({ careerDirection: v as string })} disabled={isDisabled} />
      </Section>

      <Section sectionKey="preferences" expanded={expandedSections.has('preferences')} onToggle={toggleSection}>
        <SelectField label="鼓励风格" value={localProfile.preferences.encouragementStyle} options={ENCOURAGEMENT_STYLE_OPTIONS} onChange={v => updatePreferences({ encouragementStyle: v as EncouragementStyle })} disabled={isDisabled} />
        <SelectField label="提醒频率" value={localProfile.preferences.reminderFrequency} options={REMINDER_FREQUENCY_OPTIONS} onChange={v => updatePreferences({ reminderFrequency: v as ReminderFrequency })} disabled={isDisabled} />
        <SelectField label="详细程度" value={localProfile.preferences.detailLevel} options={DETAIL_LEVEL_OPTIONS} onChange={v => updatePreferences({ detailLevel: v as DetailLevel })} disabled={isDisabled} />
        <SelectField label="语言风格" value={localProfile.preferences.languageStyle} options={LANGUAGE_STYLE_OPTIONS} onChange={v => updatePreferences({ languageStyle: v as LanguageStyle })} disabled={isDisabled} />
      </Section>

      <Section sectionKey="boundaries" expanded={expandedSections.has('boundaries')} onToggle={toggleSection}>
        <div className={styles.field}>
          <label className={styles.label}>禁忌话题</label>
          <ChipInput values={localProfile.boundaries.tabooTopics ?? []} onChange={v => updateBoundaries({ tabooTopics: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>触发词</label>
          <ChipInput values={localProfile.boundaries.triggerWords ?? []} onChange={v => updateBoundaries({ triggerWords: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>不要提及</label>
          <ChipInput values={localProfile.boundaries.dontMention ?? []} onChange={v => updateBoundaries({ dontMention: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>敏感领域</label>
          <ChipInput values={localProfile.boundaries.sensitiveAreas ?? []} onChange={v => updateBoundaries({ sensitiveAreas: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
      </Section>

      <Section sectionKey="learning" expanded={expandedSections.has('learning')} onToggle={toggleSection}>
        <div className={styles.field}>
          <label className={styles.label}>擅长科目</label>
          <ChipInput values={localProfile.learning.strongSubjects ?? []} onChange={v => updateLearning({ strongSubjects: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>薄弱科目</label>
          <ChipInput values={localProfile.learning.weakSubjects ?? []} onChange={v => updateLearning({ weakSubjects: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <SelectField label="学习风格" value={localProfile.learning.learningStyle} options={LEARNING_STYLE_OPTIONS} onChange={v => updateLearning({ learningStyle: v as LearningStyle })} disabled={isDisabled} />
        <div className={styles.field}>
          <label className={styles.label}>常见障碍</label>
          <ChipInput values={localProfile.learning.commonBlockers ?? []} onChange={v => updateLearning({ commonBlockers: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>有效策略</label>
          <ChipInput values={localProfile.learning.effectiveStrategies ?? []} onChange={v => updateLearning({ effectiveStrategies: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
      </Section>

      <Section sectionKey="emotional" expanded={expandedSections.has('emotional')} onToggle={toggleSection}>
        <SelectField label="当前情绪趋势" value={localProfile.emotional.currentMoodTrend} options={MOOD_TREND_OPTIONS} onChange={v => updateEmotional({ currentMoodTrend: v as MoodTrend })} disabled={isDisabled} />
        <SelectField label="动机水平" value={localProfile.emotional.motivationLevel} options={MOTIVATION_LEVEL_OPTIONS} onChange={v => updateEmotional({ motivationLevel: v as MotivationLevel })} disabled={isDisabled} />
        <div className={styles.field}>
          <label className={styles.label}>支持需求</label>
          <ChipInput values={localProfile.emotional.supportNeeds ?? []} onChange={v => updateEmotional({ supportNeeds: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>近期成就</label>
          <ChipInput values={localProfile.emotional.recentWins ?? []} onChange={v => updateEmotional({ recentWins: v })} disabled={isDisabled} placeholder="输入后按回车添加" />
        </div>
      </Section>

      {!isDisabled && (
        <div className={styles.actions}>
          {onCancel && (
            <button className={styles.cancelButton} onClick={onCancel}>取消</button>
          )}
          <button className={styles.saveButton} onClick={handleSave}>保存</button>
        </div>
      )}
    </div>
  )
}
