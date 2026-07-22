import type { FoodSafetyItem } from './foodSafety'

export const FOOD_SAFETY_CAUTION_A: FoodSafetyItem[] = [
  {
    id: 'tuna',
    name: '金枪鱼',
    aliases: ['吞拿鱼', 'tuna', '金枪鱼罐头'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '金枪鱼适量喂食通常安全，但大量长期食用有风险。金枪鱼可能含汞等重金属，长期食用可导致汞蓄积。猫对金枪鱼容易上瘾，可能拒绝其他食物导致营养失衡。金枪鱼罐头含盐量高，应选择无盐版本。建议偶尔少量作为零食。'
  },
  {
    id: 'sardine',
    name: '沙丁鱼',
    aliases: ['沙甸鱼', 'sardine', '沙丁鱼罐头'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '沙丁鱼营养丰富含Omega-3脂肪酸，但罐装沙丁鱼含盐量高，应选择无盐或低盐水浸版本。油浸沙丁鱼脂肪过高。适量喂食有益，但需注意盐分摄入。建议每周不超过1-2次。'
  },
  {
    id: 'shrimp',
    name: '虾',
    aliases: ['明虾', '大虾', '基围虾', 'shrimp'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '虾煮熟去壳后少量喂食通常安全，富含蛋白质。但必须完全煮熟以杀灭寄生虫，必须去壳去虾线（壳可能造成消化道损伤和梗阻）。虾胆固醇较高，不宜大量喂食。部分宠物可能对虾过敏，首次喂食少量观察。'
  },
  {
    id: 'crab_meat',
    name: '蟹肉',
    aliases: ['螃蟹肉', '蟹腿肉', 'crab meat'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '蟹肉少量煮熟后喂食通常安全，但必须完全煮熟去壳。蟹壳碎片可造成消化道损伤。蟹肉胆固醇和钠含量较高，不宜大量喂食。部分宠物可能对甲壳类过敏。不要喂食调味蟹肉产品。'
  },
  {
    id: 'shellfish',
    name: '贝类',
    aliases: ['蛤蜊', '扇贝', '青口', '牡蛎', '生蚝'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '贝类煮熟后少量喂食通常安全，但过敏风险较高。必须完全煮熟以杀灭寄生虫和细菌，生贝类可能含弧菌等致病菌。部分宠物可能对贝类严重过敏，首次喂食极少量观察。不要喂食调味或蒜蓉贝类。'
  },
  {
    id: 'beef_fatty',
    name: '牛肉（高脂）',
    aliases: ['肥牛肉', '牛腩', '牛肋条', '肥牛'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '高脂部位牛肉（肥牛、牛腩）脂肪含量高，可引发胰腺炎。应选择瘦肉部位（牛里脊、牛腱），去除可见脂肪后煮熟喂食。不要添加调味料。适量瘦肉牛肉是安全的蛋白质来源。'
  },
  {
    id: 'pork_fatty',
    name: '猪肉（高脂）',
    aliases: ['五花肉', '肥猪肉', '猪五花', '猪颈肉'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '高脂猪肉（五花肉、猪颈肉）脂肪含量极高，是胰腺炎的主要诱因。应选择瘦猪肉（猪里脊），去除所有可见脂肪后煮熟喂食。生猪肉可能含旋毛虫，必须完全煮熟。培根和火腿等加工猪肉含盐量高，不建议喂食。'
  },
  {
    id: 'lamb_fatty',
    name: '羊肉（高脂）',
    aliases: ['羊排', '肥羊肉', '羊腿', '羊肩'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '羊肉脂肪含量较高，高脂部位可引发胰腺炎。应选择瘦羊肉，去除可见脂肪后煮熟喂食。羊肉是常见的过敏原之一，部分犬可能对羊肉不耐受。首次喂食少量观察是否有过敏反应。'
  },
  {
    id: 'duck_fatty',
    name: '鸭肉（高脂）',
    aliases: ['鸭胸', '鸭腿', '烤鸭', '鸭肉'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸭肉脂肪含量较高，尤其是鸭皮。应去皮后喂食瘦肉部分。烤鸭和调味鸭肉含盐和调味料，不适合宠物。鸭胸肉去皮煮熟后适量喂食是安全的蛋白质来源。'
  },
  {
    id: 'turkey_seasoned',
    name: '火鸡（调味）',
    aliases: ['感恩节火鸡', '烤火鸡', 'turkey'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '调味烤火鸡含盐、洋葱、大蒜和香料，对宠物有害。火鸡胸肉无调味煮熟后是安全的蛋白质来源。火鸡骨头煮熟后易碎裂，有造成消化道损伤的风险。感恩节后因宠物偷食调味火鸡导致的胰腺炎病例常见。'
  },
  {
    id: 'chicken_bone_in',
    name: '鸡肉（带骨）',
    aliases: ['鸡腿', '鸡翅', '鸡架', '整鸡'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '带骨鸡肉有骨头碎裂造成消化道损伤的风险，尤其是煮熟后的鸡骨。应去骨后喂食纯肉。鸡皮脂肪含量高应去除。鸡脖子生食有争议，建议煮熟后少量喂食。必须无调味。'
  },
  {
    id: 'fish_bone',
    name: '鱼肉（有刺）',
    aliases: ['鱼刺', '鱼骨', '整鱼', '鱼段'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鱼刺可造成口腔和消化道损伤或梗阻。应选择无刺鱼块或仔细去刺后喂食。必须完全煮熟以杀灭寄生虫和病原体。不要喂食生鱼。三文鱼、鳕鱼等无刺鱼块煮熟后是安全选择。'
  },
  {
    id: 'rabbit_meat',
    name: '兔肉',
    aliases: ['兔腿', '兔肉', 'rabbit'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '兔肉是低脂肪高蛋白的肉类，煮熟无调味后适量喂食通常安全。但兔肉作为单一蛋白质来源可能导致营养失衡（兔肉饥饿症）。应搭配其他食物。部分宠物食品使用兔肉作为低敏蛋白源。'
  },
  {
    id: 'venison',
    name: '鹿肉',
    aliases: ['鹿肉', 'deer meat', 'venison'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鹿肉是低脂肪高蛋白的肉类，煮熟无调味后适量喂食通常安全。野生鹿肉可能含寄生虫，必须完全煮熟。部分宠物食品使用鹿肉作为低敏蛋白源。首次喂食少量观察。'
  },
  {
    id: 'quail_egg',
    name: '鹌鹑蛋',
    aliases: ['鹌鹑蛋', '小鸡蛋', 'quail egg'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鹌鹑蛋完全煮熟后适量喂食是安全的蛋白质来源。与鸡蛋一样必须完全煮熟以避免沙门氏菌和抗生物素蛋白。营养密度高于鸡蛋，但喂食量应相应减少。小型犬每次1-2个，大型犬可适当增加。'
  },
  {
    id: 'tofu',
    name: '豆腐',
    aliases: ['老豆腐', '嫩豆腐', '豆腐干', '豆制品'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '豆腐少量喂食通常安全，但营养价值对猫狗较低。大豆蛋白不是宠物理想的蛋白质来源。部分宠物可能对大豆过敏。豆腐含植物雌激素，长期大量食用可能影响内分泌。建议偶尔少量，不要作为主要蛋白质来源。'
  },
  {
    id: 'soy_milk',
    name: '豆浆',
    aliases: ['豆奶', 'soy milk', '豆乳'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖豆浆少量喂食通常安全，但营养价值对猫狗较低。含糖豆浆含糖量高不宜喂食。部分宠物可能对大豆过敏或乳糖不耐受（豆浆虽无乳糖但含低聚糖可致胀气）。不建议作为日常饮品。'
  },
  {
    id: 'oatmeal',
    name: '燕麦',
    aliases: ['燕麦片', '麦片', 'oatmeal', '燕麦粥'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖无调味燕麦片煮熟后适量喂食通常安全，富含可溶性纤维。但调味燕麦片含糖和人工调味料，不适合宠物。猫对谷物的消化能力有限，不建议作为猫的常规食物。犬可偶尔少量食用。'
  },
  {
    id: 'brown_rice',
    name: '糙米',
    aliases: ['全麦米', 'brown rice', '粗粮'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '糙米煮熟后适量喂食通常安全，营养价值高于白米。但糙米含较多纤维和植酸，消化难度较大，可能引起胃肠不适。建议充分煮熟至软烂。肠胃敏感的宠物更适合白米。'
  },
  {
    id: 'sweet_potato_large',
    name: '红薯（大量）',
    aliases: ['地瓜大量', '番薯大量', '甘薯大量'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '红薯适量煮熟后是安全的，但大量喂食可导致消化不良和腹胀、腹泻。红薯含糖量较高，糖尿病宠物应限制。必须去皮煮熟，生红薯难以消化。不要喂食红薯皮或发芽红薯。'
  },
  {
    id: 'pumpkin_large',
    name: '南瓜（大量）',
    aliases: ['南瓜泥大量', '南瓜大量'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '南瓜适量是安全的，但大量喂食可导致腹泻（因高纤维含量）。纯南瓜泥常用于缓解便秘和腹泻，但需控制量。不要使用含糖和香料的南瓜派馅料。维生素A含量高，长期大量可能蓄积。'
  },
  {
    id: 'zucchini',
    name: '西葫芦',
    aliases: ['角瓜', 'zucchini', '夏南瓜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '西葫芦少量煮熟后喂食通常安全，含水量高热量低。但苦味西葫芦含葫芦素，可导致胃肠中毒。如果西葫芦味道苦应立即丢弃。建议少量煮熟后喂食。'
  },
  {
    id: 'celery',
    name: '芹菜',
    aliases: ['旱芹', 'celery', '西芹', '水芹'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '芹菜少量喂食通常安全，含水量高热量低。但芹菜纤维粗硬，可能造成窒息或消化道刺激。建议切成小段煮熟后喂食。芹菜含少量呋喃香豆素，大量食用可能影响药物代谢。'
  },
  {
    id: 'asparagus',
    name: '芦笋',
    aliases: ['asparagus', '石刁柏', '龙须菜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '芦笋煮熟后少量喂食通常安全。生芦笋难以消化，可能引起胃肠不适。建议切成小段煮熟后少量喂食。芦笋可能使尿液有异味，这是正常现象。大量食用可导致胃肠不适。'
  },
  {
    id: 'eggplant',
    name: '茄子',
    aliases: ['矮瓜', 'eggplant', 'aubergine'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '茄子煮熟后少量喂食通常安全。茄子属于茄科植物，含少量茄碱，大量食用可能有风险。生茄子含茄碱较高不建议喂食。建议去皮煮熟后少量喂食。猫通常对茄子不感兴趣。'
  },
  {
    id: 'green_pepper',
    name: '青椒',
    aliases: ['甜椒', '灯笼椒', 'green pepper', 'bell pepper'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '青椒少量喂食通常安全，富含维生素C。但辣椒类（非甜椒）含辣椒素对宠物有害。必须区分甜椒和辣椒。建议去籽煮熟后少量喂食。红黄甜椒比青椒营养更丰富。'
  },
  {
    id: 'edible_mushroom',
    name: '蘑菇（可食用品种）',
    aliases: ['香菇', '白蘑菇', '金针菇', '杏鲍菇'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '超市出售的常见食用蘑菇煮熟后少量喂食通常安全。但蘑菇营养价值对宠物有限，且野外蘑菇极其危险（可能致命），建议不要培养宠物吃蘑菇的习惯，以免宠物在户外误食毒蘑菇。所有野生蘑菇必须视为有毒。'
  },
  {
    id: 'olive',
    name: '橄榄',
    aliases: ['青橄榄', '黑橄榄', 'olive', '橄榄果'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '橄榄去核后少量喂食通常安全，但含盐量较高（尤其是腌制橄榄）。应选择无盐或低盐橄榄，必须去核（果核可造成梗阻或牙齿损伤）。建议偶尔少量。橄榄油少量添加到食物中通常安全。'
  },
  {
    id: 'coconut_oil_large',
    name: '椰子油（大量）',
    aliases: ['椰油大量', 'coconut oil', 'MCT油'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '椰子油极少量可能对犬皮肤和毛发有益，但大量可导致腹泻和胰腺炎。中链甘油三酯（MCT）虽比长链脂肪易消化，但仍是脂肪。建议犬每次不超过1茶匙（小型犬更少）。猫使用椰子油的安全性研究不足，建议谨慎。'
  },
  {
    id: 'flaxseed',
    name: '亚麻籽',
    aliases: ['亚麻籽粉', 'flaxseed', '亚麻籽油'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '亚麻籽磨碎后少量添加到食物中通常安全，含Omega-3脂肪酸和纤维。整粒亚麻籽无法消化会直接通过。亚麻籽油易氧化变质，需冷藏。适量使用有益，但亚麻籽中的ALA转化率低，不如鱼油有效。'
  },
  {
    id: 'chia_seed',
    name: '奇亚籽',
    aliases: ['chia seed', '奇雅籽', '鼠尾草籽'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '奇亚籽少量添加到食物中通常安全，含Omega-3和纤维。但奇亚籽吸水膨胀，干食后饮水可导致食道梗阻。建议先浸泡后再混入食物。适量使用有益，但不宜大量。'
  },
  {
    id: 'sunflower_seed',
    name: '葵花籽',
    aliases: ['葵瓜子', 'sunflower seed', '向日葵籽'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '葵花籽去壳后少量喂食通常安全，含维生素E和健康脂肪。但壳不可消化可造成消化道损伤，必须去壳。盐焗葵花籽含盐量高不适合。高脂肪含量意味着不宜大量喂食。猫通常不感兴趣。'
  },
  {
    id: 'pumpkin_seed',
    name: '南瓜籽',
    aliases: ['南瓜子', 'pumpkin seed', '白瓜子'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '南瓜籽磨碎或压碎后少量喂食通常安全，含锌和健康脂肪。整粒南瓜籽可能无法消化。盐焗南瓜籽含盐量高不适合。南瓜籽传统上被认为有驱虫效果，但不应替代正规驱虫药。建议磨碎后少量添加。'
  },
  {
    id: 'watermelon_seed',
    name: '西瓜（带籽）',
    aliases: ['西瓜籽', '有籽西瓜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '西瓜果肉安全，但西瓜籽可能造成肠梗阻（尤其小型犬）。建议使用无籽西瓜或仔细去籽。西瓜含糖量较高，不宜过量。是夏季消暑的好选择，但需控制量。'
  },
  {
    id: 'cantaloupe',
    name: '哈密瓜',
    aliases: ['蜜瓜', 'cantaloupe', '甜瓜', '网纹瓜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '哈密瓜果肉去籽后少量喂食通常安全，富含维生素A和C。但含糖量较高，不宜过量。糖尿病和肥胖宠物应限制。必须去籽（籽可能造成梗阻）。建议少量作为偶尔零食。'
  },
  {
    id: 'honeydew',
    name: '蜜瓜',
    aliases: ['白兰瓜', 'honeydew', '蜜露瓜', '伊丽莎白瓜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '蜜瓜果肉去籽后少量喂食通常安全，含水量高。但含糖量较高，不宜过量。糖尿病和肥胖宠物应限制。必须去籽。建议少量作为偶尔零食。'
  },
  {
    id: 'pineapple',
    name: '菠萝',
    aliases: ['凤梨', 'pineapple', '黄梨'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '菠萝少量去皮去芯后喂食通常安全，含菠萝蛋白酶可帮助消化。但菠萝蛋白酶也可刺激口腔和胃肠黏膜，大量食用可导致腹泻。必须去皮去芯。建议少量偶尔少量作为零食。猫通常对菠萝不感兴趣。'
  },
  {
    id: 'mango',
    name: '芒果',
    aliases: ['mango', '芒果肉', '芒果干'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '芒果少量去皮去核后喂食通常安全，富含维生素A和C。但芒果皮含漆酚可导致过敏反应，必须去皮。果核可造成梗阻，必须去核。含糖量较高不宜过量。芒果干含糖量更高不建议喂食。'
  },
  {
    id: 'papaya',
    name: '木瓜',
    aliases: ['番木瓜', 'papaya', '木瓜肉'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '木瓜少量去皮去籽后喂食通常安全，含木瓜蛋白酶可帮助消化。但木瓜籽含微量生物碱不建议喂食。含糖量较高不宜过量。偶尔少量作为零食。'
  },
  {
    id: 'pomegranate',
    name: '石榴',
    aliases: ['pomegranate', '石榴籽', '石榴汁'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '石榴籽少量喂食通常安全，含抗氧化物。但石榴籽可能造成梗阻（尤其小型犬），且单宁含量高可导致便秘。含糖量较高不宜过量。建议少量去籽后喂食果肉部分。'
  },
  {
    id: 'passion_fruit',
    name: '百香果',
    aliases: ['热情果', 'passion fruit', '鸡蛋果'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '百香果少量果肉喂食通常安全，但含糖量高且酸度强，大量可刺激胃肠。籽可能造成小型犬梗阻。建议少量果肉偶尔喂食。猫通常对百香果不感兴趣。'
  },
  {
    id: 'longan',
    name: '龙眼',
    aliases: ['桂圆', 'longan', '龙眼肉'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '龙眼少量去壳去核后喂食通常安全，但含糖量极高，不宜过量。糖尿病和肥胖宠物应避免。果核可造成梗阻，必须去核。龙眼干（桂圆干）含糖量更高不建议喂食。'
  },
  {
    id: 'lychee',
    name: '荔枝',
    aliases: ['lychee', '荔枝肉', '妃子笑'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '荔枝少量去壳去核后喂食通常安全，但含糖量极高，不宜过量。空腹大量食用荔枝可导致低血糖（荔枝病）。果核可造成梗阻，必须去核。糖尿病和肥胖宠物应避免。'
  },
  {
    id: 'fig',
    name: '无花果',
    aliases: ['fig', '无花果肉', '无花果干'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无花果少量去皮后喂食通常安全，但无花果的白色汁液含呋喃香豆素和蛋白酶，可导致皮肤和口腔刺激。部分宠物可能对无花果过敏。无花果干含糖量高不建议喂食。建议少量尝试观察反应。'
  },
  {
    id: 'cranberry',
    name: '蔓越莓',
    aliases: ['cranberry', '小红莓', '蔓越莓干'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '蔓越莓少量喂食通常安全，传统上认为有助于预防尿路感染。但蔓越莓极酸，大量可刺激胃肠。蔓越莓干含糖量高不建议喂食。蔓越莓汁含糖量高且酸度强，不建议喂食。偶尔少量新鲜或冻干蔓越莓即可。'
  },
  {
    id: 'blackberry',
    name: '黑莓',
    aliases: ['blackberry', '黑刺莓', '黑树莓'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '黑莓少量喂食通常安全，含抗氧化物和纤维。但含糖量较高不宜过量。籽可能对小型犬造成轻微胃肠刺激。偶尔少量作为零食是安全的。'
  },
  {
    id: 'raspberry',
    name: '覆盆子',
    aliases: ['raspberry', '树莓', '红莓'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '覆盆子少量喂食通常安全，含抗氧化物和纤维。但含少量天然水杨酸盐，大量食用可能对猫不安全（猫对水杨酸盐敏感）。含糖量较高不宜过量。偶尔少量作为零食。'
  },
  {
    id: 'strawberry',
    name: '草莓',
    aliases: ['strawberry', '红草莓', '士多啤梨'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '草莓少量喂食通常安全，含维生素C和抗氧化物。但草莓含糖量较高不宜过量，且农药残留风险较高，应充分清洗或选择有机草莓。部分宠物可能对草莓过敏。偶尔少量作为零食。'
  },
  {
    id: 'goji_berry',
    name: '枸杞',
    aliases: ['goji berry', '枸杞子', '宁夏枸杞'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '枸杞少量喂食通常安全，含抗氧化物。但枸杞含少量阿托品，大量食用可能对宠物有害。枸杞干含糖量较高。建议偶尔少量。中药配方的枸杞汤不建议喂食（可能含其他成分）。'
  },
  {
    id: 'red_date',
    name: '红枣',
    aliases: ['枣', '大枣', '红枣肉', '中国枣'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '红枣去核后少量喂食通常安全，但含糖量极高不宜过量。枣核可造成梗阻或牙齿损伤，必须去核。红枣干含糖量更高不建议喂食。糖尿病和肥胖宠物应避免。'
  },
  {
    id: 'longan_dried',
    name: '桂圆（干）',
    aliases: ['桂圆干', '龙眼干', '圆肉'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '桂圆干含糖量极高，不建议喂食。新鲜龙眼少量去壳去核后尚可，但桂圆干因脱水浓缩糖分更高。果核可造成梗阻。糖尿病和肥胖宠物应完全避免。'
  },
  {
    id: 'hawthorn',
    name: '山楂',
    aliases: ['hawthorn', '红果', '山里红', '山楂片'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '山楂少量去核后喂食通常安全，含有机酸可助消化。但山楂含糖量和酸度较高，大量可刺激胃肠。山楂核可造成梗阻。山楂片和山楂糕含大量糖分不建议喂食。偶尔少量新鲜山楂即可。'
  },
  {
    id: 'loquat',
    name: '枇杷',
    aliases: ['loquat', '芦橘', '金丸'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '枇杷果肉少量去核后喂食通常安全。但枇杷核含氰苷，大量咀嚼可释放氰化物，必须去核。枇杷叶和枇杷仁入药但生品有毒。含糖量较高不宜过量。'
  },
  {
    id: 'bayberry',
    name: '杨梅',
    aliases: ['bayberry', '杨梅果', '树梅'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '杨梅少量喂食通常安全，含维生素C和抗氧化物。但杨梅酸度较高，大量可刺激胃肠。杨梅核较小但大量吞食可能造成梗阻。含糖量较高不宜过量。建议少量去核后喂食。'
  },
  {
    id: 'mulberry',
    name: '桑葚',
    aliases: ['mulberry', '桑果', '桑枣'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '桑葚少量喂食通常安全，含抗氧化物和铁。但桑葚含糖量较高不宜过量，且可能含微量致幻物质（未成熟桑葚）。大量食用可导致腹泻和胃肠不适。偶尔少量作为零食。'
  }
]
