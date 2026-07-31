/**
 * 原始食材安全数据 B
 * 宠物食物安全数据库 - 原始/未加工食材部分 B
 */
import type { FoodSafetyItem } from './foodSafety'

export const FOOD_SAFETY_ORIGINAL_B: FoodSafetyItem[] = [
  {
    id: 'tobacco',
    name: '烟草',
    aliases: ['香烟', '烟丝', '烟叶', '电子烟液'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['尼古丁'],
    toxicDoses: '1mg/kg 尼古丁可中毒',
    symptoms: ['流涎', '呕吐', '腹泻', '震颤', '抽搐', '呼吸衰竭', '死亡'],
    detail: '烟草含尼古丁，对犬猫有致命毒性。烟头含浓缩残留尼古丁。电子烟液含高浓度尼古丁尤其危险。',
    firstAid: '立即送兽医。'
  },
  {
    id: 'antifreeze',
    name: '防冻液',
    aliases: ['乙二醇', '冷却液'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['乙二醇'],
    toxicDoses: '犬：4.4ml/kg，猫：1.5ml/kg',
    symptoms: ['呕吐', '共济失调', '多饮多尿', '肾衰竭', '死亡'],
    detail: '乙二醇防冻液有甜味吸引宠物，极少量即可导致致命性肾衰竭。猫更敏感。是宠物中毒最常见的原因之一。早期治疗至关重要。',
    firstAid: '立即送兽医急诊，时间至关重要。12小时内治疗预后较好。'
  },
  {
    id: 'human_medicine',
    name: '人类药物',
    aliases: ['感冒药', '止痛药', '布洛芬', '对乙酰氨基酚', '阿司匹林'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['对乙酰氨基酚', '布洛芬', '阿司匹林'],
    symptoms: ['呕吐', '胃肠出血', '肝衰竭', '肾衰竭', '死亡'],
    detail: '人类药物对犬猫毒性极大。对乙酰氨基酚对猫尤其致命（1片即可致死）。布洛芬可导致胃肠穿孔和肾衰竭。不要给宠物服用任何人类药物。',
    firstAid: '立即送兽医，携带药物标签。'
  },
  {
    id: 'chicken_breast',
    name: '鸡胸肉',
    aliases: ['鸡胸', '去皮鸡胸'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡胸肉煮熟无调味后是犬猫的优质蛋白质来源。必须完全煮熟，去除所有骨头和皮。不要添加盐和调味料。是肠胃不适时的推荐食物。'
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    aliases: ['红萝卜', '胡萝卜条'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '胡萝卜生食或煮熟后少量喂食是安全的，含β-胡萝卜素和纤维。建议切成小块或条状防止窒息。生胡萝卜对犬牙齿有清洁作用。'
  },
  {
    id: 'blueberry',
    name: '蓝莓',
    aliases: ['蓝梅', '越橘'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '蓝莓少量喂食是安全的，含抗氧化物和维生素C。是低热量零食选择。建议少量喂食。'
  },
  {
    id: 'apple',
    name: '苹果',
    aliases: ['红苹果', '青苹果', '苹果片'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '苹果去籽去核后少量喂食是安全的，含纤维和维生素C。苹果籽含氰苷必须去除。建议切成小块喂食。'
  },
  {
    id: 'banana',
    name: '香蕉',
    aliases: ['芭蕉', '大蕉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '香蕉少量喂食是安全的，含钾和维生素。含糖量较高不宜过量。建议少量作为零食。'
  },
  {
    id: 'pumpkin',
    name: '南瓜',
    aliases: ['南瓜泥', '南瓜块'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '南瓜煮熟或纯南瓜泥少量喂食是安全的，含纤维有益消化。是腹泻和便秘时的推荐食物。必须使用纯南瓜泥，不要用南瓜派馅料（含香料和糖）。'
  },
  {
    id: 'broccoli',
    name: '西兰花',
    aliases: ['花椰菜绿', '绿花菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '西兰花煮熟后少量喂食是安全的，含维生素C和纤维。十字花科蔬菜大量可能影响甲状腺。建议少量喂食。'
  },
  {
    id: 'salmon',
    name: '三文鱼',
    aliases: ['鲑鱼', '煮熟三文鱼'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '三文鱼完全煮熟后喂食是安全的，含Omega-3脂肪酸有益皮肤和毛发。必须完全煮熟（生三文鱼可导致鲑鱼中毒症），去刺。'
  },
  {
    id: 'sweet_potato',
    name: '红薯',
    aliases: ['地瓜', '番薯', '山芋'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '红薯煮熟后少量喂食是安全的，含纤维和维生素A。必须煮熟（生红薯难以消化）。不要喂食红薯皮（可能含霉菌）。含糖量较高不宜过量。'
  },
  {
    id: 'cucumber',
    name: '黄瓜',
    aliases: ['青瓜', '胡瓜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '黄瓜切片后少量喂食是安全的，含水量高热量低。是夏季消暑的好选择。无需烹饪，洗净切片即可。'
  },
  {
    id: 'watermelon',
    name: '西瓜',
    aliases: ['无籽西瓜', '西瓜瓤'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '西瓜去籽去皮后少量喂食是安全的，含水量高。必须去籽（籽可导致肠梗阻），去皮。含糖量较高不宜过量。'
  },
  {
    id: 'egg_cooked',
    name: '鸡蛋（煮熟）',
    aliases: ['水煮蛋', '全熟蛋'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡蛋完全煮熟后喂食是安全的，是优质蛋白质来源。必须完全煮熟（生鸡蛋含沙门氏菌和抗生物素蛋白）。不要添加盐和调味料。'
  },
  {
    id: 'rice_cooked',
    name: '白米饭',
    aliases: ['煮熟白米', '大米饭'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '白米饭煮熟后少量喂食是安全的，易消化。肠胃不适时是好的选择。但营养价值较低，不宜作为主食。'
  },
  {
    id: 'green_bean',
    name: '四季豆',
    aliases: ['菜豆', '芸豆', '豆角'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '四季豆煮熟后少量喂食是安全的，含纤维和维生素。必须煮熟（生四季豆含植物血凝素）。建议切碎后少量喂食。'
  },
  {
    id: 'spinach',
    name: '菠菜',
    aliases: ['菠菜叶', '波斯草'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '菠菜煮熟后少量喂食是安全的，含铁和维生素。含草酸盐，有肾结石病史的宠物应限制。建议少量喂食。'
  },
  {
    id: 'peanut_butter',
    name: '花生酱',
    aliases: ['纯花生酱', '无盐花生酱'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '纯花生酱（无木糖醇、无盐、无糖）少量喂食是安全的。必须确认不含木糖醇（对犬致命）。选择100%纯花生酱。含脂肪较高不宜过量。'
  },
  {
    id: 'honey',
    name: '蜂蜜',
    aliases: ['天然蜂蜜', '百花蜜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '少量蜂蜜对成年犬通常是安全的。含糖量高不宜经常喂食。幼犬和免疫力低下的犬应避免。不建议给猫喂食。'
  },
  {
    id: 'coconut',
    name: '椰子',
    aliases: ['椰肉', '椰子水'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '新鲜椰子肉和椰子水少量喂食是安全的。椰子水含钾较高，有肾脏问题的宠物应避免。椰奶脂肪含量高不宜过量。'
  },
  {
    id: 'tea_tree_oil',
    name: '茶树油',
    aliases: ['茶树精油', 'melaleuca oil'],
    safetyLevel: 'toxic',
    speciesApplicable: ['cat'],
    dangerousCompounds: ['萜烯'],
    symptoms: ['共济失调', '震颤', '流涎', '虚脱'],
    detail: '茶树油对猫有高度毒性，猫肝脏缺乏葡萄糖醛酸转移酶无法代谢。即使稀释后也可能不安全。犬耐受性稍好但仍需谨慎。',
    firstAid: '立即送兽医，用温和洗剂清洗皮肤。'
  },
  {
    id: 'chocolate_chip_cookie',
    name: '巧克力曲奇',
    aliases: ['巧克力饼干', '巧克力蛋糕'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['可可碱', '糖', '脂肪'],
    symptoms: ['呕吐', '腹泻', '心动过速', '震颤'],
    detail: '巧克力曲奇含可可碱和大量糖脂肪。可可碱对犬猫有毒。高脂肪可导致胰腺炎。',
    firstAid: '大量摄入联系兽医。'
  },
  {
    id: 'raisin_bran',
    name: '葡萄干麦片',
    aliases: ['葡萄干谷物', '葡萄干面包'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['未知肾毒性物质'],
    symptoms: ['呕吐', '腹泻', '肾衰竭'],
    detail: '葡萄干可导致犬急性肾衰竭，毒性比新鲜葡萄更浓缩。任何含葡萄干的食品都不要喂给宠物。',
    firstAid: '立即联系兽医。'
  },
  {
    id: 'sago_palm',
    name: '苏铁',
    aliases: ['铁树', '凤尾蕉'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['苏铁苷'],
    symptoms: ['呕吐', '腹泻', '肝衰竭', '死亡'],
    detail: '苏铁所有部位均有毒，种子毒性最强。50-75%的摄入病例可致命。是剧毒观赏植物。',
    firstAid: '立即送兽医急诊。'
  },
  {
    id: 'castor_bean',
    name: '蓖麻籽',
    aliases: ['蓖麻', '蓖麻油'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['蓖麻毒素'],
    toxicDoses: '极少量即可致命',
    symptoms: ['呕吐', '腹泻', '腹痛', '虚脱', '死亡'],
    detail: '蓖麻籽含蓖麻毒素是已知最毒的天然毒素之一。咀嚼1-2颗籽即可致命。蓖麻油经过处理毒素被去除是安全的。',
    firstAid: '立即送兽医急诊。'
  },
  {
    id: 'cocoa_mulch',
    name: '可可覆盖物',
    aliases: ['可可壳覆盖物', '可可覆盖土'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['可可碱'],
    symptoms: ['呕吐', '腹泻', '心动过速', '震颤'],
    detail: '可可壳覆盖物含可可碱，犬可能被巧克力气味吸引啃食。建议使用其他类型的花园覆盖物。',
    firstAid: '大量摄入联系兽医。'
  },
  {
    id: 'hamster_food',
    name: '仓鼠食物',
    aliases: ['仓鼠粮', '啮齿类食物'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    symptoms: ['胃肠不适', '胰腺炎'],
    detail: '仓鼠食物含高脂肪和种子，少量通常无害但不宜作为宠物食物。高脂肪可导致胰腺炎。',
    firstAid: '少量通常无需处理。'
  },
  {
    id: 'cat_food_for_dogs',
    name: '猫粮（犬食）',
    aliases: ['猫粮给狗吃'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    symptoms: ['胃肠不适', '胰腺炎'],
    detail: '猫粮蛋白质和脂肪含量高于犬粮，长期食用可导致肥胖和胰腺炎。偶尔少量无害。',
    firstAid: '少量通常无需处理，长期需调整饮食。'
  },
  {
    id: 'dog_food_for_cats',
    name: '狗粮（猫食）',
    aliases: ['狗粮给猫吃'],
    safetyLevel: 'caution',
    speciesApplicable: ['cat'],
    dangerousCompounds: ['缺乏牛磺酸'],
    symptoms: ['营养不良', '心肌病', '视网膜退化'],
    detail: '狗粮缺乏猫必需的牛磺酸等营养素，长期食用可导致心肌病和视网膜退化。偶尔少量无害但不能替代猫粮。',
    firstAid: '少量通常无需处理，长期需调整饮食。'
  },
  {
    id: 'vitamin_supplement',
    name: '人类维生素补充剂',
    aliases: ['维生素片', '复合维生素'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['铁', '维生素D', '维生素A'],
    symptoms: ['胃肠不适', '铁中毒', '维生素D中毒'],
    detail: '人类维生素补充剂剂量对宠物可能过高，含铁和维生素D的补充剂尤其危险。应使用宠物专用维生素。',
    firstAid: '大量摄入联系兽医。'
  },
  {
    id: 'fabric_softener',
    name: '柔顺剂',
    aliases: ['衣物柔顺剂', '织物柔顺剂'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['阳离子表面活性剂'],
    symptoms: ['呕吐', '流涎', '口腔刺激'],
    detail: '柔顺剂含阳离子表面活性剂可导致口腔和胃肠刺激。浓缩产品毒性更强。建议安全存放。',
    firstAid: '少量通常自行恢复，大量摄入联系兽医。'
  },
  {
    id: 'zinc',
    name: '锌',
    aliases: ['氧化锌', '锌软膏', '锌片'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['锌'],
    symptoms: ['呕吐', '腹泻', '溶血', '肾衰竭'],
    detail: '过量锌可导致溶血和肾衰竭。常见来源包括锌软膏、硬币、镀锌金属。1982年后的美国便士含锌量高。',
    firstAid: '疑似锌中毒立即送兽医。'
  }
]
