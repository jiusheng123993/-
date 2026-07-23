import { ToxicFoodFilter, type FoodSafetyItem, type FoodSafetyLevel } from './ToxicFoodFilter';
import { MedicalDisclaimer } from './MedicalDisclaimer';
import type { HealthRiskLevel } from '../../memory-body/types/memoryBodyTypes';

export type UrgencyLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface FoodCheckData {
  foodName: string;
}

export interface SymptomCheckData {
  symptoms: string[];
  duration?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface CheckinCheckData {
  poopLevel: number;
  appetiteLevel: number;
  spiritLevel: number;
  hasAnomaly: boolean;
  anomalyItems?: string[];
}

export interface SafetyCheckInput {
  type: 'food' | 'symptom' | 'checkin';
  data: FoodCheckData | SymptomCheckData | CheckinCheckData;
  petSpecies: 'dog' | 'cat';
  petBreed?: string;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  urgencyLevel: UrgencyLevel;
  blocked: boolean;
  blockReason?: string;
  warnings: string[];
  disclaimer: string;
  requiresVetVisit: boolean;
  emergencyActions: string[];
  data: Record<string, unknown>;
}

const RED_SYMPTOM_KEYWORDS = ['血便', '抽搐', '呼吸困难', '误食毒物', '昏迷', '癫痫', '休克', '瞳孔放大', '牙龈苍白'];
const ORANGE_SYMPTOM_KEYWORDS = ['持续呕吐', '不吃三天', '多次呕吐', '严重腹泻', '无法站立', '明显疼痛'];
const YELLOW_SYMPTOM_KEYWORDS = ['呕吐', '腹泻', '精神差', '不吃', '咳嗽', '打喷嚏', '皮肤问题', '跛行', '眼鼻分泌物', '排尿异常'];
const COMBO_RED_TRIGGERS: Array<{ symptoms: string[]; description: string }> = [
  { symptoms: ['不吃', '萎靡'], description: '持续不吃+萎靡' },
  { symptoms: ['呕吐', '腹泻', '精神差'], description: '呕吐+腹泻+精神差' },
  { symptoms: ['不吃', '呕吐'], description: '不吃+呕吐' },
];

export function mapFoodSafetyLevelToHealthRisk(level: FoodSafetyLevel): HealthRiskLevel {
  switch (level) {
    case 'toxic':
      return 'emergency';
    case 'dangerous':
      return 'high';
    case 'caution':
      return 'medium';
    case 'safe':
      return 'low';
  }
}

export class PetSafetyHandler {
  private toxicFoodFilter: ToxicFoodFilter;
  private medicalDisclaimer: MedicalDisclaimer;

  constructor(foodData?: FoodSafetyItem[]) {
    this.toxicFoodFilter = new ToxicFoodFilter(foodData);
    this.medicalDisclaimer = new MedicalDisclaimer();
  }

  check(input: SafetyCheckInput): SafetyCheckResult {
    switch (input.type) {
      case 'food':
        return this.checkFoodInput(input);
      case 'symptom':
        return this.checkSymptomInput(input);
      case 'checkin':
        return this.checkCheckinInput(input);
      default:
        return this.createUnknownResult();
    }
  }

  checkFood(foodName: string, species: 'dog' | 'cat', breed?: string): SafetyCheckResult {
    const filterResult = this.toxicFoodFilter.filter(foodName, species, breed);
    const urgencyLevel = this.foodSafetyToUrgency(filterResult.safetyLevel);
    const blocked = filterResult.safetyLevel === 'toxic';
    const warnings: string[] = [];

    if (filterResult.speciesWarning) {
      warnings.push(filterResult.speciesWarning);
    }
    if (filterResult.breedWarnings.length > 0) {
      warnings.push(...filterResult.breedWarnings);
    }
    
    // 品种特殊禁忌详细警告
    if (filterResult.breedWarningDetails.length > 0) {
      for (const bw of filterResult.breedWarningDetails) {
        warnings.push(`【${bw.breedName}特殊注意】${bw.reason}`);
      }
    }
    
    if (filterResult.matchedItem && filterResult.matchedItem.symptoms.length > 0) {
      warnings.push(`可能症状：${filterResult.matchedItem.symptoms.join('、')}`);
    }
    if (filterResult.matchedItem && filterResult.matchedItem.dangerousCompounds.length > 0) {
      warnings.push(`危险成分：${filterResult.matchedItem.dangerousCompounds.join('、')}`);
    }

    const disclaimer = this.medicalDisclaimer.getFoodDisclaimer(filterResult.safetyLevel);
    const emergencyActions = this.generateEmergencyActions(urgencyLevel, 'food');

    return {
      isSafe: filterResult.safetyLevel === 'safe',
      urgencyLevel,
      blocked,
      blockReason: blocked ? `${foodName}对${species === 'cat' ? '猫' : '狗'}有毒，禁止喂食` : undefined,
      warnings,
      disclaimer,
      requiresVetVisit: urgencyLevel === 'red' || urgencyLevel === 'orange',
      emergencyActions,
      data: {
        foodName,
        safetyLevel: filterResult.safetyLevel,
        matchedItem: filterResult.matchedItem?.id,
        species,
        breed,
        breedWarningDetails: filterResult.breedWarningDetails,
      },
    };
  }

