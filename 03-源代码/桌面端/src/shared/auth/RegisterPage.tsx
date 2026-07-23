import { useState } from 'react'
import type { AuthProviderKind } from './authTypes'
import { getAvailableProviders } from './authProviders'

interface RegisterPageProps {
  onRegister: (provider: AuthProviderKind, phoneNumber: string, displayName: string, age?: number) => void
  onBack: () => void
  isLoggingIn: boolean
  error: string | null
}

const providerLabels: Record<string, { name: string; icon: string; color: string }> = {
  wechat: { name: '微信注册', icon: '💬', color: '#07c160' },
  alipay: { name: '支付宝注册', icon: '💰', color: '#1677ff' },
  apple: { name: 'Apple 注册', icon: '🍎', color: '#000000' }
}

export function RegisterPage({ onRegister, onBack, isLoggingIn, error }: RegisterPageProps) {
  const [step, setStep] = useState<'provider' | 'info'>('provider')
  const [selectedProvider, setSelectedProvider] = useState<AuthProviderKind | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const availableProviders = getAvailableProviders()

  const handleProviderSelect = (provider: AuthProviderKind) => {
    setSelectedProvider(provider)
    setStep('info')
  }

  const handleSubmit = () => {
    if (!selectedProvider) return
    const ageNum = age ? parseInt(age, 10) : undefined
    onRegister(selectedProvider, phoneNumber, displayName, ageNum)
  }

  const handleBack = () => {
    if (step === 'info') {
      setStep('provider')
      setSelectedProvider(null)
    } else {
      onBack()
    }
  }

  const isValid = phoneNumber.length === 11 && displayName.trim().length > 0

  if (step === 'info' && selectedProvider) {
    const info = providerLabels[selectedProvider]
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <button onClick={handleBack} style={styles.backButton}>← 返回</button>
          <div style={styles.iconLarge}>{info?.icon}</div>
          <h2 style={styles.title}>{info?.name}</h2>
          <p style={styles.subtitle}>填写信息完成注册</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>手机号 *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="请输入手机号"
              style={styles.input}
              maxLength={11}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>昵称 *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
              placeholder="请输入昵称"
              style={styles.input}
              maxLength={20}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>年龄（选填，用于内容分级）</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="请输入年龄"
              style={styles.input}
              min={1}
              max={150}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isLoggingIn || !isValid}
            style={{
              ...styles.submitButton,
              backgroundColor: info?.color || '#0f766e',
              opacity: isLoggingIn || !isValid ? 0.6 : 1
            }}
          >
            {isLoggingIn ? '注册中...' : '完成注册'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <button onClick={handleBack} style={styles.backButton}>← 返回登录</button>
        <h1 style={styles.brandTitle}>创建账号</h1>
        <p style={styles.brandSubtitle}>选择注册方式</p>

        <div style={styles.divider}>
          <span style={styles.dividerText}>第三方注册</span>
        </div>

        <div style={styles.providerList}>
          {availableProviders.map((provider) => {
            const info = providerLabels[provider.kind]
            if (!info) return null
            return (
              <button
                key={provider.kind}
                onClick={() => handleProviderSelect(provider.kind)}
                disabled={isLoggingIn}
                style={{
                  ...styles.providerButton,
                  borderColor: info.color,
                  opacity: isLoggingIn ? 0.6 : 1
                }}
              >
                <span style={styles.providerIcon}>{info.icon}</span>
                <span style={{ ...styles.providerName, color: info.color }}>{info.name}</span>
              </button>
            )
          })}
        </div>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
    backdropFilter: 'blur(4px)'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '40px 32px',
    width: 380,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 24
  },
  divider: {
    width: '100%',
    textAlign: 'center',
    borderBottom: '1px solid #e2e8f0',
    lineHeight: '0.1em',
    margin: '16px 0 24px'
  },
  dividerText: {
    backgroundColor: '#ffffff',
    padding: '0 12px',
    color: '#94a3b8',
    fontSize: 13
  },
  providerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%'
  },
  providerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 20px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  providerIcon: {
    fontSize: 24
  },
  providerName: {
    fontSize: 16,
    fontWeight: 600
  },
  iconLarge: {
    fontSize: 48,
    marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 4px'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: '0 0 20px'
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 6
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '2px solid #e2e8f0',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  submitButton: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: 12,
    border: 'none',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: 8
  },
  backButton: {
    alignSelf: 'flex-start',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    margin: '12px 0 0',
    textAlign: 'center'
  }
}
