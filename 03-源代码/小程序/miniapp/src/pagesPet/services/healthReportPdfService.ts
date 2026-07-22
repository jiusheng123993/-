import Taro from '@tarojs/taro'
import { getCheckinsByDateRange } from '../../services/checkinService'
import { getVaccineRecords } from '../../services/vaccineService'
import { getPetById } from '../../services/petService'
import { getCheckHistory } from '../../services/symptomService'
import { renderReportToCanvas, saveReportImage } from '../../utils/reportCanvasRenderer'
import { exportHealthReportCsv, shareHealthReportCsv } from '../../utils/reportExporter'
import type { HealthReportData } from '../../types/reportTypes'

const CANVAS_ID = 'health-report-canvas'

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function generateHealthReportData(
  userId: string,
  petId: string,
  days: number = 30,
): Promise<HealthReportData> {
  const pet = await getPetById(userId, petId)
  if (!pet) throw new Error('Pet not found')

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const entries = await getCheckinsByDateRange(petId, userId, formatDate(startDate), formatDate(endDate))
  const vaccines = await getVaccineRecords(petId)
  const symptomHistory = await getCheckHistory(petId)

  const filteredSymptoms = symptomHistory
    .filter((record) => {
      const recordDate = record.createdAt.slice(0, 10)
      return recordDate >= formatDate(startDate) && recordDate <= formatDate(endDate)
    })
    .slice(0, 5)
    .map((record) => ({
      date: record.createdAt.slice(0, 10),
      symptoms: record.symptoms,
      urgencyLevel: record.riskLevel,
      aiAssessment: record.aiAdvice,
    }))

  const aiAnalysis = filteredSymptoms.length > 0
    ? `报告期内共进行${filteredSymptoms.length}次症状检查。${filteredSymptoms.some((s) => s.urgencyLevel === 'emergency' || s.urgencyLevel === 'warning') ? '存在高风险记录，建议尽快就医复查。' : '未发现高风险异常，请继续保持观察。'}`
    : undefined

  return {
    pet: {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '未知',
      birthDate: pet.birthDate || '未知',
      gender: pet.gender || 'unknown',
      neutered: pet.isNeutered || false,
      weight: pet.weight || 0,
      photoUrl: pet.avatarPhotoUrl,
      allergies: [],
      medications: [],
      chronicConditions: [],
    },
    entries: entries.map(entry => ({
      date: entry.createdAt instanceof Date
        ? formatDate(entry.createdAt)
        : formatDate(new Date(entry.createdAt)),
      bowel: entry.poopLevel === 3 ? '正常' : entry.poopLevel === 5 ? '便秘' : entry.poopLevel === 4 ? '软便' : entry.poopLevel === 2 ? '腹泻' : '血便',
      appetite: entry.appetiteLevel === 3 ? '正常' : entry.appetiteLevel >= 4 ? '亢进' : entry.appetiteLevel === 2 ? '减退' : '拒食',
      energy: entry.spiritLevel === 3 ? '正常' : entry.spiritLevel >= 4 ? '兴奋' : entry.spiritLevel === 2 ? '低落' : '萎靡',
      exercise: entry.exerciseLevel === 3 ? '正常' : entry.exerciseLevel >= 4 ? '活跃' : entry.exerciseLevel === 2 ? '减少' : '无',
      weight: entry.weight,
    })),
    symptoms: filteredSymptoms,
    vaccines: vaccines.map(v => ({
      name: v.category,
      dateGiven: v.date,
      dateDue: v.nextDate || v.date,
      status: v.status === 'completed' ? 'done' : v.status === 'pending' ? 'pending' : 'overdue',
    })),
    generatedAt: new Date().toLocaleDateString('zh-CN'),
    period: `${formatDate(startDate)} 至 ${formatDate(endDate)}`,
    aiAnalysis,
  }
}

export async function downloadHealthReport(
  data: HealthReportData,
  _petName: string,
): Promise<void> {
  try {
    const result = await renderReportToCanvas(data, { canvasId: CANVAS_ID })
    await saveReportImage(result.tempFilePath)
  } catch (err) {
    Taro.showToast({ title: '导出失败', icon: 'none' })
    throw err
  }
}

export async function shareHealthReport(
  data: HealthReportData,
  petName: string,
): Promise<void> {
  try {
    const result = await renderReportToCanvas(data, { canvasId: CANVAS_ID })
    Taro.shareFileMessage({
      filePath: result.tempFilePath,
      fileName: `${petName}健康报告.png`,
      fail: () => {
        Taro.showToast({ title: '分享失败', icon: 'none' })
      },
    })
  } catch {
    Taro.showToast({ title: '分享失败', icon: 'none' })
  }
}

export async function downloadHealthReportCsv(
  data: HealthReportData,
  petName: string,
): Promise<void> {
  try {
    const filePath = await exportHealthReportCsv(data, petName)
    Taro.showToast({ title: 'CSV已生成', icon: 'success' })
    Taro.shareFileMessage({
      filePath,
      fileName: `${petName}健康报告.csv`,
      fail: () => {
        Taro.showToast({ title: '分享CSV失败', icon: 'none' })
      },
    })
  } catch (err) {
    Taro.showToast({ title: '导出CSV失败', icon: 'none' })
    throw err
  }
}

export async function shareReportToVet(
  data: HealthReportData,
  petName: string,
): Promise<void> {
  try {
    const [imageResult, csvPath] = await Promise.all([
      renderReportToCanvas(data, { canvasId: CANVAS_ID }),
      exportHealthReportCsv(data, petName),
    ])

    Taro.showActionSheet({
      itemList: ['发送图片报告', '发送CSV数据', '同时发送两种格式'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            Taro.shareFileMessage({
              filePath: imageResult.tempFilePath,
              fileName: `${petName}健康报告.png`,
              fail: () => Taro.showToast({ title: '分享失败', icon: 'none' }),
            })
            break
          case 1:
            Taro.shareFileMessage({
              filePath: csvPath,
              fileName: `${petName}健康报告.csv`,
              fail: () => Taro.showToast({ title: '分享失败', icon: 'none' }),
            })
            break
          case 2:
            Taro.shareFileMessage({
              filePath: imageResult.tempFilePath,
              fileName: `${petName}健康报告.png`,
              success: () => {
                setTimeout(() => {
                  Taro.shareFileMessage({
                    filePath: csvPath,
                    fileName: `${petName}健康报告.csv`,
                    fail: () => Taro.showToast({ title: 'CSV分享失败', icon: 'none' }),
                  })
                }, 500)
              },
              fail: () => Taro.showToast({ title: '图片分享失败', icon: 'none' }),
            })
            break
        }
      },
    })
  } catch {
    Taro.showToast({ title: '分享给兽医失败', icon: 'none' })
  }
}
