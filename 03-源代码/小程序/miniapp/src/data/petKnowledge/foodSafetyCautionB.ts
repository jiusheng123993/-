/**
 * 谨慎食物数据 B
 * 宠物食物安全数据库 - 需谨慎喂食的食物/植物清单 B
 */
import type { FoodSafetyItem } from './foodSafety'

export const FOOD_SAFETY_CAUTION_B: FoodSafetyItem[] = [
  {
    id: 'avocado_oil',
    name: '牛油果油',
    aliases: ['鳄梨油', 'avocado oil'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '牛油果油少量添加到食物中通常安全，persin毒素在精炼过程中被去除。但仍是高脂肪油类，大量可导致腹泻和胰腺炎。建议极少量使用。猫使用安全性研究不足，建议谨慎。'
  },
  {
    id: 'olive_oil',
    name: '橄榄油',
    aliases: ['olive oil', '初榨橄榄油', '纯橄榄油'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '橄榄油少量添加到食物中通常安全，含单不饱和脂肪酸。但大量可导致腹泻和胰腺炎。建议犬每次不超过1茶匙。猫可更少量。选择初榨橄榄油品质更好。'
  },
  {
    id: 'sesame_oil',
    name: '芝麻油',
    aliases: ['香油', '麻油', 'sesame oil'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '芝麻油极少量添加通常安全，但大量可导致腹泻。部分宠物可能对芝麻过敏。芝麻油热量高，不宜经常使用。建议偶尔极少量调味。'
  },
  {
    id: 'walnut_oil',
    name: '核桃油',
    aliases: ['胡桃油', 'walnut oil'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '核桃油少量添加通常安全，含Omega-3和Omega-6脂肪酸。但核桃油易氧化变质，需冷藏保存。大量可导致腹泻和胰腺炎。建议偶尔少量使用。'
  },
  {
    id: 'peanut_oil',
    name: '花生油',
    aliases: ['peanut oil', '花生油烹饪'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '花生油少量通常安全，但大量可导致腹泻和胰腺炎。部分犬可能对花生过敏。猫使用花生油的安全性研究不足。建议偶尔极少量使用。'
  },
  {
    id: 'corn_oil',
    name: '玉米油',
    aliases: ['corn oil', '玉米胚芽油'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '玉米油少量添加通常安全，含亚油酸。但大量可导致腹泻和胰腺炎。Omega-6含量高，过量可能促进炎症。建议偶尔少量使用。'
  },
  {
    id: 'sunflower_oil',
    name: '葵花籽油',
    aliases: ['sunflower oil', '向日葵油'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '葵花籽油少量添加通常安全，含维生素E。但大量可导致腹泻和胰腺炎。Omega-6含量高，过量可能促进炎症。建议偶尔少量使用。'
  },
  {
    id: 'honey_small',
    name: '蜂蜜（少量）',
    aliases: ['天然蜂蜜少量', '花蜜少量', '蜜糖少量'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '少量蜂蜜对犬通常是安全的，含一些有益营养素。但含糖量高不宜经常喂食。幼犬和免疫力低下的犬应避免（蜂蜜可能含肉毒杆菌芽孢）。不建议给猫喂食蜂蜜。犬每次不超过1茶匙。'
  },
  {
    id: 'maple_syrup',
    name: '枫糖浆',
    aliases: ['maple syrup', '枫树糖浆'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '纯枫糖浆少量通常安全，但含糖量极高不宜喂食。无糖枫糖浆可能含木糖醇对犬致命。不建议给宠物喂食任何糖浆类产品。偶尔极少量舔食无需担心。'
  },
  {
    id: 'coconut_water',
    name: '椰子水',
    aliases: ['coconut water', '椰汁', '纯椰水'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '纯椰子水少量喂食通常安全，含钾和电解质。但含钾较高，有肾脏问题的宠物应避免。市售椰子水可能添加糖分，需注意。大量饮用可导致电解质失衡。建议偶尔少量。'
  },
  {
    id: 'bone_broth',
    name: '骨头汤',
    aliases: ['骨汤', '大骨汤', 'bone broth'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '低盐无调味骨头汤适量喂食通常安全，含胶原蛋白和矿物质。但必须确保无骨头碎片、低盐、无洋葱大蒜等调味料。市售骨头汤含盐量和调味料不适合宠物。建议自制低盐无调味版本。'
  },
  {
    id: 'chicken_broth',
    name: '鸡汤',
    aliases: ['鸡肉汤', 'chicken broth', '鸡汤面'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无盐无调味鸡汤适量喂食通常安全，可增加食物风味和水分摄入。但市售鸡汤含盐量和调味料不适合宠物，常含洋葱粉。建议自制无盐无调味版本。罐装鸡汤含盐量极高。'
  },
  {
    id: 'yogurt_plain',
    name: '原味酸奶',
    aliases: ['plain yogurt', '无糖酸奶', '纯酸奶'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖无木糖醇的原味酸奶少量喂食通常安全，含益生菌有益消化。但必须确认不含木糖醇和糖。乳糖含量低于牛奶，多数宠物耐受性更好。建议选择低脂或脱脂版本。每次少量。'
  },
  {
    id: 'kefir',
    name: '开菲尔',
    aliases: ['kefir', '克菲尔', '发酵乳'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖开菲尔少量喂食通常安全，含益生菌和酵母有益消化。乳糖含量低于牛奶。但必须确认不含糖和木糖醇。建议选择全脂或低脂无糖版本。每次少量。'
  },
  {
    id: 'cottage_cheese',
    name: '茅屋奶酪',
    aliases: ['cottage cheese', '白软干酪', '乡村奶酪'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '低脂茅屋奶酪少量喂食通常安全，含高蛋白低脂肪。但乳糖含量仍可能引起部分宠物腹泻。建议选择低脂或脱脂版本，每次少量。有乳糖不耐受的宠物应避免。'
  },
  {
    id: 'mozzarella',
    name: '马苏里拉奶酪',
    aliases: ['mozzarella', '水牛芝士', '披萨芝士'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '低脂马苏里拉奶酪少量喂食通常安全。但全脂版本脂肪含量高可引发胰腺炎，含盐量也需注意。乳糖含量较低。建议选择低脂版本，每次极少量。不要喂食披萨上的奶酪（含盐和调味料）。'
  },
  {
    id: 'parmesan',
    name: '帕尔马奶酪',
    aliases: ['parmesan', '帕玛森', '硬奶酪'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '帕尔马奶酪极少量作为调味通常安全，但含盐量极高，不宜多食。硬奶酪乳糖含量较低。建议极少量磨碎撒在食物上。猫不建议喂食高盐奶酪。'
  },
  {
    id: 'cream_cheese',
    name: '奶油奶酪',
    aliases: ['cream cheese', '芝士酱', '涂抹奶酪'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '奶油奶酪少量喂食通常安全，但脂肪含量极高可引发胰腺炎。含盐量也需注意。建议选择低脂版本，每次极少量。不要喂食含调味料（如蒜香）的奶油奶酪。'
  },
  {
    id: 'gelatin',
    name: '明胶',
    aliases: ['gelatin', '吉利丁', '动物胶', '果冻粉'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖无调味明胶少量喂食通常安全，含胶原蛋白。但市售果冻含糖量高且可能含木糖醇，不适合宠物。建议使用无味明胶粉自制宠物零食。不要喂食含糖果冻。'
  },
  {
    id: 'agar',
    name: '琼脂',
    aliases: ['agar', '琼脂粉', '寒天', '海藻胶'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '琼脂少量使用通常安全，是植物性凝固剂。含少量纤维和矿物质。但大量食用可导致腹泻（琼脂吸水膨胀）。建议少量使用。不要喂食含糖琼脂甜品。'
  },
  {
    id: 'bread',
    name: '面包',
    aliases: ['白面包', '全麦面包', '面包片'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '面包少量喂食通常安全，但营养价值低。全麦面包含纤维但可能含葡萄干（有毒）。面包含碳水化合物和少量盐，不宜经常喂食。生面团危险（发酵膨胀和酒精产生）。肥胖宠物应避免。'
  },
  {
    id: 'cracker',
    name: '饼干（无糖）',
    aliases: ['苏打饼干', '原味饼干', 'rice cracker'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '无糖无木糖醇的原味饼干少量喂食通常安全，但含盐和碳水化合物，营养价值低。必须确认不含木糖醇、巧克力、葡萄干等有害成分。不建议作为常规零食。猫通常不感兴趣。'
  },
  {
    id: 'pasta',
    name: '意大利面',
    aliases: ['pasta', '通心粉', '面条', '意面'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '意大利面煮熟无调味后少量喂食通常安全，但营养价值低。含大量碳水化合物，肥胖宠物应避免。不要喂食含番茄酱（含盐和洋葱粉）或奶酪酱的意大利面。偶尔少量即可。'
  },
  {
    id: 'corn_chip',
    name: '玉米片',
    aliases: ['tortilla chip', '玉米脆片', '玉米饼'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '无盐玉米片少量喂食通常安全，但含盐版本含盐量高。调味玉米片可能含洋葱粉和大蒜粉。建议选择无盐无调味版本，偶尔少量。猫通常不感兴趣。'
  },
  {
    id: 'popcorn',
    name: '爆米花',
    aliases: ['popcorn', '玉米花', '爆谷'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '无盐无黄油的爆米花少量喂食通常安全，含纤维。但盐爆米花含盐量高，黄油爆米花脂肪含量高，焦糖爆米花含糖量高。未爆开的玉米粒可能造成牙齿损伤或 choking。建议选择无盐无黄油版本。'
  },
  {
    id: 'pancake',
    name: '薄饼',
    aliases: ['pancake', '煎饼', '华夫饼'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '无调味薄饼少量喂食通常安全，但营养价值低。不要喂食含糖浆（可能含木糖醇）、黄油或水果的薄饼。含碳水化合物和少量盐，不宜经常喂食。猫通常不感兴趣。'
  },
  {
    id: 'rice_cake',
    name: '年糕',
    aliases: ['糯米糕', 'rice cake', '麻糬', '汤圆'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '年糕少量喂食通常安全，但粘性强可能造成窒息或梗阻，尤其对小型犬和猫。必须切成极小块。含纯碳水化合物，营养价值低。不要喂食含糖或含馅的年糕。'
  },
  {
    id: 'noodle',
    name: '面条',
    aliases: ['挂面', 'noodle', '乌冬面', '拉面'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '面条煮熟无调味后少量喂食通常安全，但营养价值低。不要喂食方便面（含盐和调味料极高）。拉面汤含盐量极高。偶尔少量白面条即可。'
  },
  {
    id: 'millet_porridge',
    name: '小米粥',
    aliases: ['小米', 'millet', '黄米粥'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '小米粥无糖无调味少量喂食通常安全，易消化。肠胃不适时可少量喂食。但营养价值较低，不宜作为主食。建议搭配蛋白质食物。'
  },
  {
    id: 'mung_bean_soup',
    name: '绿豆汤',
    aliases: ['绿豆', 'mung bean soup', '绿豆沙'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖绿豆汤少量喂食通常安全，绿豆有清热解毒作用。但含糖绿豆汤和绿豆沙含糖量高不适合。绿豆性寒，脾胃虚寒的宠物不宜多食。建议无糖少量。'
  },
  {
    id: 'red_bean_soup',
    name: '红豆沙',
    aliases: ['红豆汤', 'red bean soup', '红豆'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖红豆沙少量喂食通常安全，含蛋白质和纤维。但含糖红豆沙含糖量高不适合。红豆必须充分煮熟，生红豆含皂苷和植物血凝素。建议无糖少量。'
  },
  {
    id: 'sesame_paste',
    name: '芝麻糊',
    aliases: ['黑芝麻糊', 'sesame paste', '芝麻酱'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog'],
    detail: '无糖芝麻糊少量喂食通常安全，含钙和铁。但含糖芝麻糊含糖量高不适合。芝麻酱高脂肪高热量，不宜大量。建议无糖少量。猫通常不感兴趣。'
  },
  {
    id: 'quail',
    name: '鹌鹑',
    aliases: ['鹌鹑肉', 'quail', '鹌鹑鸟'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鹌鹑肉煮熟无调味后适量喂食通常安全，是低脂高蛋白肉类。鹌鹑骨头较小，煮熟后易碎裂，建议去骨后喂食。部分宠物食品使用鹌鹑作为低敏蛋白源。'
  },
  {
    id: 'pigeon',
    name: '鸽子肉',
    aliases: ['鸽肉', 'pigeon', '乳鸽'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸽子肉煮熟无调味后适量喂食通常安全，是低脂高蛋白肉类。鸽子骨头较小，煮熟后易碎裂，建议去骨后喂食。偶尔少量作为蛋白质来源。'
  },
  {
    id: 'goat_milk',
    name: '羊奶',
    aliases: ['goat milk', '山羊奶', '羊乳'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '无糖羊奶少量喂食通常安全，乳糖含量低于牛奶，部分乳糖不耐受宠物耐受性更好。但大量仍可导致腹泻。宠物专用羊奶粉是更好的选择。不建议以羊奶代替清水。'
  },
  {
    id: 'gizzard',
    name: '鸡胗',
    aliases: ['鸡胗', 'gizzard', '鸡肫', '鸭胗'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡胗煮熟无调味后少量喂食通常安全，含高蛋白和铁。但胆固醇较高不宜大量。必须完全煮熟，不要喂食调味鸡胗。偶尔少量作为零食。'
  },
  {
    id: 'chicken_heart',
    name: '鸡心',
    aliases: ['鸡心脏', 'chicken heart', '鸭心'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '鸡心煮熟无调味后少量喂食通常安全，含高蛋白和牛磺酸（对猫有益）。但胆固醇和嘌呤较高不宜大量。必须完全煮熟。偶尔少量作为零食。'
  },
  {
    id: 'beef_liver',
    name: '牛肝',
    aliases: ['beef liver', '牛肝脏'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '牛肝煮熟后少量喂食通常安全，富含铁和维生素A。但维生素A含量极高，长期大量可导致维生素A中毒。建议每周不超过1-2次，每次少量。猫对维生素A更敏感。'
  },
  {
    id: 'beef_heart',
    name: '牛心',
    aliases: ['beef heart', '牛心脏'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '牛心煮熟无调味后适量喂食通常安全，含高蛋白和牛磺酸。是营养丰富的肌肉器官肉。但胆固醇较高不宜大量。必须完全煮熟。'
  },
  {
    id: 'taro',
    name: '芋头',
    aliases: ['taro', '芋艿', '荔浦芋头'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '芋头必须完全煮熟后少量喂食，生芋头含草酸钙结晶可导致口腔和消化道严重刺激。煮熟后草酸钙被破坏，通常安全。但含淀粉量高不宜过量。必须去皮煮熟。'
  },
  {
    id: 'yam',
    name: '山药',
    aliases: ['yam', '淮山', '薯蓣', '铁棍山药'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '山药煮熟后少量喂食通常安全，含黏液蛋白和纤维有益消化。但生山药含皂苷和植物碱可刺激皮肤和黏膜，处理时需注意。必须去皮煮熟。偶尔少量即可。'
  },
  {
    id: 'lotus_root',
    name: '莲藕',
    aliases: ['lotus root', '藕', '藕片'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '莲藕煮熟后少量喂食通常安全，含纤维和维生素C。生莲藕难以消化。必须完全煮熟后切成小段喂食。偶尔少量作为零食。'
  },
  {
    id: 'water_chestnut',
    name: '荸荠',
    aliases: ['water chestnut', '马蹄', '地栗'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '荸荠煮熟后少量喂食通常安全，含钾和纤维。生荸荠可能含寄生虫（姜片虫），必须去皮煮熟。偶尔少量作为零食。'
  },
  {
    id: 'chestnut',
    name: '栗子',
    aliases: ['chestnut', '板栗', '糖炒栗子'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '栗子煮熟后少量喂食通常安全，含碳水化合物和维生素C。但含淀粉和碳水化合物较高不宜过量。糖炒栗子含糖量高不适合。必须去壳。偶尔少量即可。'
  },
  {
    id: 'seaweed',
    name: '海藻',
    aliases: ['海带', '紫菜', 'seaweed', '裙带菜', '海苔'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '海藻少量喂食通常安全，含碘和矿物质。但含碘量高，大量可导致甲状腺问题。调味海苔含盐量高不适合。建议选择无盐无调味海藻，偶尔少量。有甲状腺问题的宠物应避免。'
  },
  {
    id: 'cabbage',
    name: '白菜',
    aliases: ['大白菜', 'cabbage', '黄芽白'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '白菜煮熟后少量喂食通常安全，含纤维和维生素。但十字花科蔬菜含致甲状腺肿物质，大量长期食用可能影响甲状腺。建议煮熟后偶尔少量。猫通常对白菜不感兴趣。'
  },
  {
    id: 'bok_choy',
    name: '小白菜',
    aliases: ['bok choy', '青菜', '上海青'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '小白菜煮熟后少量喂食通常安全，含钙和维生素。与白菜类似含致甲状腺肿物质，大量长期食用可能影响甲状腺。建议煮熟后偶尔少量。'
  },
  {
    id: 'bitter_melon',
    name: '苦瓜',
    aliases: ['bitter melon', '凉瓜', '苦瓜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '苦瓜煮熟后少量喂食通常安全，含维生素C。但苦瓜极苦，多数宠物不愿食用。苦瓜籽含凝集素不建议喂食。大量食用可导致低血糖和胃肠不适。建议少量尝试。'
  },
  {
    id: 'winter_melon',
    name: '冬瓜',
    aliases: ['winter melon', '白冬瓜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '冬瓜煮熟后少量喂食通常安全，含水量高热量低。去籽后煮熟喂食。冬瓜性寒，脾胃虚寒的宠物不宜多食。偶尔少量即可。'
  },
  {
    id: 'luffa',
    name: '丝瓜',
    aliases: ['luffa', '丝瓜络', '水瓜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '丝瓜煮熟后少量喂食通常安全，含水量高热量低。去皮去籽后煮熟喂食。偶尔少量即可。猫通常对丝瓜不感兴趣。'
  },
  {
    id: 'okra',
    name: '秋葵',
    aliases: ['okra', '羊角豆', ' lady finger'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '秋葵煮熟后少量喂食通常安全，含黏液蛋白和纤维。但秋葵黏液可能使部分宠物不适。建议煮熟后切成小段少量喂食。偶尔少量即可。'
  },
  {
    id: 'bamboo_shoot',
    name: '竹笋',
    aliases: ['bamboo shoot', '春笋', '冬笋'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '竹笋煮熟后少量喂食通常安全，含纤维。但竹笋含草酸和氰苷，必须充分煮熟以降低毒性。生竹笋有毒。建议充分焯水后少量喂食。消化功能弱的宠物不宜。'
  },
  {
    id: 'lettuce',
    name: '生菜',
    aliases: ['lettuce', '莴苣', '沙拉菜'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '生菜少量喂食通常安全，含水量高热量低。但营养价值较低，大量可导致腹泻。建议选择深绿色品种（罗马生菜比冰山生菜营养更丰富）。洗净后少量喂食。'
  },
  {
    id: 'tung_oil_tree',
    name: '油桐',
    aliases: ['桐油树', 'tung tree', '油桐果'],
    safetyLevel: 'caution',
    speciesApplicable: ['dog', 'cat'],
    detail: '油桐果实和种子含毒蛋白和皂苷，可导致呕吐腹泻。桐油对宠物有毒。常见于南方地区。宠物可能被果实吸引。建议避免接触。'
  }
]
