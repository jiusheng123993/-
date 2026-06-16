import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search,
  TrendingUp,
  Clock,
  Star,
  Download,
  Flag,
  Trash2,
  Eye,
  EyeOff,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Check,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Heart,
  Zap,
  Crown,
  Sparkles,
} from 'lucide-react'
import type { ICommunityPersonaService, CommunityPersonaEntry, CommunitySortMode, CommunityReportReason } from './communityPersonaService'
import type { CustomPersona } from '../customPersona'
import { createErrorHandler } from '../../utils/errorHandler'

export type CommunityPersonaUIProps = {
  userId: string
  communityService: ICommunityPersonaService
  onImportPersona?: (persona: CustomPersona) => void
  onClose?: () => void
}

type ViewMode = 'browse' | 'detail' | 'my-shares'

const REPORT_REASON_LABELS: Record<CommunityReportReason, string> = {
  inappropriate_persona: '不当角色设定',
  inappropriate_dialogue: '不当对话内容',
  plagiarism: '抄袭/盗用',
  impersonation: '冒充他人',
  other: '其他',
}

const SORT_OPTIONS: { value: CommunitySortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'hot', label: '热门', icon: <TrendingUp size={14} /> },
  { value: 'new', label: '最新', icon: <Clock size={14} /> },
  { value: 'top_rated', label: '高分', icon: <Star size={14} /> },
]

