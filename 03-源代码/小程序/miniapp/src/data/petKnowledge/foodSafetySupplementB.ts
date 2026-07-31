/**
 * 补充保健食品数据 B
 * 宠物食物安全数据库 - 营养补充品和保健品部分 B
 */
import type { FoodSafetyItem } from './foodSafety'

export const FOOD_SAFETY_SUPPLEMENT_B: FoodSafetyItem[] = [
  {
    id: 'deet',
    name: '避蚊胺/DEET',
    aliases: ['DEET', '避蚊胺', '驱蚊胺'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['避蚊胺'],
    symptoms: ['呕吐', '震颤', '抽搐', '共济失调'],
    detail: 'DEET是常见驱蚊剂成分，对宠物有神经毒性。猫比犬更敏感。舔食含DEET的皮肤或直接喷洒宠物可导致中毒。建议使用宠物专用驱虫产品。',
    firstAid: '清洗接触部位，大量接触送兽医。'
  },
  {
    id: 'pool_chemical',
    name: '泳池化学品',
    aliases: ['pool chemical', '氯片', '泳池消毒剂'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['次氯酸钠', '三氯异氰尿酸'],
    symptoms: ['口腔灼伤', '呕吐', '呼吸困难', '食管损伤'],
    detail: '泳池化学品含高浓度氯，直接接触可导致化学灼伤。稀释后的泳池水通常安全，但浓缩氯片极度危险。建议安全存放。',
    firstAid: '用清水冲洗口腔，立即送兽医。不要诱导呕吐。'
  },
  {
    id: 'drain_cleaner',
    name: '管道疏通剂',
    aliases: ['drain cleaner', '下水道疏通剂', '通渠剂'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['氢氧化钠', '硫酸'],
    symptoms: ['口腔灼伤', '呕吐', '食管穿孔', '死亡'],
    detail: '管道疏通剂含强碱或强酸，可导致严重化学灼伤和食管穿孔。即使少量也非常危险。建议安全存放在宠物无法接触的位置。',
    firstAid: '不要诱导呕吐，用清水冲洗口腔，立即送兽医急诊。'
  },
  {
    id: 'toilet_bowl_cleaner',
    name: '马桶清洁剂',
    aliases: ['toilet bowl cleaner', '洁厕灵', '马桶清洁液'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['盐酸', '次氯酸钠', '季铵盐'],
    symptoms: ['口腔灼伤', '呕吐', '胃肠刺激'],
    detail: '马桶清洁剂含强酸或漂白剂，可导致化学灼伤。宠物可能饮用马桶中含清洁剂的水。使用后应冲洗干净并关闭马桶盖。',
    firstAid: '用清水冲洗口腔，联系兽医。'
  },
  {
    id: 'dishwasher_tablet',
    name: '洗碗机洗涤块',
    aliases: ['dishwasher tablet', '洗碗凝珠', '洗碗粉'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['碳酸钠', '过碳酸钠', '酶'],
    symptoms: ['呕吐', '口腔刺激', '胃肠刺激'],
    detail: '洗碗机洗涤块含强碱和酶，可导致口腔和胃肠灼伤。色彩鲜艳的凝珠可能吸引宠物啃食。建议存放在宠物无法接触的位置。',
    firstAid: '用清水冲洗口腔，联系兽医。不要诱导呕吐。'
  },
  {
    id: 'laundry_pod',
    name: '洗衣凝珠',
    aliases: ['laundry pod', '洗衣胶囊', '洗衣凝珠'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['表面活性剂', '酶', '漂白剂'],
    symptoms: ['呕吐', '口腔刺激', '呼吸困难', '胃肠刺激'],
    detail: '洗衣凝珠含浓缩洗涤剂，咬破后液体可喷射到咽喉导致呼吸困难。色彩鲜艳吸引宠物啃食。是宠物中毒热线常见来电原因。建议安全存放。',
    firstAid: '咬破后立即用清水冲洗口腔，联系兽医。'
  },
  {
    id: 'battery_lithium',
    name: '锂电池/纽扣电池',
    aliases: ['lithium battery', '纽扣电池', 'coin cell battery'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['锂', '氢氧化钾'],
    symptoms: ['口腔灼伤', '呕吐', '食管穿孔', '死亡'],
    detail: '锂电池卡在食管中可在1-2小时内产生电流导致组织坏死和食管穿孔。纽扣电池体积小易被吞食。是医疗紧急情况。遥控器、钥匙扣、贺卡中的电池都需安全存放。',
    firstAid: '疑似吞食立即送兽医急诊，X光定位。不要等待症状。'
  },
  {
    id: 'coin',
    name: '硬币',
    aliases: ['coin', '硬币', '铜板'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['锌', '铜'],
    symptoms: ['呕吐', '厌食', '溶血', '肾衰竭'],
    detail: '1982年后美国便士含97.5%锌，锌在胃酸中溶解可导致锌中毒和溶血。硬币也可导致胃肠梗阻。犬可能吞食地面硬币。',
    firstAid: '疑似吞食送兽医，X光定位。'
  },
  {
    id: 'small_magnet',
    name: '小磁铁',
    aliases: ['small magnet', '磁力珠', '巴克球'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    symptoms: ['呕吐', '腹痛', '胃肠穿孔'],
    detail: '吞食多个磁铁可导致肠段之间相互吸引，造成肠壁缺血坏死和穿孔。即使间隔数天吞食也危险。磁力珠（巴克球）尤其危险。是外科紧急情况。',
    firstAid: '疑似吞食立即送兽医，X光定位。'
  },
  {
    id: 'plastic_wrap',
    name: '保鲜膜/塑料袋',
    aliases: ['plastic wrap', '保鲜袋', '食品包装膜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    symptoms: ['呕吐', '胃肠梗阻', '窒息'],
    detail: '保鲜膜和塑料袋本身无毒，但吞食可导致胃肠梗阻或窒息。沾有食物气味的塑料更可能被宠物啃食。建议妥善处理食品包装。',
    firstAid: '吞食大量联系兽医。'
  },
  {
    id: 'aluminum_foil',
    name: '锡纸/铝箔',
    aliases: ['aluminum foil', '锡箔纸', '铝箔纸'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    symptoms: ['呕吐', '胃肠梗阻', '口腔切割'],
    detail: '铝箔本身毒性低，但吞食可导致胃肠梗阻或口腔切割伤。沾有食物的铝箔更可能被宠物啃食。建议妥善处理。',
    firstAid: '吞食大量联系兽医。'
  },
  {
    id: 'chewing_gum_xylitol',
    name: '口香糖（含木糖醇）',
    aliases: ['xylitol gum', '无糖口香糖', '木糖醇口香糖'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog'],
    dangerousCompounds: ['木糖醇'],
    toxicDoses: '0.1g/kg可导致低血糖，0.5g/kg可导致肝衰竭',
    symptoms: ['低血糖', '呕吐', '嗜睡', '抽搐', '肝衰竭', '死亡'],
    detail: '含木糖醇的口香糖对犬有致命毒性。木糖醇导致犬胰岛素大量释放引起严重低血糖，继而可导致急性肝衰竭。一包口香糖含木糖醇量足以杀死大型犬。猫对木糖醇敏感性较低但仍需避免。',
    firstAid: '立即送兽医急诊，携带产品标签确认木糖醇含量。'
  },
  {
    id: 'peanut_butter_xylitol',
    name: '花生酱（含木糖醇）',
    aliases: ['xylitol peanut butter', '无糖花生酱'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog'],
    dangerousCompounds: ['木糖醇'],
    symptoms: ['低血糖', '呕吐', '嗜睡', '抽搐', '肝衰竭'],
    detail: '部分"无糖"或"减脂"花生酱含木糖醇，对犬有致命毒性。喂食花生酱前必须确认成分表不含木糖醇。选择100%纯花生酱是安全的。',
    firstAid: '立即送兽医急诊。'
  },
  {
    id: 'sugar_free_candy_xylitol',
    name: '无糖糖果（含木糖醇）',
    aliases: ['sugar free candy', '无糖软糖', '木糖醇糖果'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog'],
    dangerousCompounds: ['木糖醇'],
    symptoms: ['低血糖', '呕吐', '抽搐', '肝衰竭'],
    detail: '无糖糖果常含木糖醇作为甜味剂，对犬有致命毒性。木糖醇在无糖糖果中浓度可能很高。必须检查成分表。',
    firstAid: '立即送兽医急诊。'
  },
  {
    id: 'sugar_free_jello',
    name: '无糖果冻（含木糖醇）',
    aliases: ['sugar free jello', '无糖吉利丁', '木糖醇果冻'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog'],
    dangerousCompounds: ['木糖醇'],
    symptoms: ['低血糖', '呕吐', '抽搐'],
    detail: '无糖果冻可能含木糖醇，对犬有毒性。喂食前必须确认成分。普通含糖果冻少量通常安全但含糖量高。',
    firstAid: '含木糖醇立即送兽医。'
  },
  {
    id: 'bbq_sauce',
    name: '烧烤酱',
    aliases: ['BBQ sauce', '烤肉酱', '烧烤汁'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['洋葱粉', '大蒜粉', '高盐', '高糖'],
    symptoms: ['胃肠不适', '贫血（长期大量）'],
    detail: '烧烤酱含洋葱粉、大蒜粉、高盐和高糖，对宠物不友好。少量舔食通常无害，但大量摄入洋葱粉可导致溶血性贫血。建议不要给宠物喂食含调味酱的食物。',
    firstAid: '少量通常无需处理，大量摄入联系兽医。'
  },
  {
    id: 'soy_sauce',
    name: '酱油',
    aliases: ['soy sauce', '生抽', '老抽'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['高盐'],
    symptoms: ['多饮多尿', '呕吐', '盐中毒'],
    detail: '酱油含盐量极高，一汤匙酱油含约1000mg钠。大量摄入可导致盐中毒。建议不要给宠物喂食含酱油的食物。',
    firstAid: '大量摄入联系兽医，确保充足饮水。'
  },
  {
    id: 'hot_sauce',
    name: '辣椒酱/辣酱',
    aliases: ['hot sauce', '辣椒酱', '辣油'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['辣椒素'],
    symptoms: ['口腔刺激', '流涎', '呕吐', '腹泻'],
    detail: '辣椒酱含辣椒素，可导致口腔和胃肠刺激。宠物对辣味的耐受性远低于人类。虽然通常不致命，但可导致明显不适。建议不要给宠物喂食辣味食物。',
    firstAid: '提供清水，少量通常自行恢复。'
  },
  {
    id: 'ketchup',
    name: '番茄酱',
    aliases: ['ketchup', '番茄沙司'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['高糖', '高盐', '洋葱粉'],
    symptoms: ['胃肠不适'],
    detail: '番茄酱含高糖、高盐和少量洋葱粉。少量舔食通常无害，但不宜作为常规喂食。无盐无糖版本稍好但仍含洋葱粉。',
    firstAid: '少量通常无需处理。'
  },
  {
    id: 'mustard',
    name: '芥末',
    aliases: ['mustard', '黄芥末', '芥末酱'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['芥子油苷'],
    symptoms: ['胃肠刺激', '呕吐', '腹泻'],
    detail: '芥末含芥子油苷，可导致胃肠刺激。少量通常无害但可引起不适。大量摄入可导致更严重的胃肠症状。',
    firstAid: '少量通常自行恢复，大量摄入联系兽医。'
  },
  {
    id: 'mayonnaise',
    name: '蛋黄酱',
    aliases: ['mayonnaise', '沙拉酱', '美乃滋'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    symptoms: ['呕吐', '腹泻', '胰腺炎风险'],
    detail: '蛋黄酱含高脂肪，少量通常无害但大量可导致胃肠不适和胰腺炎。不建议作为常规喂食。',
    firstAid: '少量通常无需处理，大量摄入注意胰腺炎症状。'
  },
  {
    id: 'salad_dressing',
    name: '沙拉酱',
    aliases: ['salad dressing', '千岛酱', '凯撒酱'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['洋葱粉', '大蒜粉', '高脂肪'],
    symptoms: ['胃肠不适', '胰腺炎风险'],
    detail: '沙拉酱含高脂肪、洋葱粉、大蒜粉等对宠物不友好的成分。少量舔食通常无害，但大量摄入有胰腺炎风险。',
    firstAid: '少量通常无需处理。'
  },
  {
    id: 'vinegar',
    name: '醋',
    aliases: ['vinegar', '白醋', '苹果醋'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    symptoms: ['口腔刺激', '呕吐'],
    detail: '少量醋通常无害，极少量苹果醋有时被建议作为补充剂。但大量摄入可导致口腔和胃肠刺激、酸碱平衡紊乱。不建议主动喂食。',
    firstAid: '少量通常无需处理，大量摄入联系兽医。'
  },
  {
    id: 'cooking_oil',
    name: '食用油（大量）',
    aliases: ['cooking oil large', '植物油大量', '菜籽油大量'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    symptoms: ['腹泻', '呕吐', '胰腺炎'],
    detail: '少量食用油通常无害，但大量摄入可导致严重腹泻和胰腺炎。不要给宠物喂食油炸食物或大量油脂。',
    firstAid: '大量摄入注意胰腺炎症状，联系兽医。'
  },
  {
    id: 'bone_broth_onion',
    name: '含洋葱骨汤',
    aliases: ['bone broth with onion', '洋葱骨头汤', '洋葱炖汤'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['二丙基二硫化物', '洋葱毒素'],
    symptoms: ['胃肠不适', '溶血性贫血'],
    detail: '含洋葱的骨汤对犬猫有危险，洋葱毒素可导致溶血性贫血。许多商业骨汤含洋葱粉。选择宠物专用骨汤或确认无洋葱成分。',
    firstAid: '联系兽医，可能需要监测红细胞。'
  },
  {
    id: 'baby_food_onion',
    name: '婴儿食品（含洋葱粉）',
    aliases: ['baby food with onion', '洋葱粉婴儿食品'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['洋葱粉'],
    symptoms: ['溶血性贫血', '虚弱', '苍白'],
    detail: '部分婴儿食品含洋葱粉作为调味，对犬猫有溶血性贫血风险。喂食婴儿食品前必须确认成分表不含洋葱粉和大蒜粉。',
    firstAid: '联系兽医，可能需要监测红细胞。'
  },
  {
    id: 'protein_powder',
    name: '蛋白粉',
    aliases: ['protein powder', '乳清蛋白', '蛋白补剂'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['木糖醇', '巧克力味', '人工甜味剂'],
    symptoms: ['胃肠不适', '低血糖（含木糖醇时）'],
    detail: '纯乳清蛋白粉少量对犬通常安全，但许多蛋白粉含木糖醇、巧克力味或人工甜味剂。必须确认成分表。宠物有专用蛋白补充剂。',
    firstAid: '含木糖醇立即送兽医，纯蛋白粉少量通常无需处理。'
  },
  {
    id: 'pre_workout',
    name: '运动前补剂',
    aliases: ['pre-workout', '氮泵', '能量补剂'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['咖啡因', '牛磺酸', 'β-丙氨酸'],
    symptoms: ['呕吐', '心动过速', '震颤', '抽搐'],
    detail: '运动前补剂含高剂量咖啡因和其他兴奋剂，对宠物有严重中毒风险。一勺运动前补剂含咖啡因量可能相当于数杯咖啡。',
    firstAid: '立即联系兽医。'
  },
  {
    id: 'energy_bar',
    name: '能量棒',
    aliases: ['energy bar', '蛋白棒', '代餐棒'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['木糖醇', '巧克力', '葡萄干', '坚果'],
    symptoms: ['胃肠不适', '低血糖（含木糖醇时）'],
    detail: '能量棒可能含木糖醇、巧克力、葡萄干或澳洲坚果等对宠物有毒的成分。必须检查成分表。少量纯谷物能量棒通常安全。',
    firstAid: '含木糖醇或巧克力立即送兽医。'
  },
  {
    id: 'chocolate_spread',
    name: '巧克力酱',
    aliases: ['chocolate spread', '巧克力榛子酱', 'Nutella'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['可可碱', '糖', '脂肪'],
    symptoms: ['呕吐', '腹泻', '心动过速', '震颤', '抽搐'],
    detail: '巧克力酱含可可碱和大量糖脂肪。可可碱对犬猫有毒。虽然可可含量低于纯巧克力，但大量摄入仍有风险。高脂肪还可导致胰腺炎。',
    firstAid: '大量摄入联系兽医。'
  },
  {
    id: 'cocoa_powder',
    name: '可可粉',
    aliases: ['cocoa powder', '生可可粉', '可可'],
    safetyLevel: 'toxic',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['可可碱', '咖啡因'],
    toxicDoses: '可可粉含可可碱量是巧克力的数倍，极少量即可中毒',
    symptoms: ['呕吐', '腹泻', '心动过速', '震颤', '抽搐', '死亡'],
    detail: '可可粉是可可碱浓度最高的巧克力制品之一，比普通巧克力毒性更强。烘焙用可可粉极少量即可导致犬中毒。是家庭中最危险的巧克力制品。',
    firstAid: '任何摄入量都应联系兽医。'
  },
  {
    id: 'carob',
    name: '角豆粉/代可可',
    aliases: ['carob', '角豆', '代巧克力'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '角豆粉不含可可碱，是巧克力的安全替代品。宠物专用"巧克力"零食通常用角豆粉制作。少量喂食是安全的。含糖量较高不宜过量。'
  },
  {
    id: 'pet_milk',
    name: '宠物专用奶',
    aliases: ['pet milk', '猫用奶', '犬用奶', '宠物奶粉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用奶经过特殊处理去除乳糖，是安全的牛奶替代品。适合幼宠或喜欢奶味的成年宠物。不应替代清水作为主要饮品。'
  },
  {
    id: 'goat_milk_pet_formula',
    name: '宠物羊奶粉',
    aliases: ['goat milk pet formula', '宠物山羊奶粉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用羊奶粉是安全的，乳糖含量低于牛奶。是幼宠断奶过渡的常用选择。按说明冲泡使用。'
  },
  {
    id: 'freeze_dried_liver',
    name: '冻干肝',
    aliases: ['freeze dried liver', '冻干鸡肝', '冻干牛肝'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '冻干肝少量作为零食是安全的，含高蛋白和维生素A。但维生素A含量高不宜大量喂食。建议选择单一成分无添加的产品。'
  },
  {
    id: 'dental_stick',
    name: '洁齿棒',
    aliases: ['dental stick', '洁齿条', '刷牙条'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '宠物专用洁齿棒适量使用是安全的，可帮助清洁牙齿减少牙垢。应选择VOHC认证产品。注意选择适合犬体型的尺寸，防止吞咽。'
  },
  {
    id: 'lick_mat_treat',
    name: '舔食垫零食',
    aliases: ['lick mat treat', '舔垫零食', '慢食垫'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '舔食垫上涂抹的宠物安全食物（如纯花生酱、酸奶、南瓜泥）是安全的。可帮助缓解焦虑和减慢进食速度。必须确认涂抹食物对宠物安全。'
  },
  {
    id: 'kong_stuffing',
    name: 'KONG填充零食',
    aliases: ['KONG stuffing', '漏食玩具零食'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: 'KONG玩具中填充的宠物安全食物是安全的。常用填充物包括纯花生酱、酸奶、南瓜泥等。必须确认填充食物对宠物安全，不含木糖醇。'
  },
  {
    id: 'bone_synthetic',
    name: '合成咀嚼骨',
    aliases: ['synthetic bone', '尼龙骨', '橡胶骨'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '宠物专用合成咀嚼骨（尼龙或橡胶材质）按说明使用是安全的。应选择适合犬体型和咀嚼力的产品。注意定期检查磨损情况，碎片过大时更换。'
  },
  {
    id: 'rawhide_alternative',
    name: '生皮替代咀嚼物',
    aliases: ['rawhide alternative', '安全咀嚼物', '植物咀嚼骨'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '植物基或安全材质的生皮替代品按说明使用是安全的。比传统生皮更易消化。应选择正规品牌产品，注意适合犬体型。'
  },
  {
    id: 'cat_treat_liquid',
    name: '猫条/液体零食',
    aliases: ['cat treat liquid', '猫条', '液体猫零食', '猫舔零食'],
    safetyLevel: 'safe',
    speciesApplicable: ['cat'],
    detail: '正规品牌的猫条/液体零食按说明使用是安全的。应选择成分清晰的产品。零食不应超过每日总热量的10%。部分产品含较高水分可帮助补水。'
  },
  {
    id: 'dental_water_additive',
    name: '洁齿饮水添加剂',
    aliases: ['dental water additive', '洁齿水', '口腔护理液'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用洁齿饮水添加剂按说明使用是安全的，可帮助减少牙菌斑。应选择VOHC认证产品。必须使用宠物专用产品，不要使用人类漱口水。'
  }
]