  checkSymptoms(symptoms: string[], species: 'dog' | 'cat', duration?: string): SafetyCheckResult {
    const urgencyLevel = this.evaluateSymptomUrgency(symptoms, duration);
    const blocked = urgencyLevel === 'red';
    const warnings: string[] = [];

    if (urgencyLevel === 'red') {
      warnings.push('检测到严重症状，请立即就医');
    } else if (urgencyLevel === 'orange') {
      warnings.push('症状较严重，建议24小时内就医');
    } else if (urgencyLevel === 'yellow') {
      warnings.push('建议持续观察，如症状持续或加重请就医');
    }

    const disclaimer = this.medicalDisclaimer.getSymptomDisclaimer(urgencyLevel);
    const emergencyActions = this.generateEmergencyActions(urgencyLevel, 'symptom');

    return {
      isSafe: urgencyLevel === 'green',
      urgencyLevel,
      blocked,
      blockReason: blocked ? '检测到严重症状，必须立即就医' : undefined,
      warnings,
      disclaimer,
      requiresVetVisit: urgencyLevel === 'red' || urgencyLevel === 'orange',
      emergencyActions,
      data: {
        symptoms,
        duration,
        species,
      },
    };
  }

  checkCheckin(data: CheckinCheckData, species: 'dog' | 'cat'): SafetyCheckResult {
    const urgencyLevel = this.evaluateCheckinUrgency(data);
    const blocked = urgencyLevel === 'red';
    const warnings: string[] = [];

    if (data.poopLevel === 1) {
      warnings.push('便便异常严重（血便/黑便），需立即就医');
    }
    if (data.appetiteLevel === 1 && data.spiritLevel === 1) {
      warnings.push('不吃+萎靡组合出现，需立即就医');
    }
    if (data.appetiteLevel <= 2 && data.spiritLevel <= 2) {
      warnings.push('食欲和精神同时下降，需密切关注');
    }
    if (data.hasAnomaly && data.anomalyItems && data.anomalyItems.length > 0) {
      warnings.push(`异常项：${data.anomalyItems.join('、')}`);
    }

    const disclaimer = this.medicalDisclaimer.getCheckinDisclaimer(urgencyLevel !== 'green');
    const emergencyActions = this.generateEmergencyActions(urgencyLevel, 'checkin');

    return {
      isSafe: urgencyLevel === 'green',
      urgencyLevel,
      blocked,
      blockReason: blocked ? '健康打卡数据出现严重异常' : undefined,
      warnings,
      disclaimer,
      requiresVetVisit: urgencyLevel === 'red' || urgencyLevel === 'orange',
      emergencyActions,
      data: {
        poopLevel: data.poopLevel,
        appetiteLevel: data.appetiteLevel,
        spiritLevel: data.spiritLevel,
        hasAnomaly: data.hasAnomaly,
        species,
      },
    };
  }

  private evaluateUrgency(input: SafetyCheckInput): UrgencyLevel {
    switch (input.type) {
      case 'food': {
        const foodData = input.data as FoodCheckData;
        const filterResult = this.toxicFoodFilter.filter(foodData.foodName, input.petSpecies, input.petBreed);
        return this.foodSafetyToUrgency(filterResult.safetyLevel);
      }
      case 'symptom': {
        const symptomData = input.data as SymptomCheckData;
        return this.evaluateSymptomUrgency(symptomData.symptoms, symptomData.duration);
      }
      case 'checkin': {
        const checkinData = input.data as CheckinCheckData;
        return this.evaluateCheckinUrgency(checkinData);
      }
      default:
        return 'yellow';
    }
  }

