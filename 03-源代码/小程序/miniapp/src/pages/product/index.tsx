/**
 * 宠物用品商城页面
 * 商品分类浏览、智能推荐、佣金展示
 */
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import { useProductCommission } from '../../hooks/useProductCommission'
import {
  getAllProducts,
  getProductCategories,
  getProductsByCategory,
  getRecommendedProducts,
  type PetProduct,
  type ProductRecommendationContext,
} from '../../data/petProducts'
import { useThemeClass } from '../../hooks/useThemeClass'
import './index.scss'

type TabKey = PetProduct['category'] | 'recommend'

interface CategoryTab {
  key: TabKey
  label: string
}

export default function ProductPage() {
  const user = useAuthStore(s => s.user)
  const { currentPet } = usePetStore()
  const themeClass = useThemeClass()

  const {
    handleProductClick,
    estimateCommission,
    getRecommendations,
    refreshStats,
    stats,
  } = useProductCommission({
    userId: user?.id ?? '',
    sourcePage: 'product_list',
  })

  const [activeTab, setActiveTab] = useState<TabKey>('recommend')
  const [products, setProducts] = useState<PetProduct[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<PetProduct[]>([])

  const categoryTabs: CategoryTab[] = useMemo(() => {
    const cats = getProductCategories()
    return [{ key: 'recommend', label: '推荐' }, ...cats.map(c => ({ key: c.key, label: c.label }))]
  }, [])

  const buildRecommendationContext = useCallback((): ProductRecommendationContext => {
    if (!currentPet) return {}

    const context: ProductRecommendationContext = {
      petSpecies: [currentPet.species],
    }

    if (currentPet.birthDate) {
      const birthDate = new Date(currentPet.birthDate)
      const ageInYears = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (ageInYears < 1) {
        context.petAge = 'puppy_kitten'
      } else if (ageInYears >= 7) {
        context.petAge = 'senior'
      } else {
        context.petAge = 'adult'
      }
    }

    if (currentPet.chronicConditions && currentPet.chronicConditions.length > 0) {
      context.healthCondition = currentPet.chronicConditions
    }

    return context
  }, [currentPet])

  useEffect(() => {
    if (activeTab === 'recommend') {
      const context = buildRecommendationContext()
      const recs = getRecommendations(context)
      setRecommendedProducts(recs)
      setProducts(recs)
    } else {
      const categoryProducts = getProductsByCategory(activeTab as PetProduct['category'])
      setProducts(categoryProducts)
    }
  }, [activeTab, buildRecommendationContext, getRecommendations])

  useEffect(() => {
    if (user?.id) {
      refreshStats()
    }
  }, [user?.id, refreshStats])

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
  }, [])

  const handleBuyClick = useCallback((product: PetProduct) => {
    const link = handleProductClick(product)
    if (link) {
      Taro.setClipboardData({
        data: link,
        success: () => {
          Taro.showToast({ title: '链接已复制，即将跳转', icon: 'success' })
        },
      })
    }
  }, [handleProductClick])

  const platformLabels: Record<PetProduct['platform'], string> = {
    jd: '京东',
    taobao: '淘宝',
    pdd: '拼多多',
  }

  return (
    <ScrollView className={`product-page ${themeClass}`} scrollY>
      <View className='product-header'>
        <Text className='product-header-title'>宠物用品</Text>
        {stats && (
          <View className='product-stats-bar'>
            <Text className='product-stats-text'>
              今日预估佣金 ¥{stats.pendingCommission.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView className='product-tabs' scrollX>
        <View className='product-tabs-inner'>
          {categoryTabs.map(tab => (
            <View
              key={tab.key}
              className={`product-tab ${activeTab === tab.key ? 'product-tab--active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <Text className='product-tab-label'>{tab.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {products.length === 0 ? (
        <View className='product-empty'>
          <Text className='product-empty-icon'>🛍️</Text>
          <Text className='product-empty-text'>暂无商品</Text>
          <Text className='product-empty-hint'>请先添加宠物以获取推荐</Text>
        </View>
      ) : (
        <View className='product-grid'>
          {products.map(product => (
            <View key={product.id} className='product-card'>
              <View className='product-card-image-wrap'>
                <Image
                  className='product-card-image'
                  src={product.imageUrl || '/assets/placeholder-product.png'}
                  mode='aspectFill'
                />
                {product.commissionRate > 0 && (
                  <View className='product-card-badge'>
                    <Text className='product-card-badge-text'>佣{Math.round(product.commissionRate * 100)}%</Text>
                  </View>
                )}
              </View>

              <View className='product-card-body'>
                <View className='product-card-platform'>
                  <Text className='product-card-platform-text'>{platformLabels[product.platform]}</Text>
                </View>
                <Text className='product-card-name'>{product.name}</Text>
                <Text className='product-card-desc'>{product.description}</Text>

                <View className='product-card-tags'>
                  {product.tags.slice(0, 3).map(tag => (
                    <View key={tag} className='product-card-tag'>
                      <Text className='product-card-tag-text'>{tag}</Text>
                    </View>
                  ))}
                </View>

                <View className='product-card-footer'>
                  <View className='product-card-price-wrap'>
                    <Text className='product-card-price'>¥{product.price}</Text>
                    {product.originalPrice > product.price && (
                      <Text className='product-card-original-price'>¥{product.originalPrice}</Text>
                    )}
                  </View>
                  <View className='product-card-commission'>
                    <Text className='product-card-commission-text'>
                      预估佣金 ¥{estimateCommission(product).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View
                  className='product-card-buy-btn'
                  onClick={() => handleBuyClick(product)}
                >
                  <Text className='product-card-buy-btn-text'>立即购买</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className='product-bottom-safe' />
    </ScrollView>
  )
}