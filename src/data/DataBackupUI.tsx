import { useState, useRef, useCallback } from 'react'
import { 
  downloadBackup, 
  importFromJSON, 
  getBackupInfo, 
  clearAllData, 
  formatBytes,
  type BackupModuleInfo
} from './dataBackup'

interface DataBackupUIProps {
  onClose: () => void
}

export const DataBackupUI: React.FC<DataBackupUIProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'manage'>('backup')
  const [backupInfo, setBackupInfo] = useState(() => getBackupInfo())
  const [importStatus, setImportStatus] = useState<{ importing: boolean; result?: { success: boolean; imported: number; failed: number; errors: string[] } }>({ importing: false })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshBackupInfo = useCallback(() => {
    setBackupInfo(getBackupInfo())
  }, [])

  const handleDownload = useCallback(() => {
    downloadBackup()
    refreshBackupInfo()
  }, [refreshBackupInfo])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = importFromJSON(content, {
        onProgress: (module, status) => {
          console.log(`[${status}] ${module}`)
        }
      })
      setImportStatus({ importing: false, result })
      if (result.success) {
        refreshBackupInfo()
      }
    }
    reader.readAsText(file)
    setImportStatus({ importing: true })
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [refreshBackupInfo])

  const handleClearData = useCallback(async () => {
    const confirmed = await clearAllData({
      confirmText: '确认清除',
      onConfirm: () => {
        refreshBackupInfo()
        window.location.reload()
      }
    })
    if (confirmed) {
      console.log('Data cleared')
    }
  }, [refreshBackupInfo])

  const modulesWithData = backupInfo.modules.filter(m => m.hasData)

  return (
    <div className="data-backup-ui" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '560px',
        maxHeight: '85vh',
        backgroundColor: 'var(--surface, #fff)',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>💾 数据管理</h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          padding: '0 24px'
        }}>
          {[
            { key: 'backup', label: '备份导出', icon: '📤' },
            { key: 'restore', label: '恢复导入', icon: '📥' },
            { key: 'manage', label: '数据概览', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'backup' | 'restore' | 'manage')}
              style={{
                padding: '14px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'var(--primary, #6366f1)' : 'var(--text-secondary, #6b7280)',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary, #6366f1)' : '2px solid transparent',
                marginBottom: '-1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--surface-elevated, #f9fafb)',
                borderRadius: '12px',
                border: '1px solid var(--border, #e5e7eb)'
              }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>📦 导出备份</h3>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary, #6b7280)' }}>
                  将所有数据导出为 JSON 文件，可用于数据迁移或备份
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--primary, #6366f1)',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    已存储 {modulesWithData.length} 个模块
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--surface, #fff)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    border: '1px solid var(--border, #e5e7eb)'
                  }}>
                    {formatBytes(backupInfo.totalSize)}
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'var(--primary, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <span>📥</span>
                  <span>下载备份文件</span>
                </button>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(251, 191, 36, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>安全提示</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #6b7280)' }}>
                      导出的文件包含您的个人数据，请妥善保管，不要分享给他人
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'restore' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--surface-elevated, #f9fafb)',
                borderRadius: '12px',
                border: '1px solid var(--border, #e5e7eb)'
              }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>📤 导入备份</h3>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary, #6b7280)' }}>
                  从备份文件恢复数据，这将覆盖当前数据
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="backup-file-input"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importStatus.importing}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: importStatus.importing ? 'var(--border, #e5e7eb)' : 'var(--primary, #6366f1)',
                    color: importStatus.importing ? 'var(--text-secondary, #6b7280)' : 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: importStatus.importing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{importStatus.importing ? '⏳' : '📂'}</span>
                  <span>{importStatus.importing ? '导入中...' : '选择备份文件'}</span>
                </button>

                {importStatus.result && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: importStatus.result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: `1px solid ${importStatus.result.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 600,
                      color: importStatus.result.success ? '#22c55e' : '#ef4444',
                      marginBottom: '8px'
                    }}>
                      {importStatus.result.success ? '✅ 导入成功' : '⚠️ 导入完成'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary, #6b7280)' }}>
                      成功: {importStatus.result.imported} | 失败: {importStatus.result.failed}
                    </div>
                    {importStatus.result.errors.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                        {importStatus.result.errors.slice(0, 3).map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>🔴</span>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>风险提示</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #6b7280)' }}>
                      导入会覆盖现有数据，建议先导出当前数据备份
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--surface-elevated, #f9fafb)',
                borderRadius: '12px',
                border: '1px solid var(--border, #e5e7eb)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary, #6366f1)' }}>
                    {modulesWithData.length}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary, #6b7280)' }}>
                    已使用的模块
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {formatBytes(backupInfo.totalSize)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary, #6b7280)' }}>
                    总存储大小
                  </div>
                </div>
              </div>

              <div style={{
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--surface-elevated, #f9fafb)',
                  borderBottom: '1px solid var(--border, #e5e7eb)',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  模块详情
                </div>
                <div style={{ maxHeight: '240px', overflow: 'auto' }}>
                  {backupInfo.modules.map((module, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 16px',
                        borderBottom: index < backupInfo.modules.length - 1 ? '1px solid var(--border, #e5e7eb)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: module.hasData ? 1 : 0.5
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: module.hasData ? '#22c55e' : '#d1d5db' 
                        }} />
                        <span style={{ fontSize: '14px' }}>{module.key}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #6b7280)' }}>
                        {module.hasData ? formatBytes(module.size) : '无数据'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleClearData}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🗑️</span>
                <span>清除所有数据</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
