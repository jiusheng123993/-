/**
 * 添加宠物页面
 * 宠物信息表单输入，支持品种搜索选择、头像上传
 */
import { View, Text, Input, Picker, Switch, Textarea, Image, ScrollView } from '@tarojs/components'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePet } from '../../hooks/usePet'
import { useVaccine } from '../../hooks/useVaccine'
import { useAuthStore } from '../../stores/authStore'
import { BREED_DATA } from '../../data/petKnowledge/breeds'
import Taro from '@tarojs/taro'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import { safeNavigateBack } from '../../utils/navigation'
import { chooseImageWithPrivacy } from '../../utils/privacy'
import type { BreedItem } from '../../data/petKnowledge/breeds'
import './index.scss'

/** 草稿存储 key */
const DRAFT_KEY = 'xhh_add_pet_draft'

interface FormData {
  name: string
  species: 'dog' | 'cat' | ''
  breedId: string
  breedName: string
  gender: 'male' | 'female' | ''
  birthDate: string
  weight: string
  coatColor: string
  isNeutered: boolean
  microchipId: string
  allergies: string
  medications: string
  chronicConditions: string
  notes: string
  avatarUrl: string
}

const INITIAL_FORM: FormData = {
  name: '',
  species: '',
  breedId: '',
  breedName: '',
  gender: '',
  birthDate: '',
  weight: '',
  coatColor: '',
  isNeutered: false,
  microchipId: '',
  allergies: '',
  medications: '',
  chronicConditions: '',
  notes: '',
  avatarUrl: '',
}

/** 从 storage 恢复草稿 */
function loadDraft(): Partial<FormData> | null {
  try {
    const raw = Taro.getStorageSync(DRAFT_KEY)
    if (raw) {
      Taro.removeStorageSync(DRAFT_KEY) // 消费后清除
      return JSON.parse(raw)
    }
  } catch {}
  return null
}

/** 保存草稿到 storage */
function saveDraft(data: FormData) {
  try {
    Taro.setStorageSync(DRAFT_KEY, JSON.stringify(data))
  } catch {}
}