const PAGE_SIZE = 12

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}个月前`
}

function renderStars(rating: number) {
  const stars: React.ReactNode[] = []
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i
    const half = !filled && rating >= i - 0.5
    stars.push(
      <Star
        key={i}
        size={12}
        className={`community-star ${filled ? 'filled' : half ? 'half' : ''}`}
      />
    )
  }
  return stars
}

function getHotBadge(index: number): React.ReactNode {
  if (index === 0) return <Crown size={14} className="community-hot-badge gold" />
  if (index === 1) return <Zap size={14} className="community-hot-badge silver" />
  if (index === 2) return <Heart size={14} className="community-hot-badge bronze" />
  return <span className="community-rank-num">{index + 1}</span>
}

export function CommunityPersonaUI({
  userId,
  communityService,
  onImportPersona: _onImportPersona,
  onClose,
}: CommunityPersonaUIProps) {
  const [view, setView] = useState<ViewMode>('browse')
  const [sortMode, setSortMode] = useState<CommunitySortMode>('hot')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [entries, setEntries] = useState<CommunityPersonaEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleError = useMemo(() => createErrorHandler({ setError, moduleName: '社区人格' }), [])

  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState<CommunityReportReason>('inappropriate_persona')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportResult, setReportResult] = useState<{ ok: boolean; reason?: string } | null>(null)

  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [rateScore, setRateScore] = useState<1 | 2 | 3 | 4 | 5>(5)
  const [rateSubmitting, setRateSubmitting] = useState(false)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ ok: boolean; reason?: string } | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await communityService.list({
        sort: sortMode,
        search: searchQuery || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setEntries(result)
    } catch (e) {
      handleError(e, '加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [communityService, sortMode, searchQuery, page, handleError])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const selectedEntry = useMemo(
    () => (selectedEntryId ? communityService.getById(selectedEntryId) : null),
    [communityService, selectedEntryId]
  )

  const selectedEntryRatings = useMemo(
    () => (selectedEntryId ? communityService.getRatings(selectedEntryId) : []),
    [communityService, selectedEntryId]
  )

  const myRating = useMemo(
    () => (selectedEntryId ? communityService.getUserRating(userId, selectedEntryId) : undefined),
    [communityService, userId, selectedEntryId]
  )

  const myShares = useMemo(() => {
    const all = communityService.list({ limit: 100 })
    return all.then((list) => list.filter((e) => e.creatorUserId === userId))
  }, [communityService, userId])

  const [mySharesData, setMySharesData] = useState<CommunityPersonaEntry[]>([])
  const [mySharesLoading, setMySharesLoading] = useState(false)

  const loadMyShares = useCallback(async () => {
    setMySharesLoading(true)
    try {
      const data = await myShares
      setMySharesData(data)
    } finally {
      setMySharesLoading(false)
    }
  }, [myShares])

  useEffect(() => {
    if (view === 'my-shares') {
      loadMyShares()
    }
  }, [view, loadMyShares])

  const handleSearch = useCallback(() => {
    setPage(0)
    loadEntries()
  }, [loadEntries])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch()
    },
    [handleSearch]
  )

  const handleOpenDetail = useCallback((entryId: string) => {
    setSelectedEntryId(entryId)
    setView('detail')
    setImportResult(null)
  }, [])

  const handleBackToBrowse = useCallback(() => {
    setView('browse')
    setSelectedEntryId(null)
  }, [])

  const handleImport = useCallback(async () => {
    if (!selectedEntryId) return
    setImporting(true)
    setImportResult(null)
    try {
      const result = await communityService.importToMy(userId, selectedEntryId)
      setImportResult(result)
      if (result.ok) {
        showToast('导入成功！', 'success')
        loadEntries()
      }
    } finally {
      setImporting(false)
    }
  }, [communityService, userId, selectedEntryId, showToast, loadEntries])

  const handleReport = useCallback(async () => {
    if (!selectedEntryId) return
    setReportSubmitting(true)
    try {
      const result = await communityService.report(userId, selectedEntryId, reportReason, reportDescription || undefined)
      setReportResult(result)
      if (result.ok) {
        showToast('举报已提交', 'success')
        setReportModalOpen(false)
        setReportDescription('')
      }
    } finally {
      setReportSubmitting(false)
    }
  }, [communityService, userId, selectedEntryId, reportReason, reportDescription, showToast])

  const handleRate = useCallback(async () => {
    if (!selectedEntryId) return
    setRateSubmitting(true)
    try {
      const result = await communityService.rate(userId, selectedEntryId, rateScore)
      if (result.ok) {
        showToast('评分成功！', 'success')
        setRateModalOpen(false)
        loadEntries()
      }
    } finally {
      setRateSubmitting(false)
    }
  }, [communityService, userId, selectedEntryId, rateScore, showToast, loadEntries])

  const handleUnpublish = useCallback(
    async (entryId: string) => {
      if (!confirm('确定要下架这个分享吗？')) return
      const result = await communityService.unpublish(userId, entryId)
      if (result.ok) {
        showToast('已下架', 'success')
        loadMyShares()
      } else {
        showToast(result.reason || '下架失败', 'error')
      }
    },
    [communityService, userId, showToast, loadMyShares]
  )

  const handleSortChange = useCallback((mode: CommunitySortMode) => {
    setSortMode(mode)
    setPage(0)
  }, [])

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE) || 1)

  return (
    <div className="community-persona-backdrop" onClick={onClose} role="presentation">
      <div className="community-persona-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Persona 社区">
        <header className="community-persona-header">
          <div className="community-persona-header-left">
            {view !== 'browse' && (
              <button
                className="community-persona-back-btn"
                onClick={view === 'my-shares' ? () => setView('browse') : handleBackToBrowse}
                type="button"
                aria-label="返回"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h3>
              {view === 'browse' && 'Persona 社区'}
              {view === 'detail' && (selectedEntry?.creatorDisplayName || 'Persona 详情')}
              {view === 'my-shares' && '我的分享'}
            </h3>
          </div>
          <div className="community-persona-header-right">
            <button
              className={`community-persona-nav-btn ${view === 'browse' ? 'active' : ''}`}
              onClick={() => { setView('browse'); setSelectedEntryId(null) }}
              type="button"
            >
              <Sparkles size={16} />
              <span>发现</span>
            </button>
            <button
              className={`community-persona-nav-btn ${view === 'my-shares' ? 'active' : ''}`}
              onClick={() => setView('my-shares')}
              type="button"
            >
              <User size={16} />
              <span>我的</span>
            </button>
            {onClose && (
              <button className="community-persona-close" onClick={onClose} type="button" aria-label="关闭">
                <X size={20} />
              </button>
            )}
          </div>
        </header>

        {view === 'browse' && (
          <div className="community-persona-browse">
            <div className="community-persona-toolbar">
              <div className="community-persona-search">
                <Search size={16} className="community-persona-search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="搜索 Persona..."
                  className="community-persona-search-input"
                />
                {searchQuery && (
                  <button
                    className="community-persona-search-clear"
                    onClick={() => { setSearchQuery(''); setPage(0) }}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="community-persona-sort">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`community-persona-sort-btn ${sortMode === opt.value ? 'active' : ''}`}
                    onClick={() => handleSortChange(opt.value)}
                    type="button"
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <button
                className="community-persona-refresh-btn"
                onClick={loadEntries}
                type="button"
                title="刷新"
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
            </div>

            {error && (
              <div className="community-persona-error-banner">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="community-persona-loading">
                <div className="community-persona-spinner" />
                <span>加载中...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="community-persona-empty">
                <div className="community-persona-empty-icon">
                  <Search size={48} />
                </div>
                <h4>暂无内容</h4>
                <p>{searchQuery ? '没有找到匹配的 Persona' : '社区还没有人分享 Persona，快来成为第一个吧！'}</p>
              </div>
            ) : (
              <>
                <div className="community-persona-grid">
                  {entries.map((entry, index) => (
                    <button
                      key={entry.id}
                      className="community-persona-card"
                      onClick={() => handleOpenDetail(entry.id)}
                      type="button"
                    >
                      <div className="community-persona-card-rank">
                        {sortMode === 'hot' ? getHotBadge(index) : null}
                      </div>
                      <div className="community-persona-card-avatar">
                        <User size={28} />
                      </div>
                      <div className="community-persona-card-body">
                        <h4 className="community-persona-card-name">{entry.creatorDisplayName}</h4>
                        <div className="community-persona-card-meta">
                          <span className="community-persona-card-stat">
                            <Download size={12} />
                            {entry.importCount}
                          </span>
                          <span className="community-persona-card-stat">
                            <Star size={12} />
                            {entry.ratingCount > 0 ? entry.ratingAverage.toFixed(1) : '-'}
                          </span>
                          <span className="community-persona-card-time">{formatTimeAgo(entry.publishedAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="community-persona-pagination">
                    <button
                      className="community-persona-page-btn"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="community-persona-page-info">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      className="community-persona-page-btn"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      type="button"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === 'detail' && selectedEntry && (
          <div className="community-persona-detail">
            <div className="community-persona-detail-hero">
              <div className="community-persona-detail-avatar">
                <User size={48} />
              </div>
              <div className="community-persona-detail-hero-info">
                <h2>{selectedEntry.creatorDisplayName}</h2>
                <div className="community-persona-detail-hero-meta">
                  <span className="community-persona-detail-stat">
                    <Download size={14} />
                    <strong>{selectedEntry.importCount}</strong> 次导入
                  </span>
                  <span className="community-persona-detail-stat">
                    <Star size={14} />
                    <strong>{selectedEntry.ratingCount > 0 ? selectedEntry.ratingAverage.toFixed(1) : '-'}</strong>
                    {selectedEntry.ratingCount > 0 && ` (${selectedEntry.ratingCount} 人评分)`}
                  </span>
                  <span className="community-persona-detail-stat">
                    <Clock size={14} />
                    发布于 {formatTimeAgo(selectedEntry.publishedAt)}
                  </span>
                </div>
              </div>
              <div className="community-persona-detail-hero-actions">
                <button
                  className="community-persona-import-btn"
                  onClick={handleImport}
                  disabled={importing}
                  type="button"
                >
                  {importing ? (
                    <>
                      <div className="community-persona-spinner-sm" />
                      导入中...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      导入到我的
                    </>
                  )}
                </button>
                <button
                  className="community-persona-rate-btn"
                  onClick={() => { setRateModalOpen(true); setRateScore(myRating?.score || 5) }}
                  type="button"
                >
                  <Star size={16} />
                  {myRating ? '修改评分' : '评分'}
                </button>
                <button
                  className="community-persona-report-btn"
                  onClick={() => { setReportModalOpen(true); setReportResult(null) }}
                  type="button"
                >
                  <Flag size={16} />
                </button>
              </div>
            </div>

            {importResult && (
              <div className={`community-persona-result-banner ${importResult.ok ? 'success' : 'error'}`}>
                {importResult.ok ? (
                  <>
                    <Check size={16} /> 导入成功！
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} /> {importResult.reason || '导入失败'}
                  </>
                )}
              </div>
            )}

            <div className="community-persona-detail-sections">
              <div className="community-persona-detail-section">
                <h4>
                  <MessageSquare size={16} />
                  评分与评论
                  <span className="community-persona-section-count">{selectedEntryRatings.length}</span>
                </h4>
                {selectedEntryRatings.length === 0 ? (
                  <p className="community-persona-no-data">暂无评分</p>
                ) : (
                  <div className="community-persona-ratings-list">
                    {selectedEntryRatings.slice(0, 10).map((rating) => (
                      <div key={`${rating.userId}-${rating.createdAt}`} className="community-persona-rating-item">
                        <div className="community-persona-rating-user">
                          <User size={16} />
                          <span>{rating.userId}</span>
                        </div>
                        <div className="community-persona-rating-stars">
                          {renderStars(rating.score)}
                        </div>
                        <span className="community-persona-rating-time">{formatTimeAgo(rating.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="community-persona-detail-section">
                <h4>
                  <BarChart3 size={16} />
                  统计信息
                </h4>
                <div className="community-persona-stats-grid">
                  <div className="community-persona-stat-card">
                    <span className="community-persona-stat-value">{selectedEntry.importCount}</span>
                    <span className="community-persona-stat-label">导入次数</span>
                  </div>
                  <div className="community-persona-stat-card">
                    <span className="community-persona-stat-value">
                      {selectedEntry.ratingCount > 0 ? selectedEntry.ratingAverage.toFixed(1) : '-'}
                    </span>
                    <span className="community-persona-stat-label">平均评分</span>
                  </div>
                  <div className="community-persona-stat-card">
                    <span className="community-persona-stat-value">{selectedEntry.ratingCount}</span>
                    <span className="community-persona-stat-label">评分人数</span>
                  </div>
                  <div className="community-persona-stat-card">
                    <span className="community-persona-stat-value">{selectedEntry.reportCount}</span>
                    <span className="community-persona-stat-label">举报次数</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'my-shares' && (
          <div className="community-persona-my-shares">
            {mySharesLoading ? (
              <div className="community-persona-loading">
                <div className="community-persona-spinner" />
                <span>加载中...</span>
              </div>
            ) : mySharesData.length === 0 ? (
              <div className="community-persona-empty">
                <div className="community-persona-empty-icon">
                  <Eye size={48} />
                </div>
                <h4>还没有分享</h4>
                <p>你还没有分享任何 Persona 到社区。</p>
              </div>
            ) : (
              <div className="community-persona-my-shares-list">
                {mySharesData.map((entry) => (
                  <div key={entry.id} className="community-persona-my-share-item">
                    <div className="community-persona-my-share-info">
                      <div className="community-persona-my-share-avatar">
                        <User size={24} />
                      </div>
                      <div className="community-persona-my-share-body">
                        <h4>{entry.creatorDisplayName}</h4>
                        <div className="community-persona-my-share-meta">
                          <span>
                            {entry.visibility === 'public' ? (
                              <><Eye size={12} /> 公开</>
                            ) : (
                              <><EyeOff size={12} /> 不公开</>
                            )}
                          </span>
                          <span>
                            <Download size={12} /> {entry.importCount} 次导入
                          </span>
                          <span>
                            <Star size={12} /> {entry.ratingCount > 0 ? entry.ratingAverage.toFixed(1) : '-'}
                          </span>
                          <span className={`community-persona-my-share-status ${entry.reviewStatus}`}>
                            {entry.reviewStatus === 'approved' && '已通过'}
                            {entry.reviewStatus === 'pending' && '审核中'}
                            {entry.reviewStatus === 'rejected' && '已拒绝'}
                            {entry.reviewStatus === 'removed' && '已下架'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="community-persona-my-share-actions">
                      <button
                        className="community-persona-my-share-view-btn"
                        onClick={() => handleOpenDetail(entry.id)}
                        type="button"
                      >
                        查看
                      </button>
                      {entry.reviewStatus !== 'removed' && (
                        <button
                          className="community-persona-my-share-remove-btn"
                          onClick={() => handleUnpublish(entry.id)}
                          type="button"
                          title="下架"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {reportModalOpen && (
          <div className="community-persona-modal-overlay" onClick={() => setReportModalOpen(false)} role="presentation">
            <div className="community-persona-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="举报 Persona">
              <header className="community-persona-dialog-header">
                <h4><Flag size={16} /> 举报 Persona</h4>
                <button className="community-persona-dialog-close" onClick={() => setReportModalOpen(false)} type="button">
                  <X size={18} />
                </button>
              </header>
              <div className="community-persona-dialog-body">
                {reportResult && !reportResult.ok ? (
                  <div className="community-persona-result-banner error">
                    <AlertTriangle size={16} /> {reportResult.reason || '举报失败'}
                  </div>
                ) : null}
                <div className="community-persona-dialog-field">
                  <label>举报原因</label>
                  <div className="community-persona-report-reasons">
                    {(Object.entries(REPORT_REASON_LABELS) as [CommunityReportReason, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        className={`community-persona-reason-btn ${reportReason === value ? 'active' : ''}`}
                        onClick={() => setReportReason(value)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="community-persona-dialog-field">
                  <label>补充说明（可选）</label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="请描述具体问题..."
                    rows={3}
                  />
                </div>
              </div>
              <footer className="community-persona-dialog-footer">
                <button className="community-persona-dialog-btn secondary" onClick={() => setReportModalOpen(false)} type="button">
                  取消
                </button>
                <button
                  className="community-persona-dialog-btn primary"
                  onClick={handleReport}
                  disabled={reportSubmitting}
                  type="button"
                >
                  {reportSubmitting ? '提交中...' : '提交举报'}
                </button>
              </footer>
            </div>
          </div>
        )}

        {rateModalOpen && (
          <div className="community-persona-modal-overlay" onClick={() => setRateModalOpen(false)} role="presentation">
            <div className="community-persona-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="评分">
              <header className="community-persona-dialog-header">
                <h4><Star size={16} /> {myRating ? '修改评分' : '评分'}</h4>
                <button className="community-persona-dialog-close" onClick={() => setRateModalOpen(false)} type="button">
                  <X size={18} />
                </button>
              </header>
              <div className="community-persona-dialog-body">
                <div className="community-persona-rate-stars">
                  {([1, 2, 3, 4, 5] as const).map((score) => (
                    <button
                      key={score}
                      className={`community-persona-rate-star-btn ${rateScore >= score ? 'active' : ''}`}
                      onClick={() => setRateScore(score)}
                      type="button"
                    >
                      <Star size={32} fill={rateScore >= score ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <p className="community-persona-rate-label">
                  {rateScore === 1 && '很差'}
                  {rateScore === 2 && '较差'}
                  {rateScore === 3 && '一般'}
                  {rateScore === 4 && '不错'}
                  {rateScore === 5 && '非常好'}
                </p>
              </div>
              <footer className="community-persona-dialog-footer">
                <button className="community-persona-dialog-btn secondary" onClick={() => setRateModalOpen(false)} type="button">
                  取消
                </button>
                <button
                  className="community-persona-dialog-btn primary"
                  onClick={handleRate}
                  disabled={rateSubmitting}
                  type="button"
                >
                  {rateSubmitting ? '提交中...' : '确认评分'}
                </button>
              </footer>
            </div>
          </div>
        )}

        {toast && (
          <div className={`community-persona-toast ${toast.type}`}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
