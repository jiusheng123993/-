import { useState, useEffect, useCallback } from 'react'
import {
  rebuildIndex,
  getBacklinksFor,
  getForwardLinksFor,
  findUnlinkedMentions,
  getBacklinkStats,
  getLinkedTargets,
  getSourceTypeLabel,
  getSourceTypeIcon,
  getState,
  clearLinks,
  type Backlink,
  type UnlinkedMention
} from './backlinkService'
import './backlink.css'

interface BacklinkPanelProps {
  onClose: () => void
}

type TabId = 'overview' | 'backlinks' | 'unlinked'

export const BacklinkPanel: React.FC<BacklinkPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [links, setLinks] = useState<Backlink[]>([])
  const [unlinked, setUnlinked] = useState<UnlinkedMention[]>([])
  const [stats, setStats] = useState({ totalLinks: 0, totalSources: 0, totalTargets: 0, unlinkedCount: 0 })
  const [targets, setTargets] = useState<{ title: string; count: number }[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [lastIndexedAt, setLastIndexedAt] = useState<string | null>(null)

  const refreshData = useCallback(() => {
    const state = getState()
    setLinks(state.links)
    setLastIndexedAt(state.lastIndexedAt)
    setStats(getBacklinkStats())
    setTargets(getLinkedTargets())
    setUnlinked(findUnlinkedMentions())
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const handleRebuild = useCallback(() => {
    setIsRebuilding(true)
    setTimeout(() => {
      rebuildIndex()
      refreshData()
      setIsRebuilding(false)
    }, 300)
  }, [refreshData])

  const handleClear = useCallback(() => {
    clearLinks()
    refreshData()
    setSelectedTarget(null)
  }, [refreshData])

  const filteredBacklinks = selectedTarget
    ? links.filter(l => l.targetTitle === selectedTarget)
    : links

  const tabs = [
    { id: 'overview' as TabId, label: '概览', icon: '📊' },
    { id: 'backlinks' as TabId, label: '反向链接', icon: '🔗', count: links.length },
    { id: 'unlinked' as TabId, label: '未链接引用', icon: '💡', count: unlinked.length }
  ]

  const formatTime = (iso: string | null): string => {
    if (!iso) return '未索引'
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const highlightContext = (context: string, target: string): string => {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return context.replace(
      new RegExp(`\\[\\[${escaped}\\]\\]`, 'g'),
      `<mark>[[${target}]]</mark>`
    )
  }

  return (
    <div className="backlink-panel-overlay" onClick={onClose} role="presentation">
      <section
        className="backlink-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="双向链接"
      >
        <div className="backlink-panel-header">
          <div className="backlink-panel-title">
            <span className="icon">🔗</span>
            <h2>双向链接</h2>
          </div>
          <button className="backlink-panel-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="backlink-panel-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`backlink-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="badge">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="backlink-panel-body">
          {activeTab === 'overview' && (
            <>
              <div className="backlink-toolbar">
                <button
                  className="backlink-rebuild-btn"
                  onClick={handleRebuild}
                  disabled={isRebuilding}
                >
                  🔄 {isRebuilding ? '重建中...' : '重建索引'}
                </button>
                <span className="backlink-last-indexed">
                  上次索引: {formatTime(lastIndexedAt)}
                </span>
              </div>

              <div className="backlink-stats">
                <div className="backlink-stat-card">
                  <div className="stat-value">{stats.totalLinks}</div>
                  <div className="stat-label">链接总数</div>
                </div>
                <div className="backlink-stat-card">
                  <div className="stat-value">{stats.totalSources}</div>
                  <div className="stat-label">来源页面</div>
                </div>
                <div className="backlink-stat-card">
                  <div className="stat-value">{stats.totalTargets}</div>
                  <div className="stat-label">被引用页面</div>
                </div>
                <div className="backlink-stat-card">
                  <div className="stat-value">{stats.unlinkedCount}</div>
                  <div className="stat-label">未链接引用</div>
                </div>
              </div>

              <div className="backlink-help">
                <p>
                  💡 在日记、速记等内容中使用 <code>[[页面名]]</code> 语法创建双向链接。
                  点击"重建索引"扫描所有内容中的链接关系。
                </p>
              </div>

              {targets.length > 0 && (
                <>
                  <div className="backlink-section-title">被引用最多的页面</div>
                  {targets.slice(0, 10).map(t => (
                    <div
                      key={t.title}
                      className="backlink-item"
                      onClick={() => {
                        setSelectedTarget(t.title)
                        setActiveTab('backlinks')
                      }}
                    >
                      <div className="backlink-item-header">
                        <span className="backlink-item-target">{t.title}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                        被 {t.count} 个页面引用
                      </span>
                    </div>
                  ))}
                </>
              )}

              {targets.length === 0 && stats.totalLinks === 0 && (
                <div className="backlink-empty">
                  <div className="empty-icon">🔗</div>
                  <h3>暂无链接数据</h3>
                  <p>
                    在内容中使用 <code>[[页面名]]</code> 语法创建链接，然后点击"重建索引"扫描所有链接关系。
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'backlinks' && (
            <>
              <div className="backlink-toolbar">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="backlink-rebuild-btn"
                    onClick={handleRebuild}
                    disabled={isRebuilding}
                  >
                    🔄 {isRebuilding ? '重建中...' : '重建索引'}
                  </button>
                  {selectedTarget && (
                    <button
                      className="backlink-rebuild-btn"
                      onClick={() => setSelectedTarget(null)}
                    >
                      ✕ 清除筛选: {selectedTarget}
                    </button>
                  )}
                </div>
                {links.length > 0 && (
                  <button className="backlink-rebuild-btn" onClick={handleClear}>
                    🗑 清除链接
                  </button>
                )}
              </div>

              {selectedTarget && (
                <div className="backlink-section-title">
                  引用 "{selectedTarget}" 的页面 ({filteredBacklinks.length})
                </div>
              )}

              {!selectedTarget && targets.length > 0 && (
                <>
                  <div className="backlink-section-title">按被引用页面筛选</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {targets.map(t => (
                      <button
                        key={t.title}
                        className="backlink-rebuild-btn"
                        onClick={() => setSelectedTarget(t.title)}
                        style={{ fontSize: 12 }}
                      >
                        {t.title} ({t.count})
                      </button>
                    ))}
                  </div>
                </>
              )}

              {filteredBacklinks.length === 0 ? (
                <div className="backlink-empty">
                  <div className="empty-icon">🔍</div>
                  <h3>暂无反向链接</h3>
                  <p>
                    {selectedTarget
                      ? `没有页面引用 "${selectedTarget}"`
                      : '在内容中使用 [[页面名]] 语法创建链接后，点击"重建索引"'}
                  </p>
                </div>
              ) : (
                filteredBacklinks.map(link => (
                  <div key={link.id} className="backlink-item">
                    <div className="backlink-item-header">
                      <span className="backlink-item-type">
                        {getSourceTypeIcon(link.sourceType)} {getSourceTypeLabel(link.sourceType)}
                      </span>
                      <span className="backlink-item-source">{link.sourceTitle}</span>
                      <span className="backlink-item-arrow">→</span>
                      <span className="backlink-item-target">{link.targetTitle}</span>
                    </div>
                    <div
                      className="backlink-item-context"
                      dangerouslySetInnerHTML={{
                        __html: highlightContext(link.context, link.targetTitle)
                      }}
                    />
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'unlinked' && (
            <>
              <div className="backlink-toolbar">
                <button
                  className="backlink-rebuild-btn"
                  onClick={handleRebuild}
                  disabled={isRebuilding}
                >
                  🔄 {isRebuilding ? '重建中...' : '重建索引'}
                </button>
              </div>

              {unlinked.length === 0 ? (
                <div className="backlink-empty">
                  <div className="empty-icon">✨</div>
                  <h3>没有未链接的引用</h3>
                  <p>所有内容中的引用都已建立链接，知识网络很完整！</p>
                </div>
              ) : (
                <>
                  <div className="backlink-help">
                    <p>
                      💡 以下内容中提到了其他页面的标题，但尚未使用 <code>[[页面名]]</code> 语法建立链接。
                      建议在原文中添加链接以建立知识关联。
                    </p>
                  </div>
                  <div className="backlink-section-title">未链接引用 ({unlinked.length})</div>
                  {unlinked.map((mention, idx) => (
                    <div key={`${mention.sourceId}-${mention.mentionedTitle}-${idx}`} className="backlink-unlinked-item">
                      <div className="backlink-unlinked-header">
                        <span className="backlink-item-type">
                          {getSourceTypeIcon(mention.sourceType)} {getSourceTypeLabel(mention.sourceType)}
                        </span>
                        <span className="backlink-item-source">{mention.sourceTitle}</span>
                      </div>
                      <div
                        className="backlink-item-context"
                        dangerouslySetInnerHTML={{
                          __html: mention.context.replace(
                            new RegExp(mention.mentionedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                            `<mark>${mention.mentionedTitle}</mark>`
                          )
                        }}
                      />
                      <div className="backlink-unlinked-suggestion">
                        💡 建议在原文中将 "{mention.mentionedTitle}" 改为 <code>[[{mention.mentionedTitle}]]</code>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
