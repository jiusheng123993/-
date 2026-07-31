/**
 * 宠物虚拟形象模块统一导出入口
 * 集中导出表情引擎、SVG 渲染器、日记引擎和 AI 生成适配器
 */
export {
  calculateExpression,
  getExpressionForFoodResult,
  getExpressionForSymptomResult,
  getExpressionForVaccineDue,
  EXPRESSION_MAP,
  type ExpressionConfig,
  type ExpressionContext,
  type PetExpression
} from './expressionEngine'

export {
  buildSvgFace,
  svgToDataUri,
  getPetFaceDataUri,
  type SvgPetFace
} from './svgRenderer'

export {
  generateDiaryEntry,
  generateDiaryForToday,
  type DiaryEntry
} from './diaryEngine'

export {
  SeedreamAdapter,
  seedreamAdapter,
  type SeedreamGenerateParams,
  type SeedreamGenerateResult,
  type PetImageParams,
} from './seedreamAdapter'
