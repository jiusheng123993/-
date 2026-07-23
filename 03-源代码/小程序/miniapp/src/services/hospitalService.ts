import Taro from '@tarojs/taro'
import {
  getNearbyHospitals as getNearbyHospitalsData,
  searchHospitals as searchHospitalsData,
  getHospitalById as getHospitalByIdData,
  getEmergencyHospitals as getEmergencyHospitalsData,
  getHospitalsByType,
} from '../data/hospitals'
import type { HospitalInfo } from '../data/hospitals'

export type { HospitalInfo }

export interface HospitalFilterOptions {
  city?: string
  species?: string
  latitude?: number
  longitude?: number
}

export interface RecommendedHospital {
  hospital: HospitalInfo
  reason: string
  relevanceScore: number
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function sortByDistance(hospitals: HospitalInfo[], latitude?: number, longitude?: number): HospitalInfo[] {
  if (latitude == null || longitude == null) {
    return [...hospitals].sort((a, b) => a.distance - b.distance)
  }
  return [...hospitals].sort((a, b) => {
    const distA = calculateDistance(latitude, longitude, a.latitude, a.longitude)
    const distB = calculateDistance(latitude, longitude, b.latitude, b.longitude)
    return distA - distB
  })
}

export function getNearbyHospitals(options?: HospitalFilterOptions): HospitalInfo[] {
  try {
    const { city, species, latitude, longitude } = options || {}
    const hospitals = getNearbyHospitalsData(city, species)
    return sortByDistance(hospitals, latitude, longitude)
  } catch (error) {
    return []
  }
}

export function searchHospitals(keyword: string): HospitalInfo[] {
  try {
    if (!keyword || typeof keyword !== 'string') {
      return []
    }
    return searchHospitalsData(keyword.trim())
  } catch (error) {
    return []
  }
}

export function getHospitalDetail(id: string): HospitalInfo | null {
  try {
    if (!id || typeof id !== 'string') {
      return null
    }
    const hospital = getHospitalByIdData(id)
    return hospital || null
  } catch (error) {
    return null
  }
}

export function getEmergencyHospitals(): HospitalInfo[] {
  try {
    return getEmergencyHospitalsData()
  } catch (error) {
    return []
  }
}

export function callHospital(phone: string): void {
  try {
    if (!phone || typeof phone !== 'string') {
      Taro.showToast({ title: '电话号码无效', icon: 'none' })
      return
    }
    Taro.makePhoneCall({
      phoneNumber: phone.replace(/[^\d-]/g, ''),
      fail: () => {
        Taro.showToast({ title: '拨打电话失败', icon: 'none' })
      },
    })
  } catch (error) {
    Taro.showToast({ title: '拨打电话失败', icon: 'none' })
  }
}

export function navigateToHospital(latitude: number, longitude: number, name: string): void {
  try {
    if (latitude == null || longitude == null) {
      Taro.showToast({ title: '位置信息无效', icon: 'none' })
      return
    }
    Taro.openLocation({
      latitude,
      longitude,
      name,
      address: '',
      fail: () => {
        Taro.showToast({ title: '打开导航失败', icon: 'none' })
      },
    })
  } catch (error) {
    Taro.showToast({ title: '导航失败', icon: 'none' })
  }
}

const SYMPTOM_TO_SPECIALTY: Record<string, string[]> = {
  eye: ['眼科', '眼科专科', '白内障手术', '青光眼治疗'],
  vision: ['眼科', '眼科专科'],
  bone: ['骨科', '骨科专科', '关节置换', '脊柱手术'],
  joint: ['骨科', '骨科专科', '关节置换'],
  fracture: ['骨科', '骨科专科', '创伤处理'],
  skin: ['皮肤科', '皮肤科专科', '过敏检测', '真菌治疗'],
  allergy: ['皮肤科', '皮肤科专科', '过敏检测'],
  rash: ['皮肤科', '皮肤科专科'],
  emergency: ['24h急诊', '急诊', 'ICU', '中毒急救', '创伤处理'],
  poisoning: ['24h急诊', '中毒急救'],
  trauma: ['24h急诊', '创伤处理', '外科'],
  surgery: ['外科', '手术'],
  dental: ['牙科', '口腔'],
  internal: ['内科'],
  vaccine: ['疫苗接种'],
  checkup: ['体检'],
}

export function getRecommendedHospitals(petId?: string, symptoms?: string[]): RecommendedHospital[] {
  try {
    const allHospitals = getNearbyHospitalsData()
    const recommendations: RecommendedHospital[] = []

    if (!symptoms || symptoms.length === 0) {
      return allHospitals.slice(0, 5).map(hospital => ({
        hospital,
        reason: '综合推荐',
        relevanceScore: 0.5,
      }))
    }

    const matchedSpecialties = new Set<string>()
    symptoms.forEach(symptom => {
      const lowerSymptom = symptom.toLowerCase()
      Object.entries(SYMPTOM_TO_SPECIALTY).forEach(([key, specialties]) => {
        if (lowerSymptom.includes(key)) {
          specialties.forEach(s => matchedSpecialties.add(s))
        }
      })
    })

    if (matchedSpecialties.size === 0) {
      return allHospitals.slice(0, 5).map(hospital => ({
        hospital,
        reason: '综合推荐',
        relevanceScore: 0.5,
      }))
    }

    allHospitals.forEach(hospital => {
      let score = 0
      const matchedServices: string[] = []

      hospital.services.forEach(service => {
        matchedSpecialties.forEach(specialty => {
          if (service.includes(specialty)) {
            score += 1
            if (!matchedServices.includes(specialty)) {
              matchedServices.push(specialty)
            }
          }
        })
      })

      if (hospital.specialties) {
        hospital.specialties.forEach(specialty => {
          matchedSpecialties.forEach(matched => {
            if (specialty.includes(matched) || matched.includes(specialty)) {
              score += 2
            }
          })
        })
      }

      if (hospital.emergency && symptoms.some(s => {
        const lower = s.toLowerCase()
        return lower.includes('emergency') || lower.includes('urgent') || lower.includes('中毒') || lower.includes('创伤')
      })) {
        score += 3
      }

      if (score > 0) {
        const reason = matchedServices.length > 0
          ? `擅长：${matchedServices.slice(0, 3).join('、')}`
          : '专科匹配'
        recommendations.push({
          hospital,
          reason,
          relevanceScore: score,
        })
      }
    })

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)
  } catch (error) {
    return []
  }
}
