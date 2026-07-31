import type { FoodSafetyItem } from './foodSafety'

/**
 * 安全水果数据
 * 宠物可安全食用的水果列表（含去核去籽等注意事项）
 */
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
  {
    id: 'lemon',
    name: '柠檬',
    aliases: ['lemon', '黄柠檬', '青柠檬', '柠檬果', '香水柠檬'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '柠檬去籽去皮后少量果肉喂食通常是安全的，含维生素C。柠檬酸含量高，大量可能刺激胃肠，不宜过量。果皮含柠檬烯和精油对宠物有毒（尤其浓缩精油），去皮的果肉少量安全。猫通常不喜酸味，不必强迫喂食。'
  },
  {
    id: 'lemon_peel',
    name: '柠檬皮（不可喂食）',
    aliases: ['柠檬皮', '干柠檬片', '柠檬干'],
    safetyLevel: 'dangerous',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['柠檬烯', '补骨脂素', '柠檬精油'],
    symptoms: ['呕吐', '腹泻', '皮肤光敏', '中枢抑制'],
    detail: '柠檬皮含高浓度柠檬烯和精油，大量摄入可导致中毒。干柠檬片仍含精油成分，不建议喂食。果肉少量安全，但果皮和精油有毒性。柠檬精油浓缩后毒性更强。'
  },
  {
    id: 'lime',
    name: '青柠',
    aliases: ['lime', '酸橙', '莱姆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '青柠去籽去皮后少量果肉喂食通常是安全的。果皮含精油有刺激性，不宜喂食。酸度较高，大量可刺激胃肠。建议极少量果肉。'
  },
  {
    id: 'passion_fruit',
    name: '百香果',
    aliases: ['passion fruit', '鸡蛋果', '热情果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '百香果少量果肉喂食是安全的，含维生素C和纤维。籽较小通常可耐受，但大量可能刺激胃肠。酸度极高，建议极少量测试。'
  },
  {
    id: 'pomegranate',
    name: '石榴',
    aliases: ['pomegranate', '红石榴', '安石榴'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    dangerousCompounds: ['鞣酸', '石榴碱'],
    detail: '石榴少量果肉通常安全，但果皮和根含石榴碱有毒性。籽硬可能造成胃肠刺激或梗阻。建议只给极少量果肉，并确保去籽去果皮。部分犬猫可能出现胃肠不适。'
  },
  {
    id: 'longan',
    name: '龙眼',
    aliases: ['longan', '桂圆', '龙眼肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '龙眼去壳去核后少量果肉喂食是安全的，含维生素C和糖分。必须去壳去核（核可造成梗阻）。含糖量极高不宜过量。建议极少量去核果肉。'
  },
  {
    id: 'lychee',
    name: '荔枝',
    aliases: ['lychee', '荔枝果', '糯米糍', '妃子笑'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '荔枝去壳去核后少量果肉喂食是安全的，含维生素C。必须去壳去核（核可造成梗阻）。含糖量极高不宜过量。建议极少量去核果肉。'
  },
  {
    id: 'mango',
    name: '芒果',
    aliases: ['mango', '芒果肉', '青芒果', '台农芒'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '芒果去皮去核后少量果肉喂食是安全的，含维生素A和C。必须去核（核含微量氰苷且可造成梗阻）。芒果皮含漆酚，部分宠物可能过敏。果肉含糖量高不宜过量。'
  },
  {
    id: 'papaya',
    name: '木瓜',
    aliases: ['papaya', '番木瓜', '青木瓜', '木瓜肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '木瓜去皮去籽后少量喂食是安全的，含木瓜酵素助消化，含维生素A和C。籽不宜食用。建议少量去皮去籽果肉。'
  },
  {
    id: 'pineapple',
    name: '菠萝',
    aliases: ['pineapple', '凤梨', '菠萝肉', '金钻凤梨'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '菠萝去皮去芯后少量喂食是安全的，含菠萝蛋白酶和维生素C。菠萝蛋白酶大量可刺激口腔黏膜。含糖量较高不宜过量。建议少量新鲜菠萝肉。'
  },
  {
    id: 'watermelon',
    name: '西瓜',
    aliases: ['watermelon', '西瓜肉', '无籽西瓜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '西瓜去籽后少量果肉喂食是安全的，含水量高补水好。必须去籽（籽可造成梗阻）。瓜皮不宜喂食。含糖量较高不宜过量。建议少量去籽红肉。'
  },
  {
    id: 'banana',
    name: '香蕉',
    aliases: ['banana', '香蕉肉', '芭蕉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '香蕉去皮后少量喂食是安全的，含钾和维生素B6。含糖和淀粉较高不宜过量。建议少量切片。香蕉皮不易消化不建议喂食。'
  },
  {
    id: 'blueberry',
    name: '蓝莓',
    aliases: ['blueberry', '蓝莓果', '野生蓝莓'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '蓝莓少量喂食是安全的，含抗氧化物和维生素C。低热量高纤维。建议少量新鲜或冷冻蓝莓（不要加糖）。'
  },
  {
    id: 'strawberry',
    name: '草莓',
    aliases: ['strawberry', '草莓果', '士多啤梨'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '草莓去蒂后少量喂食是安全的，含维生素C和纤维。含糖量较高不宜过量。建议少量新鲜草莓。'
  },
  {
    id: 'raspberry',
    name: '树莓',
    aliases: ['raspberry', '覆盆子', '红树莓'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '树莓少量喂食是安全的，含抗氧化物和纤维，含微量木糖醇但量极低安全。建议少量新鲜树莓。'
  },
  {
    id: 'cranberry',
    name: '蔓越莓',
    aliases: ['cranberry', '小红莓', '酸果蔓'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '蔓越莓少量喂食是安全的，含抗氧化物有助于泌尿道健康。酸度较高不宜大量。建议少量新鲜或干燥蔓越莓（不加糖）。'
  },
  {
    id: 'apple',
    name: '苹果',
    aliases: ['apple', '苹果肉', '红苹果', '青苹果'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '苹果去核去籽后少量喂食是安全的，含纤维和维生素C。必须去核去籽（籽含微量氰苷）。果肉安全，果核梗不可食。含糖量较高不宜过量。'
  },
]
