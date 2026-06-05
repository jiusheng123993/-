import { useState } from 'react'
import { LayoutTemplate, Plus, Trash2, Play, Clock, FolderOpen } from 'lucide-react'
import { createTemplateService } from './templateService'

interface TemplateUIProps {
  compact?: boolean
  service?: ReturnType<typeof createTemplateService>
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#f97316',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
}

const categoryLabels: Record<string, string> = {
  daily: '日常',
  study: '学习',
  work: '工作',
  project: '项目',
  other: '其他'
}

export function TemplateUI({ compact = false, service: externalService }: TemplateUIProps) {
  const [service] = useState(() => externalService ?? createTemplateService())
  const [showCreate, setShowCreate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: '', category: 'daily', tasks: '' })

  const templates = service.getTemplates()

  const handleCreate = () => {
    if (!newTemplate.name || !newTemplate.tasks) return
    const tasks = newTemplate.tasks.split('\n').filter(Boolean).map((line) => {
      const parts = line.split(':')
      return { title: parts[0].trim(), minutes: parseInt(parts[1]?.trim()) || 30 }
    })
    service.createTemplate(newTemplate.name, tasks, newTemplate.category)
    setNewTemplate({ name: '', category: 'daily', tasks: '' })
    setShowCreate(false)
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <LayoutTemplate size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>模板</strong>
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>{templates.length} 个模板</div>
        {templates.slice(0, 3).map((t) => (
          <div key={t.id} style={{ fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${colors.cardBorder}` }}>
            {t.name} · {t.tasks.length}项
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <LayoutTemplate size={24} style={{ color: colors.accent }} />模板中心
      </h2>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: colors.textSecondary }}>任务模板 ({templates.length})</h3>
          <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '8px 12px', background: colors.accent, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer' }}><Plus size={14} /></button>
        </div>

        {showCreate && (
          <div style={{ marginBottom: 16, padding: 16, background: colors.inputBg, borderRadius: 8 }}>
            <input type="text" placeholder="模板名称" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }} />
            <select value={newTemplate.category} onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }}>
              {Object.entries(categoryLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <textarea placeholder="任务列表（每行一个，格式：任务名:分钟数）&#10;例如：&#10;晨间运动:30&#10;早餐:15" value={newTemplate.tasks} onChange={(e) => setNewTemplate({ ...newTemplate, tasks: e.target.value })} style={{ width: '100%', minHeight: 100, padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 13, marginBottom: 12, resize: 'vertical' }} />
            <button onClick={handleCreate} style={{ width: '100%', padding: '10px 16px', border: 'none', borderRadius: 6, background: colors.accent, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>创建模板</button>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {templates.map((template) => (
            <div key={template.id} style={{ padding: 16, background: colors.inputBg, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{template.name}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{categoryLabels[template.category] || '其他'} · {template.tasks.length} 个任务</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => service.useTemplate(template.id)} style={{ padding: '6px 10px', background: colors.accent, border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Play size={12} />使用
                  </button>
                  <button onClick={() => service.deleteTemplate(template.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {template.tasks.map((task, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '4px 8px', background: colors.cardBorder, borderRadius: 4, color: colors.textSecondary }}>
                    {task.title} ({task.minutes}分钟)
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}