import { useState, useMemo } from 'react'
import { GraduationCap, Briefcase, Palette, Sprout, BookOpen, Building2, Award, Languages, Plus, X, ChevronDown, Trash2, Edit3 } from 'lucide-react'
import { personaRegistry, type PersonaId, type PersonaScenario } from './personaRegistry'
import type { CustomPersona, CustomPersonaInput } from './customPersona'
import { addCustomPersona, deleteCustomPersona, loadCustomPersonas } from './customPersona'
import { usePersonaFormWizard } from '../hooks/usePersonaFormWizard'

const getPersonaIcon = (id: string) => {
  switch (id) {
    case 'office-worker':
      return <Briefcase size={18} />
    case 'creator':
      return <Palette size={18} />
    case 'self-growth':
      return <Sprout size={18} />
    case 'grad-exam':
      return <GraduationCap size={18} />
    case 'civil-service':
      return <Building2 size={18} />
    case 'cert-exam':
      return <Award size={18} />
    case 'english-cet':
      return <Languages size={18} />
    default:
      return <BookOpen size={18} />
  }
}

type PersonaGroup = {
  label: string
  personas: (PersonaScenario | CustomPersona)[]
}

export type PersonaSwitcherProps = {
  activePersonaId: PersonaId | string
  onSwitchPersona: (personaId: PersonaId | string) => void
  onCreateCustomPersona?: (persona: CustomPersona) => void
}

