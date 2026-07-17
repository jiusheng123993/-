export interface VaccineItem {
  id: string
  name: string
  species: 'dog' | 'cat'
  vaccineType: 'core' | 'non-core' | 'not-recommended'
  targetDiseases: string[]
  schedule: {
    puppyKitten: string
    adult: string
    senior: string
  }
  administrationRoute: string
  boosterFrequency: string
  maternalAntibodyInterference: string
  minimumAge: string
  specialConsiderations: string[]
  sideEffects: string[]
  contraindications: string[]
}

export interface VaccineScheduleTemplate {
  id: string
  name: string
  species: 'dog' | 'cat'
  lifeStage: 'puppy_kitten' | 'adult' | 'senior'
  schedule: {
    weekOrAge: string
    vaccines: string[]
    notes: string
  }[]
}

export const VACCINE_DATA: VaccineItem[] = [
  {
    id: 'dhpp',
    name: '犬瘟热-腺病毒-细小病毒-副流感联合疫苗（DHPP）',
    species: 'dog',
    vaccineType: 'core',
    targetDiseases: ['犬瘟热', '犬腺病毒1型（传染性肝炎）', '犬腺病毒2型', '犬细小病毒', '犬副流感病毒'],
    schedule: {
      puppyKitten: '6-8周龄首免，每2-4周加强一次，直至16周龄或以上',
      adult: '首免后1年加强，之后每3年加强一次',
      senior: '每3年加强一次，根据抗体检测结果调整'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每3年（WSAVA 2024指南推荐）',
    maternalAntibodyInterference: '母源抗体可持续至12-16周龄，16周龄前最后一针至关重要',
    minimumAge: '6周龄',
    specialConsiderations: ['16周龄或以上必须完成最后一针加强', '首年系列至少3针', '高感染风险环境可提前至4周龄开始'],
    sideEffects: ['注射部位轻微肿胀', '嗜睡24-48小时', '食欲暂时下降', '罕见：过敏反应'],
    contraindications: ['发热', '免疫抑制状态', '怀孕母犬（减毒活疫苗）']
  },
  {
    id: 'rabies_dog',
    name: '狂犬病疫苗（犬）',
    species: 'dog',
    vaccineType: 'core',
    targetDiseases: ['狂犬病'],
    schedule: {
      puppyKitten: '12-16周龄首免（各国法规不同，中国通常3月龄以上）',
      adult: '首免后1年加强，之后每1-3年加强（依当地法规和疫苗类型）',
      senior: '按当地法规要求加强'
    },
    administrationRoute: '皮下或肌肉注射',
    boosterFrequency: '每1-3年（依当地法规和疫苗类型）',
    maternalAntibodyInterference: '母源抗体干扰较小，但建议12周龄后接种',
    minimumAge: '12周龄（中国法规通常要求3月龄以上）',
    specialConsiderations: ['中国为狂犬病疫区，依法必须接种', '接种后发放免疫证明', '跨境旅行需符合目的地国家要求'],
    sideEffects: ['注射部位疼痛', '嗜睡', '罕见：过敏反应', '极罕见：注射部位肉瘤（猫更常见）'],
    contraindications: ['发热', '严重免疫抑制', '既往狂犬疫苗严重过敏史']
  },
  {
    id: 'bordetella',
    name: '犬窝咳疫苗（支气管败血波氏杆菌+犬副流感）',
    species: 'dog',
    vaccineType: 'non-core',
    targetDiseases: ['犬传染性气管支气管炎（犬窝咳）'],
    schedule: {
      puppyKitten: '6-8周龄可开始（鼻内型），或8-12周龄（注射型）',
      adult: '每年加强一次（高风险犬每6个月）',
      senior: '每年加强一次'
    },
    administrationRoute: '鼻内滴注或皮下注射（鼻内型起效更快）',
    boosterFrequency: '每年一次，高风险环境每6个月',
    maternalAntibodyInterference: '鼻内型受母源抗体干扰较小',
    minimumAge: '3周龄（鼻内型），6周龄（注射型）',
    specialConsiderations: ['寄养/美容/犬舍/犬展前至少2周接种', '鼻内型可提供更快的局部免疫', '不能完全预防但可减轻症状'],
    sideEffects: ['鼻内型：打喷嚏、流鼻涕', '注射型：局部肿胀', '轻微咳嗽'],
    contraindications: ['免疫抑制', '严重呼吸道疾病急性期']
  },
  {
    id: 'leptospirosis',
    name: '钩端螺旋体疫苗',
    species: 'dog',
    vaccineType: 'non-core',
    targetDiseases: ['钩端螺旋体病（多种血清型）'],
    schedule: {
      puppyKitten: '8-12周龄首免，2-4周后加强',
      adult: '每年加强一次',
      senior: '每年加强一次'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每年一次（免疫力持续时间约12个月）',
    maternalAntibodyInterference: '母源抗体可干扰，建议12周龄后接种',
    minimumAge: '8周龄',
    specialConsiderations: ['选择覆盖当地流行血清型的多价疫苗', '小型犬过敏反应风险略高', '户外活动多的犬强烈推荐', '人畜共患病'],
    sideEffects: ['注射部位疼痛', '嗜睡', '小型犬过敏反应风险较高', '罕见：急性过敏'],
    contraindications: ['既往钩端螺旋体疫苗严重过敏史', '发热']
  },
  {
    id: 'lyme_dog',
    name: '莱姆病疫苗（伯氏疏螺旋体）',
    species: 'dog',
    vaccineType: 'non-core',
    targetDiseases: ['莱姆病（莱姆疏螺旋体病）'],
    schedule: {
      puppyKitten: '12周龄首免，2-4周后加强',
      adult: '每年加强一次（蜱虫季节前）',
      senior: '每年加强一次'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每年一次',
    maternalAntibodyInterference: '母源抗体可干扰，建议12周龄后接种',
    minimumAge: '12周龄',
    specialConsiderations: ['仅推荐蜱虫高发地区使用', '需配合体外驱虫', '已有莱姆病症状的犬不建议接种'],
    sideEffects: ['注射部位肿胀', '嗜睡', '罕见：莱姆病样症状'],
    contraindications: ['已确诊莱姆病肾炎', '免疫介导性多关节炎']
  },
  {
    id: 'canine_influenza',
    name: '犬流感疫苗',
    species: 'dog',
    vaccineType: 'non-core',
    targetDiseases: ['犬流感病毒（H3N8和H3N2）'],
    schedule: {
      puppyKitten: '6-8周龄首免，2-4周后加强',
      adult: '每年加强一次',
      senior: '每年加强一次'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每年一次',
    maternalAntibodyInterference: '母源抗体可干扰早期接种',
    minimumAge: '6周龄',
    specialConsiderations: ['流行地区或犬只密集场所推荐', '不能完全预防感染但可减轻症状', '寄养/犬展前至少2周接种'],
    sideEffects: ['注射部位反应', '嗜睡', '轻微呼吸道症状'],
    contraindications: ['发热', '免疫抑制']
  },
  {
    id: 'fvrCP',
    name: '猫疱疹病毒-杯状病毒-泛白细胞减少症联合疫苗（FVRCP）',
    species: 'cat',
    vaccineType: 'core',
    targetDiseases: ['猫疱疹病毒1型（猫鼻支）', '猫杯状病毒', '猫泛白细胞减少症（猫瘟）'],
    schedule: {
      puppyKitten: '6-8周龄首免，每3-4周加强一次，直至16周龄或以上',
      adult: '首免后1年加强，之后每3年加强一次',
      senior: '每3年加强一次，根据抗体检测结果调整'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每3年（WSAVA 2024指南推荐）',
    maternalAntibodyInterference: '母源抗体可持续至12-16周龄，16周龄前最后一针至关重要',
    minimumAge: '6周龄',
    specialConsiderations: ['16周龄或以上必须完成最后一针加强', '首年系列至少3针', '高感染风险环境（收容所/猫舍）可提前至4周龄开始'],
    sideEffects: ['注射部位轻微肿胀', '嗜睡24-48小时', '食欲暂时下降', '罕见：过敏反应'],
    contraindications: ['发热', '免疫抑制状态', '怀孕母猫（减毒活疫苗）']
  },
  {
    id: 'rabies_cat',
    name: '狂犬病疫苗（猫）',
    species: 'cat',
    vaccineType: 'core',
    targetDiseases: ['狂犬病'],
    schedule: {
      puppyKitten: '12-16周龄首免',
      adult: '首免后1年加强，之后每1-3年加强（依当地法规和疫苗类型）',
      senior: '按当地法规要求加强'
    },
    administrationRoute: '皮下或肌肉注射',
    boosterFrequency: '每1-3年（依当地法规和疫苗类型）',
    maternalAntibodyInterference: '母源抗体干扰较小',
    minimumAge: '12周龄',
    specialConsiderations: ['中国为狂犬病疫区，依法必须接种', '使用无佐剂疫苗降低注射部位肉瘤风险', '建议肢体远端注射（便于肉瘤处理）'],
    sideEffects: ['注射部位疼痛', '嗜睡', '罕见：过敏反应', '极罕见：注射部位肉瘤（FISS）'],
    contraindications: ['发热', '严重免疫抑制', '既往狂犬疫苗严重过敏史']
  },
  {
    id: 'felv',
    name: '猫白血病病毒疫苗（FeLV）',
    species: 'cat',
    vaccineType: 'non-core',
    targetDiseases: ['猫白血病病毒感染'],
    schedule: {
      puppyKitten: '8-12周龄首免，3-4周后加强',
      adult: '每年加强一次（户外猫/高风险猫）',
      senior: '根据风险评估决定是否继续'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每年一次（高风险猫）',
    maternalAntibodyInterference: '母源抗体可干扰，建议8周龄后接种',
    minimumAge: '8周龄',
    specialConsiderations: ['接种前必须进行FeLV检测（阴性方可接种）', '核心疫苗仅对户外猫/高风险猫', '纯室内猫通常不需要', '建议肢体远端注射'],
    sideEffects: ['注射部位反应', '嗜睡', '罕见：注射部位肉瘤'],
    contraindications: ['FeLV阳性猫', '纯室内猫（低风险）', '免疫抑制']
  },
  {
    id: 'fiv',
    name: '猫免疫缺陷病毒疫苗（FIV）',
    species: 'cat',
    vaccineType: 'not-recommended',
    targetDiseases: ['猫免疫缺陷病毒感染（猫艾滋病）'],
    schedule: {
      puppyKitten: '8周龄首免，2-3周后加强两次',
      adult: '每年加强一次',
      senior: '不推荐'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每年一次',
    maternalAntibodyInterference: '母源抗体可干扰',
    minimumAge: '8周龄',
    specialConsiderations: ['WSAVA不推荐常规使用', '接种后抗体检测无法区分疫苗和感染', '保护效力有限', '仅高风险户外猫考虑'],
    sideEffects: ['注射部位反应', '抗体检测假阳性', '嗜睡'],
    contraindications: ['FIV阳性猫', '纯室内猫', '大多数情况下不推荐']
  },
  {
    id: 'chlamydia_cat',
    name: '猫衣原体疫苗',
    species: 'cat',
    vaccineType: 'non-core',
    targetDiseases: ['猫衣原体结膜炎'],
    schedule: {
      puppyKitten: '8-12周龄首免，3-4周后加强',
      adult: '每年加强一次（高风险猫）',
      senior: '根据风险评估决定'
    },
    administrationRoute: '皮下注射',
    boosterFrequency: '每年一次',
    maternalAntibodyInterference: '母源抗体可干扰',
    minimumAge: '8周龄',
    specialConsiderations: ['仅推荐多猫环境/猫舍使用', '保护效力有限', '不能完全预防感染'],
    sideEffects: ['注射部位反应', '嗜睡', '食欲下降'],
    contraindications: ['单猫家庭', '低风险环境']
  },
  {
    id: 'fip',
    name: '猫传染性腹膜炎疫苗（FIP）',
    species: 'cat',
    vaccineType: 'not-recommended',
    targetDiseases: ['猫传染性腹膜炎'],
    schedule: {
      puppyKitten: '16周龄首免，3-4周后加强',
      adult: '每年加强一次',
      senior: '不推荐'
    },
    administrationRoute: '鼻内滴注',
    boosterFrequency: '每年一次',
    maternalAntibodyInterference: '母源抗体干扰显著',
    minimumAge: '16周龄',
    specialConsiderations: ['WSAVA不推荐使用', '保护效力证据不足', '接种前必须确认FCoV抗体阴性', '大多数猫已暴露于FCoV'],
    sideEffects: ['鼻内不适', '打喷嚏'],
    contraindications: ['FCoV抗体阳性猫', '大多数情况下不推荐']
  }
]

export const DOG_VACCINE_SCHEDULE: VaccineScheduleTemplate[] = [
  {
    id: 'dog_puppy',
    name: '幼犬疫苗排期（WSAVA 2024标准）',
    species: 'dog',
    lifeStage: 'puppy_kitten',
    schedule: [
      { weekOrAge: '6-8周龄', vaccines: ['DHPP（第一针）', '窝咳疫苗（可选，鼻内型）'], notes: '首次免疫，母源抗体可能干扰。窝咳疫苗鼻内型可3周龄起用。' },
      { weekOrAge: '10-12周龄', vaccines: ['DHPP（第二针）', '钩端螺旋体（第一针，可选）'], notes: '钩端螺旋体疫苗根据当地流行情况决定。' },
      { weekOrAge: '14-16周龄', vaccines: ['DHPP（第三针/最后一针）', '钩端螺旋体（第二针，可选）', '狂犬病（12-16周龄）'], notes: '最后一针DHPP必须在16周龄或以上。狂犬病按当地法规。' },
      { weekOrAge: '6月龄', vaccines: ['狂犬病（如未接种）'], notes: '如16周龄前未接种狂犬病疫苗，此时补种。' },
      { weekOrAge: '1岁', vaccines: ['DHPP（首次年度加强）', '狂犬病（首次年度加强）', '钩端螺旋体（年度加强）', '窝咳（年度加强）'], notes: '首次年度加强，之后DHPP转为每3年一次。' }
    ]
  },
  {
    id: 'dog_adult',
    name: '成年犬疫苗排期（WSAVA 2024标准）',
    species: 'dog',
    lifeStage: 'adult',
    schedule: [
      { weekOrAge: '每年', vaccines: ['钩端螺旋体（年度加强）', '窝咳（年度加强）', '犬流感（年度加强，可选）', '莱姆病（年度加强，可选）'], notes: '非核心疫苗每年加强。窝咳高风险犬可每6个月加强。' },
      { weekOrAge: '每3年', vaccines: ['DHPP（3年加强）', '狂犬病（依法规1-3年）'], notes: '核心疫苗每3年加强。狂犬病频率依当地法规。' }
    ]
  },
  {
    id: 'dog_senior',
    name: '老年犬疫苗排期（WSAVA 2024标准）',
    species: 'dog',
    lifeStage: 'senior',
    schedule: [
      { weekOrAge: '每年', vaccines: ['钩端螺旋体（年度加强）', '窝咳（年度加强）'], notes: '根据健康状况和暴露风险评估。体弱犬可考虑抗体检测替代。' },
      { weekOrAge: '每3年', vaccines: ['DHPP（3年加强）', '狂犬病（依法规）'], notes: '可考虑抗体滴度检测替代自动加强。' }
    ]
  }
]

export const CAT_VACCINE_SCHEDULE: VaccineScheduleTemplate[] = [
  {
    id: 'cat_kitten',
    name: '幼猫疫苗排期（WSAVA 2024标准）',
    species: 'cat',
    lifeStage: 'puppy_kitten',
    schedule: [
      { weekOrAge: '6-8周龄', vaccines: ['FVRCP（第一针）'], notes: '首次免疫，母源抗体可能干扰。' },
      { weekOrAge: '10-12周龄', vaccines: ['FVRCP（第二针）', 'FeLV（第一针，户外猫）'], notes: 'FeLV接种前必须检测阴性。纯室内猫不需要FeLV。' },
      { weekOrAge: '14-16周龄', vaccines: ['FVRCP（第三针/最后一针）', 'FeLV（第二针，户外猫）', '狂犬病（12-16周龄）'], notes: '最后一针FVRCP必须在16周龄或以上。狂犬病按当地法规。' },
      { weekOrAge: '6月龄', vaccines: ['狂犬病（如未接种）'], notes: '如16周龄前未接种狂犬病疫苗，此时补种。' },
      { weekOrAge: '1岁', vaccines: ['FVRCP（首次年度加强）', '狂犬病（首次年度加强）', 'FeLV（年度加强，户外猫）'], notes: '首次年度加强，之后FVRCP转为每3年一次。' }
    ]
  },
  {
    id: 'cat_adult',
    name: '成年猫疫苗排期（WSAVA 2024标准）',
    species: 'cat',
    lifeStage: 'adult',
    schedule: [
      { weekOrAge: '每年', vaccines: ['FeLV（年度加强，户外猫）', '狂犬病（依法规1-3年）'], notes: 'FeLV仅户外猫/高风险猫。狂犬病频率依当地法规。' },
      { weekOrAge: '每3年', vaccines: ['FVRCP（3年加强）'], notes: '核心疫苗每3年加强。纯室内猫可考虑抗体检测替代。' }
    ]
  },
  {
    id: 'cat_senior',
    name: '老年猫疫苗排期（WSAVA 2024标准）',
    species: 'cat',
    lifeStage: 'senior',
    schedule: [
      { weekOrAge: '每年', vaccines: ['FeLV（年度加强，户外猫）', '狂犬病（依法规）'], notes: '根据健康状况和暴露风险评估。体弱猫可考虑抗体检测替代。' },
      { weekOrAge: '每3年', vaccines: ['FVRCP（3年加强）'], notes: '可考虑抗体滴度检测替代自动加强。' }
    ]
  }
]