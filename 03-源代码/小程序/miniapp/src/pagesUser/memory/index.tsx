/**
 * AI 记忆纠错页面
 *
 * 让用户查看 AI 记住的宠物信息（memory-body 记忆引擎），
 * 并可对错误记忆进行手动修正。
 *
 * 功能：
 *  1. 按宠物筛选记忆列表
 *  2. 查看每条记忆的分类、内容、来源、重要性、状态
 *  3. 点击卡片进入 inline 编辑模式，修正内容后保存
 *
 * 安全说明：
 *  - 后端校验登录态与记忆归属（WHERE id AND user_id），防横向越权
 *  - 修正后 source 标记为 manual，防止被 AI 自动提取覆盖
 */
import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, Textarea, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePet } from '../../hooks/usePet'
import { useAuthStore } from '../../stores/authStore'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useThemeClass } from '../../hooks/useThemeClass'
import PageLoading from '../../components/PageLoading'
import PageError from '../../components/PageError'
import {
  listMemories,
  updateMemory,
  getCategoryInfo,
  getSourceLabel,
  getStatusLabel,
  getImportanceStars,
} from '../../services/memoryService'
import type { MemoryEntry } from '../../types/memoryTypes'
import './index.scss'

/** 单次加载上限提示阈值 */
const LOAD_LIMIT_HINT = 200

