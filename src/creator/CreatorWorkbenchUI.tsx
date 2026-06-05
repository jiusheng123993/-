import React, { useState, useEffect, useCallback } from 'react'
import {
  Lightbulb,
  FileText,
  Calendar,
  Users,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Archive,
  Send,
  Eye,
  PenTool
} from 'lucide-react'
import {
  createCreatorService,
  type CreatorService,
  type IdeaItem,
  type ContentPiece,
  type PublishEvent,
  type ClientProject
} from './creatorService'

type TabKey = 'ideas' | 'content' | 'publish' | 'clients'

const STAGE_COLORS: Record<ContentPiece['stage'], string> = {
  outline: '#9ca3af',
  draft: '#3b82f6',
  editing: '#eab308',
  review: '#f97316',
  publish: '#22c55e'
}

const STAGE_LABELS: Record<ContentPiece['stage'], string> = {
  outline: '大纲',
  draft: '草稿',
  editing: '编辑中',
  review: '审核中',
  publish: '已发布'
}

const IDEA_STATUS_LABELS: Record<IdeaItem['status'], string> = {
  new: '新灵感',
  developing: '开发中',
  archived: '已归档'
}

const IDEA_STATUS_COLORS: Record<IdeaItem['status'], string> = {
  new: '#8b5cf6',
  developing: '#3b82f6',
  archived: '#9ca3af'
}

const PUBLISH_STATUS_LABELS: Record<PublishEvent['status'], string> = {
  planned: '计划中',
  published: '已发布',
  delayed: '已延期'
}

const PUBLISH_STATUS_COLORS: Record<PublishEvent['status'], string> = {
  planned: '#3b82f6',
  published: '#22c55e',
  delayed: '#ef4444'
}

const CLIENT_STATUS_LABELS: Record<ClientProject['status'], string> = {
  inquiry: '咨询中',
  proposal: '提案中',
  'in-progress': '进行中',
  feedback: '反馈中',
  delivered: '已交付'
}

const CLIENT_STATUS_COLORS: Record<ClientProject['status'], string> = {
  inquiry: '#8b5cf6',
  proposal: '#3b82f6',
  'in-progress': '#eab308',
  feedback: '#f97316',
  delivered: '#22c55e'
}

interface CreatorWorkbenchUIProps {
  compact?: boolean
  service?: CreatorService
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: color,
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ width: '100%', height: 6, backgroundColor: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          backgroundColor: '#3b82f6',
          borderRadius: 3,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  )
}

function CompactMode({ service }: { service: CreatorService }) {
  const [summary, setSummary] = useState(service.getSummary())

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(service.getSummary())
    }, 2000)
    return () => clearInterval(interval)
  }, [service])

  return (
    <div
      style={{
        width: 300,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Lightbulb size={20} color="#f59e0b" />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>内容创作工作台</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 14
        }}
      >
        <StatItem icon={<Lightbulb size={14} />} label="灵感数" value={summary.ideaCount} color="#8b5cf6" />
        <StatItem icon={<PenTool size={14} />} label="生产中" value={summary.activeContentCount} color="#3b82f6" />
        <StatItem icon={<Send size={14} />} label="待发布" value={summary.upcomingPublishCount} color="#f59e0b" />
        <StatItem icon={<Users size={14} />} label="客户项目" value={summary.activeClientCount} color="#22c55e" />
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>活跃内容进度</div>
        <ProgressBar value={summary.activeContentCount > 0 ? 50 : 0} />
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
          {summary.activeContentCount} 个内容生产中
        </div>
      </div>
    </div>
  )
}

function StatItem({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        backgroundColor: `${color}10`,
        border: `1px solid ${color}30`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, color }}>
        {icon}
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

