/**
 * 家庭看板页面
 * 宠物家庭聚合看板、健康总览
 */
import { useEffect, useState, useMemo, useCallback } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useFamilyStore } from '../../../stores/familyStore'
import { usePetStore } from '../../../stores/petStore'
import { useAuthStore } from '../../../stores/authStore'
import { getCheckinStats } from '../../../services/checkinService'
import { getTodayCheckin } from '../../../services/checkinService'
import { useThemeClass } from '../../../hooks/useThemeClass'
import {
  buildFamilyPhotoData,
  renderFamilyPhoto,
  saveFamilyPhoto,
  shareFamilyPhoto,
  FAMILY_PHOTO_STYLE_LABELS,
  FAMILY_PHOTO_STYLES,
} from '../../../services/familyPhotoService'
import type { FamilyPhotoStyle } from '../../../services/familyPhotoService'
import type { PetProfile } from '../../../services/petService'
import type { PetFamilyMember, FamilyPhoto } from '../../../types/familyTypes'
import FamilyPetAvatar from '../../../pages/family/FamilyPetAvatar'
import './index.scss'

const ROLE_ICONS: Record<string, string> = {
  '老大': '👑',
  '团宠': '💖',
  '活力之星': '⚡',
  '守护者': '🛡️',
  '乖宝宝': '🌟',
  '新成员': '🌱',
}

