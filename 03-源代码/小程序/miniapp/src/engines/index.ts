/**
 * 宠物健康引擎模块统一导出入口
 * 集中导出宠物安全处理、情绪检测、表情计算和日记生成等核心引擎
 */
export { PetSafetyHandler } from '../engines/petSafety/PetSafetyHandler'
export { ToxicFoodFilter } from '../engines/petSafety/ToxicFoodFilter'
export { MedicalDisclaimer } from '../engines/petSafety/MedicalDisclaimer'
export {
  calculateExpression,
  getExpressionForFoodResult,
  getExpressionForSymptomResult,
  getExpressionForVaccineDue,
  EXPRESSION_MAP,
  buildSvgFace,
  svgToDataUri,
  getPetFaceDataUri,
  generateDiaryEntry,
  generateDiaryForToday,
  type ExpressionConfig,
  type ExpressionContext,
  type PetExpression,
  type SvgPetFace,
  type DiaryEntry
} from '../engines/petAvatar'

export {
  evaluateTrigger,
  detectGriefStage,
  getGriefResponse,
  getGriefOpening,
  getGriefClosing,
  getGriefFollowUp,
  detectSickAnxiety,
  getSickAnxietyMessage,
  detectNewOwnerAnxiety,
  getNewOwnerAnxietyMessage,
  shouldTriggerEmotionIntervention,
  createIntervention,
  getDisclaimer,
  type GriefStage,
  type EmotionSceneType,
  type AnxietyLevel,
  type SickAnxietyContext,
  type NewOwnerAnxietyContext,
  type EmotionIntervention,
} from '../engines/emotion'
