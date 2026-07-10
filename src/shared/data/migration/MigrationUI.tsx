import { useState, useCallback, useMemo } from 'react'
import {
  scanLocalStorage,
  migrateModule,
  clearLocalStorageAfterMigration,
  type MigrationModule
} from './migrationTool'
import { createErrorHandler } from '../../utils/errorHandler'

interface MigrationUIProps {
  userId: string
  onComplete: () => void
}

export function MigrationUI({ userId, onComplete }: MigrationUIProps) {
  const [modules, setModules] = useState<MigrationModule[]>(() => scanLocalStorage())
  const [migrating, setMigrating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useMemo(() => createErrorHandler({ setError, moduleName: '数据迁移' }), [])

  const totalItems = modules.reduce((sum, m) => sum + m.count, 0)
  const doneModules = modules.filter((m) => m.status === 'done').length

  const handleMigrate = useCallback(async () => {
    setMigrating(true)
    setError(null)

    const updated = [...modules]

    for (let i = 0; i < updated.length; i++) {
      const mod = { ...updated[i] }
      try {
        await migrateModule(userId, mod, (status, err) => {
          mod.status = status
          if (err) mod.error = err
          updated[i] = mod
          setModules([...updated])
        })
      } catch (e) {
        mod.status = 'error'
        mod.error = e instanceof Error ? e.message : '迁移失败'
        updated[i] = mod
        setModules([...updated])
        handleError(e, '迁移失败')
      }
    }

    setMigrating(false)
    setDone(true)
  }, [userId, modules, handleError])

  const handleClear = useCallback(() => {
    clearLocalStorageAfterMigration(modules)
    onComplete()
  }, [modules, onComplete])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  if (modules.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>没有可迁移的本地数据</p>
        <button onClick={onComplete} style={{ marginTop: 12, padding: '8px 24px' }}>
          继续使用
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 8 }}>数据迁移</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        检测到 {modules.length} 个模块的本地数据（共 {totalItems} 条记录），
        将迁移到云端数据库。
      </p>

      {error && (
        <div style={{ padding: 12, background: '#fff0f0', borderRadius: 8, marginBottom: 16, color: '#c00' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        {modules.map((mod) => (
          <div
            key={mod.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: '1px solid #eee',
              background: mod.status === 'error' ? '#fff0f0' : 'transparent'
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>{mod.label}</span>
              <span style={{ color: '#999', marginLeft: 8, fontSize: 13 }}>
                {mod.count} 条
              </span>
            </div>
            <span
              style={{
                fontSize: 13,
                color:
                  mod.status === 'done'
                    ? '#4caf50'
                    : mod.status === 'error'
                      ? '#c00'
                      : mod.status === 'migrating'
                        ? '#2196f3'
                        : '#999'
              }}
            >
              {mod.status === 'done'
                ? '✓ 完成'
                : mod.status === 'error'
                  ? `✗ ${mod.error || '失败'}`
                  : mod.status === 'migrating'
                    ? '迁移中...'
                    : '待迁移'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {!done ? (
          <button
            onClick={handleMigrate}
            disabled={migrating}
            style={{
              padding: '10px 32px',
              background: migrating ? '#ccc' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: migrating ? 'not-allowed' : 'pointer',
              fontSize: 15
            }}
          >
            {migrating ? `迁移中 (${doneModules}/${modules.length})...` : '一键迁移'}
          </button>
        ) : (
          <>
            <button
              onClick={handleClear}
              style={{
                padding: '10px 24px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 15
              }}
            >
              清除本地数据并继续
            </button>
            <button
              onClick={handleSkip}
              style={{
                padding: '10px 24px',
                background: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 15
              }}
            >
              保留本地数据
            </button>
          </>
        )}
      </div>
    </div>
  )
}
