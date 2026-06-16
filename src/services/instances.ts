import { createEntitlementService } from '../entitlement/entitlementService'
import { createAiQuotaProvider } from '../entitlement/aiQuotaProvider'
import { createOrderService } from '../entitlement/orderService'
import { createNotificationService } from '../notifications/notificationService'
import { createCameoTriggerEngine } from '../personas/cameoTriggerEngine'
import { createPersonaScheduleStorage } from '../personas/personaScheduleStore'
import { createPersonaScheduler, PRESET_PERSONAS } from '../personas/personaScheduler'
import { createSafetyIncidentLog } from '../personas/safetyIncidentLog'
import { createPersonaSafetyGate } from '../personas/personaSafetyGate'
import { createRelationshipHealthMonitor } from '../personas/relationshipHealthMonitor'
import { createAvatarAiGenQuotaProvider } from '../entitlement/avatarAiGenProvider'
import { createPersonaAvatarGen } from '../personas/personaAvatarGen'
import { avatarAIProvider } from '../avatar'
import { createCommunityPersonaService } from '../personas/community/communityPersonaService'
import { addCustomPersona, loadCustomPersonas } from '../personas/customPersona'
import { createPersonaProvider } from '../entitlement/personaProvider'
import { createCustomPersonaService } from '../personas/customPersonaService'

export const entitlementService = createEntitlementService()
export const aiQuotaProvider = createAiQuotaProvider(entitlementService)
export const orderService = createOrderService()
export const notificationService = createNotificationService()
export const cameoEngine = createCameoTriggerEngine()
export const personaScheduleStorage = createPersonaScheduleStorage()
export const personaScheduler = createPersonaScheduler(personaScheduleStorage, entitlementService, cameoEngine)
export const safetyIncidentLog = createSafetyIncidentLog()
export const personaSafetyGate = createPersonaSafetyGate(safetyIncidentLog)
export const relationshipHealthMonitor = createRelationshipHealthMonitor(safetyIncidentLog, personaScheduleStorage, personaScheduler)
export const avatarGenQuotaProvider = createAvatarAiGenQuotaProvider(entitlementService)
export const personaAvatarGen = createPersonaAvatarGen({
  quotaProvider: avatarGenQuotaProvider,
  aiProvider: avatarAIProvider,
  getPersonaById: (id) => PRESET_PERSONAS.find((p) => p.id === id)
})
export const communityPersonaService = createCommunityPersonaService({
  safetyGate: personaSafetyGate,
  getCustomPersonaById: (id) => loadCustomPersonas().find((p) => p.id === id),
  getCustomPersonasByUser: (userId) => loadCustomPersonas().filter((p) => p.creatorUserId === userId),
  addCustomPersona: (input) => addCustomPersona(input)
})
export const personaProvider = createPersonaProvider(entitlementService)
export const customPersonaService = createCustomPersonaService({
  safetyGate: personaSafetyGate,
  incidentLog: safetyIncidentLog
})
