import { useState } from 'react'
import { useIdentity } from './IdentityProvider'
import type { IdentityTag } from './types'

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

export const IdentitySelector: React.FC = () => {
  const { state, dispatch } = useIdentity()
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<IdentityTag[]>([])

  const handleCreate = () => {
    if (!name.trim()) return
    dispatch({
      type: 'CREATE_IDENTITY',
      payload: {
        name: name.trim(),
        description: description.trim(),
        tags: selectedTags
      }
    })
    setName('')
    setDescription('')
    setSelectedTags([])
    setIsCreating(false)
  }

  const toggleTag = (tag: IdentityTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="identity-selector" style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700 }}>选择身份</h2>

      {state.identities.length === 0 && !isCreating && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <p>还没有创建身份</p>
          <p>创建一个新身份来开始使用吧</p>
        </div>
      )}

      {state.identities.length > 0 && !isCreating && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {state.identities.map(identity => (
            <div
              key={identity.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_IDENTITY', payload: identity.id })}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: identity.id === state.activeIdentityId ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: identity.id === state.activeIdentityId ? 'var(--surface-strong)' : 'var(--surface)',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{identity.name}</div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{identity.description}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {identity.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '12px'
                  }}>
                    {IDENTITY_TAGS.find(t => t.id === tag)?.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreating && (
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ margin: '0 0 16px' }}>创建新身份</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>身份名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：考研党、职场新人、全职妈妈"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-strong)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>描述（可选）</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述一下你的使用场景..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-strong)',
                color: 'var(--text)',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {IDENTITY_TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    background: selectedTags.includes(tag.id) ? 'var(--primary)' : 'var(--surface-strong)',
                    color: selectedTags.includes(tag.id) ? '#fff' : 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                opacity: name.trim() ? 1 : 0.5,
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              创建
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setName('')
                setDescription('')
                setSelectedTags([])
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: '2px dashed var(--border)',
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          + 创建新身份
        </button>
      )}
    </div>
  )
}
