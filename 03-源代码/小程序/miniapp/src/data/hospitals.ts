/**
 * 医院数据
 * 全国主要城市宠物医院信息，含合作医院和 24 小时急诊医院
 */

/** 医院信息 */
export interface HospitalInfo {
  id: string
  name: string
  address: string
  phone: string
  distance: number
  rating: number
  openHours: string
  services: string[]
  species: ('dog' | 'cat' | 'bird' | 'rabbit' | 'reptile' | 'small_animal')[]
  emergency: boolean
  latitude: number
  longitude: number
  city: string
  type: 'general' | 'specialist' | 'emergency'
  specialties?: string[]
  isPartner?: boolean
  partnerId?: string
  commissionRate?: number
}

const HOSPITALS: HospitalInfo[] = [
  {
    id: 'h001',
    name: '北京瑞派宠物医院（朝阳总院）',
    address: '北京市朝阳区建国路88号SOHO现代城A座',
    phone: '010-88886666',
    distance: 1.2,
    rating: 4.8,
    openHours: '09:00-21:00',
    services: ['内科', '外科', '影像科', '检验科', '牙科', '皮肤科'],
    species: ['dog', 'cat', 'bird', 'rabbit'],
    emergency: false,
    latitude: 39.9042,
    longitude: 116.4074,
    city: '北京',
    type: 'general',
    isPartner: true,
    partnerId: 'partner_h001',
    commissionRate: 0.08,
  },
  {
    id: 'h002',
    name: '北京爱诺动物医院（24h急诊）',
    address: '北京市海淀区中关村大街27号中关村大厦',
    phone: '010-66668888',
    distance: 3.5,
    rating: 4.9,
    openHours: '24小时',
    services: ['24h急诊', '内科', '外科', 'ICU', '血液透析', '影像科'],
    species: ['dog', 'cat', 'bird', 'rabbit', 'reptile', 'small_animal'],
    emergency: true,
    latitude: 39.959,
    longitude: 116.317,
    city: '北京',
    type: 'emergency',
  },
  {
    id: 'h003',
    name: '北京芭比堂动物眼科中心',
    address: '北京市西城区金融街甲9号',
    phone: '010-55559999',
    distance: 5.8,
    rating: 4.7,
    openHours: '09:00-18:00',
    services: ['眼科专科', '白内障手术', '青光眼治疗', '角膜移植'],
    species: ['dog', 'cat'],
    emergency: false,
    latitude: 39.9139,
    longitude: 116.3669,
    city: '北京',
    type: 'specialist',
    specialties: ['眼科'],
  },
  {
    id: 'h004',
    name: '上海瑞鹏宠物医院（浦东旗舰店）',
    address: '上海市浦东新区陆家嘴环路1000号',
    phone: '021-68888888',
    distance: 2.1,
    rating: 4.6,
    openHours: '08:30-22:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育', '牙科'],
    species: ['dog', 'cat', 'rabbit'],
    emergency: false,
    latitude: 31.2304,
    longitude: 121.4737,
    city: '上海',
    type: 'general',
  },
  {
    id: 'h005',
    name: '上海芭比堂动物医院（浦东分院）',
    address: '上海市浦东新区张杨路828号华都大厦',
    phone: '021-33336666',
    distance: 2.8,
    rating: 4.7,
    openHours: '08:30-22:00',
    services: ['内科', '外科', '影像科', '牙科', '体检', '绝育', '住院'],
    species: ['dog', 'cat', 'bird', 'rabbit', 'reptile'],
    emergency: false,
    latitude: 31.2304,
    longitude: 121.4737,
    city: '上海',
    type: 'general',
    isPartner: true,
    partnerId: 'partner_h005',
    commissionRate: 0.07,
  },
  {
    id: 'h006',
    name: '上海顽皮家族宠物骨科中心',
    address: '上海市长宁区虹桥路1438号',
    phone: '021-77778888',
    distance: 6.2,
    rating: 4.8,
    openHours: '09:00-19:00',
    services: ['骨科专科', '关节置换', '脊柱手术', '运动康复', '物理治疗'],
    species: ['dog', 'cat'],
    emergency: false,
    latitude: 31.198,
    longitude: 121.4,
    city: '上海',
    type: 'specialist',
    specialties: ['骨科'],
  },
  {
    id: 'h007',
    name: '广州爱宠动物医院（天河分院）',
    address: '广州市天河区天河路385号太古汇',
    phone: '020-88889999',
    distance: 1.8,
    rating: 4.5,
    openHours: '09:00-21:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
    species: ['dog', 'cat', 'bird'],
    emergency: false,
    latitude: 23.1291,
    longitude: 113.2644,
    city: '广州',
    type: 'general',
  },
  {
    id: 'h008',
    name: '广州立德动物医院（24h急诊）',
    address: '广州市越秀区东风东路753号',
    phone: '020-66667777',
    distance: 3.9,
    rating: 4.7,
    openHours: '24小时',
    services: ['24h急诊', '内科', '外科', 'ICU', '中毒急救'],
    species: ['dog', 'cat', 'bird', 'rabbit', 'small_animal'],
    emergency: true,
    latitude: 23.1291,
    longitude: 113.2644,
    city: '广州',
    type: 'emergency',
  },
  {
    id: 'h009',
    name: '广州瑞派宠物皮肤科中心',
    address: '广州市海珠区新港中路350号',
    phone: '020-55554444',
    distance: 5.1,
    rating: 4.6,
    openHours: '09:00-18:00',
    services: ['皮肤科专科', '过敏检测', '真菌治疗', '寄生虫防治', '药浴'],
    species: ['dog', 'cat'],
    emergency: false,
    latitude: 23.0958,
    longitude: 113.3199,
    city: '广州',
    type: 'specialist',
    specialties: ['皮肤科'],
  },
  {
    id: 'h010',
    name: '深圳瑞鹏宠物医院（南山总院）',
    address: '深圳市南山区深南大道9966号',
    phone: '0755-88886666',
    distance: 2.5,
    rating: 4.7,
    openHours: '08:30-22:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育', '牙科', '影像科'],
    species: ['dog', 'cat', 'rabbit', 'bird'],
    emergency: false,
    latitude: 22.5431,
    longitude: 114.0579,
    city: '深圳',
    type: 'general',
    isPartner: true,
    partnerId: 'partner_h010',
    commissionRate: 0.06,
  },
  {
    id: 'h011',
    name: '深圳联合宠物医院（24h急诊）',
    address: '深圳市福田区福华三路168号',
    phone: '0755-66668888',
    distance: 4.8,
    rating: 4.8,
    openHours: '24小时',
    services: ['24h急诊', '内科', '外科', 'ICU', '血液透析', '中毒急救'],
    species: ['dog', 'cat', 'bird', 'rabbit', 'reptile', 'small_animal'],
    emergency: true,
    latitude: 22.5431,
    longitude: 114.0579,
    city: '深圳',
    type: 'emergency',
  },
  {
    id: 'h012',
    name: '成都瑞派宠物医院（锦江总院）',
    address: '成都市锦江区人民南路二段80号',
    phone: '028-88889999',
    distance: 1.5,
    rating: 4.6,
    openHours: '09:00-21:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
    species: ['dog', 'cat', 'bird'],
    emergency: false,
    latitude: 30.5728,
    longitude: 104.0668,
    city: '成都',
    type: 'general',
  },
  {
    id: 'h013',
    name: '成都华西动物医院（24h急诊）',
    address: '成都市武侯区人民南路三段17号',
    phone: '028-66667777',
    distance: 3.2,
    rating: 4.9,
    openHours: '24小时',
    services: ['24h急诊', '内科', '外科', 'ICU', '创伤处理', '中毒急救'],
    species: ['dog', 'cat', 'bird', 'rabbit', 'small_animal'],
    emergency: true,
    latitude: 30.6359,
    longitude: 104.0607,
    city: '成都',
    type: 'emergency',
  },
  {
    id: 'h014',
    name: '杭州瑞鹏宠物医院（西湖分院）',
    address: '杭州市西湖区曙光路120号',
    phone: '0571-88887777',
    distance: 2.3,
    rating: 4.5,
    openHours: '09:00-21:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育', '牙科'],
    species: ['dog', 'cat', 'rabbit'],
    emergency: false,
    latitude: 30.2741,
    longitude: 120.1551,
    city: '杭州',
    type: 'general',
  },
  {
    id: 'h015',
    name: '杭州派希德动物医院（24h急诊）',
    address: '杭州市江干区钱江新城城星路89号',
    phone: '0571-66665555',
    distance: 5.6,
    rating: 4.7,
    openHours: '24小时',
    services: ['24h急诊', '内科', '外科', 'ICU', '中毒急救'],
    species: ['dog', 'cat', 'bird', 'rabbit', 'small_animal'],
    emergency: true,
    latitude: 30.2741,
    longitude: 120.1551,
    city: '杭州',
    type: 'emergency',
  },
  {
    id: 'h016',
    name: '武汉瑞派宠物医院（武昌总院）',
    address: '武汉市武昌区中南路7号',
    phone: '027-88886666',
    distance: 1.9,
    rating: 4.4,
    openHours: '09:00-21:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育'],
    species: ['dog', 'cat', 'bird'],
    emergency: false,
    latitude: 30.5928,
    longitude: 114.3055,
    city: '武汉',
    type: 'general',
  },
  {
    id: 'h017',
    name: '武汉联合动物医院（24h急诊）',
    address: '武汉市江汉区解放大道686号',
    phone: '027-66669999',
    distance: 4.1,
    rating: 4.6,
    openHours: '24小时',
    services: ['24h急诊', '内科', '外科', 'ICU', '创伤处理'],
    species: ['dog', 'cat', 'bird', 'rabbit'],
    emergency: true,
    latitude: 30.5928,
    longitude: 114.3055,
    city: '武汉',
    type: 'emergency',
  },
  {
    id: 'h018',
    name: '南京瑞鹏宠物医院（玄武分院）',
    address: '南京市玄武区中山路81号',
    phone: '025-88885555',
    distance: 2.7,
    rating: 4.5,
    openHours: '09:00-21:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
    species: ['dog', 'cat', 'rabbit'],
    emergency: false,
    latitude: 32.0603,
    longitude: 118.7969,
    city: '南京',
    type: 'general',
  },
  {
    id: 'h019',
    name: '西安瑞派宠物医院（雁塔总院）',
    address: '西安市雁塔区长安中路38号',
    phone: '029-88884444',
    distance: 3.3,
    rating: 4.3,
    openHours: '09:00-20:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育'],
    species: ['dog', 'cat'],
    emergency: false,
    latitude: 34.3416,
    longitude: 108.9398,
    city: '西安',
    type: 'general',
  },
  {
    id: 'h020',
    name: '重庆瑞鹏宠物医院（渝中总院）',
    address: '重庆市渝中区邹容路120号',
    phone: '023-88883333',
    distance: 1.6,
    rating: 4.4,
    openHours: '09:00-21:00',
    services: ['内科', '外科', '疫苗接种', '体检', '绝育', '影像科'],
    species: ['dog', 'cat', 'bird', 'rabbit'],
    emergency: false,
    latitude: 29.563,
    longitude: 106.5516,
    city: '重庆',
    type: 'general',
  },
]

