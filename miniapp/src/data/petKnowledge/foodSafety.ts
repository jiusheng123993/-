export interface FoodSafetyItem {
  id: string
  name: string
  aliases: string[]
  safetyLevel: 'safe' | 'caution' | 'dangerous' | 'toxic'
  speciesApplicable: ('dog' | 'cat')[]
  dangerousCompounds?: string[]
  toxicDoses?: string
  symptoms?: string[]
  breedWarnings?: string[]
  detail: string
  firstAid?: string
}

export const FOOD_SAFETY_DATA: FoodSafetyItem[] = [
  {
    id: 'chocolate',
    name: '巧克力',
    aliases: ['可可', '黑巧克力', '白巧克力', '可可粉', '可可豆'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['可可碱', '咖啡因'],
    toxicDoses: '犬：可可碱100-200mg/kg可致死；猫：可可碱80-150mg/kg可致死。黑巧克力可可碱含量最高约450mg/28g，白巧克力含量极低约0.25mg/28g',
    symptoms: ['呕吐', '腹泻', '烦躁不安', '心跳加速', '肌肉震颤', '抽搐', '心律失常', '心力衰竭'],
    detail: '巧克力中的可可碱和咖啡因对猫狗的代谢速度远慢于人类，容易在体内蓄积中毒。黑巧克力和烘焙巧克力最危险，白巧克力风险较低但仍不建议喂食。小型犬和猫因体重小，少量即可达到中毒剂量。',
    firstAid: '立即联系宠物医院。告知兽医巧克力类型、估计摄入量和宠物体重。不要自行催吐，除非兽医指导。'
  },
  {
    id: 'grape',
    name: '葡萄',
    aliases: ['葡萄干', '提子', '无籽葡萄', '红葡萄', '绿葡萄'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['未知毒素（疑似酒石酸或单宁类物质）'],
    toxicDoses: '犬：少量葡萄干（0.05-0.5oz/kg）即可导致肾衰竭，个体差异极大。猫：同样敏感，具体剂量不确定',
    symptoms: ['呕吐', '腹泻', '食欲下降', '腹痛', '少尿或无尿', '肾衰竭'],
    detail: '葡萄和葡萄干可导致犬急性肾衰竭，毒理机制尚未完全明确。个体敏感性差异极大，有的犬吃少量即中毒，有的耐受较多。葡萄干比鲜葡萄更危险（浓缩后毒素浓度更高）。猫同样可能中毒，但报告病例较少。',
    firstAid: '立即联系宠物医院。如果刚吃下（1-2小时内），兽医可能建议催吐。需进行血液检查监测肾功能。'
  },
  {
    id: 'onion',
    name: '洋葱',
    aliases: ['红洋葱', '黄洋葱', '洋葱粉'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['硫代硫酸盐（N-丙基二硫化物）'],
    toxicDoses: '犬：5g/kg洋葱可导致溶血；猫：更敏感，少量即可中毒。洋葱粉毒性浓缩约10倍',
    symptoms: ['虚弱', '牙龈苍白', '呼吸急促', '红尿（血红蛋白尿）', '黄疸', '食欲下降', '溶血性贫血'],
    detail: '洋葱、大蒜、韭菜等葱属植物含有硫代硫酸盐，会破坏红细胞的血红蛋白导致溶血性贫血。猫比狗更敏感。所有形式都有毒：生、熟、干燥、粉末。洋葱粉因浓缩而毒性更强。症状可能在摄入后1-7天才出现。',
    firstAid: '立即联系宠物医院。告知摄入量和种类。需检查血常规和尿检。严重溶血可能需要输血。'
  },
  {
    id: 'xylitol',
    name: '木糖醇',
    aliases: ['桦木糖', '木糖醇口香糖', '无糖食品', '木糖醇花生酱'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog'],
    dangerousCompounds: ['木糖醇'],
    toxicDoses: '犬：0.05g/kg可导致低血糖；0.5g/kg可导致肝衰竭。一包口香糖含约1-2g木糖醇',
    symptoms: ['呕吐', '低血糖症状（虚弱、共济失调、抽搐）', '肝衰竭', '凝血障碍', '黄疸'],
    detail: '木糖醇是常见的无糖甜味剂，广泛用于口香糖、糖果、花生酱、烘焙食品等。犬摄入后胰岛素大量释放导致严重低血糖，随后可能发生肝坏死。猫对木糖醇的敏感性目前研究不足，建议同样避免。',
    firstAid: '立即联系宠物医院急诊。低血糖可在30分钟内发生，肝损伤可能延迟12-24小时。不要等待症状出现。'
  },
  {
    id: 'macadamia_nut',
    name: '澳洲坚果',
    aliases: ['夏威夷果', '澳洲胡桃', '昆士兰坚果'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog'],
    dangerousCompounds: ['未知毒素'],
    toxicDoses: '犬：约2.4g/kg可出现症状，约1-2颗坚果即可使小型犬中毒',
    symptoms: ['后肢无力', '共济失调', '呕吐', '体温升高', '震颤', '腹痛'],
    detail: '澳洲坚果对犬有独特毒性，可导致后肢无力和其他神经症状。毒理机制尚不明确。症状通常在摄入后6-12小时出现，多数病例可自行恢复，但严重者需治疗。猫的中毒报告极少，建议同样避免。',
    firstAid: '联系宠物医院。如果刚吃下，兽医可能建议催吐。多数病例经支持治疗后24-48小时恢复。'
  },
  {
    id: 'alcohol',
    name: '酒精',
    aliases: ['乙醇', '白酒', '啤酒', '红酒', '含酒精食物', '酒心巧克力'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['乙醇'],
    toxicDoses: '犬猫：5.5-8ml纯酒精/kg可致死。少量即可中毒',
    symptoms: ['共济失调', '嗜睡', '呼吸抑制', '低体温', '代谢性酸中毒', '昏迷', '死亡'],
    detail: '猫狗对酒精的耐受性远低于人类。即使少量含酒精的食物（如酒心巧克力、发酵面团）也可能导致中毒。酒精可导致低血糖、低体温和呼吸抑制。猫因体重小更易中毒。',
    firstAid: '立即联系宠物医院急诊。酒精吸收快，不要等待症状。可能需要静脉输液和监测血糖。'
  },
  {
    id: 'coffee',
    name: '咖啡',
    aliases: ['咖啡因', '茶', '红茶', '绿茶', '能量饮料', '咖啡豆', '茶叶'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['咖啡因'],
    toxicDoses: '犬：140mg/kg可致死（约1杯浓咖啡对小型犬）。猫更敏感',
    symptoms: ['烦躁不安', '心跳加速', '肌肉震颤', '呕吐', '腹泻', '抽搐', '心律失常'],
    detail: '咖啡因存在于咖啡、茶、能量饮料、某些药物中。猫狗对咖啡因代谢缓慢，容易蓄积中毒。与巧克力中毒机制类似（都是甲基黄嘌呤类），症状也相似。茶和能量饮料同样危险。',
    firstAid: '立即联系宠物医院。告知摄入的咖啡因来源和估计量。可能需要催吐和监测心脏。'
  },
  {
    id: 'lily',
    name: '百合',
    aliases: ['百合花', '亚洲百合', '东方百合', '虎百合', '星百合', '萱草'],
    safetyLevel: 'toxic',
    speciesApplicable: ['cat'],
    dangerousCompounds: ['未知水溶性毒素（存在于所有部位包括花粉）'],
    toxicDoses: '猫：极少量（2-3片花瓣或舔食花粉）即可导致急性肾衰竭',
    symptoms: ['呕吐', '食欲下降', '嗜睡', '少尿或无尿', '肾衰竭', '死亡'],
    detail: '百合对猫具有特有毒性，是猫中毒最常见的原因之一。所有部位（花瓣、叶子、茎、花粉、花瓶水）都有毒。即使舔食花粉或饮用花瓶水也可致命。肾损伤在摄入后6-12小时开始，36-72小时可发展为不可逆肾衰竭。对狗毒性较低，主要引起胃肠道症状。',
    firstAid: '猫接触百合后立即联系宠物医院急诊。即使只是接触花粉也应就医。6小时内治疗预后较好，超过18小时预后极差。'
  },
  {
    id: 'azalea',
    name: '杜鹃花',
    aliases: ['映山红', '杜鹃', 'Azalea', 'Rhododendron'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['木藜芦烷毒素（Grayanotoxin）'],
    toxicDoses: '犬猫：少量叶片（约体重的0.2%）即可引起中毒症状',
    symptoms: ['呕吐', '腹泻', '流口水', '食欲下降', '心律失常', '低血压', '虚弱', '昏迷'],
    detail: '杜鹃花含有木藜芦烷毒素，影响钠离子通道，可导致心血管和神经系统中毒。所有部位都有毒，包括花蜜。中毒通常在摄入后数小时内出现。严重中毒可导致心血管衰竭和死亡。',
    firstAid: '立即联系宠物医院。告知摄入量和时间。兽医可能进行催吐、活性炭给药和支持治疗。'
  }
]