function IdeasTab({ service }: { service: CreatorService }) {
  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const refresh = useCallback(() => {
    setIdeas(service.getIdeas())
  }, [service])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleAdd = () => {
    if (!title.trim()) return
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    service.addIdea(title.trim(), source.trim() || '手动录入', tags)
    setTitle('')
    setSource('')
    setTagsInput('')
    refresh()
  }

  const handleDelete = (id: string) => {
    service.removeIdea(id)
    refresh()
  }

  const handleStatusChange = (id: string, status: IdeaItem['status']) => {
    service.updateIdeaStatus(id, status)
    refresh()
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="灵感标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="来源"
            value={source}
            onChange={e => setSource(e.target.value)}
            style={{ ...inputStyle, width: 120 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="标签（逗号分隔）"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleAdd} style={primaryBtnStyle}>
            <Plus size={14} /> 添加
          </button>
        </div>
      </div>

      {ideas.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 24, fontSize: 13 }}>
          暂无灵感，开始记录吧
        </div>
      )}

      {ideas.map(idea => (
        <div key={idea.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                {idea.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                来源: {idea.source} · {new Date(idea.createdAt).toLocaleDateString('zh-CN')}
              </div>
              {idea.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                  {idea.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        backgroundColor: 'var(--bg-secondary, #f3f4f6)',
                        color: 'var(--muted)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <Badge label={IDEA_STATUS_LABELS[idea.status]} color={IDEA_STATUS_COLORS[idea.status]} />
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {idea.status !== 'developing' && (
                <button
                  onClick={() => handleStatusChange(idea.id, 'developing')}
                  style={iconBtnStyle}
                  title="开始开发"
                >
                  <Edit3 size={14} />
                </button>
              )}
              {idea.status !== 'archived' && (
                <button
                  onClick={() => handleStatusChange(idea.id, 'archived')}
                  style={iconBtnStyle}
                  title="归档"
                >
                  <Archive size={14} />
                </button>
              )}
              <button onClick={() => handleDelete(idea.id)} style={dangerIconBtnStyle} title="删除">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ContentTab({ service }: { service: CreatorService }) {
  const [pieces, setPieces] = useState<ContentPiece[]>([])
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('')
  const [deadline, setDeadline] = useState('')

  const refresh = useCallback(() => {
    setPieces(service.getContentPieces())
  }, [service])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleAdd = () => {
    if (!title.trim()) return
    service.addContentPiece(title.trim(), platform.trim() || '通用', deadline || '未设定')
    setTitle('')
    setPlatform('')
    setDeadline('')
    refresh()
  }

  const handleDelete = (id: string) => {
    service.removeContentPiece(id)
    refresh()
  }

  const handleStageChange = (id: string, stage: ContentPiece['stage']) => {
    service.updateContentStage(id, stage)
    refresh()
  }

  const handleProgressChange = (id: string, progress: number) => {
    service.updateContentProgress(id, progress)
    refresh()
  }

  const stageOrder: ContentPiece['stage'][] = ['outline', 'draft', 'editing', 'review', 'publish']

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="内容标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="平台"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            style={{ ...inputStyle, width: 120 }}
          />
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <button onClick={handleAdd} style={primaryBtnStyle}>
            <Plus size={14} /> 添加
          </button>
        </div>
      </div>

      {pieces.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 24, fontSize: 13 }}>
          暂无内容，开始创作吧
        </div>
      )}

      {pieces.map(piece => (
        <div key={piece.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                {piece.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                {piece.platform} · 截止: {piece.deadline}
              </div>
              <Badge label={STAGE_LABELS[piece.stage]} color={STAGE_COLORS[piece.stage]} />
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => handleDelete(piece.id)} style={dangerIconBtnStyle} title="删除">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>进度</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{piece.progress}%</span>
            </div>
            <ProgressBar value={piece.progress} />
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {stageOrder.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageChange(piece.id, stage)}
                style={{
                  ...stageBtnStyle,
                  backgroundColor: piece.stage === stage ? STAGE_COLORS[stage] : '#f3f4f6',
                  color: piece.stage === stage ? '#fff' : 'var(--muted)'
                }}
              >
                {STAGE_LABELS[stage]}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={piece.progress}
              onChange={e => handleProgressChange(piece.id, Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function PublishTab({ service }: { service: CreatorService }) {
  const [events, setEvents] = useState<PublishEvent[]>([])
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('')
  const [date, setDate] = useState('')

  const refresh = useCallback(() => {
    setEvents(service.getPublishEvents())
  }, [service])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  )

  const handleAdd = () => {
    if (!title.trim()) return
    service.addPublishEvent(title.trim(), platform.trim() || '通用', date || new Date().toISOString().slice(0, 10))
    setTitle('')
    setPlatform('')
    setDate('')
    refresh()
  }

  const handleDelete = (id: string) => {
    service.removePublishEvent(id)
    refresh()
  }

  const handleMarkPublished = (id: string) => {
    service.markPublished(id)
    refresh()
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="发布标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="平台"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            style={{ ...inputStyle, width: 120 }}
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <button onClick={handleAdd} style={primaryBtnStyle}>
            <Plus size={14} /> 添加
          </button>
        </div>
      </div>

      {sortedEvents.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 24, fontSize: 13 }}>
          暂无发布计划
        </div>
      )}

      {sortedEvents.map(event => (
        <div key={event.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                {event.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                {event.scheduledDate} · {event.platform}
              </div>
              <Badge label={PUBLISH_STATUS_LABELS[event.status]} color={PUBLISH_STATUS_COLORS[event.status]} />
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {event.status !== 'published' && (
                <button
                  onClick={() => handleMarkPublished(event.id)}
                  style={iconBtnStyle}
                  title="标记为已发布"
                >
                  <CheckCircle size={14} />
                </button>
              )}
              <button onClick={() => handleDelete(event.id)} style={dangerIconBtnStyle} title="删除">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClientsTab({ service }: { service: CreatorService }) {
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [clientName, setClientName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')

  const refresh = useCallback(() => {
    setProjects(service.getClientProjects())
  }, [service])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleAdd = () => {
    if (!clientName.trim()) return
    service.addClientProject(
      clientName.trim(),
      description.trim() || '未描述',
      deadline || '未设定',
      Number(budget) || 0
    )
    setClientName('')
    setDescription('')
    setDeadline('')
    setBudget('')
    refresh()
  }

  const handleDelete = (id: string) => {
    service.removeClientProject(id)
    refresh()
  }

  const handleStatusChange = (id: string, status: ClientProject['status']) => {
    service.updateClientStatus(id, status)
    refresh()
  }

  const clientStatuses: ClientProject['status'][] = ['inquiry', 'proposal', 'in-progress', 'feedback', 'delivered']

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="客户名称"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="项目描述"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <input
            type="number"
            placeholder="预算"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            style={{ ...inputStyle, width: 120 }}
          />
          <button onClick={handleAdd} style={primaryBtnStyle}>
            <Plus size={14} /> 添加
          </button>
        </div>
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 24, fontSize: 13 }}>
          暂无客户项目
        </div>
      )}

      {projects.map(project => (
        <div key={project.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                {project.clientName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                {project.description}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                截止: {project.deadline}
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={12} color="#22c55e" />
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                    ¥{project.budget.toLocaleString()}
                  </span>
                </span>
                <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={12} color="#3b82f6" />
                  <span style={{ color: 'var(--muted)' }}>
                    已付 ¥{project.paidAmount.toLocaleString()}
                  </span>
                </span>
              </div>
              <Badge
                label={CLIENT_STATUS_LABELS[project.status]}
                color={CLIENT_STATUS_COLORS[project.status]}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => handleDelete(project.id)} style={dangerIconBtnStyle} title="删除">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
            {clientStatuses.map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(project.id, status)}
                style={{
                  ...stageBtnStyle,
                  backgroundColor: project.status === status ? CLIENT_STATUS_COLORS[status] : '#f3f4f6',
                  color: project.status === status ? '#fff' : 'var(--muted)'
                }}
              >
                {CLIENT_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FullMode({ service }: { service: CreatorService }) {
  const [activeTab, setActiveTab] = useState<TabKey>('ideas')

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'ideas', label: '灵感收集箱', icon: <Lightbulb size={16} /> },
    { key: 'content', label: '内容生产线', icon: <FileText size={16} /> },
    { key: 'publish', label: '发布日历', icon: <Calendar size={16} /> },
    { key: 'clients', label: '客户交付', icon: <Users size={16} /> }
  ]

  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary, #f9fafb)'
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 20px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.key ? '#3b82f6' : 'var(--muted)',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20, maxHeight: 500, overflowY: 'auto' }}>
        {activeTab === 'ideas' && <IdeasTab service={service} />}
        {activeTab === 'content' && <ContentTab service={service} />}
        {activeTab === 'publish' && <PublishTab service={service} />}
        {activeTab === 'clients' && <ClientsTab service={service} />}
      </div>
    </div>
  )
}

export function CreatorWorkbenchUI({ compact = false, service }: CreatorWorkbenchUIProps) {
  const svc = service ?? createCreatorService()

  if (compact) {
    return <CompactMode service={svc} />
  }

  return <FullMode service={svc} />
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 13,
  outline: 'none',
  flex: 1,
  minWidth: 0
}

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 14px',
  border: 'none',
  borderRadius: 6,
  backgroundColor: '#3b82f6',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: '1px solid var(--border, #d1d5db)',
  borderRadius: 6,
  backgroundColor: 'var(--surface, #fff)',
  color: 'var(--muted)',
  cursor: 'pointer'
}

const dangerIconBtnStyle: React.CSSProperties = {
  ...iconBtnStyle,
  color: '#ef4444',
  borderColor: '#fca5a5'
}

const cardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: '#fff',
  marginBottom: 10
}

const stageBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  border: 'none',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease'
}
