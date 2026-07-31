/**
 * 宠物商品数据
 * 各电商平台的宠物商品信息，含佣金比例和推广链接
 */

/** 宠物商品信息 */
export interface PetProduct {
  id: string
  name: string
  category: 'food' | 'health' | 'toy' | 'grooming' | 'bedding' | 'accessory'
  brand: string
  price: number
  originalPrice: number
  commissionRate: number
  commissionAmount: number
  platform: 'jd' | 'taobao' | 'pdd'
  imageUrl: string
  description: string
  suitableSpecies: ('dog' | 'cat' | 'bird' | 'rabbit' | 'reptile' | 'small_animal')[]
  tags: string[]
  rating: number
  salesCount: number
  affiliateUrl: string
  inStock: boolean
}

export interface ProductRecommendationContext {
  petSpecies?: ('dog' | 'cat' | 'bird' | 'rabbit' | 'reptile' | 'small_animal')[]
  petAge?: 'puppy_kitten' | 'adult' | 'senior'
  healthCondition?: string[]
  budget?: 'economy' | 'mid' | 'premium'
}

const PRODUCTS: PetProduct[] = [
  {
    id: 'prod_001',
    name: '皇家犬粮小型犬成犬粮',
    category: 'food',
    brand: '皇家',
    price: 158,
    originalPrice: 198,
    commissionRate: 0.06,
    commissionAmount: 9.48,
    platform: 'jd',
    imageUrl: '',
    description: '专为小型犬设计的均衡营养配方，含优质蛋白和必需脂肪酸，促进皮肤毛发健康',
    suitableSpecies: ['dog'],
    tags: ['成犬粮', '小型犬', '天然粮'],
    rating: 4.8,
    salesCount: 12000,
    affiliateUrl: 'https://union.jd.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_002',
    name: '冠能猫粮室内成猫粮',
    category: 'food',
    brand: '冠能',
    price: 128,
    originalPrice: 158,
    commissionRate: 0.05,
    commissionAmount: 6.4,
    platform: 'taobao',
    imageUrl: '',
    description: '室内成猫专用配方，控制毛球形成，减少便臭',
    suitableSpecies: ['cat'],
    tags: ['成猫粮', '室内猫', '天然粮'],
    rating: 4.6,
    salesCount: 8500,
    affiliateUrl: 'https://mo.m.taobao.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_003',
    name: '卫仕犬用钙片',
    category: 'health',
    brand: '卫仕',
    price: 78,
    originalPrice: 98,
    commissionRate: 0.08,
    commissionAmount: 6.24,
    platform: 'jd',
    imageUrl: '',
    description: '犬用钙片，含钙+VD3+CPP，促进骨骼发育和牙齿健康',
    suitableSpecies: ['dog'],
    tags: ['补钙', '幼犬', '骨骼'],
    rating: 4.7,
    salesCount: 6200,
    affiliateUrl: 'https://union.jd.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_004',
    name: '麦德氏猫用化毛膏',
    category: 'health',
    brand: '麦德氏',
    price: 49,
    originalPrice: 69,
    commissionRate: 0.07,
    commissionAmount: 3.43,
    platform: 'pdd',
    imageUrl: '',
    description: '猫用化毛膏，天然植物油配方，温和排毛',
    suitableSpecies: ['cat'],
    tags: ['化毛', '消化', '保健'],
    rating: 4.5,
    salesCount: 9800,
    affiliateUrl: 'https://mobile.yangkeduo.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_005',
    name: '田田猫猫咪逗猫棒',
    category: 'toy',
    brand: '田田猫',
    price: 19.9,
    originalPrice: 29.9,
    commissionRate: 0.1,
    commissionAmount: 1.99,
    platform: 'taobao',
    imageUrl: '',
    description: '仿真羽毛逗猫棒，内置铃铛，互动娱乐必备',
    suitableSpecies: ['cat'],
    tags: ['玩具', '互动', '趣味'],
    rating: 4.9,
    salesCount: 25000,
    affiliateUrl: 'https://mo.m.taobao.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_006',
    name: '贵为犬用耐咬磨牙球',
    category: 'toy',
    brand: '贵为',
    price: 35,
    originalPrice: 49,
    commissionRate: 0.09,
    commissionAmount: 3.15,
    platform: 'jd',
    imageUrl: '',
    description: '犬用磨牙球，食品级材质，发声设计，耐咬',
    suitableSpecies: ['dog'],
    tags: ['磨牙', '玩具', '互动'],
    rating: 4.6,
    salesCount: 4200,
    affiliateUrl: 'https://union.jd.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_007',
    name: '贝维斯宠物梳毛器',
    category: 'grooming',
    brand: '贝维斯',
    price: 45,
    originalPrice: 59,
    commissionRate: 0.08,
    commissionAmount: 3.6,
    platform: 'taobao',
    imageUrl: '',
    description: '不锈钢针梳，一键除毛，适合长毛犬猫',
    suitableSpecies: ['dog', 'cat'],
    tags: ['梳毛', '美容', '换毛季'],
    rating: 4.5,
    salesCount: 7600,
    affiliateUrl: 'https://mo.m.taobao.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_008',
    name: 'PETKIT宠物智能饮水机',
    category: 'accessory',
    brand: 'PETKIT',
    price: 199,
    originalPrice: 269,
    commissionRate: 0.05,
    commissionAmount: 9.95,
    platform: 'jd',
    imageUrl: '',
    description: '智能循环饮水机，三层过滤，静音设计，2.5L大容量',
    suitableSpecies: ['dog', 'cat'],
    tags: ['饮水机', '智能', '活水'],
    rating: 4.8,
    salesCount: 15000,
    affiliateUrl: 'https://union.jd.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_009',
    name: '嬉皮狗宠物窝垫四季通用',
    category: 'bedding',
    brand: '嬉皮狗',
    price: 89,
    originalPrice: 129,
    commissionRate: 0.07,
    commissionAmount: 6.23,
    platform: 'pdd',
    imageUrl: '',
    description: '四季通用宠物窝垫，可拆洗，加厚填充，防滑底',
    suitableSpecies: ['dog', 'cat', 'rabbit'],
    tags: ['窝垫', '四季', '可拆洗'],
    rating: 4.4,
    salesCount: 5600,
    affiliateUrl: 'https://mobile.yangkeduo.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_010',
    name: '麦富迪犬用鸡肉绕钙骨',
    category: 'food',
    brand: '麦富迪',
    price: 29.9,
    originalPrice: 39.9,
    commissionRate: 0.07,
    commissionAmount: 2.09,
    platform: 'taobao',
    imageUrl: '',
    description: '犬用鸡肉绕钙骨零食，磨牙洁齿，补充钙质',
    suitableSpecies: ['dog'],
    tags: ['零食', '磨牙', '钙质'],
    rating: 4.7,
    salesCount: 18000,
    affiliateUrl: 'https://mo.m.taobao.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_011',
    name: '维克宠物营养膏',
    category: 'health',
    brand: '维克',
    price: 69,
    originalPrice: 89,
    commissionRate: 0.07,
    commissionAmount: 4.83,
    platform: 'jd',
    imageUrl: '',
    description: '综合营养补充膏，含维生素和微量元素，术后恢复、食欲不振食用',
    suitableSpecies: ['dog', 'cat'],
    tags: ['营养膏', '术后', '补充'],
    rating: 4.6,
    salesCount: 3800,
    affiliateUrl: 'https://union.jd.com/xxx',
    inStock: true,
  },
  {
    id: 'prod_012',
    name: '大宠爱犬猫专用体外驱虫滴剂',
    category: 'health',
    brand: '大宠爱',
    price: 168,
    originalPrice: 218,
    commissionRate: 0.06,
    commissionAmount: 10.08,
    platform: 'taobao',
    imageUrl: '',
    description: '犬猫通用体外驱虫滴剂，预防跳蚤、蜱虫、耳螨',
    suitableSpecies: ['dog', 'cat'],
    tags: ['驱虫', '体外', '防护'],
    rating: 4.9,
    salesCount: 30000,
    affiliateUrl: 'https://mo.m.taobao.com/xxx',
    inStock: true,
  },
]

