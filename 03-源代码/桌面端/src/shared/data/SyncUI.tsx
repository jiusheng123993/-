import { useState } from 'react'
import { generateSyncManifest, compareManifests, exportAllData, importAllData } from './dataBackup'
import type { SyncManifest } from './dataBackup'
import './sync.css'

interface SyncUIProps {
  onClose: () => void
}

export const SyncUI: React.FC<SyncUIProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'idle' | 'comparing' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [diff, setDiff] = useState<ReturnType<typeof compareManifests> | null>(null)

  const handleExportManifest = () => {
    const manifest = generateSyncManifest()
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sync-manifest-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('清单已导出')
  }

  const handleImportManifest = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        setStatus('comparing')
        const text = await file.text()
        const remoteManifest: SyncManifest = JSON.parse(text)
        const localManifest = generateSyncManifest()
        const result = compareManifests(localManifest, remoteManifest)
        setDiff(result)
        const total = result.localOnly.length + result.remoteOnly.length + result.changed.length
        setMessage(total === 0 ? '数据完全一致，无需同步' : `发现 ${total} 个差异模块`)
        setStatus('done')
      } catch {
        setStatus('error')
        setMessage('清单解析失败，请检查文件格式')
      }
    }
    input.click()
  }

  const handleFullExport = () => {
    exportAllData()
    setMessage('全量数据已导出')
  }

  const handleFullImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        setStatus('syncing')
        const text = await file.text()
        const data = JSON.parse(text)
        importAllData(data)
        setStatus('done')
        setMessage('数据导入成功')
      } catch {
        setStatus('error')
        setMessage('数据导入失败，请检查文件格式')
      }
    }
    input.click()
  }

  return (
    <div className="sync-panel">
      <div className="sync-header">
        <h3>跨设备同步</h3>
        <button className="sync-close" onClick={onClose} type="button">✕</button>
      </div>

      <div className="sync-section">
        <h4>同步清单</h4>
        <p className="sync-desc">导出同步清单到文件，在另一台设备上导入比对差异</p>
        <div className="sync-actions">
          <button className="sync-btn" onClick={handleExportManifest} type="button">
            📤 导出清单
          </button>
          <button className="sync-btn" onClick={handleImportManifest} type="button">
            📥 导入清单比对
          </button>
        </div>
      </div>

      <div className="sync-section">
        <h4>全量数据</h4>
        <p className="sync-desc">导出/导入完整数据（包含所有模块数据）</p>
        <div className="sync-actions">
          <button className="sync-btn" onClick={handleFullExport} type="button">
            📦 导出全部数据
          </button>
          <button className="sync-btn" onClick={handleFullImport} type="button">
            📥 导入全部数据
          </button>
        </div>
      </div>

      {status !== 'idle' && (
        <div className={`sync-status sync-status-${status}`}>
          {status === 'comparing' && '正在比对...'}
          {status === 'syncing' && '正在同步...'}
          {status === 'done' && message}
          {status === 'error' && message}
        </div>
      )}

      {diff && (
        <div className="sync-diff">
          {diff.changed.length > 0 && (
            <div className="sync-diff-group">
              <strong>已变更 ({diff.changed.length})：</strong>
              {diff.changed.map(k => <div key={k} className="sync-diff-item changed">{k}</div>)}
            </div>
          )}
          {diff.localOnly.length > 0 && (
            <div className="sync-diff-group">
              <strong>仅本地 ({diff.localOnly.length})：</strong>
              {diff.localOnly.map(k => <div key={k} className="sync-diff-item local">{k}</div>)}
            </div>
          )}
          {diff.remoteOnly.length > 0 && (
            <div className="sync-diff-group">
              <strong>仅远程 ({diff.remoteOnly.length})：</strong>
              {diff.remoteOnly.map(k => <div key={k} className="sync-diff-item remote">{k}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}