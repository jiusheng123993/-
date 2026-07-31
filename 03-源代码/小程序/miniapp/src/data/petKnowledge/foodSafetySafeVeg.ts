import type { FoodSafetyItem } from './foodSafety'

/**
 * 安全蔬菜数据
 * 宠物可安全食用的蔬菜列表（含煮熟去皮等注意事项）
 */
export const FOOD_SAFETY_SAFE_VEG: FoodSafetyItem[] = [
  {
    id: 'cauliflower',
    name: '花椰菜',
    aliases: ['菜花', '白花菜', 'cauliflower'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '花椰菜煮熟后少量喂食是安全的，富含维生素C和纤维。建议蒸熟或煮熟，不要添加调味料。少量喂食有益健康，过量可能导致胃肠不适。'
  },
  {
    id: 'romaine_lettuce',
    name: '罗马生菜',
    aliases: ['罗马生菜', 'romaine', '长叶莴苣'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '罗马生菜少量喂食是安全的，含水量高热量低。比冰山生菜营养更丰富。洗净后可直接喂食或切碎拌入食物。'
  },
  {
    id: 'yu_choy',
    name: '油麦菜',
    aliases: ['油麦菜', 'yu choy', '莜麦菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '油麦菜煮熟后少量喂食是安全的，含维生素和矿物质。建议煮熟后切碎少量喂食。'
  },
  {
    id: 'water_spinach',
    name: '空心菜',
    aliases: ['蕹菜', 'water spinach', '通心菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '空心菜煮熟后少量喂食是安全的，含铁和维生素。建议煮熟后切碎少量喂食。'
  },
  {
    id: 'crown_daisy',
    name: '茼蒿',
    aliases: ['菊花菜', 'crown daisy', '蒿子秆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '茼蒿煮熟后少量喂食是安全的，含维生素和矿物质。建议煮熟后切碎少量喂食。'
  },
  {
    id: 'amaranth',
    name: '苋菜',
    aliases: ['苋菜心', 'amaranth', '红苋菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '苋菜煮熟后少量喂食是安全的，含铁和钙。建议煮熟后切碎少量喂食。红色苋菜含花青素。'
  },
  {
    id: 'chinese_broccoli',
    name: '芥蓝',
    aliases: ['芥兰', 'chinese broccoli', 'gai lan'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '芥蓝煮熟后少量喂食是安全的，含钙和维生素K。建议煮熟后切碎少量喂食。'
  },
  {
    id: 'baby_cabbage',
    name: '娃娃菜',
    aliases: ['迷你白菜', 'baby cabbage'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '娃娃菜煮熟后少量喂食是安全的，含维生素和纤维。建议煮熟后切碎少量喂食。'
  },
  {
    id: 'red_cabbage',
    name: '紫甘蓝',
    aliases: ['紫包菜', 'red cabbage', '紫圆白菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '紫甘蓝煮熟后少量喂食是安全的，含花青素和维生素C。建议煮熟后切碎少量喂食。比普通甘蓝营养更丰富。'
  },
  {
    id: 'pea',
    name: '豌豆',
    aliases: ['青豌豆', 'pea', '甜豌豆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '豌豆煮熟后少量喂食是安全的，含蛋白质和纤维。建议煮熟后少量喂食。糖豌豆和甜豌豆均可。'
  },
  {
    id: 'edamame',
    name: '毛豆',
    aliases: ['青豆', 'edamame', '嫩大豆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '毛豆煮熟去壳后少量喂食是安全的，含蛋白质和纤维。必须完全煮熟，去壳后喂食。不建议喂食调味毛豆。'
  },
  {
    id: 'snow_pea',
    name: '荷兰豆',
    aliases: ['snow pea', '甜豆', '蜜豆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '荷兰豆煮熟后少量喂食是安全的，含维生素C和纤维。建议煮熟后少量喂食。'
  },
  {
    id: 'cowpea',
    name: '豇豆',
    aliases: ['长豆角', 'cowpea', '黑眼豆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '豇豆充分煮熟后少量喂食是安全的，含蛋白质和纤维。必须完全煮熟以破坏植物血凝素。建议切段煮熟后少量喂食。'
  },
  {
    id: 'broad_bean',
    name: '蚕豆',
    aliases: ['broad bean', '胡豆', '罗汉豆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '蚕豆充分煮熟后少量喂食是安全的，含蛋白质和纤维。必须完全煮熟。有G6PD缺乏的犬应避免（罕见）。建议少量喂食。'
  },
  {
    id: 'lima_bean',
    name: '扁豆',
    aliases: ['lima bean', '白扁豆', '眉豆'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '扁豆充分煮熟后少量喂食是安全的，含蛋白质和纤维。必须完全煮熟以破坏植物血凝素。建议少量喂食。'
  },
  {
    id: 'red_bell_pepper',
    name: '红甜椒',
    aliases: ['红彩椒', 'red bell pepper', '甜红椒'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '红甜椒去籽煮熟后少量喂食是安全的，富含维生素C和β-胡萝卜素。比青椒营养更丰富。必须去籽，建议煮熟后切碎少量喂食。'
  },
  {
    id: 'yellow_bell_pepper',
    name: '黄甜椒',
    aliases: ['黄彩椒', 'yellow bell pepper', '甜黄椒'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '黄甜椒去籽煮熟后少量喂食是安全的，含维生素C。必须去籽，建议煮熟后切碎少量喂食。'
  },
  {
    id: 'broccoli_sprout',
    name: '西兰花苗',
    aliases: ['西兰花芽', 'broccoli sprout'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '西兰花苗少量喂食是安全的，含萝卜硫素等抗氧化物。比成熟西兰花营养密度更高。建议少量喂食。'
  },
  {
    id: 'bean_sprout',
    name: '豆芽',
    aliases: ['绿豆芽', '黄豆芽', 'bean sprout'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '豆芽煮熟后少量喂食是安全的，含维生素C和纤维。必须煮熟以避免细菌污染。建议少量喂食。'
  },
  {
    id: 'daikon',
    name: '白萝卜',
    aliases: ['萝卜', 'daikon', '大根'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '白萝卜煮熟后少量喂食是安全的，含维生素C和消化酶。建议煮熟后少量喂食。生萝卜可能引起胃肠不适。'
  },
  {
    id: 'carrot_green',
    name: '胡萝卜缨',
    aliases: ['萝卜叶', 'carrot top', '胡萝卜叶'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '胡萝卜缨少量煮熟后喂食是安全的，含维生素K和钾。建议煮熟后切碎少量喂食。'
  },
  {
    id: 'beet_root',
    name: '甜菜根',
    aliases: ['红菜头', 'beet root', '甜菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '甜菜根煮熟后少量喂食是安全的，含叶酸和锰。可能使尿液和粪便变红，这是正常现象。含糖量较高不宜过量。建议煮熟后少量喂食。'
  },
  {
    id: 'water_caltrop',
    name: '菱角',
    aliases: ['water caltrop', '菱', '角菱'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '菱角煮熟去壳后少量喂食是安全的，含淀粉和蛋白质。必须完全煮熟去壳。建议少量喂食。'
  },
  {
    id: 'edible_lily',
    name: '百合（食用）',
    aliases: ['百合瓣', 'edible lily bulb', '兰州百合'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '食用百合煮熟后少量喂食对犬是安全的。注意：观赏百合对猫致命，但食用百合（鳞茎）与观赏百合不同品种。犬少量食用通常安全。猫建议避免任何百合属所有植物。'
  },
  {
    id: 'goji_leaf',
    name: '枸杞叶',
    aliases: ['枸杞菜', 'goji leaf', '枸杞苗'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '枸杞叶煮熟后少量喂食是安全的，含维生素和矿物质。建议煮熟后切碎少量喂食。'
  },
  {
    id: 'sweet_potato_leaf',
    name: '红薯叶',
    aliases: ['地瓜叶', 'sweet potato leaf', '番薯叶'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '红薯叶煮熟后少量喂食是安全的，含维生素和抗氧化物。建议煮熟后切碎少量喂食。是营养丰富的绿叶蔬菜。'
  },
  {
    id: 'pumpkin_flower',
    name: '南瓜花',
    aliases: ['pumpkin flower', '南瓜花', '西葫芦花'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '南瓜花少量煮熟后喂食是安全的，含维生素和矿物质。建议去除花蕊后煮熟少量喂食。'
  },
  {
    id: 'pumpkin_seed_ground',
    name: '南瓜籽（磨碎）',
    aliases: ['南瓜子粉', 'pumpkin seed ground', '白瓜子粉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '南瓜籽磨碎后少量添加到食物中是安全的，含锌和健康脂肪。整粒南瓜籽可能无法消化。建议磨碎后少量添加。'
  },
  {
    id: 'chayote',
    name: '佛手瓜',
    aliases: ['chayote', '合掌瓜', '菜肴梨'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '佛手瓜煮熟后少量喂食是安全的，含维生素C和纤维。建议煮熟后少量喂食。'
  },
  {
    id: 'water_shield',
    name: '茭白',
    aliases: ['water shield', '茭瓜', '茭笋'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '茭白煮熟后少量喂食是安全的，含纤维和维生素。建议煮熟后少量喂食。'
  },
  {
    id: 'celtuce',
    name: '莴笋',
    aliases: ['莴苣', 'celtuce', '莴苣笋'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '莴笋去皮煮熟后少量喂食是安全的，含维生素和矿物质。建议去皮煮熟后少量喂食。'
  },
  {
    id: 'corn_kernel',
    name: '玉米粒',
    aliases: ['甜玉米', 'corn kernel', '玉米'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '玉米粒脱粒煮熟后少量喂食是安全的，含碳水化合物和纤维。整根玉米棒有梗阻风险，必须脱粒。建议煮熟后少量喂食。'
  },
  {
    id: 'corn_silk_tea',
    name: '玉米须茶',
    aliases: ['玉米须水', 'corn silk tea'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '玉米须煮水无糖无调味少量喂食是安全的，传统上认为有利尿作用。建议无糖少量。'
  },
  {
    id: 'potato_cooked',
    name: '土豆（煮熟）',
    aliases: ['马铃薯煮熟', 'potato cooked', '洋芋煮熟'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '土豆去皮煮熟后少量喂食是安全的，含碳水化合物和维生素C。必须去皮煮熟，发芽和变绿的土豆含茄碱有毒必须丢弃。不要喂食炸薯条（高脂肪高盐）。'
  },
  {
    id: 'tomato_ripe',
    name: '番茄（成熟）',
    aliases: ['成熟番茄', 'ripe tomato', '西红柿'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '成熟红色番茄去叶去茎后少量喂食是安全的，含番茄红素和维生素C。番茄叶和茎含茄碱有毒。未成熟绿色番茄含茄碱较高不建议喂食。建议少量喂食成熟红色番茄。'
  },
  {
    id: 'shiitake',
    name: '香菇（煮熟）',
    aliases: ['冬菇', 'shiitake', '花菇'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '香菇煮熟后少量喂食是安全的，含维生素D和多糖。必须完全煮熟。建议少量喂食。不要培养宠物吃蘑菇的习惯。'
  },
  {
    id: 'oyster_mushroom',
    name: '平菇（煮熟）',
    aliases: ['oyster mushroom', '侧耳'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '平菇煮熟后少量喂食是安全的，含蛋白质和多糖。必须完全煮熟。建议少量喂食。'
  },
  {
    id: 'enoki_mushroom',
    name: '金针菇（煮熟）',
    aliases: ['enoki mushroom', '金菇', '冬菇'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '金针菇煮熟后少量喂食是安全的，含纤维和多糖。必须完全煮熟，切段后喂食。建议少量喂食。'
  },
  {
    id: 'king_oyster_mushroom',
    name: '杏鲍菇（煮熟）',
    aliases: ['king oyster mushroom', '雪茸'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '杏鲍菇煮熟后少量喂食是安全的，含蛋白质和多糖。必须完全煮熟。建议少量喂食。'
  },
  {
    id: 'button_mushroom',
    name: '白蘑菇（煮熟）',
    aliases: ['口蘑', 'button mushroom', '双孢蘑菇'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '白蘑菇煮熟后少量喂食是安全的，含硒和B族维生素。必须完全煮熟。建议少量喂食。'
  },
  {
    id: 'tea_tree_mushroom',
    name: '茶树菇（煮熟）',
    aliases: ['tea tree mushroom', '杨树菇'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '茶树菇煮熟后少量喂食是安全的，含蛋白质和多糖。必须完全煮熟。建议少量喂食。'
  },
  {
    id: 'lion_mane_mushroom',
    name: '猴头菇（煮熟）',
    aliases: ['lion mane mushroom', '猴菇'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '猴头菇煮熟后少量喂食是安全的，含多糖有益消化。必须完全煮熟泡发。建议少量喂食。'
  },
  {
    id: 'radish',
    name: '萝卜',
    aliases: ['红萝卜', 'radish', '水萝卜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '萝卜煮熟后少量喂食是安全的，含维生素C和消化酶。建议煮熟后少量喂食。'
  },
  {
    id: 'turnip',
    name: '芜菁',
    aliases: ['turnip', '大头菜', '蔓菁'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '芜菁煮熟后少量喂食是安全的，含维生素C和纤维。建议煮熟后少量喂食。'
  },
  {
    id: 'parsnip',
    name: '欧防风',
    aliases: ['parsnip', '防风草'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '欧防风煮熟后少量喂食是安全的，含叶酸和钾。建议煮熟后少量喂食。'
  },
  {
    id: 'rutabaga',
    name: '芜菁甘蓝',
    aliases: ['rutabaga', '瑞典萝卜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '芜菁甘蓝煮熟后少量喂食是安全的，含维生素C和纤维。建议煮熟后少量喂食。'
  },
  {
    id: 'kale',
    name: '羽衣甘蓝',
    aliases: ['kale', '恐龙甘蓝', '无头甘蓝'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '羽衣甘蓝煮熟后少量喂食是安全的，含维生素K和抗氧化物。含少量草酸盐，有肾结石病史的宠物应限制。建议煮熟后少量喂食。'
  },
  {
    id: 'collard_green',
    name: '羽衣甘蓝叶',
    aliases: ['collard green', '芥菜叶'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '羽衣甘蓝叶煮熟后少量喂食是安全的，含钙和维生素K。建议煮熟后少量喂食。'
  },
  {
    id: 'swiss_chard',
    name: '瑞士甜菜',
    aliases: ['swiss chard', '牛皮菜', '红甜菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '瑞士甜菜煮熟后少量喂食是安全的，含维生素K和镁。含草酸盐，有肾结石病史的宠物应限制。建议煮熟后少量喂食。'
  },
  {
    id: 'artichoke',
    name: '朝鲜蓟',
    aliases: ['artichoke', '洋蓟', '法国百合'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '朝鲜蓟心煮熟后少量喂食是安全的，含纤维和抗氧化物。建议只喂食朝鲜蓟心部分，煮熟后少量。'
  },
  {
    id: 'brussels_sprout',
    name: '抱子甘蓝',
    aliases: ['brussels sprout', '小卷心菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '抱子甘蓝煮熟后少量喂食是安全的，含维生素C和纤维。十字花科蔬菜大量可能影响甲状腺。建议煮熟后少量喂食。'
  },
  {
    id: 'watercress',
    name: '西洋菜',
    aliases: ['watercress', '豆瓣菜', '水蔊菜'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '西洋菜煮熟后少量喂食是安全的，含维生素C和铁。建议煮熟后少量喂食。'
  },
  {
    id: 'bok_choy_sum',
    name: '菜心',
    aliases: ['choy sum', '菜薹', '油菜心'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '菜心煮熟后少量喂食是安全的，含维生素和矿物质。建议煮熟后少量喂食。'
  },
  {
    id: 'gai_choy',
    name: '芥菜',
    aliases: ['gai choy', '大芥菜', '芥菜心'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '芥菜煮熟后少量喂食是安全的，含维生素C和钙。建议煮熟后少量喂食。腌制芥菜含盐量高不适合。'
  },
]