export default function MemoryPage() {
  const user = useAuthStore(s => s.user)
  const { pets } = usePet()
  const { trackPageView, trackEvent } = useAnalytics()
  const themeClass = useThemeClass()

  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePetId, setActivePetId] = useState<string>('') // '' = 全部宠物
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    trackPageView('memory_correction')
  }, [trackPageView])

  /** 加载记忆列表 */
  const loadMemories = useCallback(async (petId?: string) => {
    setLoading(true)
    setError(null)
    try {
      const list = await listMemories(petId || undefined)
      setMemories(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败'
      setError(msg)
      setMemories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      setError('请先登录')
      return
    }
    loadMemories(activePetId || undefined)
  }, [user?.id, activePetId, loadMemories])

  /** 进入编辑模式 */
  const handleStartEdit = useCallback((memory: MemoryEntry) => {
    setEditingId(memory.id)
    setEditingContent(memory.content)
    trackEvent('memory_edit_start', { category: memory.category })
  }, [trackEvent])

  /** 取消编辑 */
  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingContent('')
  }, [])

  /** 保存修正 */
  const handleSaveEdit = useCallback(async (memoryId: number) => {
    const trimmed = editingContent.trim()
    if (!trimmed) {
      Taro.showToast({ title: '内容不能为空', icon: 'none' })
      return
    }
    if (trimmed.length > 2000) {
      Taro.showToast({ title: '内容过长（最多2000字）', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await updateMemory(memoryId, trimmed)
      // 本地更新
      setMemories(prev =>
        prev.map(m =>
          m.id === memoryId
            ? { ...m, content: trimmed, source: 'manual', status: 'active', importance: Math.max(m.importance, 6) }
            : m,
        ),
      )
      setEditingId(null)
      setEditingContent('')
      trackEvent('memory_edit_save', { memoryId })
      Taro.showToast({ title: '已修正', icon: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setSaving(false)
    }
  }, [editingContent, trackEvent])

  /** 重试 */
  const handleRetry = useCallback(() => {
    loadMemories(activePetId || undefined)
  }, [activePetId, loadMemories])

  /** 宠物名映射（petId → name） */
  const petNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of pets) {
      map[p.id] = p.name
    }
    return map
  }, [pets])

  /** 获取记忆对应的宠物名 */
  const getPetName = useCallback((petId: string | null) => {
    if (!petId) return '通用'
    return petNameMap[petId] || '未知宠物'
  }, [petNameMap])

  return (
    <View className={'memory-page ' + themeClass}>
      {/* 顶部说明 */}
      <View className='memory-page__header'>
        <Text className='memory-page__header-title'>AI 记忆管理</Text>
        <Text className='memory-page__header-desc'>
          这里展示 AI 在对话中自动记住的宠物信息。如果发现 AI 记错了，你可以直接修正，AI 后续对话会以修正后的内容为准。
        </Text>
      </View>

      {/* 宠物筛选 */}
      {pets.length > 1 && (
        <ScrollView scrollX className='memory-page__filter' enhanced showScrollbar={false}>
          <View
            className={`memory-page__filter-tab ${activePetId === '' ? 'memory-page__filter-tab--active' : ''}`}
            onClick={() => setActivePetId('')}
          >
            <Text>全部</Text>
          </View>
          {pets.map(pet => (
            <View
              key={pet.id}
              className={`memory-page__filter-tab ${activePetId === pet.id ? 'memory-page__filter-tab--active' : ''}`}
              onClick={() => setActivePetId(pet.id)}
            >
              <Text>{pet.name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 内容区 */}
      {loading ? (
        <PageLoading text='加载记忆中...' />
      ) : error ? (
        <PageError message={error} onRetry={handleRetry} />
      ) : memories.length === 0 ? (
        <View className='memory-page__empty'>
          <Text className='memory-page__empty-emoji'>💭</Text>
          <Text className='memory-page__empty-title'>暂无 AI 记忆</Text>
          <Text className='memory-page__empty-desc'>
            和 AI 多聊聊你的宠物，它会自动记住重要信息哦～
          </Text>
        </View>
      ) : (
        <View className='memory-page__list'>
          {memories.length >= LOAD_LIMIT_HINT && (
            <View className='memory-page__limit-hint'>
              <Text>仅显示最近 {LOAD_LIMIT_HINT} 条记忆</Text>
            </View>
          )}
          {memories.map(memory => {
            const catInfo = getCategoryInfo(memory.category)
            const isEditing = editingId === memory.id
            return (
              <View key={memory.id} className='memory-page__card'>
                {/* 卡片头部 */}
                <View className='memory-page__card-header'>
                  <View className='memory-page__card-tag'>
                    <Text className='memory-page__card-icon'>{catInfo.icon}</Text>
                    <Text className='memory-page__card-category'>{catInfo.label}</Text>
                  </View>
                  <Text className='memory-page__card-pet'>{getPetName(memory.petId)}</Text>
                </View>

                {/* 卡片内容 / 编辑框 */}
                {isEditing ? (
                  <View className='memory-page__edit'>
                    <Textarea
                      className='memory-page__edit-textarea'
                      value={editingContent}
                      onInput={e => setEditingContent(e.detail.value)}
                      maxlength={2000}
                      autoHeight
                      placeholder='输入修正后的内容...'
                      focus
                    />
                    <View className='memory-page__edit-actions'>
                      <View
                        className='memory-page__edit-btn memory-page__edit-btn--cancel'
                        onClick={handleCancelEdit}
                      >
                        <Text>取消</Text>
                      </View>
                      <View
                        className={`memory-page__edit-btn memory-page__edit-btn--save ${saving ? 'memory-page__edit-btn--disabled' : ''}`}
                        onClick={() => !saving && handleSaveEdit(memory.id)}
                      >
                        <Text>{saving ? '保存中...' : '保存'}</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    className='memory-page__card-content'
                    onClick={() => handleStartEdit(memory)}
                  >
                    <Text className='memory-page__card-text'>{memory.content}</Text>
                    <Text className='memory-page__card-edit-hint'>点击修正 ›</Text>
                  </View>
                )}

                {/* 卡片底部元信息 */}
                {!isEditing && (
                  <View className='memory-page__card-meta'>
                    <Text className='memory-page__card-source'>{getSourceLabel(memory.source)}</Text>
                    <Text className='memory-page__card-importance'>{getImportanceStars(memory.importance)}</Text>
                    <Text className={`memory-page__card-status memory-page__card-status--${memory.status}`}>
                      {getStatusLabel(memory.status)}
                    </Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
