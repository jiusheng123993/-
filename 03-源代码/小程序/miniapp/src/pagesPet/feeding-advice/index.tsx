import { View, Text, ScrollView, Input, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
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

interface FeedingAdvice {
  type: 'daily_amount' | 'meal_frequency' | 'food_type' | 'supplement' | 'warning'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
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

export default function FeedingAdvicePage() {
  const user = useAuthStore(state => state.user)
  const { currentPet, pets } = usePetStore()
  const [records, setRecords] = useState<FeedingRecord[]>([])
  const [showAdd, setShowAdd] = useState(false)

  const pet = currentPet || pets[0]

  useEffect(() => {
    if (!pet) return
    const all = getStorage(STORAGE_KEY) || {}
    const petRecords = all[pet.id] || []
    setRecords(petRecords.sort((a: FeedingRecord, b: FeedingRecord) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ))
  }, [pet?.id])

  const saveRecords = (newRecords: FeedingRecord[]) => {
    if (!pet) return
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
  }

  const generateAdvice = (): FeedingAdvice[] => {
    if (!pet) return []

    const advice: FeedingAdvice[] = []
    const recentRecords = records.slice(0, 7)

    if (recentRecords.length === 0) {
      advice.push({
        type: 'daily_amount',
        title: '开始记录饮食',
        content: '建议每天记录宠物的饮食情况，包括食物类型、分量和进食状态，以便获得个性化喂养建议。',
        priority: 'high',
      })
      return advice
    }

    const poorAppetite = recentRecords.filter(r => r.appetite === 'poor').length
    if (poorAppetite >= 2) {
      advice.push({
        type: 'warning',
        title: '食欲下降预警',
        content: `最近${recentRecords.length}天内有${poorAppetite}次食欲不佳记录，建议观察宠物精神状态，必要时咨询兽医。`,
        priority: 'high',
      })
    }

    const looseStool = recentRecords.filter(r => r.stool === 'loose').length
    if (looseStool >= 2) {
      advice.push({
        type: 'warning',
        title: '软便预警',
        content: `最近${recentRecords.length}天内有${looseStool}次软便记录，建议检查食物是否新鲜，或考虑更换易消化配方。`,
        priority: 'high',
      })
    }

    const hardStool = recentRecords.filter(r => r.stool === 'hard').length
    if (hardStool >= 2) {
      advice.push({
        type: 'supplement',
        title: '便秘风险',
        content: '近期有便秘倾向，建议增加饮水量，可适量添加南瓜泥或益生菌。',
        priority: 'medium',
      })
    }

    const avgAmount = recentRecords.reduce((sum, r) => sum + r.amount, 0) / recentRecords.length
    if (pet.weight) {
      const recommendedDaily = pet.weight * 30
      if (avgAmount < recommendedDaily * 0.8) {
        advice.push({
          type: 'daily_amount',
          title: '进食量偏少',
          content: `当前日均进食量约${avgAmount.toFixed(0)}g，建议根据体重调整至${recommendedDaily.toFixed(0)}g左右。`,
          priority: 'medium',
        })
      }
    }

    const uniqueFoods = new Set(recentRecords.map(r => r.foodType)).size
    if (uniqueFoods < 2) {
      advice.push({
        type: 'food_type',
        title: '饮食单一',
        content: '建议适当丰富食物种类，轮换不同蛋白质来源，提供更均衡的营养。',
        priority: 'low',
      })
    }

    if (advice.length === 0) {
      advice.push({
        type: 'daily_amount',
        title: '饮食状况良好',
        content: '近期饮食记录显示宠物进食正常，继续保持良好的喂养习惯！',
        priority: 'low',
      })
    }

    return advice
  }

  const advice = generateAdvice()

  if (!pet) {
    return (
      <View className='feeding-empty'>
        <Text className='feeding-empty-text'>请先添加宠物</Text>
      </View>
    )
  }

  return (
    <ScrollView className='feeding-page' scrollY>
      <View className='feeding-header'>
        <Text className='feeding-title'>喂养建议</Text>
        <Text className='feeding-subtitle'>{pet.name} 的饮食管理</Text>
      </View>

      <View className='feeding-advice-section'>
        <Text className='feeding-section-title'>💡 智能建议</Text>
        {advice.map((item, index) => (
          <View key={index} className={`feeding-advice-card feeding-advice-${item.priority}`}>
            <Text className='feeding-advice-title'>{item.title}</Text>
            <Text className='feeding-advice-content'>{item.content}</Text>
          </View>
        ))}
      </View>

      <View className='feeding-actions'>
        <View className='feeding-add-btn' onClick={() => setShowAdd(true)}>
          <Text className='feeding-add-icon'>+</Text>
          <Text>记录今日饮食</Text>
        </View>
      </View>

      <View className='feeding-records-section'>
        <Text className='feeding-section-title'> 饮食记录</Text>
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
              <Text className={`feeding-record-appetite feeding-appetite-${record.appetite}`}>
                {record.appetite === 'good' ? '食欲好' : record.appetite === 'normal' ? '食欲一般' : '食欲差'}
              </Text>
            </View>
            <View className='feeding-record-body'>
              <Text className='feeding-record-food'>
                {record.foodType} {record.brand && `(${record.brand})`}
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
          <Text className='feeding-modal-title'>记录今日饮食</Text>
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
                { value: 'good', label: '好', emoji: '' },
                { value: 'normal', label: '一般', emoji: '😐' },
                { value: 'poor', label: '差', emoji: '😕' },
              ].map(item => (
                <View
                  key={item.value}
                  className={`feeding-rating-option ${form.appetite === item.value ? 'feeding-rating-active' : ''}`}
                  onClick={() => setForm({ ...form, appetite: item.value as 'good' | 'normal' | 'poor' })}
                >
                  <Text className='feeding-rating-emoji'>{item.emoji}</Text>
                  <Text className='feeding-rating-label'>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>便便</Text>
            <View className='feeding-form-rating'>
              {[
                { value: 'normal', label: '正常', emoji: '' },
                { value: 'loose', label: '软便', emoji: '💧' },
                { value: 'hard', label: '便秘', emoji: '' },
              ].map(item => (
                <View
                  key={item.value}
                  className={`feeding-rating-option ${form.stool === item.value ? 'feeding-rating-active' : ''}`}
                  onClick={() => setForm({ ...form, stool: item.value as 'normal' | 'loose' | 'hard' })}
                >
                  <Text className='feeding-rating-emoji'>{item.emoji}</Text>
                  <Text className='feeding-rating-label'>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='feeding-form-group'>
            <Text className='feeding-form-label'>精神状态</Text>
            <View className='feeding-form-rating'>
              {[
                { value: 'high', label: '活跃', emoji: '⚡' },
                { value: 'normal', label: '正常', emoji: '' },
                { value: 'low', label: '疲倦', emoji: '' },
              ].map(item => (
                <View
                  key={item.value}
                  className={`feeding-rating-option ${form.energy === item.value ? 'feeding-rating-active' : ''}`}
                  onClick={() => setForm({ ...form, energy: item.value as 'high' | 'normal' | 'low' })}
                >
                  <Text className='feeding-rating-emoji'>{item.emoji}</Text>
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