export function getAllProducts(): PetProduct[] {
  return PRODUCTS.filter(p => p.inStock)
}

export function getProductsByCategory(category: PetProduct['category']): PetProduct[] {
  return PRODUCTS.filter(p => p.category === category && p.inStock)
}

export function getProductById(id: string): PetProduct | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function getRecommendedProducts(context: ProductRecommendationContext, limit = 6): PetProduct[] {
  const available = PRODUCTS.filter(p => p.inStock)
  const scored: Array<{ product: PetProduct; score: number }> = []

  available.forEach(product => {
    let score = 0

    if (context.petSpecies && context.petSpecies.length > 0) {
      const speciesMatch = product.suitableSpecies.some(s => context.petSpecies!.includes(s))
      if (speciesMatch) {
        score += 30
      }
    }

    if (context.healthCondition && context.healthCondition.length > 0) {
      const hasJointIssue = context.healthCondition.some(c =>
        c.toLowerCase().includes('骨骼') || c.toLowerCase().includes('关节') || c.toLowerCase().includes('骨折')
      )
      const hasSkinIssue = context.healthCondition.some(c =>
        c.toLowerCase().includes('皮肤') || c.toLowerCase().includes('过敏')
      )
      const hasDigestIssue = context.healthCondition.some(c =>
        c.toLowerCase().includes('消化') || c.toLowerCase().includes('肠胃')
      )

      if (hasJointIssue && (product.category === 'health' && product.tags.some(t => t.includes('骨骼') || t.includes('钙')))) {
        score += 20
      }
      if (hasSkinIssue && (product.category === 'grooming' || product.category === 'health')) {
        score += 15
      }
      if (hasDigestIssue && (product.category === 'health' && product.tags.some(t => t.includes('消化')))) {
        score += 15
      }
    }

    if (context.petAge) {
      if (context.petAge === 'puppy_kitten' && product.tags.some(t => t.includes('幼'))) {
        score += 10
      }
      if (context.petAge === 'senior' && product.tags.some(t => t.includes('老年') || t.includes('成'))) {
        score += 10
      }
    }

    if (context.budget) {
      if (context.budget === 'economy' && product.price < 50) score += 8
      if (context.budget === 'mid' && product.price >= 50 && product.price < 150) score += 8
      if (context.budget === 'premium' && product.price >= 150) score += 8
    }

    score += product.rating * 5
    score += Math.min(product.salesCount / 1000, 10)

    scored.push({ product, score })
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product)
}

export function getProductCategories(): Array<{ key: PetProduct['category']; label: string }> {
  return [
    { key: 'food', label: '食品' },
    { key: 'health', label: '健康护理' },
    { key: 'toy', label: '玩具' },
    { key: 'grooming', label: '美容清洁' },
    { key: 'bedding', label: '窝垫' },
    { key: 'accessory', label: '用品' },
  ]
}

export function buildAffiliateLink(product: PetProduct, userId: string): string {
  const baseUrl = product.affiliateUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}uid=${userId}&pid=${product.id}`
}
