import { useState, useCallback, useEffect } from 'react'

type ProviderKeyInfo = {
  id: string
  name: string
  description: string
  localStorageKey: string
  endpoint: string
  docsUrl?: string
}

const PROVIDER_KEYS: ProviderKeyInfo[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '高性价比国产大模型，推荐使用',
    localStorageKey: 'deepseek_api_key',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    docsUrl: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT 系列模型，能力全面',
    localStorageKey: 'openai_api_key',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'tongyi',
    name: '通义千问',
    description: '阿里云大模型服务',
    localStorageKey: 'tongyi_api_key',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    docsUrl: 'https://dashscope.console.aliyun.com/apiKey'
  },
  {
    id: 'doubao',
    name: '豆包',
    description: '字节跳动大模型服务',
    localStorageKey: 'doubao_api_key',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    docsUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey'
  },
  {
    id: 'xfyun',
    name: '讯飞星火',
    description: '讯飞星火 Coding 模型',
    localStorageKey: 'xfyun_coding_api_key',
    endpoint: 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/chat/completions',
    docsUrl: 'https://console.xfyun.cn/services/coding'
  }
]

type ApiKeySettingsUIProps = {
  onClose: () => void
}

export function ApiKeySettingsUI({ onClose }: ApiKeySettingsUIProps) {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const [savedStatus, setSavedStatus] = useState<Record<string, 'idle' | 'saved' | 'cleared'>>({})
  const [activeProvider, setActiveProvider] = useState<string>(PROVIDER_KEYS[0].id)

  useEffect(() => {
    const initial: Record<string, string> = {}
    const initialVisible: Record<string, boolean> = {}
    PROVIDER_KEYS.forEach((p) => {
      initial[p.id] = localStorage.getItem(p.localStorageKey) || ''
      initialVisible[p.id] = false
    })
    setKeys(initial)
    setVisibleKeys(initialVisible)
  }, [])

  const handleKeyChange = useCallback((providerId: string, value: string) => {
    setKeys((prev) => ({ ...prev, [providerId]: value }))
    setSavedStatus((prev) => ({ ...prev, [providerId]: 'idle' }))
  }, [])

  const handleSave = useCallback((providerId: string) => {
    const info = PROVIDER_KEYS.find((p) => p.id === providerId)
    if (!info) return
    const value = keys[providerId]?.trim()
    if (value) {
      localStorage.setItem(info.localStorageKey, value)
      setSavedStatus((prev) => ({ ...prev, [providerId]: 'saved' }))
      setTimeout(() => {
        setSavedStatus((prev) =>
          prev[providerId] === 'saved' ? { ...prev, [providerId]: 'idle' } : prev
        )
      }, 2000)
    }
  }, [keys])

  const handleClear = useCallback((providerId: string) => {
    const info = PROVIDER_KEYS.find((p) => p.id === providerId)
    if (!info) return
    localStorage.removeItem(info.localStorageKey)
    setKeys((prev) => ({ ...prev, [providerId]: '' }))
    setSavedStatus((prev) => ({ ...prev, [providerId]: 'cleared' }))
    setTimeout(() => {
      setSavedStatus((prev) =>
        prev[providerId] === 'cleared' ? { ...prev, [providerId]: 'idle' } : prev
      )
    }, 2000)
  }, [])

  const toggleVisibility = useCallback((providerId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }))
  }, [])

  const activeInfo = PROVIDER_KEYS.find((p) => p.id === activeProvider) || PROVIDER_KEYS[0]
  const configuredCount = PROVIDER_KEYS.filter((p) => !!keys[p.id]).length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '640px',
          maxHeight: '85vh',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--border, rgba(0, 0, 0, 0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.02) 100%)'
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text, #0f172a)'
              }}
            >
              AI 服务配置
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: 'var(--text-secondary, #64748b)',
                fontWeight: 400
              }}
            >
              配置 API Key 以启用 AI 功能 · 已配置 {configuredCount}/{PROVIDER_KEYS.length} 个服务
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: '1px solid var(--border, rgba(0, 0, 0, 0.06))',
              backgroundColor: 'var(--surface-elevated, #f8fafc)',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #64748b)',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover, #f1f5f9)'
              e.currentTarget.style.color = 'var(--text, #0f172a)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-elevated, #f8fafc)'
              e.currentTarget.style.color = 'var(--text-secondary, #64748b)'
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border, rgba(0, 0, 0, 0.06))',
            padding: '0 28px',
            gap: '4px',
            overflowX: 'auto'
          }}
        >
          {PROVIDER_KEYS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setActiveProvider(provider.id)}
              style={{
                padding: '14px 18px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeProvider === provider.id ? 600 : 400,
                color:
                  activeProvider === provider.id
                    ? 'var(--primary, #6366f1)'
                    : 'var(--text-secondary, #64748b)',
                borderBottom:
                  activeProvider === provider.id
                    ? '2px solid var(--primary, #6366f1)'
                    : '2px solid transparent',
                marginBottom: '-1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 200ms ease'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: keys[provider.id] ? '#22c55e' : '#d1d5db',
                  flexShrink: 0
                }}
              />
              <span>{provider.name}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--surface-elevated, #f8fafc)',
              borderRadius: '16px',
              border: '1px solid var(--border, rgba(0, 0, 0, 0.06))',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--text, #0f172a)'
                  }}
                >
                  {activeInfo.name} API Key
                </h3>
                {keys[activeProvider] && (
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: '#16a34a',
                      fontWeight: 500
                    }}
                  >
                    已配置
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--text-secondary, #64748b)',
                  lineHeight: 1.6
                }}
              >
                {activeInfo.description}
              </p>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text, #0f172a)',
                  marginBottom: '8px'
                }}
              >
                API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={visibleKeys[activeProvider] ? 'text' : 'password'}
                  value={keys[activeProvider] || ''}
                  onChange={(e) => handleKeyChange(activeProvider, e.target.value)}
                  placeholder="输入你的 API Key..."
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border, rgba(0, 0, 0, 0.1))',
                    backgroundColor: 'var(--surface, #ffffff)',
                    fontSize: '14px',
                    color: 'var(--text, #0f172a)',
                    outline: 'none',
                    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                    letterSpacing: '0.02em',
                    transition: 'border-color 200ms ease, box-shadow 200ms ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary, #6366f1)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border, rgba(0, 0, 0, 0.1))'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  onClick={() => toggleVisibility(activeProvider)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: 'var(--text-secondary, #64748b)',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 200ms ease'
                  }}
                  title={visibleKeys[activeProvider] ? '隐藏' : '显示'}
                >
                  {visibleKeys[activeProvider] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSave(activeProvider)}
                disabled={!keys[activeProvider]?.trim()}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: keys[activeProvider]?.trim()
                    ? 'var(--primary, #6366f1)'
                    : 'var(--border, #e2e8f0)',
                  color: keys[activeProvider]?.trim() ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: keys[activeProvider]?.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 200ms ease',
                  boxShadow: keys[activeProvider]?.trim()
                    ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                    : 'none'
                }}
              >
                {savedStatus[activeProvider] === 'saved' ? (
                  <>
                    <span>✓</span>
                    <span>已保存</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>保存</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleClear(activeProvider)}
                disabled={!keys[activeProvider]}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: keys[activeProvider] ? '#ef4444' : 'var(--text-secondary, #94a3b8)',
                  border: `1px solid ${keys[activeProvider] ? 'rgba(239, 68, 68, 0.3)' : 'var(--border, #e2e8f0)'}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: keys[activeProvider] ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 200ms ease'
                }}
              >
                {savedStatus[activeProvider] === 'cleared' ? (
                  <>
                    <span>✓</span>
                    <span>已清除</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>清除</span>
                  </>
                )}
              </button>
            </div>

            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'rgba(99, 102, 241, 0.04)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.1)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>ℹ️</span>
                <div>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text, #0f172a)'
                    }}
                  >
                    如何获取 API Key？
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--text-secondary, #64748b)',
                      lineHeight: 1.6
                    }}
                  >
                    {activeInfo.docsUrl ? (
                      <>
                        前往{' '}
                        <a
                          href={activeInfo.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--primary, #6366f1)',
                            textDecoration: 'none',
                            fontWeight: 500
                          }}
                        >
                          {activeInfo.name} 控制台
                        </a>{' '}
                        创建 API Key，然后粘贴到上方输入框。
                      </>
                    ) : (
                      '请前往对应服务商官网获取 API Key。'
                    )}
                  </p>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '12px',
                      color: 'var(--text-secondary, #64748b)',
                      lineHeight: 1.6
                    }}
                  >
                    API Key 仅存储在浏览器本地，不会上传到任何服务器。
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'rgba(251, 191, 36, 0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(251, 191, 36, 0.15)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--text-secondary, #64748b)',
                      lineHeight: 1.6
                    }}
                  >
                    开发环境下，API 请求通过 Vite 代理转发，不会直接暴露 Key。
                    生产环境请使用后端服务代理，不要在前端直接调用。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border, rgba(0, 0, 0, 0.06))',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.01) 100%)'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: 'var(--surface-elevated, #f8fafc)',
              color: 'var(--text, #0f172a)',
              border: '1px solid var(--border, rgba(0, 0, 0, 0.06))',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover, #f1f5f9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-elevated, #f8fafc)'
            }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
