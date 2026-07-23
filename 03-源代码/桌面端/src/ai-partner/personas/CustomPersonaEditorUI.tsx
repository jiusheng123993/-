import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles, Shield, AlertTriangle, Check, MessageCircle, Ban, Image, Wand2, Loader2 } from 'lucide-react'
import type { PersonaDefinition } from './personaScheduler'
import { PRESET_PERSONAS } from './personaScheduler'
import type { PersonaSafetyGate, SafetyCheckResult, IdentityRoleAllowed } from './personaSafetyGate'
import { createPersonaSafetyGate } from './personaSafetyGate'
import type { EntitlementService } from '../../shared/entitlement/entitlementService'
import { createEntitlementService } from '../../shared/entitlement/entitlementService'
import { createPersonaProvider } from '../../shared/entitlement/personaProvider'
import { loadCustomPersonas, type CustomPersonaInput } from './customPersona'
import { createCustomPersonaService, type CustomPersonaService } from './customPersonaService'
import type { SafetyIncidentLog } from './safetyIncidentLog'
import { createSafetyIncidentLog } from './safetyIncidentLog'
import type { IPersonaAvatarGen } from './personaAvatarGen'

type ToneKeyword =
  | 'gentle' | 'sharp' | 'humorous' | 'rational' | 'energetic' | 'lazy'
  | 'caring' | 'direct' | 'philosophical' | 'playful' | 'professional'

interface CustomPersonaDraft {
  baseTemplateId: string
  name: string
  addressing: string
  identityRole: IdentityRoleAllowed
  toneKeywords: ToneKeyword[]
  catchphrase: string
  backstory: string
  forbiddenTopics: string[]
  avatarSource: 'preset' | 'ai_generated'
  avatarAssetId: string
  aiAvatarPrompt: string
}

const IDENTITY_ROLE_OPTIONS: { value: IdentityRoleAllowed; label: string; icon: string }[] = [
  { value: 'girlfriend', label: '女友', icon: '💕' },
  { value: 'sister', label: '姐姐', icon: '🌸' },
  { value: 'teacher', label: '老师', icon: '📚' },
  { value: 'brother', label: '哥哥', icon: '🤝' },
  { value: 'friend', label: '朋友', icon: '👋' },
  { value: 'study_partner', label: '学习搭子', icon: '📖' },
  { value: 'senior_student', label: '学姐/学长', icon: '🎓' },
  { value: 'coach', label: '教练', icon: '🏋️' },
  { value: 'secretary', label: '秘书', icon: '💼' },
  { value: 'wise_elder', label: '智者', icon: '🧙' },
]

const TONE_KEYWORD_OPTIONS: { value: ToneKeyword; label: string; emoji: string }[] = [
  { value: 'gentle', label: '温柔', emoji: '🌸' },
  { value: 'sharp', label: '毒舌', emoji: '🌶️' },
  { value: 'humorous', label: '幽默', emoji: '😄' },
  { value: 'rational', label: '理性', emoji: '🧠' },
  { value: 'energetic', label: '元气', emoji: '⚡' },
  { value: 'lazy', label: '慵懒', emoji: '😴' },
  { value: 'caring', label: '关怀', emoji: '🤗' },
  { value: 'direct', label: '直接', emoji: '🎯' },
  { value: 'philosophical', label: '哲学', emoji: '🤔' },
  { value: 'playful', label: '玩趣', emoji: '🎮' },
  { value: 'professional', label: '专业', emoji: '💎' },
]

const AVATAR_PRESETS = [
  { id: 'avatar-cat', label: '🐱 猫咪', emoji: '🐱' },
  { id: 'avatar-dog', label: '🐶 小狗', emoji: '🐶' },
  { id: 'avatar-fox', label: '🦊 狐狸', emoji: '🦊' },
  { id: 'avatar-owl', label: '🦉 猫头鹰', emoji: '🦉' },
  { id: 'avatar-bear', label: '🐻 小熊', emoji: '🐻' },
  { id: 'avatar-rabbit', label: '🐰 兔子', emoji: '🐰' },
]

