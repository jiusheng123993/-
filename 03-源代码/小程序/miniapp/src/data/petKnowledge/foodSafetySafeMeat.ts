import type { FoodSafetyItem } from './foodSafety'

/**
 * 安全肉类数据
 * 宠物可安全食用的肉类、水产和蛋类列表（含去骨去刺等注意事项）
 */
export const FOOD_SAFETY_SAFE_MEAT: FoodSafetyItem[] = [
  {
    id: 'chicken_liver',
    name: '鸡肝',
    aliases: ['鸡肝脏', 'chicken liver'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡肝煮熟后少量喂食是安全的，富含铁和维生素A。但维生素A含量极高，长期大量可导致维生素A中毒。建议每周不超过1-2次，每次少量。必须完全煮熟。'
  },
  {
    id: 'chicken_gizzard',
    name: '鸡胗',
    aliases: ['鸡肫', 'chicken gizzard'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡胗煮熟无调味后少量喂食是安全的，含高蛋白和铁。必须完全煮熟。偶尔少量作为零食。'
  },
  {
    id: 'chicken_neck',
    name: '鸡脖子（无骨）',
    aliases: ['鸡颈肉', 'chicken neck meat'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡脖子去骨后肉煮熟喂食是安全的。必须去骨（煮熟鸡骨易碎裂危险）。建议去骨煮熟后少量喂食。'
  },
  {
    id: 'chicken_thigh',
    name: '鸡腿肉',
    aliases: ['鸡大腿肉', 'chicken thigh', '鸡上腿肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡腿肉去骨去皮煮熟后喂食是安全的，含蛋白质和铁。必须去骨去皮，无调味煮熟。脂肪含量高于鸡胸肉。'
  },
  {
    id: 'chicken_wing_meat',
    name: '鸡翅肉',
    aliases: ['鸡翅肉', 'chicken wing meat'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡翅肉去骨去皮煮熟后喂食是安全的。必须去骨（煮熟鸡翅骨易碎裂危险），去皮。无调味煮熟。'
  },
  {
    id: 'turkey_breast',
    name: '火鸡胸肉',
    aliases: ['turkey breast', '火鸡白肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '火鸡胸肉煮熟无调味后喂食是安全的，是低脂高蛋白的优质肉类。比鸡胸肉更大块，适合大型犬。必须无调味煮熟。'
  },
  {
    id: 'turkey_thigh',
    name: '火鸡腿肉',
    aliases: ['turkey thigh', '火鸡黑肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '火鸡腿肉去骨去皮煮熟后喂食是安全的，含蛋白质和铁。必须去骨去皮，无调味煮熟。'
  },
  {
    id: 'duck_breast',
    name: '鸭胸肉',
    aliases: ['duck breast', '鸭胸', '鸭里脊'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸭胸肉去皮煮熟后喂食是安全的，含蛋白质和铁。必须去皮（鸭皮脂肪含量极高），无调味煮熟。'
  },
  {
    id: 'goose_meat',
    name: '鹅肉',
    aliases: ['goose meat', '白鹅肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鹅肉去皮去骨煮熟后少量喂食是安全的，含蛋白质。脂肪含量较高，建议去皮少量喂食。必须无调味煮熟。'
  },
  {
    id: 'beef_lean',
    name: '瘦牛肉',
    aliases: ['牛里脊', 'beef lean', '牛瘦肉', '牛腱肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '瘦牛肉煮熟无调味后喂食是安全的，是优质蛋白质来源。应选择瘦肉部位（里脊、腱子），去除可见脂肪。必须无调味煮熟。'
  },
  {
    id: 'beef_ground_lean',
    name: '瘦牛肉碎',
    aliases: ['瘦牛肉糜', 'lean ground beef', '瘦牛绞肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '瘦牛肉碎煮熟沥干油脂后喂食是安全的。应选择90%以上瘦肉比例，煮熟后沥干多余油脂。必须无调味。'
  },
  {
    id: 'pork_loin',
    name: '猪里脊',
    aliases: ['pork loin', '瘦猪肉', '猪外脊'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '猪里脊煮熟无调味后喂食是安全的，是最瘦的猪肉部位。必须完全煮熟（生猪肉可能含旋毛虫），去除所有可见脂肪。无调味。'
  },
  {
    id: 'pork_liver',
    name: '猪肝',
    aliases: ['pork liver', '猪肝脏'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '猪肝煮熟后少量喂食是安全的，富含铁和维生素A。维生素A含量高，不宜频繁大量喂食。建议每周不超过1次，每次少量。必须完全煮熟。'
  },
  {
    id: 'lamb_leg',
    name: '羊腿肉',
    aliases: ['lamb leg', '瘦羊肉', '羊瘦肉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '羊腿肉去骨去脂肪煮熟后喂食是安全的，含蛋白质和铁。必须去骨去脂肪，无调味完全煮熟。羊肉是常见过敏原，首次少量观察。'
  },
  {
    id: 'cod_cooked',
    name: '鳕鱼',
    aliases: ['cod cooked', '银鳕鱼', '真鳕鱼'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鳕鱼煮熟去刺后喂食是安全的，是低脂高蛋白鱼类。必须完全煮熟去刺。建议选择无刺鱼块。'
  },
  {
    id: 'sea_bass_cooked',
    name: '鲈鱼',
    aliases: ['sea bass cooked', '花鲈', '海鲈鱼'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鲈鱼煮熟去刺后喂食是安全的，含蛋白质和Omega-3。必须完全煮熟去刺。建议仔细去刺后少量喂食。'
  },
  {
    id: 'flounder_cooked',
    name: '比目鱼',
    aliases: ['flounder cooked', '鲽鱼', '偏口鱼'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '比目鱼煮熟去刺后喂食是安全的，是低脂鱼类。必须完全煮熟去刺。建议少量喂食。'
  },
  {
    id: 'sardine_cooked',
    name: '沙丁鱼（煮熟）',
    aliases: ['sardine cooked', '沙甸鱼煮熟'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '沙丁鱼煮熟去骨后喂食是安全的，含Omega-3和钙。建议选择无盐版本，去骨后少量喂食。'
  },
  {
    id: 'mackerel_cooked',
    name: '鲭鱼',
    aliases: ['mackerel cooked', '鲐鱼', '鲅鱼'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鲭鱼煮熟去刺后少量喂食是安全的，含Omega-3。必须完全煮熟去刺。含组胺较高，不新鲜时可能引发组胺中毒。建议少量新鲜煮熟。'
  },
  {
    id: 'shrimp_cooked',
    name: '虾（煮熟）',
    aliases: ['shrimp cooked', '明虾煮熟', '基围虾煮熟'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '虾煮熟去壳去虾线后少量喂食是安全的，含蛋白质。必须完全煮熟去壳。胆固醇较高不宜大量。部分宠物可能过敏。'
  },
  {
    id: 'crab_cooked',
    name: '蟹肉（煮熟）',
    aliases: ['crab meat cooked', '蟹腿肉煮熟'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '蟹肉煮熟去壳后少量喂食是安全的，含蛋白质和锌。必须完全煮熟去壳。胆固醇和钠含量较高不宜大量。'
  },
  {
    id: 'scallop_cooked',
    name: '扇贝',
    aliases: ['scallop cooked', '带子', '干贝'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '扇贝煮熟后少量喂食是安全的，含蛋白质和镁。必须完全煮熟。建议少量偶尔喂食。'
  },
  {
    id: 'mussel_cooked',
    name: '青口',
    aliases: ['mussel cooked', '贻贝', '海虹'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '青口煮熟后少量喂食是安全的，含蛋白质和锌。必须完全煮熟去壳。建议少量偶尔喂食。青口提取物常用于关节保健品。'
  },
  {
    id: 'egg_whole_cooked',
    name: '鸡蛋（全熟）',
    aliases: ['whole egg cooked', '水煮蛋', '煎蛋'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡蛋完全煮熟后喂食是安全的，是优质蛋白质来源。必须完全煮熟（生鸡蛋含沙门氏菌和抗生物素蛋白）。不要添加盐和调味料。每周2-3个为宜。'
  },
  {
    id: 'quail_egg_cooked',
    name: '鹌鹑蛋（全熟）',
    aliases: ['quail egg cooked', '小鸡蛋煮熟'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鹌鹑蛋完全煮熟后喂食是安全的，营养密度高于鸡蛋。必须完全煮熟。小型犬每次1-2个，大型犬可适当增加。'
  },
  {
    id: 'duck_egg_cooked',
    name: '鸭蛋（全熟）',
    aliases: ['duck egg cooked', '咸鸭蛋（不可）', '皮蛋（不可）'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸭蛋完全煮熟后少量喂食是安全的。必须完全煮熟。不要喂食咸鸭蛋（含盐量极高）和皮蛋（含铅风险）。'
  },
  {
    id: 'plain_yogurt_safe',
    name: '原味酸奶（无糖）',
    aliases: ['plain yogurt safe', '无糖纯酸奶'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖无木糖醇的原味酸奶少量喂食是安全的，含益生菌有益消化。必须确认不含木糖醇和糖。乳糖含量低于牛奶。建议选择低脂版本。'
  },
  {
    id: 'cottage_cheese_safe',
    name: '茅屋奶酪（低脂）',
    aliases: ['cottage cheese safe', '白软干酪低脂'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '低脂茅屋奶酪少量喂食是安全的，含高蛋白低脂肪。乳糖含量较低。建议选择低脂版本，每次少量。'
  },
]
