/**
 * 家族图谱页面
 * 展示宠物家族血缘关系树，支持添加/删除父母/子女关系
 *
 * 数据流：
 *   1. 从 currentFamily(useFamilyStore) 获取 familyId
 *   2. 从 familyPets(usePetStore + members) 获取家庭宠物列表
 *   3. 调用 familyService.getLineage(petId, familyId) 获取选中宠物的血缘数据
 *   4. 后端返回完整数据：{ pet, parents, children, siblings, mates }
 *   5. 父母/子女/兄弟姐妹直接渲染为卡片，带连线可视化
 */
import { useEffect, useState, useMemo, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePetStore } from '../../../stores/petStore'
import { useAuthStore } from '../../../stores/authStore'
import { useFamilyStore } from '../../../stores/familyStore'
import { familyService } from '../../../services/familyService'
import { useThemeClass } from '../../../hooks/useThemeClass'
import type { PetProfile } from '../../../services/petService'
import type { LineageResponse, LineageChild, LineageMate, FamilyOverviewResponse, OverviewMember, OverviewLineage, OverviewRelationship } from '../../../types/familyTypes'
import './index.scss'

const RELATION_LABELS: Record<string, string> = {
  self: '我',
  owner: '铲屎官',
  parent: '父母',
  grandparent: '祖辈',
  greatGrandparent: '曾祖',
  child: '子女',
  grandchild: '孙辈',
  greatGrandchild: '曾孙',
  sibling: '兄弟姐妹',
  mate: '配偶',
}

/** 根据选中宠物和兄弟姐妹的性别，返回对应的称谓 */
function getSiblingLabel(selfGender: string | undefined, siblingGender: string | undefined): string {
  if (selfGender === 'male' && siblingGender === 'male') return '兄弟'
  if (selfGender === 'female' && siblingGender === 'female') return '姐妹'
  if (selfGender === 'male' && siblingGender === 'female') return '兄妹'
  if (selfGender === 'female' && siblingGender === 'male') return '姐弟'
  return '兄弟姐妹'
}

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱',
  dog: '🐕',
  bird: '🐦',
  fish: '🐟',
  rabbit: '🐰',
  hamster: '🐹',
  turtle: '🐢',
  other: '🐾',
}

function getSpeciesEmoji(species?: string): string {
  return SPECIES_EMOJI[species || ''] || '🐾'
}