const MAX_TONE_KEYWORDS = 3
const MAX_BACKSTORY_LENGTH = 50
const MAX_CATCHPHRASE_LENGTH = 30
const MAX_NAME_LENGTH = 20
const MAX_ADDRESSING_LENGTH = 15

function createEmptyDraft(): CustomPersonaDraft {
  return {
    baseTemplateId: '',
    name: '',
    addressing: '',
    identityRole: 'friend' as IdentityRoleAllowed,
    toneKeywords: [],
    catchphrase: '',
    backstory: '',
    forbiddenTopics: [],
    avatarSource: 'preset',
    avatarAssetId: 'avatar-cat',
    aiAvatarPrompt: '',
  }
}

function generateSystemPromptPreview(draft: CustomPersonaDraft, template: PersonaDefinition): string {
  const roleLabel = IDENTITY_ROLE_OPTIONS.find((r) => r.value === draft.identityRole)?.label || draft.identityRole
  const toneLabels = draft.toneKeywords
    .map((k) => TONE_KEYWORD_OPTIONS.find((t) => t.value === k)?.label || k)
    .join('、')

  let prompt = `你是${draft.name || '用户的自定义角色'}，身份是${roleLabel}。\n\n`

  if (toneLabels) {
    prompt += `你的性格特点是：${toneLabels}。\n`
  }

  if (draft.addressing) {
    prompt += `你称呼用户为「${draft.addressing}」。\n`
  }

  if (draft.catchphrase) {
    prompt += `你的口头禅是：「${draft.catchphrase}」。\n`
  }

  if (draft.backstory) {
    prompt += `\n你的背景故事：${draft.backstory}\n`
  }

  if (draft.forbiddenTopics.length > 0) {
    prompt += `\n你绝不讨论以下话题：${draft.forbiddenTopics.join('、')}。\n`
  }

  prompt += `\n---\n基于模板「${template.name}」的系统提示框架：\n${template.systemPromptTemplate}`

  return prompt
}

function validateDraftStep1(draft: CustomPersonaDraft): boolean {
  return !!draft.baseTemplateId
}

function validateDraftStep2(draft: CustomPersonaDraft): boolean {
  return (
    !!draft.name.trim() &&
    draft.name.trim().length <= MAX_NAME_LENGTH &&
    !!draft.addressing.trim() &&
    draft.addressing.trim().length <= MAX_ADDRESSING_LENGTH &&
    !!draft.identityRole &&
    draft.toneKeywords.length > 0 &&
    draft.toneKeywords.length <= MAX_TONE_KEYWORDS &&
    !!draft.avatarAssetId
  )
}

export interface CustomPersonaEditorUIProps {
  userId: string
  onClose: () => void
  onCreate: (persona: ReturnType<typeof loadCustomPersonas>[number]) => void
  entitlementService?: EntitlementService
  safetyGate?: PersonaSafetyGate
  incidentLog?: SafetyIncidentLog
  customPersonaService?: CustomPersonaService
  avatarGen?: IPersonaAvatarGen
}

