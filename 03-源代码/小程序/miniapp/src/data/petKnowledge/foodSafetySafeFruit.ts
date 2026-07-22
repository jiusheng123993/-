import type { FoodSafetyItem } from './foodSafety'

export const FOOD_SAFETY_SAFE_FRUIT: FoodSafetyItem[] = [
  {
    id: 'pear',
    name: '梨',
    aliases: ['雪梨', 'pear', '鸭梨', '香梨'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '梨去籽去核后少量喂食是安全的，含纤维和维生素C。必须去核（籽含氰苷）。建议切成小块少量喂食。含糖量较高不宜过量。'
  },
  {
    id: 'peach',
    name: '桃子',
    aliases: ['peach', '水蜜桃', '黄桃'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '桃子去核后少量喂食是安全的，含维生素A和C。必须去核（核含氰苷且可造成梗阻）。建议切成小块少量喂食。罐头桃子含糖量高不适合。'
  },
  {
    id: 'plum',
    name: '李子',
    aliases: ['plum', '青李', '红李', '黑李'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '李子去核后少量喂食是安全的，含维生素C和纤维。必须去核（核含氰苷且可造成梗阻）。建议切成小块少量喂食。'
  },
  {
    id: 'apricot',
    name: '杏',
    aliases: ['apricot', '黄杏', '杏子'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '杏去核后少量喂食是安全的，含维生素A和C。必须去核（核含氰苷）。杏干含糖量高不建议喂食。建议少量新鲜杏肉。'
  },
  {
    id: 'cherry',
    name: '樱桃',
    aliases: ['cherry', '甜樱桃', '车厘子'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '樱桃去核去梗后少量喂食是安全的，含抗氧化物和维生素C。必须去核去梗（核含氰苷且可造成梗阻，梗有毒）。建议少量去核果肉。'
  },
  {
    id: 'kiwi',
    name: '猕猴桃',
    aliases: ['kiwi', '奇异果', '猕猴桃'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '猕猴桃去皮后少量喂食是安全的，含维生素C和纤维。含猕猴桃蛋白酶，少量安全但大量可刺激口腔。建议去皮少量喂食。'
  },
  {
    id: 'orange',
    name: '橙子',
    aliases: ['orange', '甜橙', '脐橙'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '橙子去皮去籽后少量喂食是安全的，含维生素C。柠檬酸可能刺激胃肠，不宜大量。建议少量果肉。猫通常不喜欢柑橘类。'
  },
  {
    id: 'pomelo',
    name: '柚子',
    aliases: ['pomelo', '葡萄柚', '西柚', '沙田柚'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '柚子去皮去籽后少量喂食是安全的，含维生素C。柠檬酸可能刺激胃肠，不宜大量。建议少量果肉。'
  },
  {
    id: 'mandarin',
    name: '柑橘',
    aliases: ['mandarin', '橘子', '砂糖橘', '蜜橘'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '柑橘去皮去籽后少量喂食是安全的，含维生素C。不宜大量（柠檬酸刺激胃肠）。建议少量果肉。'
  },
  {
    id: 'dragon_fruit',
    name: '火龙果',
    aliases: ['dragon fruit', '红龙果', '白龙果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '火龙果少量喂食是安全的，含维生素C和纤维。红心火龙果可能使尿液变红，这是正常现象。含糖量较高不宜过量。建议少量。'
  },
  {
    id: 'sugar_apple',
    name: '释迦果',
    aliases: ['sugar apple', '番荔枝', 'custard apple'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '释迦果去籽后少量果肉喂食是安全的。释迦果籽含毒素必须去籽。含糖量极高不宜过量。建议少量去籽果肉。'
  },
  {
    id: 'wax_apple',
    name: '莲雾',
    aliases: ['wax apple', '水蒲桃', '天桃'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '莲雾去籽后少量喂食是安全的，含水量高热量低。建议少量去籽喂食。'
  },
  {
    id: 'pepino_melon',
    name: '人参果',
    aliases: ['pepino melon', '香瓜茄', '长寿果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '人参果少量喂食是安全的，含维生素C和水分。建议少量喂食。'
  },
  {
    id: 'wampee',
    name: '黄皮',
    aliases: ['wampee', '黄皮果', '黄弹子'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '黄皮去核后少量喂食是安全的，含维生素C。必须去核。建议少量去核果肉。'
  },
  {
    id: 'rambutan',
    name: '红毛丹',
    aliases: ['rambutan', '毛荔枝', '红毛果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '红毛丹去壳去核后少量喂食是安全的，含维生素C。必须去壳去核。含糖量较高不宜过量。建议少量。'
  },
  {
    id: 'mangosteen',
    name: '山竹',
    aliases: ['mangosteen', '倒捻子', '莽吉柿'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '山竹去壳后少量果肉喂食是安全的，含抗氧化物。含糖量较高不宜过量。建议少量果肉。'
  },
  {
    id: 'coconut_meat',
    name: '椰子肉',
    aliases: ['coconut meat', '椰肉', '椰丝'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '新鲜椰子肉少量喂食是安全的，含中链脂肪酸。含脂肪较高不宜过量。建议少量新鲜椰肉。'
  },
  {
    id: 'coconut_water_pure',
    name: '椰子水（纯）',
    aliases: ['coconut water pure', '纯椰水', '新鲜椰汁'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '纯新鲜椰子水少量喂食是安全的，含电解质和钾。含钾较高，有肾脏问题的宠物应避免。建议少量。'
  },
  {
    id: 'date_fruit',
    name: '枣（去核）',
    aliases: ['鲜枣', 'date fruit', '青枣', '冬枣'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鲜枣去核后少量喂食是安全的，含维生素C。必须去核（核可造成梗阻）。含糖量较高不宜过量。建议少量去核鲜枣。'
  },
  {
    id: 'melon',
    name: '香瓜',
    aliases: ['melon', '甜瓜', '白兰瓜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '香瓜去籽后少量喂食是安全的，含水量高。必须去籽。含糖量较高不宜过量。建议少量。'
  },
  {
    id: 'kumquat',
    name: '金桔',
    aliases: ['kumquat', '金橘', '金枣'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '金桔少量喂食是安全的，含维生素C。酸度较高不宜大量。建议极少量偶尔喂食。'
  },
  {
    id: 'star_fruit',
    name: '杨桃',
    aliases: ['star fruit', '五敛子', '阳桃'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '杨桃少量去棱后喂食对犬通常安全，含维生素C。有肾脏问题的宠物应完全避免（杨桃含神经毒素）。猫建议避免。建议少量。'
  },
  {
    id: 'guava',
    name: '番石榴',
    aliases: ['guava', '芭乐', '鸡屎果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '番石榴去籽后少量喂食是安全的，含维生素C和纤维。籽较硬可能造成胃肠刺激，建议去籽。建议少量去籽果肉。'
  },
  {
    id: 'green_date',
    name: '青枣',
    aliases: ['green date', '蜜丝枣', '台湾青枣'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '青枣去核后少量喂食是安全的，含维生素C。必须去核。建议少量去核喂食。'
  },
  {
    id: 'winter_date',
    name: '冬枣',
    aliases: ['winter date', '沾化冬枣', '冰糖枣'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '冬枣去核后少量喂食是安全的，含维生素C。必须去核。含糖量较高不宜过量。建议少量去核喂食。'
  },
  {
    id: 'cherimoya',
    name: '车厘子',
    aliases: ['cherimoya', '大樱桃', '甜樱桃'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '车厘子去核去梗后少量喂食是安全的，含抗氧化物。必须去核去梗。建议少量去核果肉。'
  },
  {
    id: 'black_currant',
    name: '黑加仑',
    aliases: ['black currant', '黑醋栗', '黑加仑子'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '黑加仑少量喂食是安全的，含维生素C和抗氧化物。偶尔少量作为零食。'
  },
  {
    id: 'red_currant',
    name: '红醋栗',
    aliases: ['red currant', '红加仑'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '红醋栗少量喂食是安全的，含维生素C。偶尔少量作为零食。'
  },
  {
    id: 'gooseberry',
    name: '鹅莓',
    aliases: ['gooseberry', '醋栗', '灯笼果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鹅莓少量喂食是安全的，含维生素C和纤维。偶尔少量作为零食。'
  },
  {
    id: 'boysenberry',
    name: '波森莓',
    aliases: ['boysenberry', '波伊森莓'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '波森莓少量喂食是安全的，含抗氧化物和纤维。偶尔少量作为零食。'
  },
  {
    id: 'elderberry_cooked',
    name: '接骨木果（煮熟）',
    aliases: ['elderberry cooked', '接骨木莓'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '接骨木果煮熟后少量喂食是安全的，含抗氧化物。生接骨木果含凝集素和氰苷有毒，必须煮熟。建议少量煮熟果肉。'
  },
  {
    id: 'rose_hip',
    name: '玫瑰果',
    aliases: ['rose hip', '蔷薇果', '玫瑰籽'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '玫瑰果去籽后少量喂食是安全的，含极高维生素C。必须去籽（籽毛可刺激消化道）。建议少量去籽果肉。'
  },
  {
    id: 'sea_buckthorn',
    name: '沙棘果',
    aliases: ['sea buckthorn', '沙棘', '醋柳果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '沙棘果少量喂食是安全的，含极高维生素C和维生素E。酸度较强不宜大量。建议少量。'
  },
  {
    id: 'jackfruit',
    name: '菠萝蜜',
    aliases: ['jackfruit', '木菠萝', '大树菠萝'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '菠萝蜜去核后少量果肉喂食是安全的。含糖量极高不宜过量。必须去核。建议极少量。'
  },
  {
    id: 'durian',
    name: '榴莲',
    aliases: ['durian', '榴梿'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '榴莲少量果肉喂食对犬通常安全，但含脂肪和糖分极高，不宜过量。气味强烈多数宠物不愿食用。建议极少量尝试。'
  },
  {
    id: 'plantain',
    name: '大蕉',
    aliases: ['plantain', '烹饪蕉', '芭蕉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '大蕉煮熟后少量喂食是安全的，含钾和纤维。必须煮熟，生大蕉难以消化。建议少量煮熟后喂食。'
  },
]
