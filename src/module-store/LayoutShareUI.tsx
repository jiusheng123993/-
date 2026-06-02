import { useState } from 'react'

type LayoutShareUIProps = {
  exportedLayout: string
  onClose: () => void
  onImport: (value: string) => void
}

export const LayoutShareUI = ({ exportedLayout, onClose, onImport }: LayoutShareUIProps) => {
  const [draft, setDraft] = useState(exportedLayout)
  const copyLayout = async () => {
    if (navigator.clipboard) await navigator.clipboard.writeText(exportedLayout)
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
        <textarea
          aria-label="布局 JSON"
          onChange={(event) => setDraft(event.target.value)}
          style={{ minHeight: 240, resize: 'vertical' }}
          value={draft}
        />
        <div className="module-store-create-actions">
          <button className="module-store-btn module-store-btn-add" onClick={copyLayout} type="button">复制导出</button>
          <button className="module-store-btn module-store-btn-create" onClick={() => onImport(draft)} type="button">导入布局</button>
        </div>
        <small style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          当前布局会自动保存到本地。导出的 JSON 仅包含模块布局和自定义模块定义，不包含密钥或隐私凭据。
        </small>
      </section>
    </div>
  )
}
