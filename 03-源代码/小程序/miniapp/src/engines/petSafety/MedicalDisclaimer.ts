import type { UrgencyLevel } from './PetSafetyHandler';
import type { FoodSafetyLevel } from './ToxicFoodFilter';
import type { HealthRiskLevel } from '../../memory-body/types/memoryBodyTypes';

export interface DisclaimerConfig {
  position: 'prefix' | 'suffix' | 'standalone';
  urgencyLevel: UrgencyLevel;
}

const GENERAL_DISCLAIMER = '本建议仅供参考，不替代专业兽医诊断。如有疑虑请及时就医。';
const EMERGENCY_DISCLAIMER = '⚠️ 检测到紧急情况！请立即联系兽医或前往最近的宠物医院。本评估不替代专业诊断。';
const TOXIC_FOOD_DISCLAIMER = '⚠️ 该食物对宠物有严重危害！请立即联系兽医。误食请拨打宠物急救电话。';
const DANGEROUS_FOOD_DISCLAIMER = '该食物对宠物有风险，建议避免喂食。如已食用请密切观察，出现异常立即就医。';
const CAUTION_FOOD_DISCLAIMER = '该食物需谨慎喂食，注意控制量和频率。首次喂食请少量尝试，观察是否有不良反应。';
const SAFE_FOOD_DISCLAIMER = '该食物通常安全，但每只宠物体质不同，首次喂食请少量尝试。';
const SYMPTOM_RED_DISCLAIMER = '⚠️ 检测到严重症状信号！请立即带宠物前往急诊医院，不要等待观察。本评估不替代专业诊断。';
const SYMPTOM_ORANGE_DISCLAIMER = '⚠️ 建议尽快就医（24小时内）。持续观察期间如症状加重，请立即急诊。本评估不替代专业诊断。';
const SYMPTOM_YELLOW_DISCLAIMER = '建议持续观察，如症状持续或加重请及时就医。本评估不替代专业诊断。';
const SYMPTOM_GREEN_DISCLAIMER = GENERAL_DISCLAIMER;
const CHECKIN_ANOMALY_DISCLAIMER = '检测到健康指标异常，建议持续关注。如持续异常请及时就医。本评估不替代专业诊断。';
const CHECKIN_NORMAL_DISCLAIMER = GENERAL_DISCLAIMER;

const FOOD_SAFETY_TO_HEALTH_RISK: Record<FoodSafetyLevel, HealthRiskLevel> = {
  toxic: 'emergency',
  dangerous: 'high',
  caution: 'medium',
  safe: 'low',
};

export function mapFoodSafetyToHealthRisk(level: FoodSafetyLevel): HealthRiskLevel {
  return FOOD_SAFETY_TO_HEALTH_RISK[level];
}

const HEALTH_RISK_DISCLAIMER_MAP: Record<HealthRiskLevel, string> = {
  emergency: TOXIC_FOOD_DISCLAIMER,
  high: DANGEROUS_FOOD_DISCLAIMER,
  medium: CAUTION_FOOD_DISCLAIMER,
  low: SAFE_FOOD_DISCLAIMER,
};

export class MedicalDisclaimer {
  getDisclaimer(urgency: UrgencyLevel, context: 'food' | 'symptom' | 'checkin'): string {
    switch (context) {
      case 'food':
        return this.getFoodDisclaimerByUrgency(urgency);
      case 'symptom':
        return this.getSymptomDisclaimer(urgency);
      case 'checkin':
        return this.getCheckinDisclaimer(urgency !== 'green');
      default:
        return GENERAL_DISCLAIMER;
    }
  }

  getEmergencyDisclaimer(): string {
    return EMERGENCY_DISCLAIMER;
  }

  getFoodDisclaimer(safetyLevel: FoodSafetyLevel): string {
    switch (safetyLevel) {
      case 'toxic':
        return TOXIC_FOOD_DISCLAIMER;
      case 'dangerous':
        return DANGEROUS_FOOD_DISCLAIMER;
      case 'caution':
        return CAUTION_FOOD_DISCLAIMER;
      case 'safe':
        return SAFE_FOOD_DISCLAIMER;
      default:
        return CAUTION_FOOD_DISCLAIMER;
    }
  }

  getFoodDisclaimerByHealthRisk(riskLevel: HealthRiskLevel): string {
    return HEALTH_RISK_DISCLAIMER_MAP[riskLevel];
  }

  getSymptomDisclaimer(urgency: UrgencyLevel): string {
    switch (urgency) {
      case 'red':
        return SYMPTOM_RED_DISCLAIMER;
      case 'orange':
        return SYMPTOM_ORANGE_DISCLAIMER;
      case 'yellow':
        return SYMPTOM_YELLOW_DISCLAIMER;
      case 'green':
        return SYMPTOM_GREEN_DISCLAIMER;
      default:
        return GENERAL_DISCLAIMER;
    }
  }

  getCheckinDisclaimer(hasAnomaly: boolean): string {
    return hasAnomaly ? CHECKIN_ANOMALY_DISCLAIMER : CHECKIN_NORMAL_DISCLAIMER;
  }

  private getFoodDisclaimerByUrgency(urgency: UrgencyLevel): string {
    switch (urgency) {
      case 'red':
        return TOXIC_FOOD_DISCLAIMER;
      case 'orange':
        return DANGEROUS_FOOD_DISCLAIMER;
      case 'yellow':
        return CAUTION_FOOD_DISCLAIMER;
      case 'green':
        return SAFE_FOOD_DISCLAIMER;
      default:
        return GENERAL_DISCLAIMER;
    }
  }
}
