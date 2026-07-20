import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { usePet } from '../../hooks/usePet'
import { useVaccine } from '../../hooks/useVaccine'
import { useReminder } from '../../hooks/useReminder'
import { useAuthStore } from '../../stores/authStore'
import PetSwitcher from '../../components/PetSwitcher'
import FloatingNav from '../../components/FloatingNav'
import VaccineCalendar from '../../components/VaccineCalendar'
import VaccineRecordCard from '../../components/VaccineRecordCard'
import VaccineAddModal from '../../components/VaccineAddModal'
import { PageLoading, PageError, PetAvatar } from '../../components'
import type { ExpressionContext } from '../../engines/petAvatar'
import type { VaccineRecord } from '../../services/vaccineService'
import './index.scss'

export default function PetVaccine() {
  const { pets, currentPet, switchPet, isLoading: petLoading } = usePet()
  const user = useAuthStore((s) => s.user)
  const {
    records,
    isLoading: vaccineLoading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    removeRecord,
    markCompleted,
    clearError,
  } = useVaccine()

  const {
    subscriptionStatus,
    upcomingReminders,
    overdueReminders,
    fetchSubscriptionStatus,
    requestSubscription,
    fetchUpcomingReminders,
    fetchOverdueReminders,
  } = useReminder()

  const [modalVisible, setModalVisible] = useState(false)
  const [editRecord, setEditRecord] = useState<VaccineRecord | null>(null)
  const [loadError, setLoadError] = useState('')

  const loadVaccineData = useCallback(async () => {
    setLoadError('')
    try {
      if (currentPet) {
        await fetchRecords(currentPet.id)
        fetchUpcomingReminders(currentPet.id, 7)
        fetchOverdueReminders(currentPet.id)
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载失败，请重试')
    }
  }, [currentPet, fetchRecords, fetchUpcomingReminders, fetchOverdueReminders])

  useEffect(() => {
    loadVaccineData()
  }, [loadVaccineData])

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [fetchSubscriptionStatus])

  useEffect(() => {
    if (error) {
      Taro.showToast({ title: error, icon: 'none' })
      clearError()
    }
  }, [error, clearError])

  const stats = useMemo(() => {
    const completed = records.filter((r) => r.status === 'completed').length
    const pending = records.filter((r) => r.status === 'pending').length
    const overdue = records.filter((r) => r.status === 'overdue').length
    return { completed, pending, overdue, total: records.length }
  }, [records])

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date))
  }, [records])

  const handleAdd = () => {
    setEditRecord(null)
    setModalVisible(true)
  }

  const handleEdit = (record: VaccineRecord) => {
    setEditRecord(record)
    setModalVisible(true)
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setEditRecord(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await removeRecord(id)
      Taro.showToast({ title: '删除成功', icon: 'success' })
      if (currentPet) {
        fetchRecords(currentPet.id)
      }
    } catch {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await markCompleted(id)
      Taro.showToast({ title: '已标记完成', icon: 'success' })
      if (currentPet) {
        fetchRecords(currentPet.id)
      }
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleReminderToggle = async () => {
    try {
      await requestSubscription()
    } catch {
      Taro.showToast({ title: '授权失败', icon: 'none' })
    }
  }

  const isLoading = petLoading || vaccineLoading

  const expressionContext = useMemo((): ExpressionContext | null => {
    if (!currentPet) return null
    const allCompleted = records.length > 0 && records.every((r) => r.status === 'completed')
    return {
      todayEntry: null,
      hasAnomaly: false,
      anomalyCount: 0,
      riskLevel: null,
      streakDays: 0,
      isBirthday: false,
      isVaccineComplete: allCompleted,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet, records])

  if (isLoading && pets.length === 0) {
    return (
      <View className='pet-vaccine'>
        <PageLoading />
        <FloatingNav />
      </View>
    )
  }

  if (loadError && pets.length === 0) {
    return (
      <View className='pet-vaccine'>
        <PageError message={loadError} onRetry={loadVaccineData} />
        <FloatingNav />
      </View>
    )
  }

  return (
    <View className='pet-vaccine'>
      <PetSwitcher
        pets={pets}
        currentPetId={currentPet?.id || null}
        onSwitch={switchPet}
      />

      {currentPet && expressionContext && (
        <View className='pet-vaccine__avatar'>
          <PetAvatar
            species={currentPet.species as 'dog' | 'cat'}
            petName={currentPet.name}
            expressionContext={expressionContext}
            size={80}
            showLabel
          />
        </View>
      )}

      <View className='pet-vaccine__header'>
        <Text className='pet-vaccine__title'>疫苗驱虫日历</Text>
      </View>

      {!currentPet ? (
        <View className='pet-vaccine__empty'>
          <Text className='pet-vaccine__empty-icon'>🐾</Text>
          <Text className='pet-vaccine__empty-text'>请先添加宠物</Text>
        </View>
      ) : (
        <>
          <View className='pet-vaccine__stats'>
            <View className='pet-vaccine__stats-item'>
              <Text className='pet-vaccine__stats-value pet-vaccine__stats-value--completed'>
                {stats.completed}
              </Text>
              <Text className='pet-vaccine__stats-label'>已完成</Text>
            </View>
            <View className='pet-vaccine__stats-divider' />
            <View className='pet-vaccine__stats-item'>
              <Text className='pet-vaccine__stats-value pet-vaccine__stats-value--pending'>
                {stats.pending}
              </Text>
              <Text className='pet-vaccine__stats-label'>待接种</Text>
            </View>
            <View className='pet-vaccine__stats-divider' />
            <View className='pet-vaccine__stats-item'>
              <Text className='pet-vaccine__stats-value pet-vaccine__stats-value--overdue'>
                {stats.overdue}
              </Text>
              <Text className='pet-vaccine__stats-label'>已逾期</Text>
            </View>
          </View>

          {(upcomingReminders.length > 0 || overdueReminders.length > 0) && (
            <View className='pet-vaccine__reminders'>
              <View className='pet-vaccine__reminders-header'>
                <Text className='pet-vaccine__reminders-title'>🔔 到期提醒</Text>
                <View
                  className={`pet-vaccine__reminders-toggle${subscriptionStatus ? ' pet-vaccine__reminders-toggle--on' : ''}`}
                  onClick={handleReminderToggle}
                >
                  <Text className='pet-vaccine__reminders-toggle-text'>
                    {subscriptionStatus ? '已开启' : '开启提醒'}
                  </Text>
                </View>
              </View>
              {overdueReminders.length > 0 && (
                <View className='pet-vaccine__reminder-list'>
                  {overdueReminders.map((r) => (
                    <View key={r.record.id} className='pet-vaccine__reminder-item pet-vaccine__reminder-item--overdue'>
                      <Text className='pet-vaccine__reminder-icon'>⚠️</Text>
                      <View className='pet-vaccine__reminder-content'>
                        <Text className='pet-vaccine__reminder-name'>{r.record.category}</Text>
                        <Text className='pet-vaccine__reminder-date'>已于 {r.record.nextDate} 逾期</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {upcomingReminders.length > 0 && (
                <View className='pet-vaccine__reminder-list'>
                  {upcomingReminders.map((r) => (
                    <View key={r.record.id} className='pet-vaccine__reminder-item pet-vaccine__reminder-item--upcoming'>
                      <Text className='pet-vaccine__reminder-icon'>📅</Text>
                      <View className='pet-vaccine__reminder-content'>
                        <Text className='pet-vaccine__reminder-name'>{r.record.category}</Text>
                        <Text className='pet-vaccine__reminder-date'>{r.record.nextDate} 到期</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <VaccineCalendar records={records} />

          <View className='pet-vaccine__section'>
            <View className='pet-vaccine__section-header'>
              <Text className='pet-vaccine__section-title'>📋 记录列表</Text>
              <Text className='pet-vaccine__section-count'>共 {stats.total} 条</Text>
            </View>

            {sortedRecords.length === 0 ? (
              <View className='pet-vaccine__list-empty'>
                <Text className='pet-vaccine__list-empty-icon'>📭</Text>
                <Text className='pet-vaccine__list-empty-text'>暂无记录，点击右下角添加</Text>
              </View>
            ) : (
              <View className='pet-vaccine__list'>
                {sortedRecords.map((record) => (
                  <VaccineRecordCard
                    key={record.id}
                    record={record}
                    onComplete={handleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <View className='pet-vaccine__fab' onClick={handleAdd}>
        <Text className='pet-vaccine__fab-icon'>+</Text>
      </View>

      {currentPet && (
        <VaccineAddModal
          visible={modalVisible}
          petId={currentPet.id}
          userId={user?.id || ''}
          editRecord={editRecord}
          onClose={handleCloseModal}
          onSubmit={addRecord}
          onUpdate={updateRecord}
        />
      )}

      <FloatingNav />
    </View>
  )
}
