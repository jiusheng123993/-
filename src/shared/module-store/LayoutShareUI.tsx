import { useRef, useState } from 'react'

type LayoutShareUIProps = {
  exportedLayout: string
  onClose: () => void
  onImport: (value: string) => void
}

const parseLayoutMeta = (raw: string) => {
  try {
    const data = JSON.parse(raw)
    return {
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null,
      activeCount: Array.isArray(data.activeModules) ? data.activeModules.length : 0,
      customCount: Array.isArray(data.modules) ? data.modules.length : 0,
    }
  } catch {
    return { exportedAt: null, activeCount: 0, customCount: 0 }
  }
}

const formatExportTime = (iso: string | null) => {
  if (!iso) return '未知'
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '未知'
  }
}

export const LayoutShareUI = ({ exportedLayout, onClose, onImport }: LayoutShareUIProps) => {
  const [draft, setDraft] = useState(exportedLayout)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const meta = parseLayoutMeta(draft)

  const copyLayout = async () => {
    if (navigator.clipboard) await navigator.clipboard.writeText(exportedLayout)
  }

  const downloadLayout = () => {
    const blob = new Blob([exportedLayout], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xinghuanhai-layout-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const readJsonFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      setDraft(text)
      onImport(text)
    }
    reader.readAsText(file)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) readJsonFile(file)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) readJsonFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="layout-share-backdrop" onClick={onClose} role="presentation">
      <section
        aria-label="布局保存与分享"
        aria-modal="true"
        className="layout-share-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="layout-share-header">
          <div>
            <p className="eyebrow">Layout Share · 本地保存 / 导入导出</p>
            <h2>布局保存/分享</h2>
          </div>
          <button aria-label="关闭布局保存与分享" className="module-store-close" onClick={onClose} type="button">×</button>
        </header>
        <div className="layout-share-meta">
          <span>导出时间：{formatExportTime(meta.exportedAt)}</span>
          <span>活跃模块：{meta.activeCount} 个</span>
          <span>自定义模块：{meta.customCount} 个</span>
        </div>
        <div
          className={`layout-share-dropzone${isDragOver ? ' layout-share-dropzone-active' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setIsDragOver(true) }}
          onDragEnter={(event) => { event.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <p>{isDragOver ? '松开以导入布局文件' : '拖拽 .json 文件到此处导入'}</p>
          <button className="module-store-btn module-store-btn-add" onClick={() => fileInputRef.current?.click()} type="button">选择文件</button>
          <input accept=".json" hidden onChange={handleFileSelect} ref={fileInputRef} type="file" />
        </div>
        <textarea
          aria-label="布局 JSON"
          onChange={(event) => setDraft(event.target.value)}
          style={{ minHeight: 240, resize: 'vertical' }}
          value={draft}
        />
        <div className="module-store-create-actions">
          <button className="module-store-btn module-store-btn-add" onClick={copyLayout} type="button">复制导出</button>
          <button className="module-store-btn module-store-btn-add" onClick={downloadLayout} type="button">下载 JSON 文件</button>
          <button className="module-store-btn module-store-btn-create" onClick={() => onImport(draft)} type="button">导入布局</button>
        </div>
        <small style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          当前布局会自动保存到本地。导出的 JSON 仅包含模块布局和自定义模块定义，不包含密钥或隐私凭据。
        </small>
      </section>
    </div>
  )
}
