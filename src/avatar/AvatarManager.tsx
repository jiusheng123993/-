import { useState, useEffect, useCallback } from 'react'
import { avatarService } from './avatarService'
import type { AvatarDefinition, AvatarStyle, AvatarRenderMode } from './avatarTypes'
import { BUILTIN_AVATARS } from './avatarTypes'
import { AvatarRenderer } from './AvatarRenderer'
import { AvatarEvolutionPanel } from './AvatarEvolutionPanel'

type AvatarManagerProps = {
  userId: string
  onAvatarSelect?: (avatarId: string) => void
}

type ManagerTab = 'my' | 'builtin' | 'ai' | 'upload'

export function AvatarManager({ userId, onAvatarSelect }: AvatarManagerProps) {
  const [avatars, setAvatars] = useState<AvatarDefinition[]>([])
  const [activeAvatar, setActiveAvatar] = useState<AvatarDefinition | undefined>()
  const [activeTab, setActiveTab] = useState<ManagerTab>('my')
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarDefinition | undefined>()
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState<AvatarStyle>('anime')
  const [aiRenderMode, setAiRenderMode] = useState<AvatarRenderMode>('2d_sticker')
  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState('')
  const [uploadName, setUploadName] = useState('')

  const refreshAvatars = useCallback(() => {
    setAvatars(avatarService.getAvatars(userId))
    setActiveAvatar(avatarService.getActiveAvatar(userId))
  }, [userId])

  useEffect(() => {
    refreshAvatars()
  }, [userId, refreshAvatars])

  const handleSelectBuiltin = (builtinId: string) => {
    const avatar = avatarService.createFromBuiltin(userId, builtinId)
    if (avatar) {
      avatarService.setActiveAvatar(userId, avatar.id)
      refreshAvatars()
      onAvatarSelect?.(avatar.id)
    }
  }

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    setAiError('')
    try {
      const avatar = await avatarService.generateWithAI(userId, aiPrompt.trim(), aiStyle, aiRenderMode)
      if (avatar) {
        avatarService.setActiveAvatar(userId, avatar.id)
        refreshAvatars()
        onAvatarSelect?.(avatar.id)
        setAiPrompt('')
      } else {
        setAiError('生成失败，请重试')
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const name = uploadName.trim() || file.name.replace(/\.[^.]+$/, '')
        const avatar = avatarService.createFromUpload(userId, name, dataUrl)
        if (avatar) {
          avatarService.setActiveAvatar(userId, avatar.id)
          refreshAvatars()
          onAvatarSelect?.(avatar.id)
          setUploadName('')
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleSetActive = (avatarId: string) => {
    avatarService.setActiveAvatar(userId, avatarId)
    refreshAvatars()
    onAvatarSelect?.(avatarId)
  }

  const handleDelete = (avatarId: string) => {
    avatarService.deleteAvatar(avatarId, userId)
    if (selectedAvatar?.id === avatarId) setSelectedAvatar(undefined)
    refreshAvatars()
  }

  const canAI = avatarService.canGenerateAI(userId)
  const remaining = avatarService.getRemainingGenerations(userId)

  return (
    <div className="avatar-manager">
      <div className="avatar-manager-header">
        <h2>角色管理</h2>
        {activeAvatar && (
          <div className="active-avatar-preview">
            <AvatarRenderer avatar={activeAvatar} width={48} height={48} />
            <span>当前: {activeAvatar.name}</span>
          </div>
        )}
      </div>

      <div className="avatar-tabs">
        <button className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
          我的角色
        </button>
        <button className={`tab-btn ${activeTab === 'builtin' ? 'active' : ''}`} onClick={() => setActiveTab('builtin')}>
          内置角色
        </button>
        <button className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          AI生成
        </button>
        <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          上传
        </button>
      </div>

      <div className="avatar-tab-content">
        {activeTab === 'my' && (
          <div className="my-avatars">
            {avatars.length === 0 ? (
              <div className="empty-state">
                <p>还没有角色，选择内置角色或AI生成一个吧！</p>
              </div>
            ) : (
              <div className="avatar-grid">
                {avatars.map(avatar => (
                  <div
                    key={avatar.id}
                    className={`avatar-card ${activeAvatar?.id === avatar.id ? 'active' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    <AvatarRenderer avatar={avatar} width={80} height={80} />
                    <span className="avatar-card-name">{avatar.name}</span>
                    <span className="avatar-card-level">Lv.{avatar.evolution.level}</span>
                    {activeAvatar?.id !== avatar.id && (
                      <button className="btn-small" onClick={(e) => { e.stopPropagation(); handleSetActive(avatar.id) }}>
                        使用
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedAvatar && (
              <div className="avatar-detail-panel">
                <div className="avatar-detail-header">
                  <AvatarRenderer avatar={selectedAvatar} width={120} height={120} />
                  <div className="avatar-detail-info">
                    <h3>{selectedAvatar.name}</h3>
                    <span>等级: Lv.{selectedAvatar.evolution.level}</span>
                    <span>来源: {selectedAvatar.source}</span>
                  </div>
                  <button className="btn-danger btn-small" onClick={() => handleDelete(selectedAvatar.id)}>
                    删除
                  </button>
                </div>
                <AvatarEvolutionPanel avatar={selectedAvatar} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'builtin' && (
          <div className="builtin-avatars">
            <div className="avatar-grid">
              {BUILTIN_AVATARS.map(builtin => (
                <div
                  key={builtin.id}
                  className="avatar-card builtin"
                  onClick={() => handleSelectBuiltin(builtin.id)}
                >
                  <div className="builtin-avatar-thumb">
                    {builtin.stickerUrl ? (
                      <img src={builtin.stickerUrl} alt={builtin.name} />
                    ) : (
                      <span className="placeholder-icon">🎭</span>
                    )}
                  </div>
                  <span className="avatar-card-name">{builtin.name}</span>
                  <span className="avatar-card-mode">{builtin.renderMode}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="ai-generation">
            {!canAI ? (
              <div className="ai-no-entitlement">
                <p>AI角色生成需要会员权限</p>
              </div>
            ) : (
              <>
                <div className="ai-remaining">
                  本月剩余生成次数: {remaining}
                </div>
                <div className="ai-form">
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value.slice(0, 500))}
                    placeholder="描述你想要的角色外观、风格、特征..."
                    rows={4}
                    maxLength={500}
                  />
                  <div className="ai-options">
                    <div className="form-group">
                      <label>风格</label>
                      <select value={aiStyle} onChange={e => setAiStyle(e.target.value as AvatarStyle)}>
                        <option value="anime">动漫</option>
                        <option value="realistic">写实</option>
                        <option value="cartoon">卡通</option>
                        <option value="chibi">Q版</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>渲染模式</label>
                      <select value={aiRenderMode} onChange={e => setAiRenderMode(e.target.value as AvatarRenderMode)}>
                        <option value="2d_sticker">2D贴纸</option>
                        <option value="3d_gltf">3D模型</option>
                      </select>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleGenerateAI}
                    disabled={generating || !aiPrompt.trim() || remaining <= 0}
                  >
                    {generating ? '生成中...' : '生成角色'}
                  </button>
                  {aiError && <div className="form-error">{aiError}</div>}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-avatar">
            <div className="upload-form">
              <input
                type="text"
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="角色名称（可选）"
              />
              <button className="btn-primary" onClick={handleUpload}>
                选择图片上传
              </button>
              <p className="upload-hint">支持 JPG/PNG/GIF，建议正方形图片</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
