import { useState, useCallback } from 'react'
import type { FlowLevel, PainLevel, SymptomType, MoodType } from './cycleTypes'
import { FLOW_LABELS, SYMptom_LABELS, MOOD_LABELS } from './cycleTypes'
import { cycleService } from './cycleService'
import { Save, X } from 'lucide-react'

type CycleDayDetailProps = {
  date: string
  onClose: () => void
  onSave: () => void
}

const SYMPTOM_OPTIONS: SymptomType[] = [
  'headache', 'back_pain', 'bloating', 'cramps', 'fatigue',
  'acne', 'breast_tenderness', 'nausea', 'dizziness', 'insomnia'
]

const MOOD_OPTIONS: MoodType[] = [
  'happy', 'calm', 'neutral', 'anxious', 'irritable',
  'sad', 'depressed', 'energetic', 'creative'
]

const PAIN_SCALE: PainLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function CycleDayDetail({ date, onClose, onSave }: CycleDayDetailProps) {
  const existing = cycleService.getRecordByDate(date)

  const [flow, setFlow] = useState<FlowLevel | undefined>(existing?.flow)
  const [pain, setPain] = useState<PainLevel | undefined>(existing?.pain)
  const [symptoms, setSymptoms] = useState<SymptomType[]>(existing?.symptoms ?? [])
  const [moods, setMoods] = useState<MoodType[]>(existing?.moods ?? [])
  const [sleepHours, setSleepHours] = useState<number | undefined>(existing?.sleepHours)
  const [exerciseMinutes, setExerciseMinutes] = useState<number | undefined>(existing?.exerciseMinutes)
  const [waterGlasses, setWaterGlasses] = useState<number | undefined>(existing?.waterGlasses)
  const [notes, setNotes] = useState<string | undefined>(existing?.notes)

  const toggleSymptom = useCallback((s: SymptomType) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }, [])

  const toggleMood = useCallback((m: MoodType) => {
    setMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }, [])

  const handleSave = useCallback(() => {
    cycleService.addRecord({
      date,
      flow,
      pain,
      symptoms,
      moods,
      sleepHours,
      exerciseMinutes,
      waterGlasses,
      notes
    })
    onSave()
  }, [date, flow, pain, symptoms, moods, sleepHours, exerciseMinutes, waterGlasses, notes, onSave])

  return (
    <div className="cycle-day-detail">
      <div className="cycle-day-detail-header">
        <h3>{date}</h3>
        <button onClick={onClose} type="button" className="cycle-close-btn">
          <X size={18} />
        </button>
      </div>

      <div className="cycle-detail-section">
        <h4>经量</h4>
        <div className="cycle-flow-options">
          {(Object.entries(FLOW_LABELS) as [FlowLevel, string][]).map(([value, label]) => (
            <button
              key={value}
              className={`cycle-option-btn ${flow === value ? 'active' : ''}`}
              onClick={() => setFlow(flow === value ? undefined : value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="cycle-detail-section">
        <h4>痛经等级</h4>
        <div className="cycle-pain-scale">
          {PAIN_SCALE.map(level => (
            <button
              key={level}
              className={`cycle-pain-btn ${pain === level ? 'active' : ''}`}
              onClick={() => setPain(pain === level ? undefined : level)}
              type="button"
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="cycle-detail-section">
        <h4>症状</h4>
        <div className="cycle-symptom-grid">
          {SYMPTOM_OPTIONS.map(s => (
            <button
              key={s}
              className={`cycle-option-btn small ${symptoms.includes(s) ? 'active' : ''}`}
              onClick={() => toggleSymptom(s)}
              type="button"
            >
              {SYMptom_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="cycle-detail-section">
        <h4>情绪</h4>
        <div className="cycle-mood-grid">
          {MOOD_OPTIONS.map(m => (
            <button
              key={m}
              className={`cycle-option-btn small ${moods.includes(m) ? 'active' : ''}`}
              onClick={() => toggleMood(m)}
              type="button"
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="cycle-detail-section">
        <h4>生活记录</h4>
        <div className="cycle-life-inputs">
          <div className="cycle-input-group">
            <label>睡眠(小时)</label>
            <input
              type="number"
              min={0}
              max={24}
              value={sleepHours ?? ''}
              onChange={e => setSleepHours(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="cycle-input-group">
            <label>运动(分钟)</label>
            <input
              type="number"
              min={0}
              max={600}
              value={exerciseMinutes ?? ''}
              onChange={e => setExerciseMinutes(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="cycle-input-group">
            <label>饮水(杯)</label>
            <input
              type="number"
              min={0}
              max={20}
              value={waterGlasses ?? ''}
              onChange={e => setWaterGlasses(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

      <div className="cycle-detail-section">
        <h4>备注</h4>
        <textarea
          className="cycle-notes-input"
          value={notes ?? ''}
          onChange={e => setNotes(e.target.value || undefined)}
          placeholder="记录今天的状态..."
          rows={3}
        />
      </div>

      <button className="cycle-save-btn" onClick={handleSave} type="button">
        <Save size={16} />
        <span>保存记录</span>
      </button>
    </div>
  )
}
