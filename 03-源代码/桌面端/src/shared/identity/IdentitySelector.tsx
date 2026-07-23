import { useId, useState } from 'react'
import { useIdentity } from './IdentityProvider'
import type { Identity, IdentityTag } from './types'
import './IdentitySelector.css'

const IDENTITY_TAGS: { id: IdentityTag; label: string }[] = [
  { id: 'student', label: '学生' },
  { id: 'worker', label: '打工人' },
  { id: 'parent', label: '宝妈/宝爸' },
  { id: 'creator', label: '创作者' },
  { id: 'freelancer', label: '自由职业' },
  { id: 'entrepreneur', label: '创业者' },
  { id: 'retiree', label: '退休' },
  { id: 'other', label: '其他' }
]

const getTagLabel = (tag: IdentityTag) => IDENTITY_TAGS.find(item => item.id === tag)?.label ?? tag

export const IdentitySelector: React.FC = () => {
  const { state, dispatch } = useIdentity()
  const [isCreating, setIsCreating] = useState(false)
  const [editingIdentityId, setEditingIdentityId] = useState<string | null>(null)
  const [deletingIdentityId, setDeletingIdentityId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<IdentityTag[]>([])
  const [isNameTouched, setIsNameTouched] = useState(false)
  const nameInputId = useId()
  const descriptionInputId = useId()
  const nameErrorId = useId()
  const dialogTitleId = useId()
  const dialogDescriptionId = useId()
  const editingIdentity = state.identities.find(identity => identity.id === editingIdentityId) ?? null
  const deletingIdentity = state.identities.find(identity => identity.id === deletingIdentityId) ?? null
  const isEditing = Boolean(editingIdentity)
  const isFormOpen = isCreating || isEditing
  const nameError = isNameTouched && !name.trim() ? '请输入身份名称' : ''

  const resetForm = () => {
    setName('')
    setDescription('')
    setSelectedTags([])
    setIsNameTouched(false)
    setEditingIdentityId(null)
  }

  const closeForm = () => {
    resetForm()
    setIsCreating(false)
  }

  const openCreateForm = () => {
    resetForm()
    setIsCreating(true)
    setStatusMessage('')
  }

  const openEditForm = (identity: Identity) => {
    setIsCreating(false)
    setEditingIdentityId(identity.id)
    setName(identity.name)
    setDescription(identity.description)
    setSelectedTags(identity.tags)
    setIsNameTouched(false)
    setStatusMessage('')
  }

  const saveIdentity = () => {
    setIsNameTouched(true)
    if (!name.trim()) return

    if (editingIdentity) {
      dispatch({
        type: 'UPDATE_IDENTITY',
        payload: {
          ...editingIdentity,
          name: name.trim(),
          description: description.trim(),
          tags: selectedTags
        }
      })
      setStatusMessage(`已更新身份：${name.trim()}`)
    } else {
      dispatch({
        type: 'CREATE_IDENTITY',
        payload: {
          name: name.trim(),
          description: description.trim(),
          tags: selectedTags
        }
      })
      setStatusMessage(`已创建身份：${name.trim()}`)
    }

    closeForm()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (value.trim()) setIsNameTouched(false)
  }

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeForm()
      return
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      saveIdentity()
    }
  }

  const toggleTag = (tag: IdentityTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const selectIdentity = (identity: Identity) => {
    dispatch({ type: 'SET_ACTIVE_IDENTITY', payload: identity.id })
  }

  const confirmDelete = () => {
    if (!deletingIdentity) return
    const deletedName = deletingIdentity.name
    dispatch({ type: 'DELETE_IDENTITY', payload: deletingIdentity.id })
    setDeletingIdentityId(null)
    setStatusMessage(`已删除身份：${deletedName}`)
  }

  return (
    <section className="identity-selector" aria-labelledby="identity-selector-title">
      <div className="identity-selector-header">
        <span className="identity-eyebrow">身份系统</span>
        <h2 id="identity-selector-title">选择身份</h2>
        <p>为不同生活阶段保存专属配置，让模块推荐和学习节奏更贴合当前状态。</p>
      </div>

      {statusMessage && (
        <div className="identity-status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}

      {state.identities.length === 0 && !isFormOpen && (
        <div className="identity-empty" aria-live="polite">
          <div className="identity-empty-icon" aria-hidden="true">＋</div>
          <p>还没有创建身份</p>
          <span>创建一个新身份来开始使用吧</span>
        </div>
      )}

      {state.identities.length > 0 && !isFormOpen && (
        <div className="identity-card-grid" role="list" aria-label="身份列表">
          {state.identities.map(identity => {
            const isActive = identity.id === state.activeIdentityId
            const tagText = identity.tags.map(getTagLabel).join('、')
            return (
              <div key={identity.id} className="identity-card-shell" role="listitem">
                <button
                  type="button"
                  className={`identity-card${isActive ? ' identity-card-active' : ''}`}
                  onClick={() => selectIdentity(identity)}
                  aria-pressed={isActive}
                  aria-label={`${identity.name}${identity.description ? `，${identity.description}` : ''}${tagText ? `，标签：${tagText}` : ''}`}
                >
                  <span className="identity-card-topline">
                    <span className="identity-card-name">{identity.name}</span>
                    {isActive && <span className="identity-active-badge">当前</span>}
                  </span>
                  {identity.description && <span className="identity-card-description">{identity.description}</span>}
                  {identity.tags.length > 0 && (
                    <span className="identity-card-tags" aria-label={`标签：${tagText}`}>
                      {identity.tags.map(tag => (
                        <span key={tag} className="identity-tag-chip">
                          {getTagLabel(tag)}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
                <div className="identity-card-actions" aria-label={`${identity.name} 操作`}>
                  <button
                    type="button"
                    className="identity-icon-button"
                    aria-label={`编辑 ${identity.name}`}
                    onClick={() => openEditForm(identity)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="identity-icon-button identity-icon-button-danger"
                    aria-label={`删除 ${identity.name}`}
                    onClick={() => setDeletingIdentityId(identity.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isFormOpen && (
        <form
          className="identity-form"
          aria-label={isEditing ? '编辑身份' : '创建新身份'}
          onSubmit={event => {
            event.preventDefault()
            saveIdentity()
          }}
          onKeyDown={handleFormKeyDown}
        >
          <div className="identity-form-heading">
            <span className="identity-eyebrow">{isEditing ? '编辑配置' : '新建配置'}</span>
            <h3>{isEditing ? '编辑身份' : '创建新身份'}</h3>
            <p>{isEditing ? '更新身份名称、描述和标签，当前身份会保持选中状态。' : '填写一个容易识别的身份名称，再选择标签用于后续推荐。'}</p>
          </div>

          <div className="identity-field">
            <label htmlFor={nameInputId}>身份名称</label>
            <input
              id={nameInputId}
              className={`identity-input${nameError ? ' identity-input-error' : ''}`}
              type="text"
              value={name}
              onChange={event => handleNameChange(event.target.value)}
              onBlur={() => setIsNameTouched(true)}
              placeholder="例如：考研党、职场新人、全职妈妈"
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={nameError ? nameErrorId : undefined}
            />
            {nameError && (
              <div id={nameErrorId} className="identity-error" role="alert">
                {nameError}
              </div>
            )}
          </div>

          <div className="identity-field">
            <label htmlFor={descriptionInputId}>描述（可选）</label>
            <textarea
              id={descriptionInputId}
              className="identity-input identity-textarea"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="描述一下你的使用场景..."
              rows={3}
            />
          </div>

          <fieldset className="identity-fieldset">
            <legend>标签</legend>
            <div className="identity-tag-grid">
              {IDENTITY_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`identity-tag${isSelected ? ' selected' : ''}`}
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={isSelected}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="identity-shortcuts" aria-label="表单快捷键">
            <span>Ctrl/⌘ + Enter 保存</span>
            <span>Esc 取消</span>
          </div>

          <div className="identity-step-actions">
            <button
              type="submit"
              className="identity-btn-primary"
              disabled={!name.trim()}
            >
              {isEditing ? '保存' : '创建'}
            </button>
            <button
              type="button"
              className="identity-btn-secondary"
              onClick={closeForm}
            >
              取消
            </button>
          </div>
        </form>
      )}

      {!isFormOpen && (
        <button
          type="button"
          className="identity-create-button"
          aria-label="创建新身份"
          onClick={openCreateForm}
        >
          <span aria-hidden="true">＋</span>
          创建新身份
        </button>
      )}

      {deletingIdentity && (
        <div className="identity-dialog-backdrop" role="presentation">
          <div
            className="identity-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
          >
            <h3 id={dialogTitleId}>删除身份</h3>
            <p id={dialogDescriptionId}>确定删除“{deletingIdentity.name}”吗？删除后仍可重新创建身份。</p>
            <div className="identity-step-actions">
              <button
                type="button"
                className="identity-btn-secondary"
                onClick={() => setDeletingIdentityId(null)}
              >
                取消删除
              </button>
              <button
                type="button"
                className="identity-btn-danger"
                onClick={confirmDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
