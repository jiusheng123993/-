import { View, Text, ScrollView, Input, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import './index.scss'

interface ChronicRecord {
  id: string
  petId: string
  condition: string
  diagnosedDate: string
  severity: 'mild' | 'moderate' | 'severe'
  status: 'active' | 'managed' | 'resolved'
  medications: string[]
  vetName: string
  vetContact: string
  nextCheckupDate: string
  notes: string
  symptoms: string[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'chronic_records'

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

export default function ChronicTrackingPage() {
  const user = useAuthStore(state => state.user)
  const { currentPet, pets } = usePetStore()
  const [records, setRecords] = useState<ChronicRecord[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const pet = currentPet || pets[0]

  useEffect(() => {
    if (!pet) return
    const all = getStorage(STORAGE_KEY) || {}
    const petRecords = all[pet.id] || []
    setRecords(petRecords)
  }, [pet?.id])

  const saveRecords = (newRecords: ChronicRecord[]) => {
    if (!pet) return
    const all = getStorage(STORAGE_KEY) || {}
    all[pet.id] = newRecords
    setStorage(STORAGE_KEY, all)
    setRecords(newRecords)
  }

  const handleAdd = (data: Omit<ChronicRecord, 'id' | 'petId' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newRecord: ChronicRecord = {
      ...data,
      id: generateId(),
      petId: pet!.id,
      createdAt: now,
      updatedAt: now,
    }
    saveRecords([newRecord, ...records])
    setShowAdd(false)
    Taro.showToast({ title: '添加成功', icon: 'success' })
  }

  const handleUpdate = (id: string, updates: Partial<ChronicRecord>) => {
    const updated = records.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    )
    saveRecords(updated)
    setEditingId(null)
    Taro.showToast({ title: '更新成功', icon: 'success' })
  }

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条慢性病记录吗？',
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
      <View className='chronic-empty'>
        <Text className='chronic-empty-text'>请先添加宠物</Text>
      </View>
    )
  }

  return (
    <ScrollView className='chronic-page' scrollY>
      <View className='chronic-header'>
        <Text className='chronic-title'>慢性病追踪</Text>
        <Text className='chronic-subtitle'>{pet.name} 的健康档案</Text>
      </View>

      <View className='chronic-summary'>
        <View className='chronic-summary-item'>
          <Text className='chronic-summary-number'>{records.filter(r => r.status === 'active').length}</Text>
          <Text className='chronic-summary-label'>活跃中</Text>
        </View>
        <View className='chronic-summary-item'>
          <Text className='chronic-summary-number'>{records.filter(r => r.status === 'managed').length}</Text>
          <Text className='chronic-summary-label'>已控制</Text>
        </View>
        <View className='chronic-summary-item'>
          <Text className='chronic-summary-number'>{records.length}</Text>
          <Text className='chronic-summary-label'>总记录</Text>
        </View>
      </View>

      <View className='chronic-actions'>
        <View className='chronic-add-btn' onClick={() => setShowAdd(true)}>
          <Text className='chronic-add-icon'>+</Text>
          <Text>添加记录</Text>
        </View>
      </View>

      {records.length === 0 && (
        <View className='chronic-empty-state'>
          <Text className='chronic-empty-icon'>🩺</Text>
          <Text className='chronic-empty-title'>暂无慢性病记录</Text>
          <Text className='chronic-empty-hint'>点击上方按钮添加宠物的慢性病信息</Text>
        </View>
      )}

      {records.map(record => (
        <ChronicRecordCard
          key={record.id}
          record={record}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {showAdd && (
        <AddRecordModal
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      <View className='chronic-bottom-safe' />
    </ScrollView>
  )
}

function ChronicRecordCard({
  record,
  onUpdate,
  onDelete,
}: {
  record: ChronicRecord
  onUpdate: (id: string, updates: Partial<ChronicRecord>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const severityColor = {
    mild: '#52c41a',
    moderate: '#faad14',
    severe: '#f5222d',
  }

  const statusText = {
    active: '活跃中',
    managed: '已控制',
    resolved: '已康复',
  }

  const isOverdue = record.nextCheckupDate && new Date(record.nextCheckupDate) < new Date()

  return (
    <View className='chronic-card'>
      <View className='chronic-card-header' onClick={() => setExpanded(!expanded)}>
        <View className='chronic-card-main'>
          <Text className='chronic-card-title'>{record.condition}</Text>
          <View className='chronic-card-tags'>
            <Text
              className='chronic-card-tag'
              style={{ backgroundColor: severityColor[record.severity] + '20', color: severityColor[record.severity] }}
            >
              {record.severity === 'mild' ? '轻度' : record.severity === 'moderate' ? '中度' : '重度'}
            </Text>
            <Text className='chronic-card-tag' style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}>
              {statusText[record.status]}
            </Text>
          </View>
        </View>
        <Text className='chronic-card-arrow'>{expanded ? '▼' : '▶'}</Text>
      </View>

      {expanded && (
        <View className='chronic-card-body'>
          <View className='chronic-card-row'>
            <Text className='chronic-card-label'>确诊日期</Text>
            <Text className='chronic-card-value'>{record.diagnosedDate}</Text>
          </View>
          <View className='chronic-card-row'>
            <Text className='chronic-card-label'>主治医生</Text>
            <Text className='chronic-card-value'>{record.vetName}</Text>
          </View>
          <View className='chronic-card-row'>
            <Text className='chronic-card-label'>联系方式</Text>
            <Text className='chronic-card-value'>{record.vetContact}</Text>
          </View>
          <View className='chronic-card-row'>
            <Text className='chronic-card-label'>用药</Text>
            <Text className='chronic-card-value'>
              {record.medications.length > 0 ? record.medications.join('、') : '无'}
            </Text>
          </View>
          <View className='chronic-card-row'>
            <Text className='chronic-card-label'>症状</Text>
            <Text className='chronic-card-value'>
              {record.symptoms.length > 0 ? record.symptoms.join('、') : '无'}
            </Text>
          </View>
          <View className='chronic-card-row'>
            <Text className='chronic-card-label'>下次复查</Text>
            <Text className={`chronic-card-value ${isOverdue ? 'chronic-card-overdue' : ''}`}>
              {record.nextCheckupDate}
              {isOverdue && ' (已逾期)'}
            </Text>
          </View>
          {record.notes && (
            <View className='chronic-card-row'>
              <Text className='chronic-card-label'>备注</Text>
              <Text className='chronic-card-value'>{record.notes}</Text>
            </View>
          )}

          <View className='chronic-card-actions'>
            <View
              className='chronic-card-btn chronic-card-btn-primary'
              onClick={() => onUpdate(record.id, { status: record.status === 'active' ? 'managed' : 'active' })}
            >
              <Text>{record.status === 'active' ? '标记为已控制' : '标记为活跃'}</Text>
            </View>
            <View className='chronic-card-btn chronic-card-btn-danger' onClick={() => onDelete(record.id)}>
              <Text>删除</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

function AddRecordModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: Omit<ChronicRecord, 'id' | 'petId' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    condition: '',
    diagnosedDate: '',
    severity: 'mild' as 'mild' | 'moderate' | 'severe',
    status: 'active' as 'active' | 'managed' | 'resolved',
    medications: '',
    vetName: '',
    vetContact: '',
    nextCheckupDate: '',
    notes: '',
    symptoms: '',
  })

  const handleDiagnosedDateChange = (e: { detail: { value: string } }) => {
    setForm({ ...form, diagnosedDate: e.detail.value })
  }

  const handleNextCheckupDateChange = (e: { detail: { value: string } }) => {
    setForm({ ...form, nextCheckupDate: e.detail.value })
  }

  const handleInput = (field: string) => (e: { detail: { value: string } }) => {
    setForm({ ...form, [field]: e.detail.value })
  }

  const handleSubmit = () => {
    if (!form.condition.trim()) {
      Taro.showToast({ title: '请输入疾病名称', icon: 'none' })
      return
    }
    if (!form.diagnosedDate) {
      Taro.showToast({ title: '请选择确诊日期', icon: 'none' })
      return
    }

    onSubmit({
      ...form,
      medications: form.medications.split(',').map(s => s.trim()).filter(Boolean),
      symptoms: form.symptoms.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  return (
    <View className='chronic-modal-overlay' onClick={onClose}>
      <View className='chronic-modal' onClick={e => e.stopPropagation()}>
        <View className='chronic-modal-header'>
          <Text className='chronic-modal-title'>添加慢性病记录</Text>
          <Text className='chronic-modal-close' onClick={onClose}>×</Text>
        </View>

        <ScrollView className='chronic-modal-body' scrollY>
          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>疾病名称 *</Text>
            <Input
              className='chronic-form-input'
              placeholder='如：慢性肾病、心脏病等'
              value={form.condition}
              onInput={handleInput('condition')}
            />
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>确诊日期 *</Text>
            <Picker mode='date' value={form.diagnosedDate} onChange={handleDiagnosedDateChange as (e: unknown) => void}>
              <View className='chronic-form-picker'>
                <Text>{form.diagnosedDate || '请选择日期'}</Text>
              </View>
            </Picker>
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>严重程度</Text>
            <View className='chronic-form-severity'>
              {(['mild', 'moderate', 'severe'] as const).map(s => (
                <View
                  key={s}
                  className={`chronic-severity-option ${form.severity === s ? 'chronic-severity-active' : ''}`}
                  onClick={() => setForm({ ...form, severity: s })}
                >
                  <Text>{s === 'mild' ? '轻度' : s === 'moderate' ? '中度' : '重度'}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>主治医生</Text>
            <Input
              className='chronic-form-input'
              placeholder='医生姓名'
              value={form.vetName}
              onInput={handleInput('vetName')}
            />
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>联系方式</Text>
            <Input
              className='chronic-form-input'
              placeholder='电话或微信'
              value={form.vetContact}
              onInput={handleInput('vetContact')}
            />
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>用药（用逗号分隔）</Text>
            <Input
              className='chronic-form-input'
              placeholder='如：贝那普利、塞米'
              value={form.medications}
              onInput={handleInput('medications')}
            />
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>症状（用逗号分隔）</Text>
            <Input
              className='chronic-form-input'
              placeholder='如：多饮多尿、食欲下降'
              value={form.symptoms}
              onInput={handleInput('symptoms')}
            />
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>下次复查日期</Text>
            <Picker mode='date' value={form.nextCheckupDate} onChange={handleNextCheckupDateChange as (e: unknown) => void}>
              <View className='chronic-form-picker'>
                <Text>{form.nextCheckupDate || '请选择日期'}</Text>
              </View>
            </Picker>
          </View>

          <View className='chronic-form-group'>
            <Text className='chronic-form-label'>备注</Text>
            <Textarea
              className='chronic-form-textarea'
              placeholder='其他需要记录的信息'
              value={form.notes}
              onInput={handleInput('notes')}
            />
          </View>
        </ScrollView>

        <View className='chronic-modal-footer'>
          <View className='chronic-modal-btn chronic-modal-btn-cancel' onClick={onClose}>
            <Text>取消</Text>
          </View>
          <View className='chronic-modal-btn chronic-modal-btn-confirm' onClick={handleSubmit}>
            <Text>保存</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
