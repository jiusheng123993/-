/**
 * 编辑宠物页面
 * 修改宠物信息表单，预填已有数据
 */
import { View, Text, Input, Picker, Switch, Textarea, Image } from '@tarojs/components'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePet } from '../../hooks/usePet'
import { useAuthStore } from '../../stores/authStore'
import { BREED_DATA } from '../../data/petKnowledge/breeds'
import Taro from '@tarojs/taro'
import { useState, useMemo, useEffect } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { safeNavigateBack } from '../../utils/navigation'
import { chooseImageWithPrivacy } from '../../utils/privacy'
import type { BreedItem } from '../../data/petKnowledge/breeds'
import '../add/index.scss'

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

export default function EditPet() {
  const themeClass = useThemeClass()
  const { pets, updatePet } = usePet()
  const { trackPageView, trackEvent } = useAnalytics()
  const userId = useAuthStore(s => s.user?.id) || ''
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [petId, setPetId] = useState('')
  const [selectedBreed, setSelectedBreed] = useState<BreedItem | null>(null)

  useEffect(() => {
    trackPageView('edit_pet')
  }, [trackPageView])

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance.router?.params?.id
    if (!id) {
      Taro.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => {
        safeNavigateBack()
      }, 1500)
      return
    }
    setPetId(id)
    const pet = pets.find(p => p.id === id)
    if (pet) {
      setFormData({
        name: pet.name,
        species: pet.species,
        breedId: pet.breedId || '',
        breedName: pet.breed || '',
        gender: pet.gender === 'male' || pet.gender === 'female' ? pet.gender : '',
        birthDate: pet.birthDate,
        weight: pet.weight ? String(pet.weight) : '',
        coatColor: pet.coatColor || '',
        isNeutered: pet.isNeutered,
        microchipId: pet.microchipId || '',
        allergies: (pet.allergies || []).join('、'),
        medications: (pet.medications || []).join('、'),
        chronicConditions: (pet.chronicConditions || []).join('、'),
        notes: pet.notes || '',
        avatarUrl: pet.avatarPhotoUrl || '',
      })
      if (pet.breedId) {
        const breed = BREED_DATA.find(b => b.id === pet.breedId)
        if (breed) setSelectedBreed(breed)
      }
    }
  }, [pets])

  const filteredBreeds = useMemo(() => {
    if (!formData.species) return []
    return BREED_DATA.filter((b) => b.species === formData.species)
  }, [formData.species])

  const breedOptions = useMemo(() => {
    return filteredBreeds.map((b) => ({
      value: b.id,
      label: b.aliases.length > 0 ? `${b.name}（${b.aliases[0]}）` : b.name,
    }))
  }, [filteredBreeds])

  const selectedBreedIndex = useMemo(() => {
    return breedOptions.findIndex((b) => b.value === formData.breedId)
  }, [breedOptions, formData.breedId])

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

  const handleBreedChange = (e: { detail: { value: number } }) => {
    const index = e.detail.value
    const breed = filteredBreeds[index]
    if (breed) {
      updateField('breedId', breed.id)
      updateField('breedName', breed.name)
      setSelectedBreed(breed)
    }
  }

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
      console.warn('[EditPet] chooseImage failed:', err)
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

  const handleSubmit = async () => {
    if (!validate()) return
    if (!petId) return

    setSubmitting(true)
    try {
      await updatePet(petId, {
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
        userId,
      })

      trackEvent('edit_pet_success', { petId })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        safeNavigateBack()
      }, 1500)
    } catch (err) {
      trackEvent('edit_pet_failure')
      const message = err instanceof Error ? err.message : '保存失败，请重试'
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
          <Picker
            mode='selector'
            range={breedOptions}
            rangeKey='label'
            value={selectedBreedIndex >= 0 ? selectedBreedIndex : 0}
            onChange={handleBreedChange as (e: unknown) => void}
            disabled={!formData.species}
          >
            <View className='add-pet__picker'>
              <Text className={formData.breedName ? '' : 'add-pet__picker-placeholder'}>
                {formData.breedName || '请选择品种'}
              </Text>
              <Text className='add-pet__picker-arrow'>▼</Text>
            </View>
          </Picker>
        </View>

        {selectedBreed && (selectedBreed.geneticDiseases.length > 0 || selectedBreed.dietRestrictions.length > 0) && (
          <View className='add-pet__breed-info'>
            {selectedBreed.geneticDiseases.length > 0 && (
              <View className='add-pet__breed-info-row'>
                <Text className='add-pet__breed-info-label'>遗传病易感</Text>
                <View className='add-pet__breed-info-tags'>
                  {selectedBreed.geneticDiseases.map((d) => (
                    <Text key={d} className='add-pet__breed-info-tag add-pet__breed-info-tag--warn'>⚠️{d}</Text>
                  ))}
                </View>
              </View>
            )}
            {selectedBreed.dietRestrictions.length > 0 && (
              <View className='add-pet__breed-info-row'>
                <Text className='add-pet__breed-info-label'>饮食禁忌</Text>
                <View className='add-pet__breed-info-tags'>
                  {selectedBreed.dietRestrictions.map((d) => (
                    <Text key={d} className='add-pet__breed-info-tag add-pet__breed-info-tag--danger'>🚫{d}</Text>
                  ))}
                </View>
              </View>
            )}
            <View className='add-pet__breed-info-row'>
              <Text className='add-pet__breed-info-label'>建议体重</Text>
              <Text className='add-pet__breed-info-value'>{selectedBreed.weightRange.min}-{selectedBreed.weightRange.max}kg</Text>
            </View>
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
          <Text>{submitting ? '保存中...' : '保存'}</Text>
        </View>
      </View>

    </View>
  )
}