function calcAge(birthDate?: string): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths}月`
  const ageYears = Math.floor(totalMonths / 12)
  const remainingMonths = totalMonths % 12
  if (remainingMonths === 0) return `${ageYears}岁`
  return `${ageYears}岁${remainingMonths}月`
}

function getGenderIcon(gender?: string): string {
  switch (gender) {
    case 'male': return '♂️'
    case 'female': return '♀️'
    default: return ''
  }
}

function getGenderClass(gender?: string): string {
  switch (gender) {
    case 'male': return 'lineage-gender--male'
    case 'female': return 'lineage-gender--female'
    default: return ''
  }
}

export default function LineagePage() {
  const { pets, fetchPets } = usePetStore()
  const user = useAuthStore(s => s.user)
  const { currentFamily, members, fetchFamilies } = useFamilyStore()
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [lineage, setLineage] = useState<LineageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)
  const [petSelectorOpen, setPetSelectorOpen] = useState(false)
  const [addingRelation, setAddingRelation] = useState<{
    childId: string
    mode: 'parent' | 'child' | 'mate' | 'sibling'
  } | null>(null)
  const [viewMode, setViewMode] = useState<'single' | 'overview'>('single')
  const [overviewData, setOverviewData] = useState<FamilyOverviewResponse | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const themeClass = useThemeClass()

  useEffect(() => {
    const loadData = async () => {
      setDataReady(false)
      try {
        await fetchFamilies()
        if (user) {
          await fetchPets(user.id)
        }
      } finally {
        setDataReady(true)
      }
    }
    loadData()
  }, [user])

  // 家庭宠物列表（当前家庭中的宠物，未加载完成时返回空数组避免误判空状态）
  const familyPets = useMemo(() => {
    if (!currentFamily) return []
    const memberPetIds = new Set(members.map(m => m.petId))
    return pets.filter(p => memberPetIds.has(p.id))
  }, [pets, members, currentFamily])

  // 自动选中第一个宠物
  useEffect(() => {
    if (familyPets.length > 0) {
      if (!selectedPetId || !familyPets.find(p => p.id === selectedPetId)) {
        setSelectedPetId(familyPets[0].id)
      }
    }
  }, [familyPets])

  // 加载选中宠物的血缘数据
  useEffect(() => {
    if (!selectedPetId || !currentFamily) return
    const loadLineage = async () => {
      setLoading(true)
      try {
        const data = await familyService.getLineage(selectedPetId, currentFamily.id)
        setLineage(data)
      } catch {
        setLineage(null)
      } finally {
        setLoading(false)
      }
    }
    loadLineage()
  }, [selectedPetId, currentFamily?.id])

  const selectedPet = useMemo(() => {
    return familyPets.find(p => p.id === selectedPetId) || null
  }, [familyPets, selectedPetId])

  // 从 lineage 数据中提取有对应 pet 的关系
  const parentPets = useMemo(() => {
    if (!lineage) return []
    const parentIds = lineage.parents.map(l => l.parentId)
    return pets.filter(p => parentIds.includes(p.id)).map(p => {
      const l = lineage.parents.find(lp => lp.parentId === p.id)
      return { pet: p, lineageId: l?.id || '', litterDate: l?.litterDate }
    })
  }, [pets, lineage])

  // 将某一代血亲行（LineageChild[]）转换为有对应 pet 的关系列表
  const mapLevelToPets = useCallback((level: LineageChild[], useChildId: boolean) => {
    const ids = level.map(l => (useChildId ? l.childId : l.parentId))
    return pets
      .filter(p => ids.includes(p.id))
      .map(p => {
        const l = level.find(lv => (useChildId ? lv.childId : lv.parentId) === p.id)
        return { pet: p, lineageId: l?.id || '', litterDate: l?.litterDate }
      })
  }, [pets])

  // 多代祖先：ancestorsLevels[0]=父母(用parentId)，[1]=祖辈，[2]=曾祖
  const grandparentPets = useMemo(() => {
    if (!lineage?.ancestorsLevels?.[1]) return []
    return mapLevelToPets(lineage.ancestorsLevels[1], false)
  }, [lineage, mapLevelToPets])

  const greatGrandparentPets = useMemo(() => {
    if (!lineage?.ancestorsLevels?.[2]) return []
    return mapLevelToPets(lineage.ancestorsLevels[2], false)
  }, [lineage, mapLevelToPets])

  const childPets = useMemo(() => {
    if (!lineage) return []
    const childIds = lineage.children.map(l => l.childId)
    return pets.filter(p => childIds.includes(p.id)).map(p => {
      const l = lineage.children.find(lc => lc.childId === p.id)
      return { pet: p, lineageId: l?.id || '', litterDate: l?.litterDate }
    })
  }, [pets, lineage])

  // 多代后代：descendantsLevels[0]=子女(用childId)，[1]=孙辈，[2]=曾孙
  const grandchildPets = useMemo(() => {
    if (!lineage?.descendantsLevels?.[1]) return []
    return mapLevelToPets(lineage.descendantsLevels[1], true)
  }, [lineage, mapLevelToPets])

  const greatGrandchildPets = useMemo(() => {
    if (!lineage?.descendantsLevels?.[2]) return []
    return mapLevelToPets(lineage.descendantsLevels[2], true)
  }, [lineage, mapLevelToPets])

  // 配偶：mates 中相对选中宠物的另一方
  const matePets = useMemo(() => {
    if (!lineage || !selectedPetId) return []
    const result: Array<{
      pet: PetProfile
      mate: LineageMate
      relationshipId: string
    }> = []
    for (const mate of lineage.mates || []) {
      const otherId = mate.petIdA === selectedPetId ? mate.petIdB : mate.petIdA
      const otherPet = pets.find(p => p.id === otherId)
      if (otherPet) {
        result.push({ pet: otherPet, mate, relationshipId: mate.id })
      }
    }
    return result
  }, [pets, lineage, selectedPetId])

  // 直接使用后端返回的 siblings 数据（含血缘和手动添加的兄弟姐妹）
  const siblingPets = useMemo(() => {
    if (!lineage) return []
    const siblingIds = lineage.siblings.map(l => l.petId || l.childId)
    return pets.filter(p => siblingIds.includes(p.id)).map(p => {
      const l = lineage.siblings.find(s => (s.petId || s.childId) === p.id)
      return { pet: p, lineageId: l?.id || '', litterDate: l?.litterDate, source: l?.source }
    })
  }, [pets, lineage])

  const hasAnyRelation = parentPets.length > 0 || childPets.length > 0 || siblingPets.length > 0 || matePets.length > 0

  // 当宠物没有任何祖先（父母/祖辈/曾祖）时，显示铲屎官作为家族树的根节点
  const hasNoAncestors = !!lineage && parentPets.length === 0 && grandparentPets.length === 0 && greatGrandparentPets.length === 0

  // 可添加关系的宠物（排除已有关系 + 自身）
  const availableForRelation = useMemo(() => {
    const relatedIds = new Set<string>()
    if (selectedPetId) relatedIds.add(selectedPetId)
    lineage?.parents.forEach(l => relatedIds.add(l.parentId))
    lineage?.children.forEach(l => relatedIds.add(l.childId))
    lineage?.siblings.forEach(l => relatedIds.add(l.petId || l.childId))
    ;(lineage?.ancestorsLevels || []).forEach(level => level.forEach(l => relatedIds.add(l.parentId)))
    ;(lineage?.descendantsLevels || []).forEach(level => level.forEach(l => relatedIds.add(l.childId)))
    ;(lineage?.mates || []).forEach(m => {
      relatedIds.add(m.petIdA === selectedPetId ? m.petIdB : m.petIdA)
    })
    return pets.filter(p => !relatedIds.has(p.id))
  }, [pets, selectedPetId, lineage])

  const handleSelectPet = (petId: string) => {
    setSelectedPetId(petId)
    setPetSelectorOpen(false)
  }

  const handleAddParent = () => {
    if (!selectedPetId) return
    if (availableForRelation.length === 0) {
      Taro.showToast({ title: '没有可选的宠物', icon: 'none' })
      return
    }
    setAddingRelation({ childId: selectedPetId, mode: 'parent' })
  }

  const handleAddChild = () => {
    if (!selectedPetId) return
    if (availableForRelation.length === 0) {
      Taro.showToast({ title: '没有可选的宠物', icon: 'none' })
      return
    }
    setAddingRelation({ childId: selectedPetId, mode: 'child' })
  }

  const handleAddMate = () => {
    if (!selectedPetId) return
    if (availableForRelation.length === 0) {
      Taro.showToast({ title: '没有可选的宠物', icon: 'none' })
      return
    }
    setAddingRelation({ childId: selectedPetId, mode: 'mate' })
  }

  const handleAddSibling = () => {
    if (!selectedPetId) return
    if (availableForRelation.length === 0) {
      Taro.showToast({ title: '没有可选的宠物', icon: 'none' })
      return
    }
    setAddingRelation({ childId: selectedPetId, mode: 'sibling' })
  }

  const loadOverview = useCallback(async () => {
    if (!currentFamily) return
    setOverviewLoading(true)
    try {
      const data = await familyService.getOverview(currentFamily.id)
      setOverviewData(data)
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setOverviewLoading(false)
    }
  }, [currentFamily])

  const handleSwitchMode = useCallback((mode: 'single' | 'overview') => {
    setViewMode(mode)
    if (mode === 'overview' && !overviewData) {
      loadOverview()
    }
  }, [overviewData, loadOverview])

  const handleConfirmRelation = useCallback(async (targetPetId: string) => {
    if (!addingRelation || !currentFamily) return
    try {
      if (addingRelation.mode === 'mate') {
        // 添加配偶关系
        await familyService.addMate(currentFamily.id, addingRelation.childId, targetPetId)
      } else if (addingRelation.mode === 'sibling') {
        // 添加兄弟姐妹关系
        await familyService.addSibling(currentFamily.id, addingRelation.childId, targetPetId)
      } else if (addingRelation.mode === 'parent') {
        // targetPetId 是父母，addingRelation.childId 是子女
        await familyService.addLineage(targetPetId, addingRelation.childId, currentFamily.id)
      } else {
        // addingRelation.childId 是父母，targetPetId 是子女
        await familyService.addLineage(addingRelation.childId, targetPetId, currentFamily.id)
      }
      Taro.showToast({ title: '关系已添加', icon: 'success' })
      // 重新加载血缘数据
      if (selectedPetId) {
        const data = await familyService.getLineage(selectedPetId, currentFamily.id)
        setLineage(data)
        if (viewMode === 'overview') loadOverview()
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '添加失败', icon: 'none' })
    } finally {
      setAddingRelation(null)
    }
  }, [addingRelation, currentFamily, selectedPetId, viewMode, loadOverview])

  const handleRemoveRelation = useCallback((lineageId: string, relationType: 'parent' | 'child', targetName: string) => {
    if (!currentFamily) return
    Taro.showModal({
      title: '解除关系',
      content: `确认解除与${targetName}的${relationType === 'parent' ? '父母' : '子女'}关系吗？`,
      confirmText: '确认解除',
      confirmColor: '#E0856B',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            await familyService.removeLineage(lineageId, currentFamily.id)
            const data = await familyService.getLineage(selectedPetId!, currentFamily.id)
            setLineage(data)
            if (viewMode === 'overview') loadOverview()
            Taro.showToast({ title: '关系已解除', icon: 'success' })
          } catch (err: unknown) {
            const error = err as { message?: string }
            Taro.showToast({ title: error.message || '解除失败', icon: 'none' })
          }
        }
      },
    })
  }, [currentFamily, selectedPetId, viewMode, loadOverview])

  const handleRemoveMate = useCallback((relationshipId: string, targetName: string) => {
    if (!currentFamily) return
    Taro.showModal({
      title: '解除配偶',
      content: `确认解除与${targetName}的配偶关系吗？`,
      confirmText: '确认解除',
      confirmColor: '#E0856B',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            await familyService.removeMate(currentFamily.id, relationshipId)
            const data = await familyService.getLineage(selectedPetId!, currentFamily.id)
            setLineage(data)
            if (viewMode === 'overview') loadOverview()
            Taro.showToast({ title: '关系已解除', icon: 'success' })
          } catch (err: unknown) {
            const error = err as { message?: string }
            Taro.showToast({ title: error.message || '解除失败', icon: 'none' })
          }
        }
      },
    })
  }, [currentFamily, selectedPetId, viewMode, loadOverview])

  const handleRemoveSibling = useCallback((relationshipId: string, targetName: string, siblingLabel: string) => {
    if (!currentFamily) return
    Taro.showModal({
      title: '解除关系',
      content: `确认解除与${targetName}的${siblingLabel}关系吗？`,
      confirmText: '确认解除',
      confirmColor: '#E0856B',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            await familyService.removeSibling(currentFamily.id, relationshipId)
            const data = await familyService.getLineage(selectedPetId!, currentFamily.id)
            setLineage(data)
            if (viewMode === 'overview') loadOverview()
            Taro.showToast({ title: '关系已解除', icon: 'success' })
          } catch (err: unknown) {
            const error = err as { message?: string }
            Taro.showToast({ title: error.message || '解除失败', icon: 'none' })
          }
        }
      },
    })
  }, [currentFamily, selectedPetId, viewMode, loadOverview])

  const handlePetCardClick = (petId: string) => {
    if (addingRelation) {
      handleConfirmRelation(petId)
      return
    }
    setSelectedPetId(petId)
  }

  const renderPetCard = (
    pet: PetProfile,
    relation: 'self' | 'parent' | 'grandparent' | 'greatGrandparent' | 'child' | 'grandchild' | 'greatGrandchild' | 'sibling' | 'mate',
    extra?: { litterDate?: string; labelOverride?: string },
  ) => {
    const isSelected = pet.id === selectedPetId
    const genderIcon = getGenderIcon(pet.gender)
    const genderClass = getGenderClass(pet.gender)
    const age = calcAge(pet.birthDate)

    return (
      <View
        key={pet.id}
        className={`lineage-card ${isSelected ? 'lineage-card--selected' : ''} ${addingRelation ? 'lineage-card--selectable' : ''}`}
        onClick={() => handlePetCardClick(pet.id)}
      >
        <View className='lineage-card-badge'>
          <Text className='lineage-card-badge-text'>{extra?.labelOverride || RELATION_LABELS[relation]}</Text>
        </View>
        <View className='lineage-card-body'>
          <View className='lineage-card-avatar'>
            <Text className='lineage-card-emoji'>{getSpeciesEmoji(pet.species)}</Text>
          </View>
          <View className='lineage-card-info'>
            <View className='lineage-card-name-row'>
              <Text className='lineage-card-name'>{pet.name}</Text>
              {genderIcon && (
                <Text className={`lineage-card-gender ${genderClass}`}>{genderIcon}</Text>
              )}
            </View>
            <Text className='lineage-card-breed'>
              {pet.breed || '未知品种'}
              {age ? ` · ${age}` : ''}
            </Text>
            {extra?.litterDate && (
              <Text className='lineage-card-litter'>📅 {extra.litterDate}</Text>
            )}
          </View>
        </View>
      </View>
    )
  }

  // 树形连线（类名匹配 SCSS: lineage-connector / lineage-connector-line / lineage-connector-dot）
  const renderTreeConnector = (direction: 'up' | 'down') => (
    <View className='lineage-connector'>
      <View className={`lineage-connector-line lineage-connector-line--${direction === 'up' ? 'top' : 'bottom'}`} />
      <View className='lineage-connector-dot' />
    </View>
  )

  if (!dataReady) {
    return (
      <View className={`lineage-page ${themeClass}`}>
        <View className='lineage-empty'>
          <Text className='lineage-empty-icon'>⏳</Text>
          <Text className='lineage-empty-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  // 无家庭：引导创建家庭
  if (!currentFamily) {
    return (
      <View className={`lineage-page ${themeClass}`}>
        <View className='lineage-empty'>
          <Text className='lineage-empty-icon'>🏡</Text>
          <Text className='lineage-empty-text'>还没有创建家庭</Text>
          <Text className='lineage-empty-hint'>创建家庭后，可以添加毛孩子并建立家族血缘关系</Text>
          <View className='lineage-empty-btn' onClick={() => Taro.navigateTo({ url: '/pagesPet/family/dashboard/index' })}>
            <Text>前往创建家庭</Text>
          </View>
        </View>
      </View>
    )
  }

  // 有家庭但无成员：引导添加成员
  if (familyPets.length === 0) {
    return (
      <View className={`lineage-page ${themeClass}`}>
        <View className='lineage-empty'>
          <Text className='lineage-empty-icon'>🧬</Text>
          <Text className='lineage-empty-text'>还没有家庭成员</Text>
          <Text className='lineage-empty-hint'>请先在家庭看板中添加宠物成员</Text>
          <View className='lineage-empty-btn' onClick={() => Taro.navigateTo({ url: '/pagesPet/family/dashboard/index' })}>
            <Text>前往添加成员</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className={`lineage-page ${themeClass}`}>
      <View className='lineage-header'>
        <View className='lineage-header-top'>
          <Text className='lineage-header-title'>🧬 家族图谱</Text>
          <View className='lineage-view-toggle'>
            <Text
              className={`lineage-view-toggle-btn ${viewMode === 'single' ? 'lineage-view-toggle-btn--active' : ''}`}
              onClick={() => handleSwitchMode('single')}
            >单宠视图</Text>
            <Text
              className={`lineage-view-toggle-btn ${viewMode === 'overview' ? 'lineage-view-toggle-btn--active' : ''}`}
              onClick={() => handleSwitchMode('overview')}
            >关系总览</Text>
          </View>
          {viewMode === 'single' && (
            <View className='lineage-header-switch' onClick={() => setPetSelectorOpen(!petSelectorOpen)}>
              <Text className='lineage-header-switch-text'>
                {selectedPet?.name || '选择宠物'}
              </Text>
              <Text className='lineage-header-switch-arrow'>
                {petSelectorOpen ? '▲' : '▼'}
              </Text>
            </View>
          )}
        </View>
        {viewMode === 'single' && petSelectorOpen && (
          <View className='lineage-selector'>
            {familyPets.map(pet => (
              <View
                key={pet.id}
                className={`lineage-selector-item ${pet.id === selectedPetId ? 'lineage-selector-item--active' : ''}`}
                onClick={() => handleSelectPet(pet.id)}
              >
                <Text className='lineage-selector-emoji'>{getSpeciesEmoji(pet.species)}</Text>
                <Text className='lineage-selector-name'>{pet.name}</Text>
                {pet.id === selectedPetId && <Text className='lineage-selector-check'>✓</Text>}
              </View>
            ))}
          </View>
        )}
      </View>

      {viewMode === 'overview' && (
        <View className='lineage-overview'>
          {overviewLoading ? (
            <View className='lineage-overview-loading'>
              <Text>加载中...</Text>
            </View>
          ) : overviewData && overviewData.members.length > 0 ? (() => {
            // ===== 图谱布局计算 =====
            const { members, lineages, relationships } = overviewData
            const childToParents = new Map<string, string[]>()
            const parentToChildren = new Map<string, string[]>()
            lineages.forEach(l => {
              if (!childToParents.has(l.childId)) childToParents.set(l.childId, [])
              childToParents.get(l.childId)!.push(l.parentId)
              if (!parentToChildren.has(l.parentId)) parentToChildren.set(l.parentId, [])
              parentToChildren.get(l.parentId)!.push(l.childId)
            })

            // BFS 分层
            const roots = members.filter(m => !childToParents.has(m.petId)).map(m => m.petId)
            const levels: string[][] = []
            const visited = new Set<string>()
            let current = roots
            while (current.length > 0) {
              levels.push(current)
              current.forEach(id => visited.add(id))
              const next: string[] = []
              current.forEach(id => {
                const children = parentToChildren.get(id) || []
                children.forEach(cid => {
                  if (!visited.has(cid) && !next.includes(cid)) next.push(cid)
                })
              })
              current = next
            }
            members.forEach(m => {
              if (!visited.has(m.petId)) {
                levels.push([m.petId])
                visited.add(m.petId)
              }
            })

            const memberMap = new Map(members.map(m => [m.petId, m]))
            const siblingRels = relationships.filter(r => r.relationType === 'sibling')
            const mateRels = relationships.filter(r => r.relationType === 'mate')

            const NODE_W = 120
            const NODE_GAP = 24
            const LAYER_GAP = 100

            return (
              <>
                {/* 图谱统计栏 */}
                <View className='graph-stats-bar'>
                  <View className='graph-stats-item'>
                    <Text className='graph-stats-num'>{members.length}</Text>
                    <Text className='graph-stats-label'>成员</Text>
                  </View>
                  <View className='graph-stats-divider' />
                  <View className='graph-stats-item'>
                    <Text className='graph-stats-num'>{lineages.length}</Text>
                    <Text className='graph-stats-label'>亲子</Text>
                  </View>
                  <View className='graph-stats-divider' />
                  <View className='graph-stats-item'>
                    <Text className='graph-stats-num'>{siblingRels.length}</Text>
                    <Text className='graph-stats-label'>手足</Text>
                  </View>
                  <View className='graph-stats-divider' />
                  <View className='graph-stats-item'>
                    <Text className='graph-stats-num'>{mateRels.length}</Text>
                    <Text className='graph-stats-label'>配偶</Text>
                  </View>
                </View>

                {/* 关系图谱 */}
                <ScrollView scrollX className='graph-scroll' enhanced showScrollbar={false}>
                  <View
                    className='graph-canvas'
                    style={{
                      width: `${Math.max(...levels.map(l => l.length)) * (NODE_W + NODE_GAP) + NODE_GAP}rpx`,
                      minHeight: `${levels.length * LAYER_GAP + 60}rpx`,
                    }}
                  >
                    {/* 铲屎官根节点 */}
                    {levels[0] && levels[0].length > 0 && childToParents.size === 0 && user && (
                      <View
                        className='graph-node graph-node--owner'
                        style={{
                          left: `${(levels[0].length * (NODE_W + NODE_GAP)) / 2 - NODE_W / 2 + NODE_GAP / 2}rpx`,
                          top: '0rpx',
                          width: `${NODE_W}rpx`,
                        }}
                      >
                        <View className='graph-node-avatar graph-node-avatar--owner'>
                          <Text className='graph-node-emoji'>🧑</Text>
                        </View>
                        <Text className='graph-node-name'>{user.nickname || '铲屎官'}</Text>
                        <Text className='graph-node-tag'>🏠 家长</Text>
                      </View>
                    )}

                    {/* 宠物节点 */}
                    {levels.map((level, levelIdx) =>
                      level.map((petId, idx) => {
                        const m = memberMap.get(petId)
                        if (!m) return null
                        const emoji = m.species === 'cat' ? '🐱' : m.species === 'dog' ? '🐕' : '🐾'
                        const genderIcon = m.gender === 'male' ? '♂' : m.gender === 'female' ? '♀' : ''
                        const genderClass = m.gender === 'male' ? 'male' : m.gender === 'female' ? 'female' : ''
                        const left = idx * (NODE_W + NODE_GAP) + NODE_GAP / 2
                        const hasOwnerRoot = childToParents.size === 0 && !!user
                        const top = hasOwnerRoot ? (levelIdx + 1) * LAYER_GAP + 20 : levelIdx * LAYER_GAP + 20

                        return (
                          <View
                            key={petId}
                            className='graph-node'
                            style={{
                              left: `${left}rpx`,
                              top: `${top}rpx`,
                              width: `${NODE_W}rpx`,
                            }}
                          >
                            <View className='graph-node-avatar'>
                              <Text className='graph-node-emoji'>{emoji}</Text>
                            </View>
                            <Text className='graph-node-name'>{m.name || '未命名'}</Text>
                            <View className='graph-node-tags'>
                              {genderIcon && (
                                <Text className={`graph-node-gender graph-node-gender--${genderClass}`}>{genderIcon}</Text>
                              )}
                              <Text className='graph-node-layer'>L{levelIdx + 1}</Text>
                            </View>
                          </View>
                        )
                      })
                    )}

                    {/* 亲子连线 */}
                    {lineages.map(l => {
                      let parentPos: { x: number; y: number } | null = null
                      let childPos: { x: number; y: number } | null = null
                      const hasOwnerRoot = childToParents.size === 0 && !!user
                      levels.forEach((level, levelIdx) => {
                        const pIdx = level.indexOf(l.parentId)
                        if (pIdx >= 0) {
                          parentPos = {
                            x: pIdx * (NODE_W + NODE_GAP) + NODE_GAP / 2 + NODE_W / 2,
                            y: (hasOwnerRoot ? (levelIdx + 1) * LAYER_GAP + 20 : levelIdx * LAYER_GAP + 20) + 60,
                          }
                        }
                        const cIdx = level.indexOf(l.childId)
                        if (cIdx >= 0) {
                          childPos = {
                            x: cIdx * (NODE_W + NODE_GAP) + NODE_GAP / 2 + NODE_W / 2,
                            y: (hasOwnerRoot ? (levelIdx + 1) * LAYER_GAP + 20 : levelIdx * LAYER_GAP + 20),
                          }
                        }
                      })
                      if (!parentPos || !childPos) return null

                      return (
                        <View
                          key={l.id}
                          className='graph-edge graph-edge--lineage'
                          style={{
                            left: `${Math.min(parentPos.x, childPos.x)}rpx`,
                            top: `${parentPos.y}rpx`,
                            width: `${Math.abs(childPos.x - parentPos.x) || 2}rpx`,
                            height: `${childPos.y - parentPos.y}rpx`,
                          }}
                          onClick={() => {
                            if (!currentFamily) return
                            Taro.showModal({
                              title: '删除亲子关系',
                              content: `确认删除 ${l.parentName} → ${l.childName} 的亲子关系吗？`,
                              confirmText: '确认删除',
                              confirmColor: '#E0856B',
                              cancelText: '取消',
                              success: async (res) => {
                                if (res.confirm) {
                                  try {
                                    await familyService.removeLineage(l.id, currentFamily.id)
                                    loadOverview()
                                    Taro.showToast({ title: '关系已删除', icon: 'success' })
                                  } catch (err: unknown) {
                                    const error = err as { message?: string }
                                    Taro.showToast({ title: error.message || '删除失败', icon: 'none' })
                                  }
                                }
                              },
                            })
                          }}
                        />
                      )
                    })}

                    {/* 配偶/手足连线 */}
                    {relationships.map(r => {
                      let posA: { x: number; y: number } | null = null
                      let posB: { x: number; y: number } | null = null
                      const hasOwnerRoot = childToParents.size === 0 && !!user
                      levels.forEach((level, levelIdx) => {
                        const aIdx = level.indexOf(r.petIdA)
                        if (aIdx >= 0) {
                          posA = {
                            x: aIdx * (NODE_W + NODE_GAP) + NODE_GAP / 2 + NODE_W,
                            y: (hasOwnerRoot ? (levelIdx + 1) * LAYER_GAP + 20 : levelIdx * LAYER_GAP + 20) + 30,
                          }
                        }
                        const bIdx = level.indexOf(r.petIdB)
                        if (bIdx >= 0) {
                          posB = {
                            x: bIdx * (NODE_W + NODE_GAP) + NODE_GAP / 2,
                            y: (hasOwnerRoot ? (levelIdx + 1) * LAYER_GAP + 20 : levelIdx * LAYER_GAP + 20) + 30,
                          }
                        }
                      })
                      if (!posA || !posB) return null
                      if (Math.abs(posA.y - posB.y) > 10) return null

                      const isMate = r.relationType === 'mate'
                      const label = isMate ? '💞' : (() => {
                        const ma = memberMap.get(r.petIdA)
                        const mb = memberMap.get(r.petIdB)
                        return getSiblingLabel(ma?.gender || undefined, mb?.gender || undefined)
                      })()

                      return (
                        <View
                          key={r.id}
                          className={`graph-edge-h ${isMate ? 'graph-edge-h--mate' : 'graph-edge-h--sibling'}`}
                          style={{
                            left: `${Math.min(posA.x, posB.x)}rpx`,
                            top: `${posA.y}rpx`,
                            width: `${Math.abs(posB.x - posA.x)}rpx`,
                          }}
                          onClick={() => {
                            if (!currentFamily) return
                            Taro.showModal({
                              title: `删除${isMate ? '配偶' : label}关系`,
                              content: `确认删除 ${r.petAName} 和 ${r.petBName} 的${isMate ? '配偶' : label}关系吗？`,
                              confirmText: '确认删除',
                              confirmColor: '#E0856B',
                              cancelText: '取消',
                              success: async (res) => {
                                if (res.confirm) {
                                  try {
                                    if (isMate) {
                                      await familyService.removeMate(currentFamily.id, r.id)
                                    } else {
                                      await familyService.removeSibling(currentFamily.id, r.id)
                                    }
                                    loadOverview()
                                    Taro.showToast({ title: '关系已删除', icon: 'success' })
                                  } catch (err: unknown) {
                                    const error = err as { message?: string }
                                    Taro.showToast({ title: error.message || '删除失败', icon: 'none' })
                                  }
                                }
                              },
                            })
                          }}
                        >
                          <Text className='graph-edge-label'>{label}</Text>
                        </View>
                      )
                    })}
                  </View>
                </ScrollView>

                {/* 图例 */}
                <View className='graph-legend'>
                  <View className='graph-legend-item'>
                    <View className='graph-legend-line graph-legend-line--solid' />
                    <Text>亲子</Text>
                  </View>
                  <View className='graph-legend-item'>
                    <View className='graph-legend-line graph-legend-line--dashed-red' />
                    <Text>配偶</Text>
                  </View>
                  <View className='graph-legend-item'>
                    <View className='graph-legend-line graph-legend-line--dashed-blue' />
                    <Text>手足</Text>
                  </View>
                  <Text className='graph-legend-hint'>点击连线可删除关系</Text>
                </View>
              </>
            )
          })() : (
            <View className='lineage-overview-empty'>
              <Text>暂无家庭成员</Text>
            </View>
          )}
        </View>
      )}

      {viewMode === 'single' && addingRelation && (
        <View className='lineage-adding-banner'>
          <Text className='lineage-adding-banner-icon'>
            {addingRelation.mode === 'parent' ? '👆' : addingRelation.mode === 'mate' ? '💞' : addingRelation.mode === 'sibling' ? '🤝' : '👇'}
          </Text>
          <Text className='lineage-adding-banner-text'>
            请选择{addingRelation.mode === 'parent' ? '父母' : addingRelation.mode === 'mate' ? '配偶' : addingRelation.mode === 'sibling' ? '兄弟姐妹' : '子女'}宠物
          </Text>
          <View className='lineage-adding-banner-cancel' onClick={() => setAddingRelation(null)}>
            <Text>取消</Text>
          </View>
        </View>
      )}

      {viewMode === 'single' && (
      <ScrollView className='lineage-scroll' scrollY>
        <View className='lineage-tree'>
          {/* 配偶层（最上方） */}
          {matePets.length > 0 && (
            <View className='lineage-layer lineage-layer--mates'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>💞 配偶</Text>
              </View>
              <View className='lineage-layer-cards'>
                {matePets.map(({ pet, relationshipId }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'mate')}
                    {!addingRelation && (
                      <View className='lineage-remove-btn' onClick={() => handleRemoveMate(relationshipId, pet.name)}>
                        <Text>✕</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 铲屎官节点（当宠物没有父母/祖辈时显示，作为家族树的根） */}
          {hasNoAncestors && !loading && !addingRelation && user && (
            <View className='lineage-layer lineage-layer--owner'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>🏠 铲屎官</Text>
              </View>
              <View className='lineage-owner-card'>
                <View className='lineage-owner-badge'>
                  <Text className='lineage-owner-badge-text'>铲屎官</Text>
                </View>
                <View className='lineage-owner-body'>
                  <View className='lineage-owner-avatar'>
                    <Text className='lineage-owner-emoji'>🧑</Text>
                  </View>
                  <View className='lineage-owner-info'>
                    <Text className='lineage-owner-name'>{user.nickname || '主人'}</Text>
                    <Text className='lineage-owner-role'>毛孩子的家长</Text>
                  </View>
                </View>
              </View>
              {renderTreeConnector('down')}
            </View>
          )}

          {/* 曾祖层 */}
          {greatGrandparentPets.length > 0 && (
            <View className='lineage-layer lineage-layer--ancestors'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👆 曾祖</Text>
              </View>
              <View className='lineage-layer-cards'>
                {greatGrandparentPets.map(({ pet, lineageId, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'greatGrandparent', { litterDate })}
                    {!addingRelation && (
                      <View className='lineage-remove-btn' onClick={() => handleRemoveRelation(lineageId, 'parent', pet.name)}>
                        <Text>✕</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              {renderTreeConnector('down')}
            </View>
          )}

          {/* 祖辈层 */}
          {grandparentPets.length > 0 && (
            <View className='lineage-layer lineage-layer--ancestors'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👆 祖辈</Text>
              </View>
              <View className='lineage-layer-cards'>
                {grandparentPets.map(({ pet, lineageId, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'grandparent', { litterDate })}
                    {!addingRelation && (
                      <View className='lineage-remove-btn' onClick={() => handleRemoveRelation(lineageId, 'parent', pet.name)}>
                        <Text>✕</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              {renderTreeConnector('down')}
            </View>
          )}

          {/* 父母层 */}
          {parentPets.length > 0 && (
            <View className='lineage-layer lineage-layer--parents'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👆 父母</Text>
              </View>
              <View className='lineage-layer-cards'>
                {parentPets.map(({ pet, lineageId, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'parent', { litterDate })}
                    {!addingRelation && (
                      <View className='lineage-remove-btn' onClick={() => handleRemoveRelation(lineageId, 'parent', pet.name)}>
                        <Text>✕</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              {renderTreeConnector('down')}
            </View>
          )}

          {/* 中间层：兄弟姐妹 + 选中宠物 */}
          <View className='lineage-layer lineage-layer--center'>
            <View className='lineage-center-row'>
              {/* 兄弟姐妹（左侧） */}
              {siblingPets.length > 0 && (
                <View className='lineage-siblings-side'>
                  <View className='lineage-layer-label'>
                    <Text className='lineage-layer-label-text'>🤝 手足</Text>
                  </View>
                  <View className='lineage-siblings-list'>
                    {siblingPets.map(({ pet, lineageId, source }) => {
                      const siblingLabel = getSiblingLabel(selectedPet?.gender, pet.gender)
                      return (
                        <View key={pet.id} className='lineage-card-wrap lineage-card-wrap--sibling'>
                          {renderPetCard(pet, 'sibling', { labelOverride: siblingLabel })}
                          {!addingRelation && source === 'sibling_rel' && (
                            <View className='lineage-remove-btn' onClick={() => handleRemoveSibling(lineageId, pet.name, siblingLabel)}>
                              <Text>✕</Text>
                            </View>
                          )}
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* 选中宠物自身 */}
              {selectedPet && (
                <View className='lineage-self-wrap'>
                  <View className='lineage-self-card'>
                    <View className='lineage-self-glow' />
                    <View className='lineage-self-body'>
                      <View className='lineage-self-avatar'>
                        <Text className='lineage-self-emoji'>{getSpeciesEmoji(selectedPet.species)}</Text>
                      </View>
                      <View className='lineage-self-info'>
                        <View className='lineage-self-name-row'>
                          <Text className='lineage-self-name'>{selectedPet.name}</Text>
                          {getGenderIcon(selectedPet.gender) && (
                            <Text className={`lineage-card-gender ${getGenderClass(selectedPet.gender)}`}>
                              {getGenderIcon(selectedPet.gender)}
                            </Text>
                          )}
                        </View>
                        <Text className='lineage-self-breed'>
                          {selectedPet.breed || '未知品种'}
                          {calcAge(selectedPet.birthDate) ? ` · ${calcAge(selectedPet.birthDate)}` : ''}
                        </Text>
                      </View>
                    </View>
                    {!addingRelation && (
                      <View className='lineage-self-actions'>
                        <View className='lineage-self-action' onClick={handleAddParent}>
                          <Text className='lineage-self-action-icon'>+👆</Text>
                          <Text className='lineage-self-action-text'>添加父母</Text>
                        </View>
                        <View className='lineage-self-action' onClick={handleAddMate}>
                          <Text className='lineage-self-action-icon'>+💞</Text>
                          <Text className='lineage-self-action-text'>添加配偶</Text>
                        </View>
                        <View className='lineage-self-action' onClick={handleAddSibling}>
                          <Text className='lineage-self-action-icon'>+🤝</Text>
                          <Text className='lineage-self-action-text'>添加手足</Text>
                        </View>
                        <View className='lineage-self-action' onClick={handleAddChild}>
                          <Text className='lineage-self-action-icon'>+👇</Text>
                          <Text className='lineage-self-action-text'>添加子女</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 子女层 */}
          {childPets.length > 0 && (
            <View className='lineage-layer lineage-layer--children'>
              {renderTreeConnector('up')}
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👇 子女</Text>
              </View>
              <View className='lineage-layer-cards'>
                {childPets.map(({ pet, lineageId, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'child', { litterDate })}
                    {!addingRelation && (
                      <View className='lineage-remove-btn' onClick={() => handleRemoveRelation(lineageId, 'child', pet.name)}>
                        <Text>✕</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 孙辈层 */}
          {grandchildPets.length > 0 && (
            <View className='lineage-layer lineage-layer--descendants'>
              {renderTreeConnector('up')}
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👇 孙辈</Text>
              </View>
              <View className='lineage-layer-cards'>
                {grandchildPets.map(({ pet, lineageId, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'grandchild', { litterDate })}
                    {!addingRelation && (
                      <View className='lineage-remove-btn' onClick={() => handleRemoveRelation(lineageId, 'child', pet.name)}>
                        <Text>✕</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 曾孙层 */}
          {greatGrandchildPets.length > 0 && (
            <View className='lineage-layer lineage-layer--descendants'>
              {renderTreeConnector('up')}
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👇 曾孙</Text>
              </View>
              <View className='lineage-layer-cards'>
                {greatGrandchildPets.map(({ pet, lineageId, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'greatGrandchild', { litterDate })}
                    {!addingRelation && (
                      <View className='lineage-remove-btn' onClick={() => handleRemoveRelation(lineageId, 'child', pet.name)}>
                        <Text>✕</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 空状态 */}
          {!hasAnyRelation && !loading && !addingRelation && (
            <View className='lineage-empty-relation'>
              <Text className='lineage-empty-relation-icon'>🧬</Text>
              <Text className='lineage-empty-relation-text'>
                {selectedPet?.name || '这只宠物'}还没有家族关系
              </Text>
              <Text className='lineage-empty-relation-hint'>
                点击上方按钮添加父母、配偶或子女
              </Text>
            </View>
          )}
        </View>

        {/* 可选宠物列表（添加关系时） */}
        {addingRelation && (
          <View className='lineage-available-section'>
            <View className='lineage-section-title'>
              <Text>可选宠物</Text>
            </View>
            <View className='lineage-available-list'>
              {availableForRelation.map(pet => (
                <View
                  key={pet.id}
                  className='lineage-available-item'
                  onClick={() => handleConfirmRelation(pet.id)}
                >
                  <Text className='lineage-available-emoji'>{getSpeciesEmoji(pet.species)}</Text>
                  <View className='lineage-available-info'>
                    <Text className='lineage-available-name'>{pet.name}</Text>
                    <Text className='lineage-available-breed'>{pet.breed || '未知品种'}</Text>
                  </View>
                  <Text className='lineage-available-add'>+</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className='lineage-bottom-safe' />
      </ScrollView>
      )}
    </View>
  )
}