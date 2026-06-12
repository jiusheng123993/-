import { useState } from 'react'
import { getSupabaseConfig, saveSupabaseConfig, getSupabase } from '../infrastructure/supabase'

interface SupabaseConfigUIProps {
  onConfigured: () => void
  onBack?: () => void
}

export function SupabaseConfigUI({ onConfigured, onBack }: SupabaseConfigUIProps) {
  const existing = getSupabaseConfig()
  const [url, setUrl] = useState(existing?.url || '')
  const [anonKey, setAnonKey] = useState(existing?.anonKey || '')
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const handleSave = async () => {
    setError(null)

    if (!url.trim() || !anonKey.trim()) {
      setError('请填写 Supabase URL 和 Anon Key')
      return
    }

    saveSupabaseConfig(url.trim(), anonKey.trim())

    setTesting(true)
    try {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Supabase 客户端初始化失败')
        return
      }

      const { error: testError } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
      if (testError && testError.code !== 'PGRST116') {
        setError(`连接测试失败: ${testError.message}`)
        return
      }

      onConfigured()
    } catch (e) {
      setError(e instanceof Error ? e.message : '连接失败')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 8 }}>配置 Supabase</h2>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>
        请输入你的 Supabase 项目 URL 和 Anon Key。
        可以在 Supabase 项目设置 → API 中找到。
      </p>

      {error && (
        <div style={{ padding: 12, background: '#fff0f0', borderRadius: 8, marginBottom: 16, color: '#c00', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>
          Supabase URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://xxxxx.supabase.co"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>
          Anon Key
        </label>
        <input
          type="password"
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
          placeholder="eyJhbGciOi..."
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={testing}
        style={{
          width: '100%',
          padding: '12px',
          background: testing ? '#ccc' : '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: testing ? 'not-allowed' : 'pointer',
          fontSize: 15,
          fontWeight: 500,
          marginBottom: 12
        }}
      >
        {testing ? '测试连接中...' : '保存并连接'}
      </button>

      {onBack && (
        <button
          onClick={onBack}
          disabled={testing}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: 8,
            cursor: testing ? 'not-allowed' : 'pointer',
            fontSize: 14
          }}
        >
          返回
        </button>
      )}
    </div>
  )
}
