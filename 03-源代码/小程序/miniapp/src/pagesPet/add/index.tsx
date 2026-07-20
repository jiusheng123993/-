import { View, Text, Input, Picker, Switch, Textarea, Image } from '@tarojs/components'
import { usePet } from '../../hooks/usePet'
import { useVaccine } from '../../hooks/useVaccine'
import { useAuthStore } from '../../stores/authStore'
import FloatingNav from '../../components/FloatingNav'
import { BREED_DATA } from '../../data/petKnowledge/breeds'
import Taro from '@tarojs/taro'
import { useState, useMemo } from 'react'
import './index.scss'

interface FormData {
  name: string
  species: 'dog' | 'cat' | ''
  breedId: string
  breedName: string
  gender: 'male' | 'female' | ''
  birthDate: string
  weight: string
  isNeutered: boolean
  microchipId: string
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
  isNeutered: false,
  microchipId: '',
  notes: '',
  avatarUrl: '',
}

export default function AddPet() {
  const { addPet } = usePet()
  const { initPlan } = useVaccine()
  const userId = useAuthStore(s => s.user?.id) || ''
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM })
  const [submitting, setSubmitting] = useState(false)

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
    updateField('species', species)
    updateField('breedId', '')
    updateField('breedName', '')
  }

  const handleBreedChange = (e: { detail: { value: number } }) => {
    const index = e.detail.value
    const breed = filteredBreeds[index]
    if (breed) {
      updateField('breedId', breed.id)
      updateField('breedName', breed.name)
    }
  }

  const handleBirthDateChange = (e: { detail: { value: string } }) => {
    updateField('birthDate', e.detail.value)
  }

  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        updateField('avatarUrl', res.tempFilePaths[0])
      },
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
        avatarPhotoUrl: formData.avatarUrl,
        photos: formData.avatarUrl ? [formData.avatarUrl] : [],
        isNeutered: formData.isNeutered,
        microchipId: formData.microchipId.trim(),
        notes: formData.notes.trim(),
        isDeceased: false,
        userId,
      })

      if (newPet?.id) {
        initPlan(newPet.id, {
          species: formData.species as 'dog' | 'cat',
          breed: formData.breedName,
          birthDate: formData.birthDate,
        }).catch(() => {
        })
      }

      Taro.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加失败，请重试'
      Taro.showToast({ title: message, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='add-pet'>
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
              <Image className='add-pet__photo-preview' src={formData.avatarUrl} mode='aspectFill' />
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

      <FloatingNav />
    </View>
  )
}