export function getNearbyHospitals(city?: string, species?: string): HospitalInfo[] {
  let result = [...HOSPITALS]

  if (city) {
    result = result.filter(h => h.city === city)
  }

  if (species) {
    result = result.filter(h => h.species.includes(species as HospitalInfo['species'][number]))
  }

  return result.sort((a, b) => a.distance - b.distance)
}

export function searchHospitals(keyword: string): HospitalInfo[] {
  if (!keyword.trim()) {
    return [...HOSPITALS].sort((a, b) => a.distance - b.distance)
  }

  const lowerKeyword = keyword.toLowerCase().trim()
  return HOSPITALS.filter(h =>
    h.name.toLowerCase().includes(lowerKeyword) ||
    h.address.toLowerCase().includes(lowerKeyword) ||
    h.services.some(s => s.toLowerCase().includes(lowerKeyword)) ||
    h.city.toLowerCase().includes(lowerKeyword) ||
    (h.specialties && h.specialties.some(s => s.toLowerCase().includes(lowerKeyword)))
  ).sort((a, b) => a.distance - b.distance)
}

export function getHospitalById(id: string): HospitalInfo | undefined {
  return HOSPITALS.find(h => h.id === id)
}

export function getEmergencyHospitals(): HospitalInfo[] {
  return HOSPITALS.filter(h => h.emergency).sort((a, b) => a.distance - b.distance)
}

export function getAllCities(): string[] {
  return Array.from(new Set(HOSPITALS.map(h => h.city)))
}

export function getHospitalsByType(type: HospitalInfo['type']): HospitalInfo[] {
  return HOSPITALS.filter(h => h.type === type).sort((a, b) => a.distance - b.distance)
}