export function CustomPersonaEditorUI({
  userId,
  onClose,
  onCreate,
  entitlementService: externalEntitlementService,
  safetyGate: externalSafetyGate,
  incidentLog: externalIncidentLog,
  customPersonaService: externalCustomPersonaService,
  avatarGen: externalAvatarGen,
}: CustomPersonaEditorUIProps) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<CustomPersonaDraft>(createEmptyDraft)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [safetyResults, setSafetyResults] = useState<Record<string, SafetyCheckResult>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false)
  const [avatarGenError, setAvatarGenError] = useState('')
  const [aiGeneratedAvatarUrl, setAiGeneratedAvatarUrl] = useState('')

  const avatarGen = externalAvatarGen

  const entitlementService = useMemo(
    () => externalEntitlementService || createEntitlementService(),
    [externalEntitlementService]
  )
  const safetyGate = useMemo(
    () => externalSafetyGate || createPersonaSafetyGate({ log: () => {} }),
    [externalSafetyGate]
  )
  const incidentLog = useMemo(
    () => externalIncidentLog || createSafetyIncidentLog(),
    [externalIncidentLog]
  )
  const customPersonaService = useMemo(
    () => externalCustomPersonaService || createCustomPersonaService({ safetyGate, incidentLog }),
    [externalCustomPersonaService, safetyGate, incidentLog]
  )
  const personaProvider = useMemo(() => createPersonaProvider(entitlementService), [entitlementService])

  const canCreateCustom = useMemo(() => personaProvider.canCreateCustom(userId), [personaProvider, userId])
  const customSlotCount = useMemo(() => personaProvider.getCustomSlotCount(userId), [personaProvider, userId])
  const existingCustomCount = useMemo(() => loadCustomPersonas().length, [])

  const selectedTemplate = useMemo(
    () => PRESET_PERSONAS.find((p) => p.id === draft.baseTemplateId) || null,
    [draft.baseTemplateId]
  )

  const systemPromptPreview = useMemo(() => {
    if (!selectedTemplate) return ''
    return generateSystemPromptPreview(draft, selectedTemplate)
  }, [draft, selectedTemplate])

  const updateDraft = <K extends keyof CustomPersonaDraft>(field: K, value: CustomPersonaDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const toggleToneKeyword = (keyword: ToneKeyword) => {
    setDraft((prev) => {
      const current = prev.toneKeywords
      if (current.includes(keyword)) {
        return { ...prev, toneKeywords: current.filter((k) => k !== keyword) }
      }
      if (current.length >= MAX_TONE_KEYWORDS) return prev
      return { ...prev, toneKeywords: [...current, keyword] }
    })
  }

  const runSafetyCheck = (field: string, value: string) => {
    let result: SafetyCheckResult
    switch (field) {
      case 'name':
        result = safetyGate.validateName(value)
        break
      case 'addressing':
        result = safetyGate.validateAddressing(value)
        break
      case 'identityRole':
        result = safetyGate.validateIdentityRole(value)
        break
      case 'catchphrase':
      case 'backstory':
        result = safetyGate.validateContent(value)
        break
      default:
        result = { ok: true }
    }
    setSafetyResults((prev) => ({ ...prev, [field]: result }))
    return result
  }

  const handleStep1Next = () => {
    if (!validateDraftStep1(draft)) {
      setValidationErrors({ baseTemplateId: '请选择一个基础模板' })
      return
    }
    setStep(2)
  }

  const handleStep2Next = () => {
    const errors: Record<string, string> = {}

    if (!draft.name.trim()) {
      errors.name = '请输入 TA 的名字'
    } else if (draft.name.trim().length > MAX_NAME_LENGTH) {
      errors.name = `名字不能超过 ${MAX_NAME_LENGTH} 个字符`
    }

    if (!draft.addressing.trim()) {
      errors.addressing = '请输入 TA 怎么称呼你'
    } else if (draft.addressing.trim().length > MAX_ADDRESSING_LENGTH) {
      errors.addressing = `称呼不能超过 ${MAX_ADDRESSING_LENGTH} 个字符`
    }

    if (!draft.identityRole) {
      errors.identityRole = '请选择 TA 的身份'
    }

    if (draft.toneKeywords.length === 0) {
      errors.toneKeywords = `请选择 1-${MAX_TONE_KEYWORDS} 个性格关键词`
    }

    if (!draft.avatarAssetId) {
      errors.avatarAssetId = '请选择头像'
    }

    if (draft.catchphrase && draft.catchphrase.length > MAX_CATCHPHRASE_LENGTH) {
      errors.catchphrase = `口头禅不能超过 ${MAX_CATCHPHRASE_LENGTH} 个字符`
    }

    if (draft.backstory && draft.backstory.length > MAX_BACKSTORY_LENGTH) {
      errors.backstory = `背景故事不能超过 ${MAX_BACKSTORY_LENGTH} 个字符`
    }

    setValidationErrors(errors)

    if (Object.keys(errors).length > 0) return

    const nameResult = runSafetyCheck('name', draft.name)
    const addressingResult = runSafetyCheck('addressing', draft.addressing)
    const identityResult = runSafetyCheck('identityRole', draft.identityRole)

    if (!nameResult.ok || !addressingResult.ok || !identityResult.ok) {
      return
    }

    if (draft.catchphrase) runSafetyCheck('catchphrase', draft.catchphrase)
    if (draft.backstory) runSafetyCheck('backstory', draft.backstory)

    setStep(3)
  }

  const handleSubmit = () => {
    if (!selectedTemplate) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const roleLabel = IDENTITY_ROLE_OPTIONS.find((r) => r.value === draft.identityRole)?.label || draft.identityRole
      const toneLabels = draft.toneKeywords
        .map((k) => TONE_KEYWORD_OPTIONS.find((t) => t.value === k)?.label || k)
        .join('、')

      const input: CustomPersonaInput = {
        name: draft.name,
        targetUser: '自定义角色用户',
        painPoint: `需要一个${roleLabel}风格的 AI 陪伴`,
        primaryFlow: `与${draft.name}互动 → 获得${toneLabels}风格的回应`,
        hero: `${draft.name}（${roleLabel}）`,
        mainModuleTitle: `${draft.name}的陪伴`,
        sideModuleTitle: '角色设定',
        aiRole: roleLabel,
        keyMetrics: ['互动质量', '角色一致性', '用户满意度', '安全合规'],
        modules: [
          { id: 'mod-1', title: '日常聊天', description: `与${draft.name}进行日常对话`, signal: '活跃' },
          { id: 'mod-2', title: '学习陪伴', description: `${draft.name}陪伴学习`, signal: '专注' },
          { id: 'mod-3', title: '情绪支持', description: `${draft.name}提供情绪支持`, signal: '温暖' },
          { id: 'mod-4', title: '角色互动', description: `基于${draft.name}设定的互动`, signal: '个性化' },
        ],
        aiActions: ['daily-plan', 'task-breakdown', 'daily-review'],
        recommendedThemeId: 'minimal-premium',
      }

      const result = customPersonaService.createWithAudit(userId, input)

      if (!result.success) {
        setSubmitError(result.blockedReason || '审核未通过，请修改内容后重试')
        return
      }

      onCreate(result.data!)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateAvatar = async () => {
    if (!avatarGen || !selectedTemplate) return

    setIsGeneratingAvatar(true)
    setAvatarGenError('')
    setAiGeneratedAvatarUrl('')

    try {
      const result = await avatarGen.generate(selectedTemplate.id, userId, 'anime')

      if (result.success && result.avatarUrl) {
        setAiGeneratedAvatarUrl(result.avatarUrl)
        updateDraft('avatarSource', 'ai_generated')
        updateDraft('avatarAssetId', `ai-gen-${Date.now()}`)
        updateDraft('aiAvatarPrompt', result.prompt || '')
      } else {
        setAvatarGenError(result.error || 'AI 头像生成失败，请重试')
      }
    } catch (err) {
      setAvatarGenError(err instanceof Error ? err.message : 'AI 头像生成异常')
    } finally {
      setIsGeneratingAvatar(false)
    }
  }

  if (!canCreateCustom) {
    return (
      <div className="custom-persona-editor-backdrop" onClick={onClose} role="presentation">
        <div className="custom-persona-editor-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="权限不足">
          <header className="custom-persona-editor-header">
            <h3>创建自定义角色</h3>
            <button className="custom-persona-editor-close" onClick={onClose} type="button" aria-label="关闭">
              <X size={20} />
            </button>
          </header>
          <div className="custom-persona-editor-entitlement-block">
            <div className="custom-persona-editor-entitlement-icon">
              <Shield size={48} />
            </div>
            <h4>需要开通会员</h4>
            <p>自定义角色功能需要 Agent 会员或 PLUS 会员才能使用。</p>
            <ul>
              <li>Agent 会员：可创建 1 个自定义角色</li>
              <li>PLUS 会员：可创建 3 个自定义角色</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (existingCustomCount >= customSlotCount) {
    return (
      <div className="custom-persona-editor-backdrop" onClick={onClose} role="presentation">
        <div className="custom-persona-editor-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="槽位已满">
          <header className="custom-persona-editor-header">
            <h3>创建自定义角色</h3>
            <button className="custom-persona-editor-close" onClick={onClose} type="button" aria-label="关闭">
              <X size={20} />
            </button>
          </header>
          <div className="custom-persona-editor-entitlement-block">
            <div className="custom-persona-editor-entitlement-icon">
              <AlertTriangle size={48} />
            </div>
            <h4>槽位已满</h4>
            <p>
              你已有 {existingCustomCount} 个自定义角色，当前会员等级最多可创建 {customSlotCount} 个。
            </p>
            <p>请删除现有角色或升级会员以创建更多。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="custom-persona-editor-backdrop" onClick={onClose} role="presentation">
      <div className="custom-persona-editor-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="创建自定义角色">
        <header className="custom-persona-editor-header">
          <h3>创建自定义角色</h3>
          <button className="custom-persona-editor-close" onClick={onClose} type="button" aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        <div className="custom-persona-editor-progress">
          <div className="custom-persona-editor-progress-bar">
            <div
              className="custom-persona-editor-progress-fill"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <span>步骤 {step}/3</span>
        </div>

        <div className="custom-persona-editor-steps">
          <div className={`custom-persona-editor-step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <span className="custom-persona-editor-step-number">{step > 1 ? <Check size={14} /> : '1'}</span>
            <span className="custom-persona-editor-step-label">选模板</span>
          </div>
          <div className={`custom-persona-editor-step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`custom-persona-editor-step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
            <span className="custom-persona-editor-step-number">{step > 2 ? <Check size={14} /> : '2'}</span>
            <span className="custom-persona-editor-step-label">填设定</span>
          </div>
          <div className={`custom-persona-editor-step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`custom-persona-editor-step-indicator ${step >= 3 ? 'active' : ''}`}>
            <span className="custom-persona-editor-step-number">3</span>
            <span className="custom-persona-editor-step-label">预览创建</span>
          </div>
        </div>

        <div className="custom-persona-editor-content">
          {step === 1 && (
            <div className="custom-persona-editor-step-content">
              <h4>选择基础模板</h4>
              <p className="custom-persona-editor-step-desc">
                选择一个预设角色作为模板底座，自定义角色将继承其语气框架与安全围栏。
              </p>
              {validationErrors.baseTemplateId && (
                <div className="custom-persona-editor-error">{validationErrors.baseTemplateId}</div>
              )}
              <div className="custom-persona-editor-template-grid">
                {PRESET_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    className={`custom-persona-editor-template-card ${draft.baseTemplateId === persona.id ? 'selected' : ''}`}
                    onClick={() => updateDraft('baseTemplateId', persona.id)}
                    type="button"
                  >
                    <div className="custom-persona-editor-template-avatar">
                      {AVATAR_PRESETS.find((a) => a.id === `avatar-${persona.id.split('_')[0]}`)?.emoji || '🤖'}
                    </div>
                    <div className="custom-persona-editor-template-info">
                      <span className="custom-persona-editor-template-name">{persona.name}</span>
                      <span className="custom-persona-editor-template-desc">{persona.shortDescription}</span>
                      <span className="custom-persona-editor-template-tone">
                        {persona.tone.join(' · ')}
                      </span>
                    </div>
                    {draft.baseTemplateId === persona.id && (
                      <div className="custom-persona-editor-template-check">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="custom-persona-editor-step-content">
              <h4>填写角色设定</h4>
              <p className="custom-persona-editor-step-desc">
                基于「{selectedTemplate?.name}」模板，自定义你的专属角色。
              </p>

              <div className="custom-persona-editor-field">
                <label>
                  TA 的名字 <span className="custom-persona-editor-required">*</span>
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => {
                    updateDraft('name', e.target.value)
                    if (e.target.value) runSafetyCheck('name', e.target.value)
                  }}
                  placeholder="给你的角色起个名字"
                  maxLength={MAX_NAME_LENGTH}
                />
                {validationErrors.name && <span className="custom-persona-editor-field-error">{validationErrors.name}</span>}
                {safetyResults.name && !safetyResults.name.ok && (
                  <span className="custom-persona-editor-field-warning">
                    <AlertTriangle size={12} /> {safetyResults.name.reason}
                  </span>
                )}
              </div>

              <div className="custom-persona-editor-field">
                <label>
                  TA 怎么称呼你 <span className="custom-persona-editor-required">*</span>
                </label>
                <input
                  type="text"
                  value={draft.addressing}
                  onChange={(e) => {
                    updateDraft('addressing', e.target.value)
                    if (e.target.value) runSafetyCheck('addressing', e.target.value)
                  }}
                  placeholder="例如：小星、同学、宝贝"
                  maxLength={MAX_ADDRESSING_LENGTH}
                />
                {validationErrors.addressing && <span className="custom-persona-editor-field-error">{validationErrors.addressing}</span>}
                {safetyResults.addressing && !safetyResults.addressing.ok && (
                  <span className="custom-persona-editor-field-warning">
                    <AlertTriangle size={12} /> {safetyResults.addressing.reason}
                  </span>
                )}
              </div>

              <div className="custom-persona-editor-field">
                <label>
                  TA 的身份 <span className="custom-persona-editor-required">*</span>
                </label>
                <div className="custom-persona-editor-identity-grid">
                  {IDENTITY_ROLE_OPTIONS.map((role) => (
                    <button
                      key={role.value}
                      className={`custom-persona-editor-identity-card ${draft.identityRole === role.value ? 'selected' : ''}`}
                      onClick={() => {
                        updateDraft('identityRole', role.value)
                        runSafetyCheck('identityRole', role.value)
                      }}
                      type="button"
                    >
                      <span className="custom-persona-editor-identity-icon">{role.icon}</span>
                      <span className="custom-persona-editor-identity-label">{role.label}</span>
                    </button>
                  ))}
                </div>
                {validationErrors.identityRole && <span className="custom-persona-editor-field-error">{validationErrors.identityRole}</span>}
                {safetyResults.identityRole && !safetyResults.identityRole.ok && (
                  <span className="custom-persona-editor-field-warning">
                    <AlertTriangle size={12} /> {safetyResults.identityRole.reason}
                  </span>
                )}
              </div>

              <div className="custom-persona-editor-field">
                <label>
                  性格关键词 <span className="custom-persona-editor-required">*</span>
                  <span className="custom-persona-editor-hint">（选 {draft.toneKeywords.length}/{MAX_TONE_KEYWORDS} 个）</span>
                </label>
                <div className="custom-persona-editor-tone-grid">
                  {TONE_KEYWORD_OPTIONS.map((tone) => (
                    <button
                      key={tone.value}
                      className={`custom-persona-editor-tone-chip ${draft.toneKeywords.includes(tone.value) ? 'selected' : ''}`}
                      onClick={() => toggleToneKeyword(tone.value)}
                      type="button"
                      disabled={!draft.toneKeywords.includes(tone.value) && draft.toneKeywords.length >= MAX_TONE_KEYWORDS}
                    >
                      <span>{tone.emoji}</span>
                      <span>{tone.label}</span>
                    </button>
                  ))}
                </div>
                {validationErrors.toneKeywords && <span className="custom-persona-editor-field-error">{validationErrors.toneKeywords}</span>}
              </div>

              <div className="custom-persona-editor-field">
                <label>
                  <MessageCircle size={14} /> 口头禅
                  <span className="custom-persona-editor-hint">（选填，≤{MAX_CATCHPHRASE_LENGTH}字）</span>
                </label>
                <input
                  type="text"
                  value={draft.catchphrase}
                  onChange={(e) => {
                    updateDraft('catchphrase', e.target.value)
                    if (e.target.value) runSafetyCheck('catchphrase', e.target.value)
                  }}
                  placeholder="例如：加油哦～"
                  maxLength={MAX_CATCHPHRASE_LENGTH}
                />
                {validationErrors.catchphrase && <span className="custom-persona-editor-field-error">{validationErrors.catchphrase}</span>}
                {safetyResults.catchphrase && !safetyResults.catchphrase.ok && (
                  <span className="custom-persona-editor-field-warning">
                    <AlertTriangle size={12} /> {safetyResults.catchphrase.reason}
                  </span>
                )}
              </div>

              <div className="custom-persona-editor-field">
                <label>
                  背景故事
                  <span className="custom-persona-editor-hint">（选填，≤{MAX_BACKSTORY_LENGTH}字）</span>
                </label>
                <textarea
                  value={draft.backstory}
                  onChange={(e) => {
                    updateDraft('backstory', e.target.value)
                    if (e.target.value) runSafetyCheck('backstory', e.target.value)
                  }}
                  placeholder="简单描述 TA 的背景故事..."
                  rows={3}
                  maxLength={MAX_BACKSTORY_LENGTH}
                />
                {validationErrors.backstory && <span className="custom-persona-editor-field-error">{validationErrors.backstory}</span>}
                {safetyResults.backstory && !safetyResults.backstory.ok && (
                  <span className="custom-persona-editor-field-warning">
                    <AlertTriangle size={12} /> {safetyResults.backstory.reason}
                  </span>
                )}
              </div>

              <div className="custom-persona-editor-field">
                <label>
                  <Ban size={14} /> TA 不聊什么
                  <span className="custom-persona-editor-hint">（选填）</span>
                </label>
                <input
                  type="text"
                  value={draft.forbiddenTopics.join('、')}
                  onChange={(e) => {
                    const topics = e.target.value
                      .split(/[、,，]/)
                      .map((t) => t.trim())
                      .filter(Boolean)
                    updateDraft('forbiddenTopics', topics)
                  }}
                  placeholder="例如：政治、暴力、色情"
                />
              </div>

              <div className="custom-persona-editor-field">
                <label>
                  <Image size={14} /> 头像 <span className="custom-persona-editor-required">*</span>
                </label>
                <div className="custom-persona-editor-avatar-grid">
                  {AVATAR_PRESETS.map((avatar) => (
                    <button
                      key={avatar.id}
                      className={`custom-persona-editor-avatar-card ${draft.avatarAssetId === avatar.id ? 'selected' : ''}`}
                      onClick={() => {
                        updateDraft('avatarAssetId', avatar.id)
                        updateDraft('avatarSource', 'preset')
                        setAiGeneratedAvatarUrl('')
                      }}
                      type="button"
                    >
                      <span className="custom-persona-editor-avatar-emoji">{avatar.emoji}</span>
                      <span className="custom-persona-editor-avatar-label">{avatar.label}</span>
                    </button>
                  ))}
                  {avatarGen && (
                    <button
                      className={`custom-persona-editor-avatar-card custom-persona-editor-avatar-ai ${draft.avatarSource === 'ai_generated' ? 'selected' : ''}`}
                      onClick={handleGenerateAvatar}
                      disabled={isGeneratingAvatar}
                      type="button"
                    >
                      {isGeneratingAvatar ? (
                        <Loader2 size={24} className="custom-persona-editor-avatar-spinner" />
                      ) : aiGeneratedAvatarUrl ? (
                        <img src={aiGeneratedAvatarUrl} alt="AI生成头像" className="custom-persona-editor-avatar-ai-img" loading="lazy" />
                      ) : (
                        <Wand2 size={24} />
                      )}
                      <span className="custom-persona-editor-avatar-label">
                        {isGeneratingAvatar ? '生成中...' : aiGeneratedAvatarUrl ? 'AI 头像' : 'AI 生成'}
                      </span>
                    </button>
                  )}
                </div>
                {avatarGenError && <span className="custom-persona-editor-field-error">{avatarGenError}</span>}
                {validationErrors.avatarAssetId && <span className="custom-persona-editor-field-error">{validationErrors.avatarAssetId}</span>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="custom-persona-editor-step-content">
              <h4>预览与确认</h4>
              <p className="custom-persona-editor-step-desc">
                以下是 AI 根据你的设定生成的系统提示预览，确认无误后即可创建。
              </p>

              <div className="custom-persona-editor-preview-card">
                <div className="custom-persona-editor-preview-header">
                  <div className="custom-persona-editor-preview-avatar">
                    {AVATAR_PRESETS.find((a) => a.id === draft.avatarAssetId)?.emoji || '🤖'}
                  </div>
                  <div className="custom-persona-editor-preview-meta">
                    <h5>{draft.name || '未命名角色'}</h5>
                    <span>{IDENTITY_ROLE_OPTIONS.find((r) => r.value === draft.identityRole)?.label}</span>
                  </div>
                </div>

                <div className="custom-persona-editor-preview-tags">
                  {draft.toneKeywords.map((k) => {
                    const tone = TONE_KEYWORD_OPTIONS.find((t) => t.value === k)
                    return (
                      <span key={k} className="custom-persona-editor-preview-tag">
                        {tone?.emoji} {tone?.label}
                      </span>
                    )
                  })}
                </div>

                {draft.catchphrase && (
                  <div className="custom-persona-editor-preview-field">
                    <span className="custom-persona-editor-preview-label">口头禅</span>
                    <span>「{draft.catchphrase}」</span>
                  </div>
                )}

                {draft.backstory && (
                  <div className="custom-persona-editor-preview-field">
                    <span className="custom-persona-editor-preview-label">背景故事</span>
                    <span>{draft.backstory}</span>
                  </div>
                )}

                {draft.forbiddenTopics.length > 0 && (
                  <div className="custom-persona-editor-preview-field">
                    <span className="custom-persona-editor-preview-label">禁忌话题</span>
                    <span>{draft.forbiddenTopics.join('、')}</span>
                  </div>
                )}

                <div className="custom-persona-editor-preview-field">
                  <span className="custom-persona-editor-preview-label">称呼你为</span>
                  <span>「{draft.addressing}」</span>
                </div>
              </div>

              <div className="custom-persona-editor-preview-system">
                <div className="custom-persona-editor-preview-system-header">
                  <Sparkles size={16} />
                  <span>AI 生成的系统提示预览</span>
                </div>
                <pre className="custom-persona-editor-preview-system-content">{systemPromptPreview}</pre>
              </div>

              <div className="custom-persona-editor-safety-summary">
                <div className="custom-persona-editor-safety-summary-header">
                  <Shield size={16} />
                  <span>安全审核摘要</span>
                </div>
                <div className="custom-persona-editor-safety-checks">
                  {Object.entries(safetyResults).map(([field, result]) => (
                    <div key={field} className={`custom-persona-editor-safety-check ${result.ok ? 'pass' : 'fail'}`}>
                      {result.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
                      <span className="custom-persona-editor-safety-check-field">{field}</span>
                      <span className="custom-persona-editor-safety-check-status">
                        {result.ok ? '通过' : result.reason || '未通过'}
                      </span>
                    </div>
                  ))}
                  {Object.keys(safetyResults).length === 0 && (
                    <span className="custom-persona-editor-safety-check-empty">所有字段均已通过安全审核</span>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="custom-persona-editor-error" style={{ marginTop: 16 }}>
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="custom-persona-editor-actions">
          {step > 1 && (
            <button
              className="custom-persona-editor-btn secondary"
              onClick={() => setStep(step - 1)}
              type="button"
            >
              <ChevronLeft size={16} />
              上一步
            </button>
          )}
          {step === 1 && (
            <button
              className="custom-persona-editor-btn primary"
              onClick={handleStep1Next}
              disabled={!validateDraftStep1(draft)}
              type="button"
            >
              下一步
              <ChevronRight size={16} />
            </button>
          )}
          {step === 2 && (
            <button
              className="custom-persona-editor-btn primary"
              onClick={handleStep2Next}
              disabled={!validateDraftStep2(draft)}
              type="button"
            >
              预览
              <ChevronRight size={16} />
            </button>
          )}
          {step === 3 && (
            <button
              className="custom-persona-editor-btn primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? (
                <>创建中...</>
              ) : (
                <>
                  <Sparkles size={16} />
                  创建角色
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
