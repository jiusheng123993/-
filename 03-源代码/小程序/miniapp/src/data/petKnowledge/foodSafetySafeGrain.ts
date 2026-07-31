import type { FoodSafetyItem } from './foodSafety'

/**
 * 安全谷物和补充剂数据
 * 宠物可安全食用的谷物、保健品和天然补充品列表
 */
export const FOOD_SAFETY_SAFE_GRAIN: FoodSafetyItem[] = [
  {
    id: 'white_rice',
    name: '白米饭',
    aliases: ['white rice', '大米饭', '精白米'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '白米饭煮熟后少量喂食是安全的，易消化。肠胃不适时是好的选择。但营养价值较低，不宜作为主食。建议搭配蛋白质食物。'
  },
  {
    id: 'quinoa',
    name: '藜麦',
    aliases: ['quinoa', '奎奴亚藜', '印第安麦'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '藜麦煮熟后少量喂食是安全的，含完整蛋白质和纤维。建议充分煮熟后少量喂食。含皂苷，充分水洗和煮熟可去除。'
  },
  {
    id: 'buckwheat',
    name: '荞麦',
    aliases: ['buckwheat', '荞麦米', '苦荞'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '荞麦煮熟后少量喂食是安全的，含蛋白质和纤维。必须完全煮熟。建议少量喂食。'
  },
  {
    id: 'barley',
    name: '大麦',
    aliases: ['barley', '裸大麦', '青稞'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '大麦煮熟后少量喂食是安全的，含纤维和矿物质。建议充分煮熟后少量喂食。含麸质，敏感宠物应避免。'
  },
  {
    id: 'coix_seed',
    name: '薏米',
    aliases: ['coix seed', '薏苡仁', '薏仁'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '薏米煮熟后少量喂食是安全的，含蛋白质和纤维。建议充分煮熟后少量喂食。'
  },
  {
    id: 'cornmeal_porridge',
    name: '玉米面粥',
    aliases: ['cornmeal porridge', '玉米糊', '棒子面粥'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '玉米面粥无糖无调味少量喂食是安全的，易消化。建议无糖无调味煮熟后少量喂食。'
  },
  {
    id: 'whole_wheat_bread_safe',
    name: '全麦面包（少量）',
    aliases: ['whole wheat bread safe', '全麦吐司'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '无葡萄干的全麦面包少量喂食对犬是安全的。必须确认不含葡萄干（有毒）。含碳水化合物，不宜经常喂食。猫通常不感兴趣。'
  },
  {
    id: 'pure_water',
    name: '纯净水',
    aliases: ['pure water', '凉白开', '过滤水'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '纯净水是宠物最安全和最重要的饮品。应随时提供新鲜清洁的饮用水。凉白开或过滤水均可。不要用矿泉水长期替代（矿物质可能过量）。'
  },
  {
    id: 'coconut_oil_tiny',
    name: '椰子油（极少量）',
    aliases: ['coconut oil tiny', '椰油微量'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '椰子油极少量对犬通常是安全的，可能有益皮肤和毛发。建议犬每次不超过1茶匙（小型犬更少）。大量可导致腹泻和胰腺炎。猫使用安全性研究不足。'
  },
  {
    id: 'honey_tiny',
    name: '蜂蜜（极少量犬用）',
    aliases: ['honey tiny dog', '天然蜂蜜微量'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '极少量蜂蜜对成年犬通常是安全的。含糖量高不宜经常喂食。幼犬和免疫力低下的犬应避免。不建议给猫喂食。犬每次不超过1茶匙。'
  },
  {
    id: 'salmon_oil',
    name: '三文鱼油',
    aliases: ['salmon oil', '鱼油', 'Omega-3补充剂'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '三文鱼油适量添加到食物中是安全的，含EPA和DHA有益皮肤、毛发和关节。建议按宠物体重计算用量。选择宠物专用产品。'
  },
  {
    id: 'flaxseed_oil',
    name: '亚麻籽油',
    aliases: ['flaxseed oil', '亚麻油', '胡麻油'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '亚麻籽油少量添加到食物中是安全的，含ALA（Omega-3）。但ALA转化率不如鱼油中的EPA/DHA。需冷藏保存防止氧化。建议少量使用。'
  },
  {
    id: 'fish_oil',
    name: '鱼油',
    aliases: ['fish oil', '深海鱼油', 'Omega3鱼油'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用鱼油适量添加是安全的，含EPA和DHA有益皮肤、毛发、关节和心血管。建议按宠物体重计算用量。选择经过纯化测试的产品。'
  },
  {
    id: 'probiotic',
    name: '宠物益生菌',
    aliases: ['probiotic', '益生菌粉', '肠道益生菌'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用益生菌适量使用是安全的，有益肠道健康。应选择宠物专用产品，不要使用人类益生菌（菌株和剂量不同）。按说明使用。'
  },
  {
    id: 'glucosamine',
    name: '氨基葡萄糖',
    aliases: ['glucosamine', '氨糖', '关节保健品'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用氨基葡萄糖适量使用是安全的，有益关节健康。应选择宠物专用产品。按说明使用。'
  },
  {
    id: 'chondroitin',
    name: '软骨素',
    aliases: ['chondroitin', '硫酸软骨素', '关节营养'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用软骨素适量使用是安全的，常与氨基葡萄糖配合使用有益关节健康。应选择宠物专用产品。'
  },
  {
    id: 'taurine_supplement',
    name: '牛磺酸补充剂',
    aliases: ['taurine supplement', '牛磺酸', '猫必需氨基酸'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '牛磺酸对猫是必需氨基酸，适量补充是安全的。猫体内无法合成足够牛磺酸，缺乏可导致心肌病和视网膜退化。应选择宠物专用产品。'
  },
  {
    id: 'l_lysine',
    name: '赖氨酸',
    aliases: ['L-lysine', '左旋赖氨酸', '猫疱疹辅助'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '赖氨酸适量补充对猫通常是安全的，传统上用于辅助管理猫疱疹病毒感染。应选择宠物专用产品。按说明使用。'
  },
  {
    id: 'digestive_enzyme',
    name: '消化酶',
    aliases: ['digestive enzyme', '消化酵素', '酶补充剂'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用消化酶适量使用是安全的，可帮助消化吸收。应选择宠物专用产品。按说明使用。'
  },
  {
    id: 'cat_grass',
    name: '猫草',
    aliases: ['cat grass', '小麦草', '燕麦草'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '猫草（小麦草或燕麦草嫩芽）是安全的，可帮助猫排出毛球和补充微量营养。犬也可少量食用。建议自行种植确保无农药。'
  },
  {
    id: 'catnip',
    name: '猫薄荷',
    aliases: ['catnip', '荆芥', '猫草（荆芥）'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '猫薄荷对猫是安全的，约50-70%的猫对其有兴奋反应。犬通常不受影响。少量使用是安全的，不会上瘾。怀孕母猫应避免。'
  },
  {
    id: 'valerian_root',
    name: '缬草根',
    aliases: ['valerian root', '缬草', '猫兴奋草'],
    safetyLevel: 'safe',
    speciesApplicable: ['cat'],
    detail: '缬草根对猫是安全的，可产生类似猫薄荷的兴奋效果。对不响应猫薄荷的猫可能有效。少量使用是安全的。'
  },
  {
    id: 'silver_vine',
    name: '木天蓼',
    aliases: ['silver vine', '葛枣猕猴桃', '猫兴奋木'],
    safetyLevel: 'safe',
    speciesApplicable: ['cat'],
    detail: '木天蓼对猫是安全的，可产生比猫薄荷更强烈的兴奋效果。约80%的猫对其有反应。少量使用是安全的，不会上瘾。'
  },
  {
    id: 'ice_chip',
    name: '冰块',
    aliases: ['ice chip', '冰片', '碎冰'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '纯水制成的冰块是安全的，可帮助宠物降温和增加水分摄入。不要给过小的冰块（窒息风险）。夏季可加入少量低盐鸡汤冻冰。'
  },
  {
    id: 'freeze_dried_treat',
    name: '冻干零食',
    aliases: ['freeze dried treat', '冻干肉', '冻干肝'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '宠物专用冻干零食（冻干鸡胸、冻干肝等）是安全的，保留营养且便于储存。应选择单一成分无添加的产品。注意控制量，冻干食品热量密度高。'
  },
  {
    id: 'dental_chew',
    name: '洁齿咀嚼物',
    aliases: ['dental chew', '洁齿骨', '刷牙棒'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog'],
    detail: '宠物专用洁齿咀嚼物适量使用是安全的，可帮助清洁牙齿。应选择VOHC认证的产品。按说明使用，注意选择适合犬体型的尺寸。'
  },
  {
    id: 'plain_gelatin',
    name: '无味明胶',
    aliases: ['plain gelatin', '吉利丁粉', '明胶粉'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '无味明胶粉少量使用是安全的，含胶原蛋白。可自制宠物零食。建议无糖无调味。'
  },
  {
    id: 'pet_treat_commercial',
    name: '宠物专用零食',
    aliases: ['pet treat', '狗零食', '猫零食', '训练零食'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '正规品牌的宠物专用零食按说明使用是安全的。应选择成分清晰、无人工色素和防腐剂的产品。零食不应超过每日总热量的10%。'
  },
  {
    id: 'sweet_potato_treat',
    name: '红薯零食',
    aliases: ['sweet potato treat', '红薯干', '地瓜干'],
    safetyLevel: 'safe',
    speciesApplicable: ['dog', 'cat'],
    detail: '红薯切片烘干或煮熟后作为零食是安全的，含纤维和维生素A。必须无糖无调味。建议自制或选择宠物专用产品。'
  },
]
