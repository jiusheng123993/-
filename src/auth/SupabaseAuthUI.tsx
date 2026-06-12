import { useState } from 'react'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

interface SupabaseAuthUIProps {
  onAuthSuccess: () => void
  onBack: () => void
}

export function SupabaseAuthUI({ onAuthSuccess, onBack }: SupabaseAuthUIProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login, register, loading } = useSupabaseAuth()

  const handleSubmit = async () => {
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少 6 位')
      return
    }

    const result = mode === 'login'
      ? await login(email.trim(), password)
      : await register(email.trim(), password)

    if (result.error) {
      setError(result.error.message || (mode === 'login' ? '登录失败' : '注册失败'))
      return
    }

    onAuthSuccess()
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError(null)
    setConfirmPassword('')
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: 24
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 40,
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
            color: '#fff',
            fontWeight: 700
          }}>
            寰
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#f1f5f9',
            margin: '0 0 4px'
          }}>
            星寰海
          </h1>
          <p style={{
            fontSize: 14,
            color: '#94a3b8',
            margin: 0
          }}>
            {mode === 'login' ? '登录你的云端账号' : '创建云端账号'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            color: '#fca5a5',
            fontSize: 13,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#cbd5e1',
            marginBottom: 6
          }}>
            邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: '#f1f5f9',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.12)'
            }}
          />
        </div>

        <div style={{ marginBottom: mode === 'register' ? 16 : 24 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#cbd5e1',
            marginBottom: 6
          }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位密码"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: '#f1f5f9',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.12)'
            }}
          />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#cbd5e1',
              marginBottom: 6
            }}>
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                color: '#f1f5f9',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.12)'
              }}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            background: loading
              ? 'rgba(99,102,241,0.4)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: 16
          }}
        >
          {loading
            ? (mode === 'login' ? '登录中...' : '注册中...')
            : (mode === 'login' ? '登录' : '注册')}
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            onClick={switchMode}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: 0
            }}
          >
            {mode === 'login' ? '还没有账号？立即注册' : '已有账号？返回登录'}
          </button>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 16,
          textAlign: 'center'
        }}>
          <button
            onClick={onBack}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: 0
            }}
          >
            ← 返回本地模式
          </button>
        </div>
      </div>
    </div>
  )
}
