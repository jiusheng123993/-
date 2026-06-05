import { useState, useCallback } from 'react'
import { FolderKanban, Plus, Trash2, CheckCircle, Circle, Flag, Calendar, ChevronRight, Target, ListTodo } from 'lucide-react'
import { createProjectService } from './projectService'
import type { ProjectService, Project, Task, Milestone } from './projectService'

interface ProjectUIProps {
  compact?: boolean
  service?: ProjectService
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#8b5cf6',
  accentLight: '#a78bfa',
  income: '#4caf50',
  progressBg: '#2a2a4a',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
  warning: '#f59e0b',
  high: '#ef4444',
}

const priorityColors = {
  low: colors.textSecondary,
  medium: colors.warning,
  high: colors.high,
  urgent: '#dc2626'
}

const statusLabels: Record<Project['status'], string> = {
  planning: '规划中',
  active: '进行中',
  'on-hold': '已暂停',
  completed: '已完成',
  archived: '已归档'
}

export function ProjectUI({ compact = false, service: externalService }: ProjectUIProps) {
  const [service] = useState<ProjectService>(() => externalService ?? createProjectService())
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'timeline'>('projects')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectDeadline, setProjectDeadline] = useState('')
  const [projectPriority, setProjectPriority] = useState<Project['priority']>('medium')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskProject, setTaskProject] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneProject, setMilestoneProject] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')

  const state = service.getState()
  const activeProjects = state.projects.filter((p) => p.status === 'active' || p.status === 'planning')

  const handleAddProject = useCallback(() => {
    if (!projectName || !projectDeadline) return
    service.addProject(projectName, projectDesc, projectDeadline, projectPriority)
    setProjectName('')
    setProjectDesc('')
    setProjectDeadline('')
    setProjectPriority('medium')
  }, [service, projectName, projectDesc, projectDeadline, projectPriority])

  const handleAddTask = useCallback(() => {
    if (!taskTitle || !taskProject) return
    service.addTask(taskProject, taskTitle)
    setTaskTitle('')
  }, [service, taskTitle, taskProject])

  const handleAddMilestone = useCallback(() => {
    if (!milestoneTitle || !milestoneProject || !milestoneDate) return
    service.addMilestone(milestoneProject, milestoneTitle, milestoneDate)
    setMilestoneTitle('')
    setMilestoneDate('')
  }, [service, milestoneTitle, milestoneProject, milestoneDate])

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FolderKanban size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>项目管理</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.text, fontSize: 20, fontWeight: 700 }}>{state.projects.length}</div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>项目</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: 20, fontWeight: 700 }}>{state.tasks.filter((t) => t.status !== 'done').length}</div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>待办</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.income, fontSize: 20, fontWeight: 700 }}>{state.projects.filter((p) => p.status === 'completed').length}</div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>完成</small>
          </div>
        </div>
        {activeProjects.length > 0 && (
          <div style={{ paddingTop: 12, borderTop: `1px solid ${colors.cardBorder}` }}>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>活跃项目</small>
            {activeProjects.slice(0, 3).map((project) => {
              const stats = service.getProjectStats(project.id)
              return (
                <div key={project.id} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{project.name}</span>
                    <span style={{ color: priorityColors[project.priority] }}><Flag size={10} /></span>
                  </div>
                  <div style={{ height: 4, background: colors.progressBg, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${stats.progress}%`, background: colors.accent, borderRadius: 2 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const tabs = [
    { id: 'projects', label: '项目', icon: FolderKanban },
    { id: 'tasks', label: '任务', icon: ListTodo },
    { id: 'timeline', label: '里程碑', icon: Calendar },
  ] as const

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FolderKanban size={24} style={{ color: colors.accent }} />项目管理
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? colors.accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : colors.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'projects' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>创建新项目</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="项目名称"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <input
                type="text"
                placeholder="项目描述"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="date"
                value={projectDeadline}
                onChange={(e) => setProjectDeadline(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <select
                value={projectPriority}
                onChange={(e) => setProjectPriority(e.target.value as Project['priority'])}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="low">低优先级</option>
                <option value="medium">中优先级</option>
                <option value="high">高优先级</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
            <button
              onClick={handleAddProject}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              创建项目
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>我的项目 ({state.projects.length})</h3>
            {state.projects.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无项目，创建一个开始吧</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {state.projects.map((project) => {
                  const stats = service.getProjectStats(project.id)
                  return (
                    <div key={project.id} style={{ padding: 16, background: colors.inputBg, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>{project.name}</strong>
                            <Flag size={12} style={{ color: priorityColors[project.priority] }} />
                          </div>
                          <small style={{ color: colors.textSecondary }}>{project.description}</small>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: colors.textSecondary, fontSize: 12 }}>{statusLabels[project.status]}</span>
                          <button onClick={() => service.removeProject(project.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
                        <span>任务: {stats.completedTasks}/{stats.totalTasks}</span>
                        <span>里程碑: {stats.completedMilestones}/{stats.totalMilestones}</span>
                        <span>截止: {project.deadline}</span>
                      </div>
                      <div style={{ height: 6, background: colors.progressBg, borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${stats.progress}%`, background: colors.accent, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>添加任务</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="任务标题"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <select
                value={taskProject}
                onChange={(e) => setTaskProject(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="">选择项目</option>
                {state.projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <button
              onClick={handleAddTask}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              添加任务
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>所有任务 ({state.tasks.length})</h3>
            {state.tasks.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无任务</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {state.tasks.map((task) => {
                  const project = state.projects.find((p) => p.id === task.projectId)
                  return (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                      <button
                        onClick={() => service.updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'done' ? colors.income : colors.textSecondary }}
                      >
                        {task.status === 'done' ? <CheckCircle size={20} /> : <Circle size={20} />}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? colors.textSecondary : colors.text }}>{task.title}</div>
                        <small style={{ color: colors.textSecondary }}>{project?.name}</small>
                      </div>
                      <button onClick={() => service.removeTask(task.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>添加里程碑</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="里程碑名称"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <select
                value={milestoneProject}
                onChange={(e) => setMilestoneProject(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="">选择项目</option>
                {state.projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <input
              type="date"
              value={milestoneDate}
              onChange={(e) => setMilestoneDate(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12 }}
            />
            <button
              onClick={handleAddMilestone}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              添加里程碑
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>里程碑时间线</h3>
            {state.milestones.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无里程碑</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {state.milestones
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((milestone) => {
                    const project = state.projects.find((p) => p.id === milestone.projectId)
                    const isOverdue = !milestone.completed && new Date(milestone.dueDate) < new Date()
                    return (
                      <div key={milestone.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: colors.inputBg, borderRadius: 8, borderLeft: `3px solid ${milestone.completed ? colors.income : isOverdue ? colors.high : colors.accent}` }}>
                        <button
                          onClick={() => service.toggleMilestone(milestone.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: milestone.completed ? colors.income : colors.textSecondary }}
                        >
                          {milestone.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ textDecoration: milestone.completed ? 'line-through' : 'none', color: milestone.completed ? colors.textSecondary : colors.text }}>{milestone.title}</div>
                          <small style={{ color: colors.textSecondary }}>{project?.name} · {milestone.dueDate}</small>
                        </div>
                        <button onClick={() => service.removeMilestone(milestone.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}