import { ToxicFoodFilter, type FoodSafetyItem, type FoodSafetyLevel } from './ToxicFoodFilter';
import { MedicalDisclaimer } from './MedicalDisclaimer';

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

const DEFAULT_FOOD_DATA: FoodSafetyItem[] = [
  {
    id: 'chocolate',
    name: '巧克力',
    aliases: ['朱古力', '可可', 'cocoa', 'chocolate'],
    safetyLevel: 'toxic',
    speciesSafety: {},
    dangerousCompounds: ['可可碱', '咖啡因'],
    symptoms: ['呕吐', '腹泻', '心跳加速', '抽搐'],
    breedWarnings: [],
    description: '巧克力含有可可碱和咖啡因，对猫狗均有毒，可导致中毒甚至死亡',
  },
  {
    id: 'grape',
    name: '葡萄',
    aliases: ['葡萄干', 'raisin', 'grape', '提子'],
    safetyLevel: 'toxic',
    speciesSafety: { dog: 'toxic', cat: 'dangerous' },
    dangerousCompounds: ['未知毒素'],
    symptoms: ['肾衰竭', '呕吐', '腹泻'],
    breedWarnings: [],
    description: '葡萄和葡萄干可导致犬类急性肾衰竭，猫的风险略低但仍需避免',
  },
  {
    id: 'onion',
    name: '洋葱',
    aliases: ['大葱', '小葱', '韭菜', 'onion', 'garlic', '大蒜'],
    safetyLevel: 'toxic',
    speciesSafety: {},
    dangerousCompounds: ['正丙基二硫化物', '大蒜素'],
    symptoms: ['溶血性贫血', '血红蛋白尿', '虚弱'],
    breedWarnings: [],
    description: '葱蒜类含硫化物可破坏红细胞导致溶血性贫血，对猫狗均有毒',
  },
  {
    id: 'xylitol',
    name: '木糖醇',
    aliases: ['xylitol', '无糖口香糖', '无糖食品'],
    safetyLevel: 'toxic',
    speciesSafety: { dog: 'toxic' },
    dangerousCompounds: ['木糖醇'],
    symptoms: ['低血糖', '肝衰竭', '呕吐', '抽搐'],
    breedWarnings: [],
    description: '木糖醇对犬类极度危险，可导致低血糖和肝衰竭',
  },
  {
    id: 'avocado',
    name: '牛油果',
    aliases: ['鳄梨', 'avocado'],
    safetyLevel: 'dangerous',
    speciesSafety: { dog: 'caution', cat: 'dangerous' },
    dangerousCompounds: ['persin'],
    symptoms: ['呕吐', '腹泻', '呼吸困难', '心脏问题'],
    breedWarnings: [],
    description: '牛油果含persin毒素，对鸟类致命，对猫风险较高，狗相对耐受但仍需注意',
  },
  {
    id: 'milk',
    name: '牛奶',
    aliases: ['milk', '鲜奶'],
    safetyLevel: 'caution',
    speciesSafety: {},
    dangerousCompounds: [],
    symptoms: ['腹泻', '胀气', '消化不良'],
    breedWarnings: [],
    description: '多数成年猫狗乳糖不耐受，可能导致腹泻和消化不良',
  },
  {
    id: 'bone',
    name: '骨头',
    aliases: ['鸡骨', '鱼骨', 'bone'],
    safetyLevel: 'dangerous',
    speciesSafety: {},
    dangerousCompounds: [],
    symptoms: ['消化道穿孔', '梗阻', '口腔损伤'],
    breedWarnings: [],
    description: '煮熟的骨头易碎裂，可能刺穿消化道或造成梗阻',
  },
  {
    id: 'chicken_breast',
    name: '鸡胸肉',
    aliases: ['鸡肉', 'chicken'],
    safetyLevel: 'safe',
    speciesSafety: {},
    dangerousCompounds: [],
    symptoms: [],
    breedWarnings: [],
    description: '煮熟无调料的鸡胸肉是安全的蛋白质来源',
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    aliases: ['carrot', '红萝卜'],
    safetyLevel: 'safe',
    speciesSafety: {},
    dangerousCompounds: [],
    symptoms: [],
    breedWarnings: [],
    description: '胡萝卜是安全的蔬菜，富含维生素A',
  },
  {
    id: 'lily',
    name: '百合',
    aliases: ['百合花', 'lily', '郁金香', '水仙'],
    safetyLevel: 'toxic',
    speciesSafety: { cat: 'toxic', dog: 'caution' },
    dangerousCompounds: ['百合毒素'],
    symptoms: ['肾衰竭', '呕吐', '食欲下降'],
    breedWarnings: [],
    description: '百合对猫极度危险，所有部位均有毒，可导致急性肾衰竭',
  },
  {
    id: 'macadamia',
    name: '夏威夷果',
    aliases: ['澳洲坚果', 'macadamia'],
    safetyLevel: 'dangerous',
    speciesSafety: { dog: 'dangerous' },
    dangerousCompounds: ['未知毒素'],
    symptoms: ['虚弱', '呕吐', '震颤', '发热'],
    breedWarnings: [],
    description: '夏威夷果对犬类有毒，可导致神经症状和发热',
  },
  {
    id: 'alcohol',
    name: '酒精',
    aliases: ['酒', '啤酒', '白酒', 'alcohol', 'wine', 'beer'],
    safetyLevel: 'toxic',
    speciesSafety: {},
    dangerousCompounds: ['乙醇'],
    symptoms: ['中毒', '昏迷', '呼吸抑制', '死亡'],
    breedWarnings: [],
    description: '酒精对猫狗有剧毒，极少量即可导致中毒',
  },
  {
    id: 'caffeine',
    name: '咖啡因',
    aliases: ['咖啡', '茶', '能量饮料', 'coffee', 'tea', 'caffeine'],
    safetyLevel: 'dangerous',
    speciesSafety: {},
    dangerousCompounds: ['咖啡因'],
    symptoms: ['心跳加速', '焦躁', '震颤', '呕吐'],
    breedWarnings: [],
    description: '咖啡因对猫狗有刺激作用，大量摄入可导致中毒',
  },
  {
    id: 'egg',
    name: '鸡蛋',
    aliases: ['egg', '生鸡蛋'],
    safetyLevel: 'caution',
    speciesSafety: {},
    dangerousCompounds: [],
    symptoms: [],
    breedWarnings: [],
    description: '煮熟的鸡蛋适量安全，生鸡蛋含抗生物素蛋白可能影响营养吸收',
  },
  {
    id: 'rice',
    name: '米饭',
    aliases: ['白饭', 'rice', '大米'],
    safetyLevel: 'caution',
    speciesSafety: {},
    dangerousCompounds: [],
    symptoms: [],
    breedWarnings: [],
    description: '煮熟白米饭适量可食，但营养价值低，不宜作为主食',
  },
  {
    id: 'blueberry',
    name: '蓝莓',
    aliases: ['blueberry', '蓝梅'],
    safetyLevel: 'safe',
    speciesSafety: {},
    dangerousCompounds: [],
    symptoms: [],
    breedWarnings: [],
    description: '蓝莓是安全的水果，富含抗氧化物',
  },
];

export class PetSafetyHandler {
  private toxicFoodFilter: ToxicFoodFilter;
  private medicalDisclaimer: MedicalDisclaimer;

  constructor(foodData?: FoodSafetyItem[]) {
    this.toxicFoodFilter = new ToxicFoodFilter(foodData ?? DEFAULT_FOOD_DATA);
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
