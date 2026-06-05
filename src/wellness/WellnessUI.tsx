import { useState, useCallback } from 'react'
import { Heart, Droplets, Flame, Utensils, Plus, Trash2, Target, Activity } from 'lucide-react'
import { createWellnessService, mealTypes, exerciseTypes } from './wellnessService'
import type { WellnessService, Meal } from './wellnessService'

interface WellnessUIProps {
  compact?: boolean
  service?: WellnessService
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#ef4444',
  accentLight: '#f87171',
  water: '#3b82f6',
  exercise: '#22c55e',
  income: '#4caf50',
  progressBg: '#2a2a4a',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
}

const mealTypeLabels: Record<Meal['type'], string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '零食'
}

export function WellnessUI({ compact = false, service: externalService }: WellnessUIProps) {
  const [service] = useState<WellnessService>(() => externalService ?? createWellnessService())
  const [activeTab, setActiveTab] = useState<'nutrition' | 'water' | 'exercise' | 'goals'>('nutrition')
  const [mealType, setMealType] = useState<Meal['type']>('lunch')
  const [mealName, setMealName] = useState('')
  const [mealCalories, setMealCalories] = useState('')
  const [waterAmount, setWaterAmount] = useState('250')
  const [exerciseType, setExerciseType] = useState('')
  const [exerciseDuration, setExerciseDuration] = useState('')
  const [exerciseCalories, setExerciseCalories] = useState('')
  const [goalType, setGoalType] = useState<'water' | 'exercise' | 'sleep'>('water')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalUnit, setGoalUnit] = useState('ml')

  const today = new Date().toISOString().split('T')[0]
  const nutrition = service.getDailyNutrition(today)
  const water = service.getDailyWater(today)
  const exercise = service.getDailyExercise(today)
  const state = service.getState()

  const waterGoal = service.getGoalProgress('water', today)
  const exerciseGoal = service.getGoalProgress('exercise', today)

  const handleAddMeal = useCallback(() => {
    if (!mealName || !mealCalories) return
    service.addMeal(mealType, mealName, parseInt(mealCalories))
    setMealName('')
    setMealCalories('')
  }, [service, mealType, mealName, mealCalories])

  const handleAddWater = useCallback(() => {
    if (!waterAmount) return
    service.addWater(parseInt(waterAmount))
  }, [service, waterAmount])

  const handleAddExercise = useCallback(() => {
    if (!exerciseType || !exerciseDuration || !exerciseCalories) return
    service.addExercise(exerciseType, parseInt(exerciseDuration), parseInt(exerciseCalories))
    setExerciseType('')
    setExerciseDuration('')
    setExerciseCalories('')
  }, [service, exerciseType, exerciseDuration, exerciseCalories])

  const handleSetGoal = useCallback(() => {
    if (!goalTarget) return
    service.setGoal(goalType, parseInt(goalTarget), goalUnit)
    setGoalTarget('')
  }, [service, goalType, goalTarget, goalUnit])

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Heart size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>健康生活</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, background: colors.inputBg, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.water, fontSize: 16, fontWeight: 700 }}>
              <Droplets size={14} />{water}
            </div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>饮水(ml)</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, background: colors.inputBg, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.exercise, fontSize: 16, fontWeight: 700 }}>
              <Flame size={14} />{exercise.totalDuration}
            </div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>运动(分钟)</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, background: colors.inputBg, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.accent, fontSize: 16, fontWeight: 700 }}>
              <Utensils size={14} />{nutrition.calories}
            </div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>卡路里</small>
          </div>
        </div>
        {waterGoal.target > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.cardBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: colors.textSecondary }}>饮水目标</span>
              <span>{waterGoal.percent}%</span>
            </div>
            <div style={{ height: 4, background: colors.progressBg, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${waterGoal.percent}%`, background: colors.water, borderRadius: 2 }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  const tabs = [
    { id: 'nutrition', label: '饮食', icon: Utensils },
    { id: 'water', label: '饮水', icon: Droplets },
    { id: 'exercise', label: '运动', icon: Activity },
    { id: 'goals', label: '目标', icon: Target },
  ] as const

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Heart size={24} style={{ color: colors.accent }} />健康生活
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? colors.accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : colors.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'nutrition' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>记录饮食</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as Meal['type'])}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                {mealTypes.map((type) => (<option key={type} value={type}>{mealTypeLabels[type]}</option>))}
              </select>
              <input
                type="number"
                placeholder="卡路里"
                value={mealCalories}
                onChange={(e) => setMealCalories(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <input
              type="text"
              placeholder="食物名称"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12 }}
            />
            <button
              onClick={handleAddMeal}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              记录饮食
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>今日营养 ({nutrition.calories} 卡路里)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>{nutrition.calories}</div>
                <small style={{ color: colors.textSecondary }}>卡路里</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.exercise }}>{nutrition.protein}g</div>
                <small style={{ color: colors.textSecondary }}>蛋白质</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.water }}>{nutrition.carbs}g</div>
                <small style={{ color: colors.textSecondary }}>碳水</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textSecondary }}>{nutrition.fat}g</div>
                <small style={{ color: colors.textSecondary }}>脂肪</small>
              </div>
            </div>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>今日饮食记录</h3>
            {state.meals.filter((m) => m.date === today).length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无记录</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {state.meals.filter((m) => m.date === today).map((meal) => (
                  <div key={meal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{meal.name}</div>
                      <small style={{ color: colors.textSecondary }}>{mealTypeLabels[meal.type]} · {meal.calories} 卡路里</small>
                    </div>
                    <button onClick={() => service.removeMeal(meal.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'water' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>快速饮水</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[100, 200, 250, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => service.addWater(amount)}
                  style={{ flex: 1, padding: '12px 16px', border: `1px solid ${colors.water}`, borderRadius: 8, background: 'transparent', color: colors.water, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  {amount}ml
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="自定义量(ml)"
                value={waterAmount}
                onChange={(e) => setWaterAmount(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <button
                onClick={handleAddWater}
                style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: colors.water, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                添加
              </button>
            </div>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>今日饮水 ({water}ml)</h3>
            {waterGoal.target > 0 && (
              <>
                <div style={{ height: 12, background: colors.progressBg, borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${waterGoal.percent}%`, background: colors.water, borderRadius: 6 }} />
                </div>
                <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
                  {waterGoal.current} / {waterGoal.target}ml ({waterGoal.percent}%)
                </p>
              </>
            )}
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>饮水记录</h3>
            {state.water.filter((w) => w.timestamp.split('T')[0] === today).length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无记录</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {state.water.filter((w) => w.timestamp.split('T')[0] === today).map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                    <span>{log.amount}ml</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <small style={{ color: colors.textSecondary }}>{new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</small>
                      <button onClick={() => service.removeWater(log.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exercise' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>记录运动</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="">选择运动</option>
                {exerciseTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
              </select>
              <input
                type="number"
                placeholder="时长(分钟)"
                value={exerciseDuration}
                onChange={(e) => setExerciseDuration(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <input
              type="number"
              placeholder="消耗卡路里"
              value={exerciseCalories}
              onChange={(e) => setExerciseCalories(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12 }}
            />
            <button
              onClick={handleAddExercise}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.exercise, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              记录运动
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>今日运动</h3>
            <div style={{ display: 'flex', gap: 24, textAlign: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.exercise }}>{exercise.totalDuration}</div>
                <small style={{ color: colors.textSecondary }}>分钟</small>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{exercise.totalCalories}</div>
                <small style={{ color: colors.textSecondary }}>卡路里</small>
              </div>
            </div>
            {exerciseGoal.target > 0 && (
              <>
                <div style={{ height: 8, background: colors.progressBg, borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${exerciseGoal.percent}%`, background: colors.exercise, borderRadius: 4 }} />
                </div>
                <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                  目标: {exerciseGoal.current}/{exerciseGoal.target}分钟 ({exerciseGoal.percent}%)
                </p>
              </>
            )}
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>运动记录</h3>
            {state.exercises.filter((e) => e.date === today).length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无记录</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {state.exercises.filter((e) => e.date === today).map((ex) => (
                  <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{ex.type}</div>
                      <small style={{ color: colors.textSecondary }}>{ex.duration}分钟 · {ex.calories}卡路里</small>
                    </div>
                    <button onClick={() => service.removeExercise(ex.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>设置健康目标</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select
                value={goalType}
                onChange={(e) => {
                  setGoalType(e.target.value as 'water' | 'exercise' | 'sleep')
                  setGoalUnit(e.target.value === 'water' ? 'ml' : e.target.value === 'exercise' ? '分钟' : '小时')
                }}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="water">每日饮水</option>
                <option value="exercise">每日运动</option>
                <option value="sleep">睡眠时长</option>
              </select>
              <input
                type="number"
                placeholder={`目标值 (${goalUnit})`}
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <button
              onClick={handleSetGoal}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              设置目标
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>我的目标</h3>
            {state.goals.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无目标</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {state.goals.map((goal) => {
                  const progress = service.getGoalProgress(goal.type, today)
                  return (
                    <div key={goal.id} style={{ padding: 16, background: colors.inputBg, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 500 }}>
                          {goal.type === 'water' ? '每日饮水' : goal.type === 'exercise' ? '每日运动' : '睡眠时长'}
                        </span>
                        <button onClick={() => service.removeGoal(goal.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ height: 8, background: colors.progressBg, borderRadius: 4, marginBottom: 8 }}>
                        <div style={{ height: '100%', width: `${progress.percent}%`, background: goal.type === 'water' ? colors.water : colors.exercise, borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textSecondary }}>
                        <span>当前: {progress.current}{goal.unit}</span>
                        <span>目标: {progress.target}{goal.unit} ({progress.percent}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}