const ROLE_LIST = ['老大', '团宠', '活力之星', '守护者', '新成员', '乖宝宝']

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function FamilyDashboard() {
  const { currentFamily, members, photos, photosLoading, fetchFamilies, createFamily, removeMember, updateMemberRole, fetchPhotos, savePhoto, deletePhoto, generateAiPhoto } = useFamilyStore()
  const { pets, fetchPets } = usePetStore()
  const user = useAuthStore(s => s.user)
  const [creating, setCreating] = useState(false)
  const [todayStatus, setTodayStatus] = useState<Record<string, { checked: boolean; mood?: string }>>({})
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoGenerating, setPhotoGenerating] = useState(false)
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [canvasVisible, setCanvasVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [albumHighlight, setAlbumHighlight] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<FamilyPhotoStyle>('pixar')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiProgressText, setAiProgressText] = useState('')
  const themeClass = useThemeClass()

  useEffect(() => {
    fetchFamilies()
  }, [])

  useEffect(() => {
    if (currentFamily) {
      fetchPhotos()
    }
  }, [currentFamily])

  useEffect(() => {
    if (user) {
      fetchPets(user.id)
    }
  }, [user])

  useEffect(() => {
    if (currentFamily && members.length > 0 && user) {
      const loadToday = async () => {
        const today = getTodayStr()
        const status: Record<string, { checked: boolean; mood?: string }> = {}
        for (const member of members) {
          if (!member.petId) continue
          try {
            const checkin = await getTodayCheckin(member.petId, user.id)
            status[member.petId] = {
              checked: !!checkin,
              mood: checkin?.spiritLevel ? (checkin.spiritLevel >= 4 ? 'happy' : checkin.spiritLevel >= 2 ? 'normal' : 'sad') : undefined,
            }
          } catch {
            status[member.petId] = { checked: false }
          }
        }
        setTodayStatus(status)
      }
      loadToday()
    }
  }, [currentFamily, members, user])

  const familyPets = useMemo(() => {
    const petMap = new Map(pets.map((p: PetProfile) => [p.id, p]))
    return members
      .map((member: PetFamilyMember) => ({
        member,
        pet: petMap.get(member.petId),
      }))
      .filter((item: { member: PetFamilyMember; pet: PetProfile | undefined }) => item.pet)
  }, [members, pets])

  const unassignedPets = useMemo(() => {
    const assignedIds = new Set(members.map((m: PetFamilyMember) => m.petId))
    return pets.filter((p: PetProfile) => !assignedIds.has(p.id))
  }, [pets, members])

  const photoGroups = useMemo(() => {
    const groups: { label: string; photos: FamilyPhoto[] }[] = []
    const sorted = [...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    for (const photo of sorted) {
      const date = new Date(photo.createdAt)
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
      let last = groups[groups.length - 1]
      if (!last || last.label !== label) {
        last = { label, photos: [] }
        groups.push(last)
      }
      last.photos.push(photo)
    }
    return groups
  }, [photos])

  const handleCreateFamily = async () => {
    if (creating) return
    setCreating(true)
    try {
      await createFamily('星澜小筑')
      Taro.showToast({ title: '家庭创建成功', icon: 'success' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '创建失败', icon: 'none' })
    } finally {
      setCreating(false)
    }
  }

  const handleAddMember = async (pet: PetProfile) => {
    if (!currentFamily) return
    try {
      await useFamilyStore.getState().addMember(pet.id)
      Taro.showToast({ title: `已邀请${pet.name}加入家庭`, icon: 'success' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '添加失败', icon: 'none' })
      // 409 冲突时刷新成员列表，确保 UI 状态与后端一致
      if (error.message === '该宠物已在家庭中') {
        await fetchFamilies()
      }
    }
  }

  const handleRemoveMember = (memberId: string, petName: string) => {
    if (!currentFamily) return
    Taro.showModal({
      title: '移出家庭',
      content: `确认将${petName}移出家庭吗？宠物数据会被保留。`,
      confirmText: '确认移出',
      confirmColor: '#E0856B',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            await removeMember(memberId)
            Taro.showToast({ title: `${petName}已移出家庭`, icon: 'success' })
          } catch {
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleAssignRole = (memberId: string, petName: string) => {
    Taro.showActionSheet({
      itemList: ROLE_LIST,
      success: async (res) => {
        const chosen = ROLE_LIST[res.tapIndex]
        try {
          await updateMemberRole(memberId, chosen)
          Taro.showToast({ title: `${petName}已成为${chosen}`, icon: 'success' })
        } catch {
          Taro.showToast({ title: '设置失败', icon: 'none' })
        }
      },
    })
  }

  const handleGeneratePhoto = useCallback(async () => {
    if (photoGenerating || aiGenerating || !currentFamily || familyPets.length === 0) return

    // 步骤1：弹出风格选择器
    Taro.showActionSheet({
      itemList: FAMILY_PHOTO_STYLES.map(s => `${FAMILY_PHOTO_STYLE_LABELS[s].emoji} ${FAMILY_PHOTO_STYLE_LABELS[s].label}`),
      success: (res) => {
        const chosen = FAMILY_PHOTO_STYLES[res.tapIndex]
        setSelectedStyle(chosen)
        handleGenerateWithStyle(chosen)
      },
    })
  }, [photoGenerating, aiGenerating, currentFamily, familyPets])

  const handleGenerateWithStyle = useCallback(async (style: FamilyPhotoStyle) => {
    if (!currentFamily) return

    // 步骤2：尝试 AI 生成
    setAiGenerating(true)
    setPhotoGenerating(true)
    setShowPhotoPreview(false)
    setAiProgressText('正在分析家庭成员...')

    const progressTimer = setInterval(() => {
      setAiProgressText((prev) => {
        const texts = [
          '正在分析家庭成员...',
          '正在构建家庭合影...',
          'AI 正在绘制全家福...',
          '正在润色细节...',
          '即将完成...',
        ]
        const idx = texts.indexOf(prev)
        return idx >= 0 && idx < texts.length - 1 ? texts[idx + 1] : texts[0]
      })
    }, 2000)

    try {
      const result = await generateAiPhoto(style)
      clearInterval(progressTimer)

      if (result.success && result.photoUrl) {
        setPhotoUrl(result.photoUrl)
        setShowPhotoPreview(true)
        setAiGenerating(false)
        setPhotoGenerating(false)
        setCanvasVisible(false)
        return
      }

      // AI 失败，提示用户并降级到 Canvas
      Taro.showToast({ title: result.message || 'AI 生成失败，切换为手绘风格', icon: 'none', duration: 2000 })
    } catch {
      clearInterval(progressTimer)
      Taro.showToast({ title: 'AI 服务暂不可用，切换为手绘风格', icon: 'none', duration: 2000 })
    }

    // 步骤3：降级到 Canvas 本地绘制
    setAiGenerating(false)
    setCanvasVisible(true)
    setAiProgressText('')

    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      const roleMap: Record<string, string> = {}
      members.forEach((m: PetFamilyMember) => { roleMap[m.petId] = m.role || '' })

      const photoPets = familyPets
        .map((fp: { member: PetFamilyMember; pet: PetProfile | undefined }) => fp.pet)
        .filter((p): p is PetProfile => !!p)

      const photoData = buildFamilyPhotoData(currentFamily.name, photoPets, roleMap)
      const result = await renderFamilyPhoto(photoData, { canvasId: 'family-photo-canvas', pixelRatio: 2 })
      setPhotoUrl(result.tempFilePath)
      setShowPhotoPreview(true)
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '生成失败，请重试', icon: 'none' })
    } finally {
      setPhotoGenerating(false)
      setCanvasVisible(false)
    }
  }, [currentFamily, familyPets, members, generateAiPhoto])

  const handleSavePhoto = useCallback(async () => {
    if (!photoUrl) return
    try {
      await saveFamilyPhoto(photoUrl)
      const memberNames = familyPets
        .map((fp: { member: PetFamilyMember; pet: PetProfile | undefined }) => fp.pet?.name)
        .filter((n): n is string => !!n)
      await savePhoto(photoUrl, familyPets.length, memberNames)
      setAlbumHighlight(true)
      setTimeout(() => setAlbumHighlight(false), 2000)
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  }, [photoUrl, familyPets, savePhoto])

  const handleSharePhoto = useCallback(async () => {
    if (!photoUrl) return
    await shareFamilyPhoto(photoUrl)
  }, [photoUrl])

  const handleUploadPhoto = useCallback(async () => {
    if (!currentFamily || uploading) return
    setUploading(true)
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      })
      const tempFilePath = res.tempFiles[0].tempFilePath
      const memberNames = familyPets
        .map((fp: { member: PetFamilyMember; pet: PetProfile | undefined }) => fp.pet?.name)
        .filter((n): n is string => !!n)
      await savePhoto(tempFilePath, memberNames.length, memberNames, 'uploaded')
      Taro.showToast({ title: '已上传到家庭相册', icon: 'success' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      if (error.message && !error.message.includes('cancel')) {
        Taro.showToast({ title: error.message || '上传失败', icon: 'none' })
      }
    } finally {
      setUploading(false)
    }
  }, [currentFamily, uploading, familyPets, savePhoto])

  if (!currentFamily) {
    return (
      <View className={`family-dashboard ${themeClass}`}>
        <View className='fd-empty'>
          <Text className='fd-empty-icon'>🏡</Text>
          <Text className='fd-empty-text'>还没有创建家庭</Text>
          <View
            className='fd-empty-btn'
            style={{ opacity: creating ? 0.6 : 1 }}
            onClick={handleCreateFamily}
          >
            <Text>{creating ? '创建中...' : '创建家庭'}</Text>
          </View>
        </View>
      </View>
    )
  }

  const checkedCount = Object.values(todayStatus).filter(s => s.checked).length
  const totalMembers = members.length

  return (
    <View className={`family-dashboard ${themeClass}`}>
      <View className='fd-section'>
        <Text className='fd-title'>{currentFamily.name}</Text>
        <Text className='fd-subtitle'>{totalMembers}位家人</Text>
      </View>

      <View className='fd-section'>
        <View className='fd-health-board'>
          <View className='fd-health-board-header'>
            <Text className='fd-health-board-icon'>🏥</Text>
            <Text className='fd-health-board-title'>今日健康看板</Text>
            <Text className='fd-health-board-date'>{getTodayStr()}</Text>
          </View>
          <View className='fd-health-summary'>
            <View className='fd-health-stat'>
              <Text className='fd-health-stat-num'>{checkedCount}</Text>
              <Text className='fd-health-stat-label'>已打卡</Text>
            </View>
            <View className='fd-health-divider' />
            <View className='fd-health-stat'>
              <Text className='fd-health-stat-num'>{totalMembers - checkedCount}</Text>
              <Text className='fd-health-stat-label'>未打卡</Text>
            </View>
            <View className='fd-health-divider' />
            <View className='fd-health-stat'>
              <Text className='fd-health-stat-num'>{Math.round((checkedCount / Math.max(totalMembers, 1)) * 100)}%</Text>
              <Text className='fd-health-stat-label'>打卡率</Text>
            </View>
          </View>
          {familyPets.length > 0 && (
            <View className='fd-health-members'>
              {familyPets.map(({ member, pet }: { member: PetFamilyMember; pet: PetProfile | undefined }) => {
                if (!pet) return null
                const status = todayStatus[member.petId]
                const isChecked = status?.checked
                const roleIcon = member.role ? ROLE_ICONS[member.role] || '' : ''
                return (
                  <View key={member.petId} className={`fd-health-member ${isChecked ? 'fd-health-member--checked' : ''}`}>
                    <View className={`fd-health-member-avatar ${isChecked ? 'fd-health-member-avatar--checked' : ''}`}>
                      <FamilyPetAvatar
                        pet={pet}
                        imgClass='fd-health-member-avatar-img'
                        emojiClass='fd-health-member-avatar-emoji'
                      />
                    </View>
                    <Text className='fd-health-member-name'>{pet.name}</Text>
                    {isChecked ? (
                      <View className='fd-health-checked-badge'>
                        <Text className='fd-health-checked-text'>✅ 已打卡</Text>
                      </View>
                    ) : (
                      <View className='fd-health-pending-badge'>
                        <Text className='fd-health-pending-text'>⏳ 待打卡</Text>
                      </View>
                    )}
                    {roleIcon && (
                      <Text className='fd-health-member-role'>{roleIcon} {member.role}</Text>
                    )}
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </View>

      <View className='fd-section'>
        <View className='fd-photo-section'>
          <View className='fd-photo-header'>
            <View className='fd-photo-header-left'>
              <Text className='fd-photo-header-icon'>📸</Text>
              <Text className='fd-photo-header-title'>全家福</Text>
            </View>
          </View>
          {familyPets.length === 0 ? (
            <View className='fd-photo-empty'>
              <Text className='fd-photo-empty-icon'>📷</Text>
              <Text className='fd-photo-empty-text'>邀请毛孩子加入家庭，<br />记录温暖的全家福</Text>
            </View>
          ) : showPhotoPreview && photoUrl ? (
            <View className='fd-photo-preview'>
              <View className='fd-photo-preview-img-wrap' onClick={() => Taro.previewImage({ urls: [photoUrl], current: photoUrl })}>
                <View className='fd-photo-preview-img' style={{ backgroundImage: `url(${photoUrl})` }} />
                <View className='fd-photo-preview-tap'>
                  <Text>点击查看大图</Text>
                </View>
              </View>
              <View className='fd-photo-preview-actions'>
                <View className='fd-photo-btn fd-photo-btn--outline' onClick={handleSavePhoto}>
                  <Text className='fd-photo-btn-text'>💾 保存到相册</Text>
                </View>
                <View className='fd-photo-btn fd-photo-btn--primary' onClick={handleSharePhoto}>
                  <Text className='fd-photo-btn-text'>📤 分享给家人</Text>
                </View>
              </View>
              <View className='fd-photo-regenerate' onClick={handleGeneratePhoto}>
                <Text className='fd-photo-regenerate-text'>🔄 重新生成</Text>
              </View>
            </View>
          ) : aiGenerating ? (
            <View className='fd-photo-generating'>
              <View className='fd-photo-generating-spinner' />
              <Text className='fd-photo-generating-text'>{aiProgressText}</Text>
              <Text className='fd-photo-generating-style'>风格：{FAMILY_PHOTO_STYLE_LABELS[selectedStyle].emoji} {FAMILY_PHOTO_STYLE_LABELS[selectedStyle].label}</Text>
              <Text className='fd-photo-generating-hint'>AI 正在为您生成全家福，请耐心等待...</Text>
            </View>
          ) : (
            <View className='fd-photo-generate'>
              <View className='fd-photo-generate-preview'>
                <View className='fd-photo-generate-frame'>
                  {familyPets.slice(0, 6).map(({ pet }: { member: PetFamilyMember; pet: PetProfile | undefined }, idx: number) => {
                    if (!pet) return null
                    const angle = (idx / Math.min(familyPets.length, 6)) * 360
                    const radius = 60
                    const x = 50 + Math.cos((angle - 90) * Math.PI / 180) * radius
                    const y = 50 + Math.sin((angle - 90) * Math.PI / 180) * radius
                    return (
                      <View
                        key={pet.id}
                        className='fd-photo-generate-avatar'
                        style={{ left: `${x}%`, top: `${y}%` }}
                      >
                        <FamilyPetAvatar
                          pet={pet}
                          imgClass='fd-photo-generate-avatar-img'
                          emojiClass='fd-photo-generate-avatar-emoji'
                        />
                      </View>
                    )
                  })}
                  <View className='fd-photo-generate-center'>
                    <Text>🏡</Text>
                  </View>
                </View>
              </View>
              <View className='fd-photo-generate-info'>
                <Text className='fd-photo-generate-label'>
                  {familyPets.length}位毛孩子
                </Text>
                <Text className='fd-photo-generate-desc'>
                  选择风格，AI 为您合成一张精美的全家福
                </Text>
              </View>
              <View
                className={`fd-photo-generate-btn ${photoGenerating ? 'fd-photo-generate-btn--loading' : ''}`}
                onClick={handleGeneratePhoto}
              >
                <Text className='fd-photo-generate-btn-text'>
                  {photoGenerating ? '⏳ 生成中...' : '✨ 生成全家福'}
                </Text>
              </View>
            </View>
          )}
          <Canvas
            className='fd-photo-canvas'
            canvasId='family-photo-canvas'
            id='family-photo-canvas'
            style={{ display: canvasVisible ? 'block' : 'none', position: 'fixed', left: '-9999px', top: '-9999px', width: '750px', height: '1000px' }}
            type='2d'
          />
        </View>
      </View>

      <View className='fd-section'>
        <View className='fd-section-header'>
          <Text className='fd-section-title'>👥 家庭成员</Text>
          <Text className='fd-section-count'>{totalMembers}位</Text>
        </View>
        <View className='fd-members-grid'>
          {familyPets.map(({ member, pet }: { member: PetFamilyMember; pet: PetProfile | undefined }, idx: number) => {
            if (!pet) return null
            const roleIcon = member.role ? ROLE_ICONS[member.role] || '' : ''
            return (
              <View key={member.petId} className='fd-member-card'>
                <View className='fd-member-top'>
                  <View className='fd-member-avatar-wrap'>
                    <FamilyPetAvatar
                      pet={pet}
                      imgClass='fd-member-avatar-img'
                      emojiClass='fd-member-avatar-emoji'
                    />
                  </View>
                  <View
                    className='fd-member-role-btn'
                    onClick={() => handleAssignRole(member.id, pet.name)}
                  >
                    <Text className='fd-member-role-btn-text'>角色</Text>
                  </View>
                </View>
                <Text className='fd-member-name'>{pet.name}</Text>
                <Text className='fd-member-role'>
                  {roleIcon ? `${roleIcon} ${member.role || '乖宝宝'}` : member.role || '乖宝宝'}
                </Text>
                <Text className='fd-member-breed'>{pet.breed || '未知品种'}</Text>
                <View
                  className='fd-member-remove'
                  onClick={() => handleRemoveMember(member.id, pet.name)}
                >
                  <Text className='fd-member-remove-text'>移出家庭</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      {unassignedPets.length > 0 && (
        <View className='fd-section'>
          <View className='fd-section-header'>
            <Text className='fd-section-title'>📋 可邀请的毛孩子</Text>
            <Text className='fd-section-count'>{unassignedPets.length}位</Text>
          </View>
          <View className='fd-invite-list'>
            {unassignedPets.map(pet => (
              <View key={pet.id} className='fd-invite-item'>
                <View className='fd-invite-avatar'>
                  <FamilyPetAvatar
                    pet={pet}
                    imgClass='fd-invite-avatar-img'
                    emojiClass='fd-invite-avatar-emoji'
                  />
                </View>
                <View className='fd-invite-info'>
                  <Text className='fd-invite-name'>{pet.name}</Text>
                  <Text className='fd-invite-breed'>{pet.breed || '未知品种'}</Text>
                </View>
                <View className='fd-invite-btn' onClick={() => handleAddMember(pet)}>
                  <Text className='fd-invite-btn-text'>+ 邀请</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className='fd-section'>
        <View className='fd-actions'>
          <View className='fd-action-card' onClick={() => Taro.navigateTo({ url: '/pagesPet/family/lineage/index' })}>
            <Text className='fd-action-icon'>🧬</Text>
            <Text className='fd-action-label'>家族图谱</Text>
          </View>
          <View className='fd-action-card' onClick={() => Taro.navigateTo({ url: '/pagesPet/family/calendar/index' })}>
            <Text className='fd-action-icon'>📅</Text>
            <Text className='fd-action-label'>家庭日历</Text>
          </View>
        </View>
      </View>

      <View className='fd-section'>
        <View className='fd-section-header'>
          <View className='fd-section-header-left'>
            <Text className='fd-section-title'>📸 全家福相册</Text>
            <Text className='fd-section-count'>{photos.length}张</Text>
            {albumHighlight && <Text className='fd-album-new-dot'>NEW</Text>}
          </View>
          <View className='fd-upload-btn' onClick={handleUploadPhoto}>
            <Text className='fd-upload-btn-text'>{uploading ? '⏳' : '📤'} 上传照片</Text>
          </View>
        </View>
        {photosLoading ? (
          <View className='fd-album-loading'>
            <View className='fd-album-loading-spinner' />
            <Text className='fd-album-loading-text'>加载相册中...</Text>
          </View>
        ) : photos.length === 0 ? (
          <View className='fd-album-empty'>
            <View className='fd-album-empty-illustration'>
              <Text className='fd-album-empty-illustration-icon'>📸</Text>
              <View className='fd-album-empty-illustration-dots'>
                <View className='fd-album-empty-dot' />
                <View className='fd-album-empty-dot' />
                <View className='fd-album-empty-dot' />
              </View>
            </View>
            <Text className='fd-album-empty-title'>珍藏每一刻</Text>
            <Text className='fd-album-empty-text'>生成全家福后点击"保存到相册"<br />或点击上方"上传照片"分享精彩瞬间</Text>
          </View>
        ) : (
          <View className={`fd-album-list ${albumHighlight ? 'fd-album-list--highlight' : ''}`}>
            {photoGroups.map((group) => (
              <View key={group.label} className='fd-album-group'>
                <View className='fd-album-group-header'>
                  <Text className='fd-album-group-label'>{group.label}</Text>
                  <Text className='fd-album-group-count'>{group.photos.length}张</Text>
                </View>
                <View className='fd-album-group-grid'>
                  {group.photos.map((photo: FamilyPhoto) => (
                    <View key={photo.id} className={`fd-album-item ${photo.photoType === 'uploaded' ? 'fd-album-item--uploaded' : ''}`}>
                      <View
                        className='fd-album-item-img'
                        onClick={() => photo.photoUrl ? Taro.previewImage({ urls: [photo.photoUrl], current: photo.photoUrl }) : undefined}
                      >
                        <View className='fd-album-item-placeholder'>
                          <Text className='fd-album-item-emoji'>{photo.photoType === 'uploaded' ? '🖼️' : '🏡'}</Text>
                          {photo.photoType === 'uploaded' && (
                            <View className='fd-album-item-badge'>
                              <Text className='fd-album-item-badge-text'>用户上传</Text>
                            </View>
                          )}
                        </View>
                        <View className='fd-album-item-overlay'>
                          <Text className='fd-album-item-overlay-text'>点击查看</Text>
                        </View>
                      </View>
                      <View className='fd-album-item-body'>
                        <View className='fd-album-item-header'>
                          <Text className='fd-album-item-date'>{photo.createdAt.slice(0, 10)}</Text>
                          <View className='fd-album-item-meta'>
                            <Text className='fd-album-item-count'>{photo.memberCount}位成员</Text>
                          </View>
                        </View>
                        {photo.description && (
                          <Text className='fd-album-item-desc'>{photo.description}</Text>
                        )}
                        <View className='fd-album-item-actions'>
                          <View className='fd-album-item-del' onClick={() => {
                            Taro.showModal({
                              title: '删除照片',
                              content: '确认删除这张全家福记录吗？',
                              confirmColor: '#E0856B',
                              success: (res) => { if (res.confirm) deletePhoto(photo.id) },
                            })
                          }}>
                            <Text className='fd-album-item-del-text'>删除</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className='fd-bottom-safe' />
    </View>
  )
}
