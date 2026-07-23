/**
 * 品种特殊食物禁忌数据库
 * 基于品种遗传特征、常见健康问题、体型等因素
 */

export interface BreedFoodWarning {
  breedId: string
  breedName: string
  foodId: string
  foodName: string
  warningLevel: 'info' | 'caution' | 'dangerous' | 'toxic'
  reason: string
  recommendation: string
}

/**
 * 品种-食物禁忌映射表
 * 数据来源于兽医临床指南、品种俱乐部健康建议
 */
export const BREED_FOOD_WARNINGS: BreedFoodWarning[] = [
  // === 小型犬特殊禁忌 ===
  {
    breedId: 'chihuahua',
    breedName: '吉娃娃',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '吉娃娃体重仅1-3kg，极小的巧克力剂量即可达到中毒阈值。可可碱代谢慢，低血糖风险叠加',
    recommendation: '绝对禁止接触，家中所有巧克力制品需妥善存放。误食1颗巧克力豆即需就医',
  },
  {
    breedId: 'chihuahua',
    breedName: '吉娃娃',
    foodId: 'grape',
    foodName: '葡萄',
    warningLevel: 'toxic',
    reason: '小型犬肾单位数量少，肾衰竭风险极高。2-3颗葡萄干即可致命',
    recommendation: '绝对禁止，误食任何量都需立即就医',
  },
  {
    breedId: 'poodle_toy',
    breedName: '贵宾犬（玩具型）',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '体重仅2-4kg，巧克力中毒剂量极低。同时易患低血糖，中毒后恢复能力差',
    recommendation: '严格禁止，家中需完全隔离',
  },
  {
    breedId: 'poodle_toy',
    breedName: '贵宾犬（玩具型）',
    foodId: 'xylitol',
    foodName: '木糖醇',
    warningLevel: 'toxic',
    reason: '木糖醇可导致胰岛素急剧释放，低血糖风险极高。小型犬血糖调节能力弱',
    recommendation: '绝对禁止，注意检查口香糖、牙膏、烘焙食品成分',
  },
  {
    breedId: 'pug',
    breedName: '巴哥犬',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '短头综合征导致呼吸受限，巧克力中毒引发的心动过速和呼吸急促会迅速恶化',
    recommendation: '绝对禁止，中毒后需紧急供氧',
  },
  {
    breedId: 'pug',
    breedName: '巴哥犬',
    foodId: 'onion',
    foodName: '洋葱',
    warningLevel: 'dangerous',
    reason: '短头犬种对缺氧耐受差，洋葱导致的溶血性贫血会加剧呼吸困难',
    recommendation: '严格避免，包括洋葱粉、洋葱汁等所有形式',
  },
  {
    breedId: 'french_bulldog',
    breedName: '法国斗牛犬',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '短头综合征+体重轻（8-14kg），巧克力中毒后呼吸衰竭风险极高',
    recommendation: '绝对禁止，中毒需立即急诊',
  },
  {
    breedId: 'french_bulldog',
    breedName: '法国斗牛犬',
    foodId: 'grape',
    foodName: '葡萄',
    warningLevel: 'toxic',
    reason: '短头犬种脱水风险高，肾衰竭会迅速导致电解质紊乱和呼吸衰竭',
    recommendation: '绝对禁止，误食需立即就医',
  },

  // === 大型犬特殊禁忌 ===
  {
    breedId: 'german_shepherd',
    breedName: '德国牧羊犬',
    foodId: 'onion',
    foodName: '洋葱',
    warningLevel: 'dangerous',
    reason: '德牧易患胰腺外分泌功能不全（EPI），洋葱会加重消化系统负担，同时引发溶血性贫血',
    recommendation: '严格避免，EPI患犬需特别注意',
  },
  {
    breedId: 'german_shepherd',
    breedName: '德国牧羊犬',
    foodId: 'garlic',
    foodName: '大蒜',
    warningLevel: 'dangerous',
    reason: '大蒜毒性是洋葱的5倍，德牧对消化系统刺激更敏感',
    recommendation: '严格避免，包括大蒜粉',
  },
  {
    breedId: 'german_shepherd',
    breedName: '德国牧羊犬',
    foodId: 'macadamia',
    foodName: '澳洲坚果',
    warningLevel: 'dangerous',
    reason: '德牧体重较大，但澳洲坚果中毒后运动障碍和体温升高症状更明显',
    recommendation: '避免喂食',
  },
  {
    breedId: 'golden_retriever',
    breedName: '金毛寻回犬',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '金毛贪吃且体型大，容易误食大量巧克力。同时易患血管肉瘤，巧克力毒性可能加重病情',
    recommendation: '严格管理，金毛好奇心强容易翻找食物',
  },
  {
    breedId: 'golden_retriever',
    breedName: '金毛寻回犬',
    foodId: 'grape',
    foodName: '葡萄',
    warningLevel: 'toxic',
    reason: '金毛对食物来者不拒，容易误食大量葡萄/葡萄干',
    recommendation: '严格管理，注意葡萄干面包等隐藏来源',
  },
  {
    breedId: 'labrador_retriever',
    breedName: '拉布拉多寻回犬',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '拉布拉多极度贪吃，是巧克力中毒最高发的品种。体重25-36kg，误食量往往很大',
    recommendation: '绝对禁止，拉布拉多会翻垃圾桶寻找食物',
  },
  {
    breedId: 'labrador_retriever',
    breedName: '拉布拉多寻回犬',
    foodId: 'grape',
    foodName: '葡萄',
    warningLevel: 'toxic',
    reason: '极度贪食，容易误食大量葡萄干制品（如葡萄干面包、麦片）',
    recommendation: '严格管理，注意所有含葡萄干的食品',
  },
  {
    breedId: 'labrador_retriever',
    breedName: '拉布拉多寻回犬',
    foodId: 'xylitol',
    foodName: '木糖醇',
    warningLevel: 'toxic',
    reason: '贪吃特性导致容易误食含木糖醇的口香糖、烘焙食品',
    recommendation: '绝对禁止，家中口香糖需妥善存放',
  },

  // === 特殊遗传问题品种 ===
  {
    breedId: 'border_collie',
    breedName: '边境牧羊犬',
    foodId: 'ivermectin_food',
    foodName: '含伊维菌素食物',
    warningLevel: 'toxic',
    reason: 'MDR1基因突变导致血脑屏障缺陷，伊维菌素等药物可穿透血脑屏障导致神经毒性',
    recommendation: '避免含伊维菌素的驱虫药和食物，选择非伊维菌素类驱虫方案',
  },
  {
    breedId: 'border_collie',
    breedName: '边境牧羊犬',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: 'MDR1基因突变可能影响药物代谢，巧克力中毒风险更高',
    recommendation: '严格禁止',
  },
  {
    breedId: 'shetland_sheepdog',
    breedName: '喜乐蒂牧羊犬',
    foodId: 'ivermectin_food',
    foodName: '含伊维菌素食物',
    warningLevel: 'toxic',
    reason: 'MDR1基因突变高发品种，伊维菌素可导致严重神经中毒',
    recommendation: '避免含伊维菌素产品',
  },
  {
    breedId: 'collie_rough',
    breedName: '苏格兰牧羊犬',
    foodId: 'ivermectin_food',
    foodName: '含伊维菌素食物',
    warningLevel: 'toxic',
    reason: 'MDR1基因突变经典品种，伊维菌素毒性极高',
    recommendation: '绝对避免伊维菌素类产品',
  },

  // === 关节问题品种 ===
  {
    breedId: 'golden_retriever',
    breedName: '金毛寻回犬',
    foodId: 'high_calorie',
    foodName: '高热量食物',
    warningLevel: 'caution',
    reason: '易患髋关节发育不良，肥胖会加重关节负担',
    recommendation: '控制体重，避免高热量零食',
  },
  {
    breedId: 'german_shepherd',
    breedName: '德国牧羊犬',
    foodId: 'high_calorie',
    foodName: '高热量食物',
    warningLevel: 'caution',
    reason: '髋关节和肘关节发育不良高发，肥胖会加速关节退化',
    recommendation: '严格控制体重，选择关节保健配方粮',
  },
  {
    breedId: 'labrador_retriever',
    breedName: '拉布拉多寻回犬',
    foodId: 'high_calorie',
    foodName: '高热量食物',
    warningLevel: 'caution',
    reason: '肥胖率极高（约60%），髋关节和前十字韧带问题与肥胖直接相关',
    recommendation: '严格控制饮食，定时定量喂食',
  },
  {
    breedId: 'corgi_pembroke',
    breedName: '彭布罗克威尔士柯基犬',
    foodId: 'high_calorie',
    foodName: '高热量食物',
    warningLevel: 'caution',
    reason: '易患椎间盘疾病（IVDD），肥胖会显著增加脊椎压力',
    recommendation: '严格控制体重，这是预防IVDD的关键',
  },

  // === 短头犬种特殊禁忌 ===
  {
    breedId: 'french_bulldog',
    breedName: '法国斗牛犬',
    foodId: 'high_calorie',
    foodName: '高热量食物',
    warningLevel: 'caution',
    reason: '肥胖会加重呼吸困难和关节负担',
    recommendation: '严格控制体重',
  },
  {
    breedId: 'pug',
    breedName: '巴哥犬',
    foodId: 'high_calorie',
    foodName: '高热量食物',
    warningLevel: 'caution',
    reason: '肥胖会加剧呼吸困难和角膜溃疡风险',
    recommendation: '严格控制体重',
  },
  {
    breedId: 'bulldog_english',
    breedName: '英国斗牛犬',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '短头综合征+体重较重，巧克力中毒后呼吸和心脏负担极大',
    recommendation: '绝对禁止',
  },

  // === 猫品种特殊禁忌 ===
  {
    breedId: 'persian',
    breedName: '波斯猫',
    foodId: 'onion',
    foodName: '洋葱',
    warningLevel: 'toxic',
    reason: '波斯猫易患多囊肾病（PKD），洋葱导致的溶血性贫血会进一步损害肾功能',
    recommendation: '严格避免',
  },
  {
    breedId: 'persian',
    breedName: '波斯猫',
    foodId: 'garlic',
    foodName: '大蒜',
    warningLevel: 'toxic',
    reason: '大蒜毒性更强，PKD患猫肾脏代偿能力有限',
    recommendation: '严格避免',
  },
  {
    breedId: 'maine_coon',
    breedName: '缅因猫',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '体型大但咖啡因代谢能力差，心脏负荷大',
    recommendation: '严格避免',
  },
  {
    breedId: 'siamese',
    breedName: '暹罗猫',
    foodId: 'milk',
    foodName: '牛奶',
    warningLevel: 'caution',
    reason: '暹罗猫乳糖不耐受发生率较高，容易导致腹泻',
    recommendation: '避免喂食，可选择无乳糖奶制品',
  },
  {
    breedId: 'scottish_fold',
    breedName: '苏格兰折耳猫',
    foodId: 'high_calorie',
    foodName: '高热量食物',
    warningLevel: 'caution',
    reason: '易患软骨发育不良，肥胖会加重关节负担和疼痛',
    recommendation: '严格控制体重',
  },
  {
    breedId: 'ragdoll',
    breedName: '布偶猫',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '体型大但心脏较脆弱，巧克力引发的心动过速风险高',
    recommendation: '严格避免',
  },

  // === 幼犬/老年犬通用增强警告 ===
  {
    breedId: 'puppy_all',
    breedName: '幼犬（所有品种）',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '幼犬体重轻、肝脏代谢功能未发育完全，巧克力中毒剂量更低',
    recommendation: '绝对禁止，幼犬好奇心强需特别注意',
  },
  {
    breedId: 'senior_all',
    breedName: '老年犬（所有品种）',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '老年犬肝肾功能下降，代谢毒素能力减弱，中毒后恢复慢',
    recommendation: '绝对禁止',
  },
  {
    breedId: 'puppy_all',
    breedName: '幼犬（所有品种）',
    foodId: 'grape',
    foodName: '葡萄',
    warningLevel: 'toxic',
    reason: '幼犬肾脏发育不完全，对肾毒性物质更敏感',
    recommendation: '绝对禁止',
  },
  {
    breedId: 'pregnant_all',
    breedName: '孕犬/孕猫',
    foodId: 'chocolate',
    foodName: '巧克力',
    warningLevel: 'toxic',
    reason: '可可碱可通过胎盘影响胎儿，同时增加母体心脏负担',
    recommendation: '绝对禁止',
  },
  {
    breedId: 'pregnant_all',
    breedName: '孕犬/孕猫',
    foodId: 'raw_egg',
    foodName: '生鸡蛋',
    warningLevel: 'dangerous',
    reason: '生鸡蛋可能含沙门氏菌，孕期感染风险高，同时抗生物素蛋白影响胎儿发育',
    recommendation: '避免生鸡蛋，煮熟后可适量喂食',
  },
]