export const PersonaSwitcher = ({ activePersonaId, onSwitchPersona, onCreateCustomPersona }: PersonaSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>(() => loadCustomPersonas())
  const [editingPersona, setEditingPersona] = useState<CustomPersona | null>(null)

  const allPersonas = useMemo(() => {
    const preset = personaRegistry as (PersonaScenario | CustomPersona)[]
    return [...preset, ...customPersonas]
  }, [customPersonas])

  const activePersona = allPersonas.find((p) => p.id === activePersonaId) || personaRegistry[0]

  const groups: PersonaGroup[] = [
    {
      label: '备考学习',
      personas: allPersonas.filter((p) =>
        ['exam-student', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet'].includes(p.id)
      )
    },
    {
      label: '职场成长',
      personas: allPersonas.filter((p) =>
        ['office-worker', 'creator', 'self-growth'].includes(p.id)
      )
    },
    {
      label: '自定义',
      personas: customPersonas
    }
  ]

  const handleDeleteCustom = (id: string) => {
    if (!confirm('确定要删除这个自定义 Persona 吗？')) return
    deleteCustomPersona(id as `custom-${string}`)
    setCustomPersonas(loadCustomPersonas())
  }

  return (
    <div className="persona-switcher">
      <button
        className="persona-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="切换用户场景"
      >
        <span className="persona-switcher-active">
          {getPersonaIcon(activePersona.id)}
          <span>{activePersona.name}</span>
        </span>
        <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="persona-switcher-dropdown" role="listbox">
          {groups.map((group) =>
            group.personas.length > 0 ? (
              <div key={group.label} className="persona-switcher-group">
                <span className="persona-switcher-group-label">{group.label}</span>
                {group.personas.map((persona) => {
                  const isActive = persona.id === activePersonaId
                  const isCustom = persona.id.startsWith('custom-')
                  return (
                    <div
                      key={persona.id}
                      className={`persona-switcher-item ${isActive ? 'active' : ''} ${isCustom ? 'custom' : ''}`}
                      onClick={() => {
                        onSwitchPersona(persona.id)
                        setIsOpen(false)
                      }}
                      role="option"
                      aria-selected={isActive}
                    >
                      {getPersonaIcon(persona.id)}
                      <div className="persona-switcher-item-info">
                        <span className="persona-switcher-item-name">{persona.name}</span>
                        <span className="persona-switcher-item-desc">{(persona as PersonaScenario).primaryFlow || '自定义场景'}</span>
                      </div>
                      {isCustom && (
                        <div className="persona-switcher-item-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="persona-switcher-action-btn"
                            onClick={() => setEditingPersona(persona as CustomPersona)}
                            type="button"
                            title="编辑"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="persona-switcher-action-btn danger"
                            onClick={() => handleDeleteCustom(persona.id)}
                            type="button"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null
          )}
          <div className="persona-switcher-footer">
            <button
              className="persona-switcher-create-btn"
              onClick={() => { setShowCreator(true); setIsOpen(false) }}
              type="button"
            >
              <Plus size={16} />
              <span>创建自定义 Persona</span>
            </button>
          </div>
        </div>
      )}

      {showCreator && (
        <PersonaCreatorModal
          onClose={() => setShowCreator(false)}
          onCreate={(persona) => {
            setCustomPersonas(loadCustomPersonas())
            onCreateCustomPersona?.(persona)
            setShowCreator(false)
          }}
          initialData={editingPersona || undefined}
        />
      )}
    </div>
  )
}

type PersonaCreatorModalProps = {
  onClose: () => void
  onCreate: (persona: CustomPersona) => void
  initialData?: CustomPersona
}

const PersonaCreatorModal = ({ onClose, onCreate, initialData }: PersonaCreatorModalProps) => {
  const {
    formData,
    step,
    totalSteps,
    updateField,
    nextStep,
    prevStep,
    isStepValid,
  } = usePersonaFormWizard<CustomPersonaInput>({
    initialData: {
      name: initialData?.name || '',
      targetUser: initialData?.targetUser || '',
      painPoint: initialData?.painPoint || '',
      primaryFlow: initialData?.primaryFlow || '',
      hero: initialData?.hero || '',
      mainModuleTitle: initialData?.mainModuleTitle || '',
      sideModuleTitle: initialData?.sideModuleTitle || '',
      aiRole: initialData?.aiRole || '',
      keyMetrics: initialData?.keyMetrics || ['', '', '', ''],
      modules: initialData?.modules || [
        { id: 'mod-1', title: '', description: '', signal: '' },
        { id: 'mod-2', title: '', description: '', signal: '' },
        { id: 'mod-3', title: '', description: '', signal: '' },
        { id: 'mod-4', title: '', description: '', signal: '' },
      ],
      aiActions: initialData?.aiActions || ['daily-plan', 'task-breakdown', 'daily-review'],
      recommendedThemeId: initialData?.recommendedThemeId || 'minimal-premium',
    },
    totalSteps: 3,
    stepValidators: {
      1: (d) => !!d.name && !!d.targetUser && !!d.painPoint && !!d.primaryFlow,
      2: (d) => !!d.mainModuleTitle && !!d.sideModuleTitle && !!d.aiRole,
      3: (d) => d.modules.every((m) => !!m.title && !!m.description),
    },
  })

  const handleSubmit = () => {
    const persona = addCustomPersona(formData)
    onCreate(persona)
  }

  return (
    <div className="persona-creator-backdrop" onClick={onClose} role="presentation">
      <div className="persona-creator-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="创建自定义 Persona">
        <header className="persona-creator-header">
          <h3>{initialData ? '编辑' : '创建'}自定义 Persona</h3>
          <button className="persona-creator-close" onClick={onClose} type="button" aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        <div className="persona-creator-progress">
          <div className="persona-creator-progress-bar">
            <div className="persona-creator-progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          <span>步骤 {step}/{totalSteps}</span>
        </div>

        <div className="persona-creator-content">
          {step === 1 && (
            <div className="persona-creator-step">
              <h4>基本信息</h4>
              <div className="persona-creator-field">
                <label>Persona 名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="例如：考研冲刺"
                />
              </div>
              <div className="persona-creator-field">
                <label>目标用户</label>
                <input
                  type="text"
                  value={formData.targetUser}
                  onChange={(e) => updateField('targetUser', e.target.value)}
                  placeholder="描述这个 Persona 适合谁"
                />
              </div>
              <div className="persona-creator-field">
                <label>痛点描述</label>
                <textarea
                  value={formData.painPoint}
                  onChange={(e) => updateField('painPoint', e.target.value)}
                  placeholder="描述目标用户面临的主要问题"
                  rows={3}
                />
              </div>
              <div className="persona-creator-field">
                <label>核心流程</label>
                <input
                  type="text"
                  value={formData.primaryFlow}
                  onChange={(e) => updateField('primaryFlow', e.target.value)}
                  placeholder="例如：目标 → 计划 → 执行 → 复盘"
                />
              </div>
              <div className="persona-creator-field">
                <label>一句话描述</label>
                <input
                  type="text"
                  value={formData.hero}
                  onChange={(e) => updateField('hero', e.target.value)}
                  placeholder="用一句话概括这个 Persona 的价值"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="persona-creator-step">
              <h4>模块配置</h4>
              <div className="persona-creator-field">
                <label>主模块标题</label>
                <input
                  type="text"
                  value={formData.mainModuleTitle}
                  onChange={(e) => updateField('mainModuleTitle', e.target.value)}
                  placeholder="例如：学习计划"
                />
              </div>
              <div className="persona-creator-field">
                <label>副模块标题</label>
                <input
                  type="text"
                  value={formData.sideModuleTitle}
                  onChange={(e) => updateField('sideModuleTitle', e.target.value)}
                  placeholder="例如：复习队列"
                />
              </div>
              <div className="persona-creator-field">
                <label>AI 角色名称</label>
                <input
                  type="text"
                  value={formData.aiRole}
                  onChange={(e) => updateField('aiRole', e.target.value)}
                  placeholder="例如：AI 学习教练"
                />
              </div>
              <div className="persona-creator-field">
                <label>关键指标（4个）</label>
                {formData.keyMetrics.map((metric, index) => (
                  <input
                    key={index}
                    type="text"
                    value={metric}
                    onChange={(e) => {
                      const newMetrics = [...formData.keyMetrics]
                      newMetrics[index] = e.target.value
                      updateField('keyMetrics', newMetrics)
                    }}
                    placeholder={`指标 ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="persona-creator-step">
              <h4>模块详情</h4>
              {formData.modules.map((module, index) => (
                <div key={module.id} className="persona-creator-module">
                  <h5>模块 {index + 1}</h5>
                  <div className="persona-creator-field">
                    <label>标题</label>
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => {
                        const newModules = [...formData.modules]
                        newModules[index] = { ...module, title: e.target.value }
                        updateField('modules', newModules)
                      }}
                      placeholder="模块标题"
                    />
                  </div>
                  <div className="persona-creator-field">
                    <label>描述</label>
                    <input
                      type="text"
                      value={module.description}
                      onChange={(e) => {
                        const newModules = [...formData.modules]
                        newModules[index] = { ...module, description: e.target.value }
                        updateField('modules', newModules)
                      }}
                      placeholder="模块描述"
                    />
                  </div>
                  <div className="persona-creator-field">
                    <label>信号/状态</label>
                    <input
                      type="text"
                      value={module.signal}
                      onChange={(e) => {
                        const newModules = [...formData.modules]
                        newModules[index] = { ...module, signal: e.target.value }
                        updateField('modules', newModules)
                      }}
                      placeholder="例如：进行中"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="persona-creator-actions">
          {step > 1 && (
            <button className="persona-creator-btn secondary" onClick={prevStep} type="button">
              上一步
            </button>
          )}
          {step < totalSteps ? (
            <button
              className="persona-creator-btn primary"
              onClick={nextStep}
              disabled={!isStepValid()}
              type="button"
            >
              下一步
            </button>
          ) : (
            <button
              className="persona-creator-btn primary"
              onClick={handleSubmit}
              disabled={!isStepValid()}
              type="button"
            >
              {initialData ? '保存' : '创建'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