export default function AddPet() {
  const themeClass = useThemeClass()
  const { addPet } = usePet()
  const { initPlan } = useVaccine()
  const { trackPageView, trackEvent } = useAnalytics()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const userId = useAuthStore(s => s.user?.id) || ''
  const [formData, setFormData] = useState<FormData>(() => {
    // 尝试恢复草稿
    const draft = loadDraft()
    if (draft) {
      return { ...INITIAL_FORM, ...draft }
    }
    return { ...INITIAL_FORM }
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedBreed, setSelectedBreed] = useState<BreedItem | null>(null)
  const [showBreedPanel, setShowBreedPanel] = useState(false)
  const [breedSearch, setBreedSearch] = useState('')

  useEffect(() => {
    trackPageView('add_pet')
  }, [trackPageView])

  const filteredBreeds = useMemo(() => {
    if (!formData.species) return []
    return BREED_DATA.filter((b) => b.species === formData.species)
  }, [formData.species])

  const searchedBreeds = useMemo(() => {
    if (!breedSearch.trim()) return filteredBreeds
    const keyword = breedSearch.trim().toLowerCase()
    return filteredBreeds.filter((b) =>
      b.name.toLowerCase().includes(keyword) ||
      b.aliases.some((a) => a.toLowerCase().includes(keyword))
    )
  }, [filteredBreeds, breedSearch])

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSpeciesChange = (species: 'dog' | 'cat') => {
    trackEvent('select_species', { species })
    updateField('species', species)
    updateField('breedId', '')
    updateField('breedName', '')
    setSelectedBreed(null)
  }

  const handleOpenBreedPanel = useCallback(() => {
    if (!formData.species) return
    setBreedSearch('')
    setShowBreedPanel(true)
  }, [formData.species])

  const handleSelectBreed = useCallback((breed: BreedItem) => {
    updateField('breedId', breed.id)
    updateField('breedName', breed.name)
    setSelectedBreed(breed)
    setShowBreedPanel(false)
  }, [updateField])

  const handleBirthDateChange = (e: { detail: { value: string } }) => {
    updateField('birthDate', e.detail.value)
  }

  const handleChooseAvatar = () => {
    trackEvent('choose_avatar')
    chooseImageWithPrivacy({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    }).then((res) => {
      updateField('avatarUrl', res.tempFilePaths[0])
    }).catch((err) => {
      console.warn('[AddPet] chooseImage failed:', err)
    })
  }

  const validate = (): boolean => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入宠物名字', icon: 'none' })
      return false
    }
    if (!formData.species) {
      Taro.showToast({ title: '请选择物种', icon: 'none' })
      return false
    }
    if (!formData.breedId) {
      Taro.showToast({ title: '请选择品种', icon: 'none' })
      return false
    }
    if (!formData.gender) {
      Taro.showToast({ title: '请选择性别', icon: 'none' })
      return false
    }
    if (!formData.birthDate) {
      Taro.showToast({ title: '请选择出生日期', icon: 'none' })
      return false
    }
    return true
  }

  /** 检查登录状态，未登录则保存草稿并引导登录 */
  const ensureLoggedIn = (): boolean => {
    if (isAuthenticated) return true
    // 保存草稿到 storage
    saveDraft(formData)
    // 弹窗引导登录
    Taro.showModal({
      title: '需要登录',
      content: '保存宠物信息需要登录账号。\n当前填写的内容不会丢失，登录后会自动恢复。',
      confirmText: '去登录',
      cancelText: '暂不',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({ url: '/pages/login/index' })
        }
      },
    })
    return false
  }

  const handleSubmit = async () => {
    if (!validate()) return
    // 未登录则弹窗引导登录，不继续提交
    if (!ensureLoggedIn()) return

    setSubmitting(true)
    try {
      const newPet = await addPet({
        name: formData.name.trim(),
        species: formData.species as 'dog' | 'cat',
        breed: formData.breedName,
        breedId: formData.breedId,
        gender: formData.gender as 'male' | 'female',
        birthDate: formData.birthDate,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        coatColor: formData.coatColor.trim(),
        avatarPhotoUrl: formData.avatarUrl,
        photos: formData.avatarUrl ? [formData.avatarUrl] : [],
        isNeutered: formData.isNeutered,
        microchipId: formData.microchipId.trim(),
        allergies: formData.allergies ? formData.allergies.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
        medications: formData.medications ? formData.medications.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
        notes: formData.notes.trim(),
        isDeceased: false,
        userId,
      })

      if (newPet?.id) {
        trackEvent(AnalyticsEventName.PetCreate, { species: formData.species, breed: formData.breedName, source: 'add_pet' })
        initPlan(newPet.id, {
          species: formData.species as 'dog' | 'cat',
          breed: formData.breedName,
          birthDate: formData.birthDate,
        }).catch(() => {
        })
      }

      Taro.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => {
        safeNavigateBack()
      }, 1500)
    } catch (err) {
      trackEvent('add_pet_failure')
      const message = err instanceof Error ? err.message : '添加失败，请重试'
      Taro.showToast({ title: message, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className={`add-pet ${themeClass}`}>
      <View className='add-pet__form'>
        <View className='add-pet__form-item'>
          <Text className='add-pet__label add-pet__label--required'>名字</Text>
          <Input
            className='add-pet__input'
            placeholder='请输入宠物名字'
            placeholderClass='add-pet__input-placeholder'
            value={formData.name}
            onInput={(e) => updateField('name', e.detail.value)}
            maxlength={20}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label add-pet__label--required'>物种</Text>
          <View className='add-pet__species-group'>
            <View
              className={`add-pet__species-btn ${formData.species === 'dog' ? 'add-pet__species-btn--active' : ''}`}
              onClick={() => handleSpeciesChange('dog')}
            >
              <Text className='add-pet__species-icon'>🐕</Text>
              <Text>狗狗</Text>
            </View>
            <View
              className={`add-pet__species-btn ${formData.species === 'cat' ? 'add-pet__species-btn--active' : ''}`}
              onClick={() => handleSpeciesChange('cat')}
            >
              <Text className='add-pet__species-icon'>🐱</Text>
              <Text>猫猫</Text>
            </View>
          </View>
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label add-pet__label--required'>品种</Text>
          <View
            className={`add-pet__picker ${!formData.species ? 'add-pet__picker--disabled' : ''}`}
            onClick={handleOpenBreedPanel}
          >
            <Text className={formData.breedName ? '' : 'add-pet__picker-placeholder'}>
              {formData.breedName || '请先选择物种，再搜索品种'}
            </Text>
            <Text className='add-pet__picker-arrow'>🔍</Text>
          </View>
        </View>

        {showBreedPanel && (
          <View className='add-pet__breed-panel-overlay' onClick={() => setShowBreedPanel(false)}>
            <View className='add-pet__breed-panel' onClick={(e: any) => e.stopPropagation()}>
              <View className='add-pet__breed-panel-header'>
                <Text className='add-pet__breed-panel-title'>选择品种</Text>
                <View className='add-pet__breed-panel-close' onClick={() => setShowBreedPanel(false)}>
                  <Text>✕</Text>
                </View>
              </View>
              <View className='add-pet__breed-panel-search'>
                <Text className='add-pet__breed-panel-search-icon'>🔍</Text>
                <Input
                  className='add-pet__breed-panel-search-input'
                  placeholder='搜索品种名称或别名'
                  placeholderClass='add-pet__input-placeholder'
                  value={breedSearch}
                  onInput={(e) => setBreedSearch(e.detail.value)}
                  focus
                  confirmType='search'
                />
                {breedSearch && (
                  <View className='add-pet__breed-panel-clear' onClick={() => setBreedSearch('')}>
                    <Text>✕</Text>
                  </View>
                )}
              </View>
              <ScrollView className='add-pet__breed-panel-list' scrollY enhanced showScrollbar={false}>
                {searchedBreeds.length === 0 ? (
                  <View className='add-pet__breed-panel-empty'>
                    <Text>未找到匹配的品种</Text>
                    <Text className='add-pet__breed-panel-empty-hint'>试试其他关键词吧</Text>
                  </View>
                ) : (
                  searchedBreeds.map((breed) => (
                    <View
                      key={breed.id}
                      className={`add-pet__breed-panel-item ${formData.breedId === breed.id ? 'add-pet__breed-panel-item--active' : ''}`}
                      onClick={() => handleSelectBreed(breed)}
                    >
                      <View className='add-pet__breed-panel-item-info'>
                        <Text className='add-pet__breed-panel-item-name'>{breed.name}</Text>
                        {breed.aliases.length > 0 && (
                          <Text className='add-pet__breed-panel-item-alias'>{breed.aliases.join('、')}</Text>
                        )}
                      </View>
                      <Text className='add-pet__breed-panel-item-origin'>{breed.origin}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {selectedBreed && (
          <View className='add-pet__breed-info'>
            <View className='add-pet__breed-info-header'>
              <Text className='add-pet__breed-info-title'>📋 {selectedBreed.name}品种特征</Text>
            </View>
            {selectedBreed.commonDiseases.length > 0 && (
              <View className='add-pet__breed-info-row'>
                <Text className='add-pet__breed-info-label'>🏥 常见疾病</Text>
                <View className='add-pet__breed-info-tags'>
                  {selectedBreed.commonDiseases.map((d) => (
                    <Text key={d} className='add-pet__breed-info-tag add-pet__breed-info-tag--warn'>{d}</Text>
                  ))}
                </View>
              </View>
            )}
            <View className='add-pet__breed-info-row'>
              <Text className='add-pet__breed-info-label'>⚖️ 标准体重</Text>
              <Text className='add-pet__breed-info-value'>{selectedBreed.weightRange.min} ~ {selectedBreed.weightRange.max} kg</Text>
            </View>
            {selectedBreed.dietRestrictions.length > 0 && (
              <View className='add-pet__breed-info-row'>
                <Text className='add-pet__breed-info-label'>🚫 饮食禁忌</Text>
                <View className='add-pet__breed-info-tags'>
                  {selectedBreed.dietRestrictions.map((d) => (
                    <Text key={d} className='add-pet__breed-info-tag add-pet__breed-info-tag--danger'>{d}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View className='add-pet__form-item'>
          <Text className='add-pet__label add-pet__label--required'>性别</Text>
          <View className='add-pet__gender-group'>
            <View
              className={`add-pet__gender-btn ${formData.gender === 'male' ? 'add-pet__gender-btn--active' : ''}`}
              onClick={() => updateField('gender', 'male')}
            >
              <Text>♂️</Text>
              <Text>公</Text>
            </View>
            <View
              className={`add-pet__gender-btn ${formData.gender === 'female' ? 'add-pet__gender-btn--active' : ''}`}
              onClick={() => updateField('gender', 'female')}
            >
              <Text>♀️</Text>
              <Text>母</Text>
            </View>
          </View>
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label add-pet__label--required'>出生日期</Text>
          <Picker
            mode='date'
            value={formData.birthDate}
            onChange={handleBirthDateChange}
            end={new Date().toISOString().split('T')[0]}
          >
            <View className='add-pet__picker'>
              <Text className={formData.birthDate ? '' : 'add-pet__picker-placeholder'}>
                {formData.birthDate || '请选择出生日期'}
              </Text>
              <Text className='add-pet__picker-arrow'>▼</Text>
            </View>
          </Picker>
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>体重（kg）</Text>
          <Input
            className='add-pet__input'
            placeholder='请输入体重'
            placeholderClass='add-pet__input-placeholder'
            type='digit'
            value={formData.weight}
            onInput={(e) => updateField('weight', e.detail.value)}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>毛色</Text>
          <Input
            className='add-pet__input'
            placeholder='如：橘色、黑白、三花'
            placeholderClass='add-pet__input-placeholder'
            value={formData.coatColor}
            onInput={(e) => updateField('coatColor', e.detail.value)}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>是否绝育</Text>
          <View className='add-pet__switch-row'>
            <Text className='add-pet__switch-label'>
              {formData.isNeutered ? '已绝育' : '未绝育'}
            </Text>
            <Switch
              checked={formData.isNeutered}
              onChange={(e) => updateField('isNeutered', e.detail.value)}
              color='#FF8C42'
            />
          </View>
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>芯片号</Text>
          <Input
            className='add-pet__input'
            placeholder='请输入芯片号'
            placeholderClass='add-pet__input-placeholder'
            value={formData.microchipId}
            onInput={(e) => updateField('microchipId', e.detail.value)}
            maxlength={30}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>过敏史</Text>
          <Input
            className='add-pet__input'
            placeholder='如：鸡肉、花粉（逗号分隔）'
            placeholderClass='add-pet__input-placeholder'
            value={formData.allergies}
            onInput={(e) => updateField('allergies', e.detail.value)}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>用药史</Text>
          <Input
            className='add-pet__input'
            placeholder='如：心脏药、关节保健品（逗号分隔）'
            placeholderClass='add-pet__input-placeholder'
            value={formData.medications}
            onInput={(e) => updateField('medications', e.detail.value)}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>慢性病</Text>
          <Input
            className='add-pet__input'
            placeholder='如：糖尿病、关节炎（逗号分隔）'
            placeholderClass='add-pet__input-placeholder'
            value={formData.chronicConditions}
            onInput={(e) => updateField('chronicConditions', e.detail.value)}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>备注</Text>
          <Textarea
            className='add-pet__textarea'
            placeholder='备注信息（选填）'
            placeholderClass='add-pet__textarea-placeholder'
            value={formData.notes}
            onInput={(e) => updateField('notes', e.detail.value)}
            maxlength={200}
          />
        </View>

        <View className='add-pet__form-item'>
          <Text className='add-pet__label'>头像</Text>
          <View className='add-pet__photo-area' onClick={handleChooseAvatar}>
            {formData.avatarUrl ? (
              <Image className='add-pet__photo-preview' src={formData.avatarUrl} mode='aspectFill' lazyLoad />
            ) : (
              <View className='add-pet__photo-placeholder'>
                <Text className='add-pet__photo-icon'>📷</Text>
                <Text>点击选择照片</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className='add-pet__submit-wrap'>
        <View
          className={`add-pet__submit-btn ${submitting ? 'add-pet__submit-btn--disabled' : ''}`}
          onClick={submitting ? undefined : handleSubmit}
        >
          <Text>{submitting ? '提交中...' : '提交'}</Text>
        </View>
      </View>

    </View>
  )
}