/**
 * 按品种ID查找食物禁忌
 */
export function getBreedFoodWarnings(breedId: string): BreedFoodWarning[] {
  return BREED_FOOD_WARNINGS.filter((w) => w.breedId === breedId)
}

/**
 * 按食物ID查找品种禁忌
 */
export function getFoodBreedWarnings(foodId: string): BreedFoodWarning[] {
  return BREED_FOOD_WARNINGS.filter((w) => w.foodId === foodId)
}

/**
 * 获取品种-食物组合的特定警告
 */
export function getBreedFoodWarning(
  breedId: string,
  foodId: string
): BreedFoodWarning | undefined {
  return BREED_FOOD_WARNINGS.find((w) => w.breedId === breedId && w.foodId === foodId)
}

/**
 * 检查品种是否对某食物有特殊禁忌
 */
export function hasBreedFoodWarning(breedId: string, foodId: string): boolean {
  return BREED_FOOD_WARNINGS.some((w) => w.breedId === breedId && w.foodId === foodId)
}

/**
 * 获取品种体型分类（用于通用警告）
 */
export function getBreedSizeCategory(breedId: string): 'toy' | 'small' | 'medium' | 'large' | 'giant' | 'unknown' {
  const sizeMap: Record<string, 'toy' | 'small' | 'medium' | 'large' | 'giant' | 'unknown'> = {
    chihuahua: 'toy',
    poodle_toy: 'toy',
    yorkshire_terrier: 'toy',
    maltese: 'toy',
    pomeranian: 'toy',
    pug: 'small',
    french_bulldog: 'small',
    corgi_pembroke: 'small',
    shiba_inu: 'small',
    beagle: 'small',
    border_collie: 'medium',
    husky_siberian: 'medium',
    cocker_spaniel: 'medium',
    bulldog_english: 'medium',
    golden_retriever: 'large',
    labrador_retriever: 'large',
    german_shepherd: 'large',
    poodle_standard: 'large',
    great_dane: 'giant',
    saint_bernard: 'giant',
    mastiff: 'giant',
  }
  return sizeMap[breedId] || 'unknown'
}

