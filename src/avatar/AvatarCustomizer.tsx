import { useState, useCallback } from 'react'
import type { AvatarDefinition, AvatarRenderMode, AvatarStyle } from './avatarTypes'
import { avatarGenerator } from './avatarGenerator'
import { AvatarCanvas } from './AvatarCanvas'
import { PartPicker } from './PartPicker'
import { AnimationPicker } from './AnimationPicker'
import { DEFAULT_AVATAR_ANIMATIONS, DEFAULT_AVATAR_DECORATIONS, type AvatarPartType } from './avatarConstraints'

export type AvatarCustomizerProps = {
  avatar?: AvatarDefinition
  userId: string
  onSave?: (avatar: AvatarDefinition) => void
  onCancel?: () => void
}

export function AvatarCustomizer({ avatar, userId, onSave, onCancel }: AvatarCustomizerProps) {
  const [name, setName] = useState(avatar?.name || '')
  const [renderMode, setRenderMode] = useState<AvatarRenderMode>(avatar?.renderMode || '2d_sticker')
  const [style, setStyle] = useState<AvatarStyle>(avatar?.source === 'meshy_ai' ? 'anime' : 'anime')
  const [selectedParts, setSelectedParts] = useState<Partial<Record<AvatarPartType, string>>>({})
  const [selectedAnimations, setSelectedAnimations] = useState<string[]>(avatar?.animations.map(a => a.name) || ['idle'])
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>(avatar?.evolution.unlockedDecorations || [])
  const [selectedEffects, setSelectedEffects] = useState<string[]>(avatar?.evolution.unlockedEffects || [])
  const [activeTab, setActiveTab] = useState<'parts' | 'animations' | 'decorations'>('parts')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const avatarLevel = avatar?.evolution.level || 1

  const handlePartSelect = useCallback((partType: AvatarPartType, partId: string) => {
    setSelectedParts(prev => ({
      ...prev,
      [partType]: prev[partType] === partId ? undefined : partId
    }))
  }, [])

  const handleAnimationToggle = useCallback((animationId: string) => {
    setSelectedAnimations(prev => {
      if (prev.includes(animationId)) {
        return prev.filter(id => id !== animationId)
      }
      return [...prev, animationId]
    })
  }, [])

  const handleDecorationToggle = useCallback((decorationId: string) => {
    setSelectedDecorations(prev => {
      if (prev.includes(decorationId)) {
        return prev.filter(id => id !== decorationId)
      }
      return [...prev, decorationId]
    })
  }, [])

  const handleEffectToggle = useCallback((effectId: string) => {
    setSelectedEffects(prev => {
      if (prev.includes(effectId)) {
        return prev.filter(id => id !== effectId)
      }
      return [...prev, effectId]
    })
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    try {
      if (avatar) {
        const result = avatarGenerator.customizeAvatar(avatar.id, userId, { name })
        if (result.success && result.avatar) {
          for (const animId of selectedAnimations) {
            if (!avatar.animations.some(a => a.name === DEFAULT_AVATAR_ANIMATIONS.find(a => a.id === animId)?.name)) {
              avatarGenerator.addAnimation(avatar.id, userId, animId)
            }
          }
          onSave?.(result.avatar)
        } else {
          setError(result.error || '保存失败')
        }
      } else {
        const result = avatarGenerator.createFromParts({
          userId,
          name,
          renderMode,
          parts: selectedParts,
          animations: selectedAnimations,
          decorations: selectedDecorations,
          effects: selectedEffects
        })

        if (result.success && result.avatar) {
          onSave?.(result.avatar)
        } else {
          setError(result.error || '创建失败')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setIsSaving(false)
    }
  }, [avatar, userId, name, renderMode, selectedParts, selectedAnimations, selectedDecorations, selectedEffects, onSave])

  const previewAvatar: AvatarDefinition = avatar || {
    id: 'preview',
    userId,
    name: name || '新角色',
    source: 'user_upload',
    renderMode,
    thumbnailUrl: 'assets/avatars/preview.png',
    stickerUrl: 'assets/avatars/preview.png',
    evolution: {
      level: avatarLevel,
      unlockedDecorations: selectedDecorations,
      unlockedEffects: selectedEffects,
      unlockedAnimations: selectedAnimations,
      totalFocusMinutes: 0,
      totalTasksCompleted: 0,
      streakDays: 0
    },
    animations: selectedAnimations.map(id => {
      const anim = DEFAULT_AVATAR_ANIMATIONS.find(a => a.id === id)
      return { name: anim?.name || id, loop: anim?.loop || false, trigger: anim?.trigger || 'auto' }
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return (
    <div className="avatar-customizer">
      <div className="customizer-header">
        <h2>{avatar ? '编辑角色' : '创建角色'}</h2>
        <button className="close-btn" onClick={onCancel}>×</button>
      </div>

      <div className="customizer-content">
        <div className="customizer-preview">
          <AvatarCanvas
            avatar={previewAvatar}
            width={300}
            height={300}
            autoRotate={renderMode === '3d_gltf'}
          />
        </div>

        <div className="customizer-controls">
          <div className="form-group">
            <label>角色名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入角色名称"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>渲染模式</label>
            <div className="render-mode-selector">
              <button
                className={renderMode === '2d_sticker' ? 'active' : ''}
                onClick={() => setRenderMode('2d_sticker')}
              >
                2D贴纸
              </button>
              <button
                className={renderMode === '2d_live2d' ? 'active' : ''}
                onClick={() => setRenderMode('2d_live2d')}
              >
                Live2D
              </button>
              <button
                className={renderMode === '3d_gltf' ? 'active' : ''}
                onClick={() => setRenderMode('3d_gltf')}
              >
                3D模型
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>风格</label>
            <div className="style-selector">
              <button
                className={style === 'anime' ? 'active' : ''}
                onClick={() => setStyle('anime')}
              >
                动漫
              </button>
              <button
                className={style === 'realistic' ? 'active' : ''}
                onClick={() => setStyle('realistic')}
              >
                写实
              </button>
              <button
                className={style === 'cartoon' ? 'active' : ''}
                onClick={() => setStyle('cartoon')}
              >
                卡通
              </button>
              <button
                className={style === 'chibi' ? 'active' : ''}
                onClick={() => setStyle('chibi')}
              >
                Q版
              </button>
            </div>
          </div>

          <div className="tabs">
            <button
              className={activeTab === 'parts' ? 'active' : ''}
              onClick={() => setActiveTab('parts')}
            >
              部件
            </button>
            <button
              className={activeTab === 'animations' ? 'active' : ''}
              onClick={() => setActiveTab('animations')}
            >
              动画
            </button>
            <button
              className={activeTab === 'decorations' ? 'active' : ''}
              onClick={() => setActiveTab('decorations')}
            >
              装饰
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'parts' && (
              <PartPicker
                selectedParts={selectedParts}
                avatarLevel={avatarLevel}
                onSelect={handlePartSelect}
              />
            )}
            {activeTab === 'animations' && (
              <AnimationPicker
                selectedAnimations={selectedAnimations}
                avatarLevel={avatarLevel}
                onToggle={handleAnimationToggle}
              />
            )}
            {activeTab === 'decorations' && (
              <div className="decorations-picker">
                <h4>装饰</h4>
                <div className="decoration-grid">
                  {DEFAULT_AVATAR_DECORATIONS.filter(d => d.type === 'decoration').map(dec => (
                    <button
                      key={dec.id}
                      className={`decoration-item ${selectedDecorations.includes(dec.id) ? 'selected' : ''} ${dec.unlockLevel && avatarLevel < dec.unlockLevel ? 'locked' : ''}`}
                      onClick={() => handleDecorationToggle(dec.id)}
                      disabled={dec.unlockLevel ? avatarLevel < dec.unlockLevel : false}
                    >
                      <span className="decoration-icon">🎀</span>
                      <span className="decoration-name">{dec.name}</span>
                      {dec.unlockLevel && <span className="unlock-level">Lv.{dec.unlockLevel}</span>}
                    </button>
                  ))}
                </div>
                <h4>特效</h4>
                <div className="effect-grid">
                  {DEFAULT_AVATAR_DECORATIONS.filter(d => d.type === 'effect').map(eff => (
                    <button
                      key={eff.id}
                      className={`effect-item ${selectedEffects.includes(eff.id) ? 'selected' : ''} ${eff.unlockLevel && avatarLevel < eff.unlockLevel ? 'locked' : ''}`}
                      onClick={() => handleEffectToggle(eff.id)}
                      disabled={eff.unlockLevel ? avatarLevel < eff.unlockLevel : false}
                    >
                      <span className="effect-icon">✨</span>
                      <span className="effect-name">{eff.name}</span>
                      {eff.unlockLevel && <span className="unlock-level">Lv.{eff.unlockLevel}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="action-buttons">
            <button className="cancel-btn" onClick={onCancel} disabled={isSaving}>
              取消
            </button>
            <button className="save-btn" onClick={handleSave} disabled={isSaving || !name}>
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
