/**
 * 家族图谱页面
 * 宠物家族关系图谱展示
 */
import { useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePetStore } from '../../../stores/petStore'
import { useAuthStore } from '../../../stores/authStore'
import { useFamilyStore } from '../../../stores/familyStore'
import { familyService } from '../../../services/familyService'
import { useThemeClass } from '../../../hooks/useThemeClass'
import type { PetProfile } from '../../../services/petService'
import type { PetLineage } from '../../../types/familyTypes'
import './index.scss'

interface TreeNode {
  pet: PetProfile
  depth: number
  parentId?: string
  children: TreeNode[]
  relation: 'self' | 'parent' | 'child' | 'sibling'
}

interface LineageData {
  parents: PetLineage[]
  children: PetLineage[]
}

const RELATION_LABELS: Record<string, string> = {
  self: '我',
  parent: '父母',
  child: '子女',
  sibling: '兄弟姐妹',
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
  const [lineageMap, setLineageMap] = useState<Record<string, LineageData>>({})
  const [loading, setLoading] = useState(true)
  const [petSelectorOpen, setPetSelectorOpen] = useState(false)
  const [addingRelation, setAddingRelation] = useState<{
    childId: string
    mode: 'parent' | 'child'
  } | null>(null)
  const themeClass = useThemeClass()

  useEffect(() => {
    fetchFamilies()
  }, [])

  useEffect(() => {
    if (user) {
      fetchPets(user.id)
    }
  }, [user])

  const familyPets = useMemo(() => {
    if (!currentFamily || members.length === 0) return pets
    const memberPetIds = new Set(members.map(m => m.petId))
    return pets.filter(p => memberPetIds.has(p.id))
  }, [pets, members, currentFamily])

  useEffect(() => {
    if (familyPets.length > 0) {
      if (!selectedPetId || !familyPets.find(p => p.id === selectedPetId)) {
        setSelectedPetId(familyPets[0].id)
      }
    }
  }, [familyPets])

  useEffect(() => {
    if (!selectedPetId) return
    const loadLineage = async () => {
      setLoading(true)
      try {
        const data = await familyService.getLineage(selectedPetId)
        setLineageMap(prev => ({ ...prev, [selectedPetId]: data }))
      } catch {
        setLineageMap(prev => ({
          ...prev,
          [selectedPetId]: { parents: [], children: [] },
        }))
      } finally {
        setLoading(false)
      }
    }
    loadLineage()
  }, [selectedPetId])

  const selectedPet = useMemo(() => {
    return familyPets.find(p => p.id === selectedPetId) || null
  }, [familyPets, selectedPetId])

  const lineage = useMemo(() => {
    return selectedPetId ? lineageMap[selectedPetId] || { parents: [], children: [] } : { parents: [], children: [] }
  }, [selectedPetId, lineageMap])

  const parentPets = useMemo(() => {
    const parentIds = lineage.parents.map(l => l.parentId)
    return pets.filter(p => parentIds.includes(p.id)).map(p => {
      const l = lineage.parents.find(lp => lp.parentId === p.id)
      return { pet: p, litterDate: l?.litterDate }
    })
  }, [pets, lineage.parents])

  const childPets = useMemo(() => {
    const childIds = lineage.children.map(l => l.childId)
    return pets.filter(p => childIds.includes(p.id)).map(p => {
      const l = lineage.children.find(lc => lc.childId === p.id)
      return { pet: p, litterDate: l?.litterDate }
    })
  }, [pets, lineage.children])

  const siblingPets = useMemo(() => {
    if (parentPets.length === 0) return []
    const parentIds = new Set(parentPets.map(p => p.pet.id))
    const siblings: PetProfile[] = []
    for (const parentId of parentIds) {
      const parentLineage = lineageMap[parentId]
      if (!parentLineage) continue
      for (const child of parentLineage.children) {
        if (child.childId === selectedPetId) continue
        const pet = pets.find(p => p.id === child.childId)
        if (pet && !siblings.find(s => s.id === pet.id)) {
          siblings.push(pet)
        }
      }
    }
    return siblings
  }, [parentPets, lineageMap, selectedPetId, pets])

  const availableForRelation = useMemo(() => {
    const relatedIds = new Set<string>()
    relatedIds.add(selectedPetId!)
    lineage.parents.forEach(l => relatedIds.add(l.parentId))
    lineage.children.forEach(l => relatedIds.add(l.childId))
    siblingPets.forEach(s => relatedIds.add(s.id))
    parentPets.forEach(p => relatedIds.add(p.pet.id))
    return pets.filter(p => !relatedIds.has(p.id))
  }, [pets, selectedPetId, lineage, siblingPets, parentPets])

  const hasAnyRelation = parentPets.length > 0 || childPets.length > 0 || siblingPets.length > 0

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

  const handleConfirmRelation = async (targetPetId: string) => {
    if (!addingRelation) return
    try {
      if (addingRelation.mode === 'parent') {
        await familyService.addLineage(targetPetId, addingRelation.childId)
        Taro.showToast({ title: '父母关系已添加', icon: 'success' })
      } else {
        await familyService.addLineage(addingRelation.childId, targetPetId)
        Taro.showToast({ title: '子女关系已添加', icon: 'success' })
      }
      if (selectedPetId) {
        const data = await familyService.getLineage(selectedPetId)
        setLineageMap(prev => ({ ...prev, [selectedPetId!]: data }))
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '添加失败', icon: 'none' })
    } finally {
      setAddingRelation(null)
    }
  }

  const handleRemoveRelation = (lineageId: string, relationType: 'parent' | 'child', targetName: string) => {
    Taro.showModal({
      title: '解除关系',
      content: `确认解除与${targetName}的${relationType === 'parent' ? '父母' : '子女'}关系吗？`,
      confirmText: '确认解除',
      confirmColor: '#E0856B',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            await familyService.removeLineage(lineageId)
            const data = await familyService.getLineage(selectedPetId!)
            setLineageMap(prev => ({ ...prev, [selectedPetId!]: data }))
            Taro.showToast({ title: '关系已解除', icon: 'success' })
          } catch (err: unknown) {
            const error = err as { message?: string }
            Taro.showToast({ title: error.message || '解除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handlePetCardClick = (petId: string) => {
    if (addingRelation) {
      handleConfirmRelation(petId)
      return
    }
    setSelectedPetId(petId)
  }

  const renderPetCard = (
    pet: PetProfile,
    relation: 'self' | 'parent' | 'child' | 'sibling',
    extra?: { litterDate?: string },
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
          <Text className='lineage-card-badge-text'>{RELATION_LABELS[relation]}</Text>
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
              <Text className='lineage-card-litter'>
                📅 {extra.litterDate}
              </Text>
            )}
          </View>
          {isSelected && !addingRelation && (
            <View className='lineage-card-indicator'>
              <View className='lineage-card-dot' />
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderConnector = (fromTop: boolean) => (
    <View className='lineage-connector'>
      <View className={`lineage-connector-line ${fromTop ? 'lineage-connector-line--top' : 'lineage-connector-line--bottom'}`} />
      <View className='lineage-connector-dot' />
    </View>
  )

  if (familyPets.length === 0) {
    return (
      <View className={`lineage-page ${themeClass}`}>
        <View className='lineage-empty'>
          <Text className='lineage-empty-icon'>🧬</Text>
          <Text className='lineage-empty-text'>还没有家庭成员</Text>
          <Text className='lineage-empty-hint'>请先在家庭看板中添加宠物</Text>
          <View
            className='lineage-empty-btn'
            onClick={() => Taro.navigateBack()}
          >
            <Text>返回家庭看板</Text>
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
          <View
            className='lineage-header-switch'
            onClick={() => setPetSelectorOpen(!petSelectorOpen)}
          >
            <Text className='lineage-header-switch-text'>
              {selectedPet?.name || '选择宠物'}
            </Text>
            <Text className='lineage-header-switch-arrow'>
              {petSelectorOpen ? '▲' : '▼'}
            </Text>
          </View>
        </View>
        {petSelectorOpen && (
          <View className='lineage-selector'>
            {familyPets.map(pet => (
              <View
                key={pet.id}
                className={`lineage-selector-item ${pet.id === selectedPetId ? 'lineage-selector-item--active' : ''}`}
                onClick={() => handleSelectPet(pet.id)}
              >
                <Text className='lineage-selector-emoji'>
                  {getSpeciesEmoji(pet.species)}
                </Text>
                <Text className='lineage-selector-name'>{pet.name}</Text>
                {pet.id === selectedPetId && (
                  <Text className='lineage-selector-check'>✓</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {addingRelation && (
        <View className='lineage-adding-banner'>
          <Text className='lineage-adding-banner-icon'>
            {addingRelation.mode === 'parent' ? '👆' : '👇'}
          </Text>
          <Text className='lineage-adding-banner-text'>
            请选择{addingRelation.mode === 'parent' ? '父母' : '子女'}宠物
          </Text>
          <View
            className='lineage-adding-banner-cancel'
            onClick={() => setAddingRelation(null)}
          >
            <Text>取消</Text>
          </View>
        </View>
      )}

      <ScrollView className='lineage-scroll' scrollY>
        <View className='lineage-tree'>
          {/* 父母层 */}
          {parentPets.length > 0 && (
            <View className='lineage-layer lineage-layer--parents'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👆 父母</Text>
              </View>
              <View className='lineage-layer-cards'>
                {parentPets.map(({ pet, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'parent', { litterDate })}
                    <View
                      className='lineage-remove-btn'
                      onClick={() => handleRemoveRelation(
                        lineage.parents.find(l => l.parentId === pet.id)?.id || '',
                        'parent',
                        pet.name,
                      )}
                    >
                      <Text>✕</Text>
                    </View>
                  </View>
                ))}
              </View>
              {renderConnector(true)}
            </View>
          )}

          {/* 兄弟姐妹层 */}
          {siblingPets.length > 0 && (
            <View className='lineage-layer lineage-layer--siblings'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>🤝 兄弟姐妹</Text>
              </View>
              <View className='lineage-layer-cards'>
                {siblingPets.map(pet => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'sibling')}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 选中宠物自身 */}
          {selectedPet && (
            <View className='lineage-layer lineage-layer--self'>
              <View className='lineage-self-card'>
                <View className='lineage-self-glow' />
                <View className='lineage-self-body'>
                  <View className='lineage-self-avatar'>
                    <Text className='lineage-self-emoji'>
                      {getSpeciesEmoji(selectedPet.species)}
                    </Text>
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
                <View className='lineage-self-actions'>
                  <View className='lineage-self-action' onClick={handleAddParent}>
                    <Text className='lineage-self-action-icon'>+👆</Text>
                    <Text className='lineage-self-action-text'>添加父母</Text>
                  </View>
                  <View className='lineage-self-action' onClick={handleAddChild}>
                    <Text className='lineage-self-action-icon'>+👇</Text>
                    <Text className='lineage-self-action-text'>添加子女</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 兄弟姐妹层(下方) */}
          {siblingPets.length > 0 && parentPets.length === 0 && (
            <View className='lineage-layer lineage-layer--siblings'>
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>🤝 兄弟姐妹</Text>
              </View>
              <View className='lineage-layer-cards'>
                {siblingPets.map(pet => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'sibling')}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 子女层 */}
          {childPets.length > 0 && (
            <View className='lineage-layer lineage-layer--children'>
              {renderConnector(false)}
              <View className='lineage-layer-label'>
                <Text className='lineage-layer-label-text'>👇 子女</Text>
              </View>
              <View className='lineage-layer-cards'>
                {childPets.map(({ pet, litterDate }) => (
                  <View key={pet.id} className='lineage-card-wrap'>
                    {renderPetCard(pet, 'child', { litterDate })}
                    <View
                      className='lineage-remove-btn'
                      onClick={() => handleRemoveRelation(
                        lineage.children.find(l => l.childId === pet.id)?.id || '',
                        'child',
                        pet.name,
                      )}
                    >
                      <Text>✕</Text>
                    </View>
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
                点击上方按钮添加父母或子女
              </Text>
            </View>
          )}
        </View>

        {/* 可选宠物列表(添加关系时) */}
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
                  <Text className='lineage-available-emoji'>
                    {getSpeciesEmoji(pet.species)}
                  </Text>
                  <View className='lineage-available-info'>
                    <Text className='lineage-available-name'>{pet.name}</Text>
                    <Text className='lineage-available-breed'>
                      {pet.breed || '未知品种'}
                    </Text>
                  </View>
                  <Text className='lineage-available-add'>+</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className='lineage-bottom-safe' />
      </ScrollView>
    </View>
  )
}