/**
 * 获取体型相关的通用食物警告
 */
export function getSizeBasedWarnings(
  breedId: string,
  foodId: string,
  foodName: string
): BreedFoodWarning | undefined {
  const size = getBreedSizeCategory(breedId)

  // 超小型犬对巧克力、葡萄、木糖醇特别敏感
  if (size === 'toy') {
    if (foodId === 'chocolate' || foodName.includes('巧克力')) {
      return {
        breedId,
        breedName: '超小型犬',
        foodId,
        foodName,
        warningLevel: 'toxic',
        reason: '体重极轻（通常<4kg），极小剂量即可中毒。低血糖风险叠加',
        recommendation: '绝对禁止，误食任何量都需立即就医',
      }
    }
    if (foodId === 'grape' || foodName.includes('葡萄')) {
      return {
        breedId,
        breedName: '超小型犬',
        foodId,
        foodName,
        warningLevel: 'toxic',
        reason: '肾单位数量少，少量即可导致肾衰竭',
        recommendation: '绝对禁止',
      }
    }
    if (foodId === 'xylitol' || foodName.includes('木糖醇')) {
      return {
        breedId,
        breedName: '超小型犬',
        foodId,
        foodName,
        warningLevel: 'toxic',
        reason: '胰岛素急剧释放导致低血糖，小型犬调节能力极弱',
        recommendation: '绝对禁止',
      }
    }
  }

  // 大型犬对高热量食物敏感
  if (size === 'large' || size === 'giant') {
    if (foodId === 'high_calorie' || foodName.includes('高热量')) {
      return {
        breedId,
        breedName: '大型犬',
        foodId,
        foodName,
        warningLevel: 'caution',
        reason: '大型犬关节负担重，肥胖会加速髋关节/肘关节退化',
        recommendation: '控制体重，避免高热量零食',
      }
    }
  }

  return undefined
}