  private evaluateSymptomUrgency(symptoms: string[], duration?: string): UrgencyLevel {
    for (const redKeyword of RED_SYMPTOM_KEYWORDS) {
      if (symptoms.some(s => s.includes(redKeyword) || redKeyword.includes(s))) {
        return 'red';
      }
    }

    for (const combo of COMBO_RED_TRIGGERS) {
      const allPresent = combo.symptoms.every(cs =>
        symptoms.some(s => s.includes(cs) || cs.includes(s))
      );
      if (allPresent) return 'red';
    }

    if (symptoms.some(s => s.includes('不吃') || s.includes('拒食')) && duration === '3天以上') {
      return 'red';
    }

    for (const orangeKeyword of ORANGE_SYMPTOM_KEYWORDS) {
      if (symptoms.some(s => s.includes(orangeKeyword) || orangeKeyword.includes(s))) {
        return 'orange';
      }
    }

    if (symptoms.length >= 3) return 'orange';

    if (symptoms.length >= 2 && (duration === '3天以上' || duration === '1-2天')) return 'orange';

    for (const yellowKeyword of YELLOW_SYMPTOM_KEYWORDS) {
      if (symptoms.some(s => s.includes(yellowKeyword) || yellowKeyword.includes(s))) {
        return 'yellow';
      }
    }

    if (symptoms.length >= 2) return 'yellow';

    return 'green';
  }

  private evaluateCheckinUrgency(data: CheckinCheckData): UrgencyLevel {
    if (data.poopLevel === 1) return 'red';
    if (data.appetiteLevel === 1 && data.spiritLevel === 1) return 'red';

    const criticalCount = [data.poopLevel <= 2, data.appetiteLevel <= 2, data.spiritLevel <= 2].filter(Boolean).length;
    if (criticalCount >= 3) return 'red';

    if (data.appetiteLevel <= 2 && data.spiritLevel <= 2) return 'orange';

    const anomalyCount = [data.poopLevel <= 2, data.appetiteLevel <= 2, data.spiritLevel <= 2].filter(Boolean).length;
    if (anomalyCount >= 2) return 'orange';

    if (data.hasAnomaly) return 'yellow';
    if (anomalyCount >= 1) return 'yellow';

    return 'green';
  }

  private generateEmergencyActions(urgency: UrgencyLevel, context: string): string[] {
    const actions: string[] = [];

    if (urgency === 'red') {
      actions.push('立即联系兽医或前往最近的宠物急诊医院');
      actions.push('不要自行用药或等待观察');
      if (context === 'food') {
        actions.push('告知兽医误食的食物名称和大概量');
        actions.push('保留食物包装以便兽医判断');
      }
      if (context === 'symptom' || context === 'checkin') {
        actions.push('记录症状出现时间和变化情况');
        actions.push('如有可能，拍摄症状视频供兽医参考');
      }
      return actions;
    }

    if (urgency === 'orange') {
      actions.push('24小时内带宠物就医');
      actions.push('密切观察症状变化，如加重立即急诊');
      if (context === 'food') {
        actions.push('停止喂食该食物');
        actions.push('观察是否出现呕吐、腹泻等症状');
      }
      if (context === 'symptom' || context === 'checkin') {
        actions.push('记录症状变化，就医时提供给兽医');
      }
      return actions;
    }

    if (urgency === 'yellow') {
      actions.push('持续观察，记录症状变化');
      if (context === 'food') {
        actions.push('首次喂食少量尝试，观察24小时');
      }
      if (context === 'symptom' || context === 'checkin') {
        actions.push('如持续2天以上或加重，建议就医');
      }
      return actions;
    }

    actions.push('保持日常观察和打卡习惯');
    return actions;
  }

  private shouldBlock(urgency: UrgencyLevel): boolean {
    return urgency === 'red';
  }

  private foodSafetyToUrgency(safetyLevel: FoodSafetyLevel): UrgencyLevel {
    switch (safetyLevel) {
      case 'toxic':
        return 'red';
      case 'dangerous':
        return 'orange';
      case 'caution':
        return 'yellow';
      case 'safe':
        return 'green';
      default:
        return 'yellow';
    }
  }

  private checkFoodInput(input: SafetyCheckInput): SafetyCheckResult {
    const foodData = input.data as FoodCheckData;
    return this.checkFood(foodData.foodName, input.petSpecies, input.petBreed);
  }

  private checkSymptomInput(input: SafetyCheckInput): SafetyCheckResult {
    const symptomData = input.data as SymptomCheckData;
    return this.checkSymptoms(symptomData.symptoms, input.petSpecies, symptomData.duration);
  }

  private checkCheckinInput(input: SafetyCheckInput): SafetyCheckResult {
    const checkinData = input.data as CheckinCheckData;
    return this.checkCheckin(checkinData, input.petSpecies);
  }

  private createUnknownResult(): SafetyCheckResult {
    return {
      isSafe: false,
      urgencyLevel: 'yellow',
      blocked: false,
      warnings: ['未知的检查类型，请谨慎对待'],
      disclaimer: this.medicalDisclaimer.getDisclaimer('yellow', 'food'),
      requiresVetVisit: false,
      emergencyActions: ['如有疑虑请咨询兽医'],
      data: {},
    };
  }
}
