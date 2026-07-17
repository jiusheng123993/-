export type FoodSafetyLevel = 'safe' | 'caution' | 'dangerous' | 'toxic';

export interface FoodSafetyItem {
  id: string;
  name: string;
  aliases: string[];
  safetyLevel: FoodSafetyLevel;
  speciesSafety: Partial<Record<'dog' | 'cat', FoodSafetyLevel>>;
  dangerousCompounds: string[];
  symptoms: string[];
  breedWarnings: Array<{ breed: string; note: string }>;
  description: string;
}

export interface ToxicFoodFilterResult {
  found: boolean;
  safetyLevel: FoodSafetyLevel;
  matchedItem?: FoodSafetyItem;
  breedWarnings: string[];
  speciesWarning?: string;
}

const SMALL_BREED_KEYWORDS = ['吉娃娃', '博美', '约克夏', '马尔济斯', '泰迪', '贵宾', '小体', '迷你', '茶杯'];
const HIGH_RISK_FOODS_FOR_SMALL_BREEDS: string[] = ['巧克力', '葡萄', '木糖醇'];

export class ToxicFoodFilter {
  private foodData: FoodSafetyItem[];
  private nameIndex: Map<string, FoodSafetyItem>;

  constructor(foodData: FoodSafetyItem[]) {
    this.foodData = foodData;
    this.nameIndex = new Map<string, FoodSafetyItem>();
    this.buildIndex();
  }

  filter(foodName: string, species: 'dog' | 'cat', breed?: string): ToxicFoodFilterResult {
    const normalized = this.normalizeFoodName(foodName);
    const matchedItem = this.matchFood(foodName, normalized);

    if (!matchedItem) {
      return {
        found: false,
        safetyLevel: 'caution',
        breedWarnings: [],
        speciesWarning: '未在食物安全库中找到该食物，建议谨慎对待，首次喂食请少量尝试',
      };
    }

    const effectiveSafetyLevel = this.resolveEffectiveSafetyLevel(matchedItem, species);
    const breedWarnings = breed ? this.checkBreedWarning(matchedItem, breed) : [];
    const speciesWarning = this.checkSpeciesWarning(matchedItem, species);
    const additionalBreedWarnings = this.checkSmallBreedRisk(foodName, breed);

    return {
      found: true,
      safetyLevel: effectiveSafetyLevel,
      matchedItem,
      breedWarnings: [...breedWarnings, ...additionalBreedWarnings],
      speciesWarning,
    };
  }

  private buildIndex(): void {
    for (const item of this.foodData) {
      const normalizedName = this.normalizeFoodName(item.name);
      this.nameIndex.set(normalizedName, item);
      for (const alias of item.aliases) {
        const normalizedAlias = this.normalizeFoodName(alias);
        this.nameIndex.set(normalizedAlias, item);
      }
    }
  }

  private normalizeFoodName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[-_]/g, '')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .trim();
  }

  private matchFood(originalName: string, normalized: string): FoodSafetyItem | undefined {
    const exactMatch = this.nameIndex.get(normalized);
    if (exactMatch) return exactMatch;

    for (const [key, item] of this.nameIndex) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return item;
      }
    }

    for (const item of this.foodData) {
      const itemNormalized = this.normalizeFoodName(item.name);
      if (this.fuzzyMatch(normalized, itemNormalized)) {
        return item;
      }
      for (const alias of item.aliases) {
        const aliasNormalized = this.normalizeFoodName(alias);
        if (this.fuzzyMatch(normalized, aliasNormalized)) {
          return item;
        }
      }
    }

    return undefined;
  }

  private fuzzyMatch(input: string, target: string): boolean {
    if (input.length < 2 || target.length < 2) return false;
    if (target.includes(input) || input.includes(target)) return true;

    let matchCount = 0;
    let targetIdx = 0;
    for (let i = 0; i < input.length && targetIdx < target.length; i++) {
      if (input[i] === target[targetIdx]) {
        matchCount++;
        targetIdx++;
      }
    }

    return matchCount >= Math.min(input.length, target.length) * 0.7;
  }

  private resolveEffectiveSafetyLevel(item: FoodSafetyItem, species: 'dog' | 'cat'): FoodSafetyLevel {
    const speciesLevel = item.speciesSafety[species];
    if (speciesLevel) return speciesLevel;
    return item.safetyLevel;
  }

  private checkBreedWarning(item: FoodSafetyItem, breed: string): string[] {
    const warnings: string[] = [];
    const normalizedBreed = breed.toLowerCase();

    for (const bw of item.breedWarnings) {
      if (normalizedBreed.includes(bw.breed.toLowerCase()) || bw.breed.toLowerCase().includes(normalizedBreed)) {
        warnings.push(bw.note);
      }
    }

    return warnings;
  }

  private checkSpeciesWarning(item: FoodSafetyItem, species: 'dog' | 'cat'): string | undefined {
    const speciesLevel = item.speciesSafety[species];
    if (!speciesLevel) return undefined;

    if (speciesLevel !== item.safetyLevel) {
      if (speciesLevel === 'toxic' && item.safetyLevel !== 'toxic') {
        return species === 'cat' ? '该食物对猫有严重危害' : '该食物对狗有严重危害';
      }
      if (speciesLevel === 'dangerous' && item.safetyLevel === 'caution') {
        return species === 'cat' ? '该食物对猫风险较高' : '该食物对狗风险较高';
      }
    }

    return undefined;
  }

  private checkSmallBreedRisk(foodName: string, breed?: string): string[] {
    if (!breed) return [];
    const normalizedBreed = breed.toLowerCase();
    const isSmallBreed = SMALL_BREED_KEYWORDS.some(k => normalizedBreed.includes(k.toLowerCase()));
    if (!isSmallBreed) return [];

    const normalizedFood = this.normalizeFoodName(foodName);
    const warnings: string[] = [];

    for (const riskyFood of HIGH_RISK_FOODS_FOR_SMALL_BREEDS) {
      const normalizedRisky = this.normalizeFoodName(riskyFood);
      if (normalizedFood.includes(normalizedRisky) || normalizedRisky.includes(normalizedFood)) {
        warnings.push('小型犬对该类食物更敏感，即使少量也可能造成严重中毒，请格外注意');
        break;
      }
    }

    return warnings;
  }
}
