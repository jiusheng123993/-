export interface UrgencyCondition {
  field: string
  operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'any_of'
  value: string | number | string[]
}

export interface UrgencyRule {
  id: string
  name: string
  category: 'symptom_combination' | 'duration' | 'species_specific' | 'age_specific' | 'breed_specific'
  triggerConditions: UrgencyCondition[]
  baseUrgency: 'green' | 'yellow' | 'orange' | 'red'
  urgencyOverride: 'green' | 'yellow' | 'orange' | 'red' | null
  description: string
  advice: string
}

export const URGENCY_RULES: UrgencyRule[] = [
  {
    id: 'vomiting_diarrhea_combo',
    name: '呕吐腹泻并发',
    category: 'symptom_combination',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '呕吐' },
      { field: 'symptoms', operator: 'contains', value: '腹泻' }
    ],
    baseUrgency: 'orange',
    urgencyOverride: 'red',
    description: '呕吐与腹泻同时出现，体液丢失速度加倍，脱水风险显著升高，幼年动物和小型犬猫尤其危险',
    advice: '立即就医，禁食不禁水，少量多次提供饮水或电解质液，密切观察精神状态'
  },
  {
    id: 'respiratory_distress_cyanosis',
    name: '呼吸困难伴发绀',
    category: 'symptom_combination',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '呼吸困难' },
      { field: 'symptoms', operator: 'contains', value: '牙龈发绀' }
    ],
    baseUrgency: 'red',
    urgencyOverride: null,
    description: '呼吸困难同时出现牙龈发绀，提示严重缺氧，可能危及生命',
    advice: '立即急诊就医，保持宠物安静，避免应激，运输途中保持通风'
  },
  {
    id: 'seizure_unconsciousness',
    name: '抽搐伴意识丧失',
    category: 'symptom_combination',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '抽搐' },
      { field: 'symptoms', operator: 'contains', value: '意识丧失' }
    ],
    baseUrgency: 'red',
    urgencyOverride: null,
    description: '抽搐同时出现意识丧失，提示严重神经系统异常，可能为癫痫大发作或脑部病变',
    advice: '立即急诊就医，发作期间不要强行按压或掰开嘴巴，记录发作持续时间和表现'
  },
  {
    id: 'polydipsia_weight_loss',
    name: '多饮多尿伴体重下降',
    category: 'symptom_combination',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '多饮多尿' },
      { field: 'symptoms', operator: 'contains', value: '体重下降' }
    ],
    baseUrgency: 'orange',
    urgencyOverride: 'red',
    description: '多饮多尿伴随体重下降，高度提示糖尿病、慢性肾病或甲状腺功能亢进等内分泌代谢疾病',
    advice: '尽快就医检查血糖、肾功能和甲状腺指标，记录饮水量和排尿频率'
  },
  {
    id: 'appetite_loss_lethargy',
    name: '食欲下降伴嗜睡',
    category: 'symptom_combination',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '食欲下降' },
      { field: 'symptoms', operator: 'contains', value: '嗜睡' }
    ],
    baseUrgency: 'yellow',
    urgencyOverride: 'orange',
    description: '食欲下降同时出现嗜睡，提示可能存在全身性疾病，需进一步排查',
    advice: '尽快就医检查，记录食欲变化和精神状态，尝试加热食物增加香味观察是否进食'
  },
  {
    id: 'vomiting_over_24h',
    name: '呕吐持续超过24小时',
    category: 'duration',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '呕吐' },
      { field: 'duration', operator: 'greater_than', value: 24 }
    ],
    baseUrgency: 'yellow',
    urgencyOverride: 'orange',
    description: '呕吐持续超过24小时，脱水风险升高，可能存在消化道梗阻或严重感染',
    advice: '尽快就医，禁食不禁水，观察呕吐物性状，记录呕吐频率'
  },
  {
    id: 'diarrhea_over_48h',
    name: '腹泻持续超过48小时',
    category: 'duration',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '腹泻' },
      { field: 'duration', operator: 'greater_than', value: 48 }
    ],
    baseUrgency: 'yellow',
    urgencyOverride: 'orange',
    description: '腹泻持续超过48小时，脱水风险显著升高，需排查寄生虫、感染和炎性肠病',
    advice: '尽快就医，提供充足饮水，观察粪便性状变化，记录排便频率'
  },
  {
    id: 'cat_anorexia_over_48h',
    name: '猫不进食超过48小时',
    category: 'duration',
    triggerConditions: [
      { field: 'species', operator: 'equals', value: 'cat' },
      { field: 'symptoms', operator: 'contains', value: '不进食' },
      { field: 'duration', operator: 'greater_than', value: 48 }
    ],
    baseUrgency: 'orange',
    urgencyOverride: 'red',
    description: '猫超过48小时不进食可诱发肝脂肪变性（脂肪肝），危及生命，需紧急处理',
    advice: '立即就医，猫脂肪肝可在短时间内发展为不可逆肝损伤，不要等待自行恢复'
  },
  {
    id: 'juvenile_anorexia_over_24h',
    name: '幼年动物不进食超过24小时',
    category: 'duration',
    triggerConditions: [
      { field: 'ageGroup', operator: 'equals', value: 'juvenile' },
      { field: 'symptoms', operator: 'contains', value: '不进食' },
      { field: 'duration', operator: 'greater_than', value: 24 }
    ],
    baseUrgency: 'orange',
    urgencyOverride: 'red',
    description: '幼年动物（小于1岁）不进食超过24小时，低血糖风险极高，可迅速导致虚脱和器官损伤',
    advice: '立即就医，幼年动物糖原储备少，低血糖可迅速危及生命，不要延迟就医'
  },
  {
    id: 'cough_over_2weeks',
    name: '咳嗽持续超过2周',
    category: 'duration',
    triggerConditions: [
      { field: 'symptoms', operator: 'contains', value: '咳嗽' },
      { field: 'duration', operator: 'greater_than', value: 336 }
    ],
    baseUrgency: 'yellow',
    urgencyOverride: 'orange',
    description: '咳嗽持续超过2周，需排查心脏病、慢性支气管炎、心丝虫和肺部肿瘤等严重疾病',
    advice: '尽快就医，需进行胸部X光和心脏检查，记录咳嗽频率和触发因素'
  },
  {
    id: 'cat_lily_exposure',
    name: '猫接触百合',
    category: 'species_specific',
    triggerConditions: [
      { field: 'species', operator: 'equals', value: 'cat' },
      { field: 'symptoms', operator: 'contains', value: '百合接触' }
    ],
    baseUrgency: 'red',
    urgencyOverride: null,
    description: '百合对猫具有特有毒性，所有部位包括花粉和花瓶水都有毒，极少量即可导致急性肾衰竭',
    advice: '立即急诊就医，即使只是接触花粉也应就医，6小时内治疗预后较好，超过18小时预后极差'
  },
  {
    id: 'cat_urinary_blockage',
    name: '猫尿闭',
    category: 'species_specific',
    triggerConditions: [
      { field: 'species', operator: 'equals', value: 'cat' },
      { field: 'symptoms', operator: 'contains', value: '尿闭' }
    ],
    baseUrgency: 'red',
    urgencyOverride: null,
    description: '猫尿道完全阻塞，可在24-48小时内导致膀胱破裂、急性肾衰竭和高钾血症死亡，公猫高发',
    advice: '立即急诊就医，尿闭是猫最紧急的急症之一，超过12小时无尿必须立即处理'
  },
  {
    id: 'dog_bloat_dry_heave',
    name: '犬腹胀伴干呕',
    category: 'species_specific',
    triggerConditions: [
      { field: 'species', operator: 'equals', value: 'dog' },
      { field: 'symptoms', operator: 'contains', value: '腹胀' },
      { field: 'symptoms', operator: 'contains', value: '干呕' }
    ],
    baseUrgency: 'red',
    urgencyOverride: null,
    description: '犬腹部胀大同时出现干呕，高度提示胃扩张扭转（GDV），死亡率极高，需紧急手术',
    advice: '立即急诊就医，GDV可在数小时内致死，不要等待观察，运输途中避免按压腹部'
  },
  {
    id: 'juvenile_orange_escalation',
    name: '幼年动物橙色症状升级',
    category: 'age_specific',
    triggerConditions: [
      { field: 'ageGroup', operator: 'equals', value: 'juvenile' },
      { field: 'urgencyLevel', operator: 'equals', value: 'orange' }
    ],
    baseUrgency: 'orange',
    urgencyOverride: 'red',
    description: '幼年动物（小于1岁）出现任何橙色级别症状，因免疫系统未成熟和糖原储备少，需升级为红色紧急处理',
    advice: '立即就医，幼年动物病情恶化速度快，不要在家观察等待'
  },
  {
    id: 'senior_rapid_weight_loss',
    name: '老年动物体重快速下降',
    category: 'age_specific',
    triggerConditions: [
      { field: 'ageGroup', operator: 'equals', value: 'senior' },
      { field: 'symptoms', operator: 'contains', value: '体重快速下降' }
    ],
    baseUrgency: 'orange',
    urgencyOverride: 'red',
    description: '老年动物（大于7岁）出现体重快速下降，高度提示恶性肿瘤、严重内分泌疾病或器官衰竭',
    advice: '尽快就医，需进行全面体检、血液检查和影像学检查，排查肿瘤和器官疾病'
  },
  {
    id: 'deep_chested_breed_bloat',
    name: '深胸犬种腹胀',
    category: 'breed_specific',
    triggerConditions: [
      { field: 'breed', operator: 'any_of', value: ['大丹犬', '德国牧羊犬', '标准贵宾犬', '魏玛犬', '圣伯纳犬', '爱尔兰塞特犬', '杜宾犬', '巴吉度猎犬'] },
      { field: 'symptoms', operator: 'contains', value: '腹胀' }
    ],
    baseUrgency: 'red',
    urgencyOverride: null,
    description: '深胸犬种出现腹胀，胃扩张扭转（GDV）风险极高，该犬种为GDV高发群体，需紧急处理',
    advice: '立即急诊就医，深胸犬种GDV发病率远高于其他犬种，不要等待观察'
  },
  {
    id: 'cavalier_seizure',
    name: '查理王小猎犬抽搐',
    category: 'breed_specific',
    triggerConditions: [
      { field: 'breed', operator: 'any_of', value: ['查理王小猎犬', '骑士查理王小猎犬'] },
      { field: 'symptoms', operator: 'contains', value: '抽搐' }
    ],
    baseUrgency: 'orange',
    urgencyOverride: 'red',
    description: '查理王小猎犬出现抽搐，高度怀疑Chiari样畸形/脊髓空洞症，该品种为高发群体，需专科检查',
    advice: '尽快就医神经专科，需进行MRI检查排查Chiari畸形和脊髓空洞症，记录抽搐频率和持续时间'
  }
]
