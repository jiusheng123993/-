/**
 * 喂养建议页面
 * 宠物个性化喂养方案与建议
 */
import { View, Text, ScrollView, Input, Textarea, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useEffect, useState, useCallback } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import {
  buildFeedingProfile,
  generatePersonalizedAdvice,
  getMealPlan,
  type PersonalizedFeedingAdvice,
  type FeedingProfile,
} from '../../services/feedingService'
import { getChronicRecords } from '../../services/chronicService'
import { DietMemoryAdapter } from '../../memory-body/adapters/dietMemoryAdapter'
import './index.scss'

interface FeedingRecord {
  id: string
  petId: string
  date: string
  foodType: string
  brand: string
  amount: number
  unit: string
  mealTime: string
  appetite: 'good' | 'normal' | 'poor'
  stool: 'normal' | 'loose' | 'hard'
  energy: 'high' | 'normal' | 'low'
  notes: string
  createdAt: string
}

const STORAGE_KEY = 'feeding_records'

function getStorage(key: string) {
  try {
    const data = Taro.getStorageSync(`xhh_${key}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function setStorage(key: string, value: unknown) {
  try {
    Taro.setStorageSync(`xhh_${key}`, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const ADVICE_PRIORITY_CONFIG = {
  high: { bg: 'rgba(245, 34, 45, 0.08)', border: 'rgba(245, 34, 45, 0.2)' },
  medium: { bg: 'rgba(250, 173, 20, 0.08)', border: 'rgba(250, 173, 20, 0.2)' },
  low: { bg: 'rgba(82, 196, 26, 0.06)', border: 'rgba(82, 196, 26, 0.15)' },
}

export default function FeedingAdvicePage() {
  const themeClass = useThemeClass()
  const user = useAuthStore(state => state.user)
  const { currentPet, pets, fetchPets } = usePetStore()
  const [records, setRecords] = useState<FeedingRecord[]>([])
  const [advice, setAdvice] = useState<PersonalizedFeedingAdvice[]>([])
  const [mealPlan, setMealPlan] = useState<Array<{ time: string; label: string; ratio: string }>>([])
  const [profile, setProfile] = useState<FeedingProfile | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [activeTab, setActiveTab] = useState<'advice' | 'records' | 'plan'>('advice')

  const pet = currentPet || pets[0]

  useDidShow(() => {
    if (user && !pets.length) {
      fetchPets(user.id)
    }
  })

  const loadData = useCallback(() => {
    if (!pet || !user) return
    const all = getStorage(STORAGE_KEY) || {}
    const petRecords: FeedingRecord[] = (all[pet.id] || []).sort(
      (a: FeedingRecord, b: FeedingRecord) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    setRecords(petRecords)

    const chronicRecords = getChronicRecords(pet.id, user.id)
    const feedingProfile = buildFeedingProfile(pet, chronicRecords)
    setProfile(feedingProfile)
    setMealPlan(getMealPlan(feedingProfile))

    const latestRecord = petRecords[0]
    const personalizedAdvice = generatePersonalizedAdvice(
      feedingProfile,
      latestRecord?.appetite,
      latestRecord?.stool,
    )
    setAdvice(personalizedAdvice)
  }, [pet, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const saveRecords = (newRecords: FeedingRecord[]) => {
    if (!pet || !user) return
    const all = getStorage(STORAGE_KEY) || {}
    all[pet.id] = newRecords
    setStorage(STORAGE_KEY, all)
    setRecords(newRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  const handleAdd = (data: Omit<FeedingRecord, 'id' | 'petId' | 'createdAt'>) => {
    const newRecord: FeedingRecord = {
      ...data,
      id: generateId(),
      petId: pet!.id,
      createdAt: new Date().toISOString(),
    }
    saveRecords([newRecord, ...records])
    setShowAdd(false)
    Taro.showToast({ title: '记录成功', icon: 'success' })

    // 记录喂养到记忆引擎
    if (user?.id && pet?.id) {
      try {
        const dietAdapter = new DietMemoryAdapter(user.id)
        dietAdapter.recordFeeding(pet.id, data.foodType, {
          date: data.date || new Date().toISOString().split('T')[0],
          amount: data.amount,
          reaction: data.appetite === 'good' ? 'good' : data.appetite === 'poor' ? 'refused' : 'normal',
        })
      } catch (e) {
        // 记忆记录失败不影响主流程
      }
    }

    loadData()
  }

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条饮食记录吗？',
      success: (res) => {
        if (res.confirm) {
          saveRecords(records.filter(r => r.id !== id))
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  if (!pet) {
    return (
      <View className='feeding-empty'>
        <Text className='feeding-empty-text'>请先添加宠物</Text>
      </View>
    )
  }

  return (
    <ScrollView className={`feeding-page ${themeClass}`} scrollY>
      <View className='feeding-header'>
        <Text className='feeding-title'>喂养建议</Text>
        <Text className='feeding-subtitle'>{pet.name} 的个性化饮食管理</Text>
      </View>

      {profile && (
        <View className='feeding-profile-cards'>
          <View className='feeding-profile-card'>
            <Text className='feeding-profile-value'>{profile.ageMonths}个月</Text>
            <Text className='feeding-profile-label'>年龄</Text>
          </View>
          <View className='feeding-profile-card'>
            <Text className='feeding-profile-value'>{profile.weight}kg</Text>
            <Text className='feeding-profile-label'>体重</Text>
          </View>
          <View className='feeding-profile-card'>
            <Text className='feeding-profile-value'>{profile.chronicConditions.length}</Text>
            <Text className='feeding-profile-label'>慢性病</Text>
          </View>
          <View className='feeding-profile-card'>
            <Text className='feeding-profile-value'>{profile.allergies.length}</Text>
            <Text className='feeding-profile-label'>过敏项</Text>
          </View>
        </View>
      )}

      <View className='feeding-tabs'>
        {(['advice', 'plan', 'records'] as const).map(tab => (
          <View
            key={tab}
            className={`feeding-tab ${activeTab === tab ? 'feeding-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <Text>{tab === 'advice' ? '智能建议' : tab === 'plan' ? '喂食计划' : '饮食记录'}</Text>
          </View>
        ))}
      </View>

      <View className='feeding-actions'>
        <View className='feeding-add-btn' onClick={() => setShowAdd(true)}>
          <Text className='feeding-add-icon'>+</Text>
          <Text>记录今日饮食</Text>
        </View>
      </View>

      {activeTab === 'advice' && (
        <View className='feeding-content'>
          {advice.length === 0 && (
            <View className='feeding-empty-state'>
              <Text className='feeding-empty-icon'>💡</Text>
              <Text className='feeding-empty-title'>暂无建议</Text>
              <Text className='feeding-empty-hint'>完善宠物信息并记录饮食后将生成个性化建议</Text>
            </View>
          )}
          {advice.map((item, index) => (
            <View
              key={index}
              className='feeding-advice-card'
              style={{
                background: ADVICE_PRIORITY_CONFIG[item.priority].bg,
                borderLeftColor: item.priority === 'high' ? '#f5222d' : item.priority === 'medium' ? '#faad14' : '#52c41a',
              }}
            >
              <View className='feeding-advice-header'>
                <Text className='feeding-advice-icon'>{item.icon}</Text>
                <Text className='feeding-advice-title'>{item.title}</Text>
              </View>
              <Text className='feeding-advice-content'>{item.content}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'plan' && (
        <View className='feeding-content'>
          <View className='feeding-plan-header'>
            <Text className='feeding-plan-title'>每日喂食计划</Text>
            <Text className='feeding-plan-subtitle'>
              基于 {pet.name} 的品种、年龄、体重和健康状况制定
            </Text>
          </View>

          <View className='feeding-plan-timeline'>
            {mealPlan.map((meal, index) => (
              <View key={index} className='feeding-plan-item'>
                <View className='feeding-plan-time-line'>
                  <View className='feeding-plan-dot' />
                  {index < mealPlan.length - 1 && <View className='feeding-plan-line' />}
                </View>
                <View className='feeding-plan-card'>
                  <View className='feeding-plan-card-header'>
                    <Text className='feeding-plan-time'>{meal.time}</Text>
                    <Text className='feeding-plan-ratio'>{meal.ratio}</Text>
                  </View>
                  <Text className='feeding-plan-label'>{meal.label}</Text>
                  <Text className='feeding-plan-tip'>
                    {meal.label === '早餐'
                      ? '早晨喂食帮助开启一天的代谢'
                      : meal.label === '午餐'
                        ? '中午补充能量'
                        : meal.label === '晚餐'
                          ? '晚餐在睡前2小时完成'
                          : '少量夜宵避免夜间饥饿'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {profile && (
            <View className='feeding-plan-tips'>
              <Text className='feeding-plan-tips-title'>💡 喂养小贴士</Text>
              <View className='feeding-plan-tip-item'>
                <Text className='feeding-plan-tip-text'>• 固定喂食时间，帮助宠物建立规律的消化节奏</Text>
              </View>
              <View className='feeding-plan-tip-item'>
                <Text className='feeding-plan-tip-text'>• 每次喂食前后检查毛发、眼睛、耳朵状态</Text>
              </View>
              <View className='feeding-plan-tip-item'>
                <Text className='feeding-plan-tip-text'>• 使用慢食碗可以帮助吃饭太快的宠物</Text>
              </View>
              <View className='feeding-plan-tip-item'>
                <Text className='feeding-plan-tip-text'>• 确保随时有新鲜干净的饮水</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === 'records' && (
        <View className='feeding-content'>
          {records.length === 0 && (
            <View className='feeding-empty-state'>
              <Text className='feeding-empty-icon'>🍽️</Text>
              <Text className='feeding-empty-title'>暂无饮食记录</Text>
              <Text className='feeding-empty-hint'>点击上方按钮记录今日饮食</Text>
            </View>
          )}
          {records.map(record => (
            <View key={record.id} className='feeding-record-card'>
              <View className='feeding-record-header'>
                <Text className='feeding-record-date'>{record.date}</Text>
                <View className='feeding-record-header-right'>
                  <Text className={`feeding-record-appetite feeding-appetite-${record.appetite}`}>
                    {record.appetite === 'good' ? '食欲好' : record.appetite === 'normal' ? '食欲一般' : '食欲差'}
                  </Text>
                  <View className='feeding-record-delete' onClick={() => handleDelete(record.id)}>
                    <Text className='feeding-record-delete-icon'>×</Text>
                  </View>
                </View>
              </View>
              <View className='feeding-record-body'>
                <Text className='feeding-record-food'>
                  {record.foodType} {record.brand ? `(${record.brand})` : ''}
                </Text>
                <Text className='feeding-record-amount'>
                  {record.amount}{record.unit} · {record.mealTime}
                </Text>
                <View className='feeding-record-tags'>
                  <Text className={`feeding-record-tag feeding-stool-${record.stool}`}>
                    💩 {record.stool === 'normal' ? '正常' : record.stool === 'loose' ? '软便' : '便秘'}
                  </Text>
                  <Text className={`feeding-record-tag feeding-energy-${record.energy}`}>
                    ⚡ {record.energy === 'high' ? '精力充沛' : record.energy === 'normal' ? '精神一般' : '精神差'}
                  </Text>
                </View>
                {record.notes && <Text className='feeding-record-notes'>{record.notes}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      <View className='feeding-bottom-safe' />

      {showAdd && (
        <AddFeedingModal
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </ScrollView>
  )
}

const UNIT_OPTIONS = ['g', 'kg', '杯', '勺']

function AddFeedingModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: Omit<FeedingRecord, 'id' | 'petId' | 'createdAt'>) => void
  onClose: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today,
    foodType: '',
    brand: '',
    amount: '',
    unit: 'g',
    mealTime: '早餐',
    appetite: 'good' as 'good' | 'normal' | 'poor',
    stool: 'normal' as 'normal' | 'loose' | 'hard',
    energy: 'normal' as 'high' | 'normal' | 'low',
    notes: '',
  })

  const handleDateChange = (e: { detail: { value: string } }) => {
    setForm({ ...form, date: e.detail.value })
  }

  const handleUnitChange = (e: { detail: { value: number } }) => {
    setForm({ ...form, unit: UNIT_OPTIONS[e.detail.value] })
  }

  const handleInput = (field: string) => (e: { detail: { value: string } }) => {
    setForm({ ...form, [field]: e.detail.value })
  }

  const handleSubmit = () => {
    if (!form.foodType.trim()) {
      Taro.showToast({ title: '请输入食物类型', icon: 'none' })
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      Taro.showToast({ title: '请输入有效分量', icon: 'none' })
      return
    }

    onSubmit({
      ...form,
      amount: Number(form.amount),
    })
  }

  return (
    <View className='feeding-modal-overlay' onClick={onClose}>
      <View className='feeding-modal' onClick={e => e.stopPropagation()}>
        <View className='feeding-modal-header'>
          <Text className='feeding-modal-title'>记录饮食</Text>
          <Text className='feeding-modal-close' onClick={onClose}>×</Text>
        </View>

        <ScrollView className='feeding-modal-body' scrollY>
          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>日期 *</Text>
            <Picker mode='date' value={form.date} onChange={handleDateChange as (e: unknown) => void}>
              <View className='feeding-form-picker'>
                <Text>{form.date}</Text>
              </View>
            </Picker>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>食物类型 *</Text>
            <Input
              className='feeding-form-input'
              placeholder='如：干粮、湿粮、自制等'
              value={form.foodType}
              onInput={handleInput('foodType')}
            />
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>品牌</Text>
            <Input
              className='feeding-form-input'
              placeholder='如：皇家、渴望等'
              value={form.brand}
              onInput={handleInput('brand')}
            />
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>分量 *</Text>
            <View className='feeding-form-amount'>
              <Input
                className='feeding-form-input feeding-form-amount-input'
                placeholder='0'
                type='number'
                value={form.amount}
                onInput={handleInput('amount')}
              />
              <Picker mode='selector' range={UNIT_OPTIONS} value={UNIT_OPTIONS.indexOf(form.unit)} onChange={handleUnitChange as (e: unknown) => void}>
                <View className='feeding-form-unit'>
                  <Text>{form.unit}</Text>
                </View>
              </Picker>
            </View>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>餐次</Text>
            <View className='feeding-form-meals'>
              {['早餐', '午餐', '晚餐', '加餐'].map(meal => (
                <View
                  key={meal}
                  className={`feeding-meal-option ${form.mealTime === meal ? 'feeding-meal-active' : ''}`}
                  onClick={() => setForm({ ...form, mealTime: meal })}
                >
                  <Text>{meal}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>食欲</Text>
            <View className='feeding-form-rating'>
              {[
                { value: 'good', label: '好' },
                { value: 'normal', label: '一般' },
                { value: 'poor', label: '差' },
              ].map(item => (
                <View
                  key={item.value}
                  className={`feeding-rating-option ${form.appetite === item.value ? 'feeding-rating-active' : ''}`}
                  onClick={() => setForm({ ...form, appetite: item.value as 'good' | 'normal' | 'poor' })}
                >
                  <Text className='feeding-rating-label'>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>便便</Text>
            <View className='feeding-form-rating'>
              {[
                { value: 'normal', label: '正常' },
                { value: 'loose', label: '软便' },
                { value: 'hard', label: '便秘' },
              ].map(item => (
                <View
                  key={item.value}
                  className={`feeding-rating-option ${form.stool === item.value ? 'feeding-rating-active' : ''}`}
                  onClick={() => setForm({ ...form, stool: item.value as 'normal' | 'loose' | 'hard' })}
                >
                  <Text className='feeding-rating-label'>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>精神状态</Text>
            <View className='feeding-form-rating'>
              {[
                { value: 'high', label: '活跃' },
                { value: 'normal', label: '正常' },
                { value: 'low', label: '疲倦' },
              ].map(item => (
                <View
                  key={item.value}
                  className={`feeding-rating-option ${form.energy === item.value ? 'feeding-rating-active' : ''}`}
                  onClick={() => setForm({ ...form, energy: item.value as 'high' | 'normal' | 'low' })}
                >
                  <Text className='feeding-rating-label'>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>备注</Text>
            <Textarea
              className='feeding-form-textarea'
              placeholder='其他需要记录的信息'
              value={form.notes}
              onInput={handleInput('notes')}
            />
          </View>
        </ScrollView>

        <View className='feeding-modal-footer'>
          <View className='feeding-modal-btn feeding-modal-btn-cancel' onClick={onClose}>
            <Text>取消</Text>
          </View>
          <View className='feeding-modal-btn feeding-modal-btn-confirm' onClick={handleSubmit}>
            <Text>保存</Text>
          </View>
        </View>
      </View>
    </View>
  )
}