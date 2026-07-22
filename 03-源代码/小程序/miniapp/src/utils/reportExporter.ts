import Taro from '@tarojs/taro'
import type { HealthReportData } from '../types/reportTypes'

const CSV_BOM = '\uFEFF'
const CSV_DELIMITER = ','
const CSV_LINE_BREAK = '\r\n'

function escapeCsvField(value: string): string {
  if (value.includes(CSV_DELIMITER) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function generateCsvContent(data: HealthReportData): string {
  const lines: string[] = []

  lines.push(escapeCsvField('宠物健康报告'))
  lines.push(CSV_LINE_BREAK)
  lines.push(CSV_LINE_BREAK)

  lines.push(escapeCsvField('宠物档案'))
  lines.push(CSV_LINE_BREAK)
  const profileHeaders = ['名称', '品种', '物种', '性别', '出生日期', '体重(kg)', '是否绝育', '过敏史', '用药史', '慢性病']
  lines.push(profileHeaders.map(escapeCsvField).join(CSV_DELIMITER))
  lines.push(CSV_LINE_BREAK)
  const genderLabel = data.pet.gender === 'female' ? '母' : data.pet.gender === 'male' ? '公' : '未知'
  const neuteredLabel = data.pet.neutered ? '是' : '否'
  const profileRow = [
    data.pet.name,
    data.pet.breed,
    data.pet.species,
    genderLabel,
    data.pet.birthDate,
    String(data.pet.weight),
    neuteredLabel,
    data.pet.allergies.join(';'),
    data.pet.medications.join(';'),
    data.pet.chronicConditions.join(';'),
  ]
  lines.push(profileRow.map(escapeCsvField).join(CSV_DELIMITER))
  lines.push(CSV_LINE_BREAK)
  lines.push(CSV_LINE_BREAK)

  lines.push(escapeCsvField('健康打卡记录'))
  lines.push(CSV_LINE_BREAK)
  const entryHeaders = ['日期', '便便状态', '食欲', '精神', '运动', '体重(kg)']
  lines.push(entryHeaders.map(escapeCsvField).join(CSV_DELIMITER))
  lines.push(CSV_LINE_BREAK)
  for (const entry of data.entries) {
    const row = [
      entry.date,
      entry.bowel,
      entry.appetite,
      entry.energy,
      entry.exercise,
      entry.weight != null ? String(entry.weight) : '',
    ]
    lines.push(row.map(escapeCsvField).join(CSV_DELIMITER))
    lines.push(CSV_LINE_BREAK)
  }
  lines.push(CSV_LINE_BREAK)

  if (data.symptoms.length > 0) {
    lines.push(escapeCsvField('异常/症状记录'))
    lines.push(CSV_LINE_BREAK)
    const symptomHeaders = ['日期', '症状', '紧急程度', 'AI评估']
    lines.push(symptomHeaders.map(escapeCsvField).join(CSV_DELIMITER))
    lines.push(CSV_LINE_BREAK)
    for (const symptom of data.symptoms) {
      const row = [
        symptom.date,
        symptom.symptoms.join(';'),
        symptom.urgencyLevel,
        symptom.aiAssessment,
      ]
      lines.push(row.map(escapeCsvField).join(CSV_DELIMITER))
      lines.push(CSV_LINE_BREAK)
    }
    lines.push(CSV_LINE_BREAK)
  }

  if (data.vaccines.length > 0) {
    lines.push(escapeCsvField('疫苗/用药记录'))
    lines.push(CSV_LINE_BREAK)
    const vaccineHeaders = ['名称', '接种/用药日期', '到期日期', '状态']
    lines.push(vaccineHeaders.map(escapeCsvField).join(CSV_DELIMITER))
    lines.push(CSV_LINE_BREAK)
    for (const vaccine of data.vaccines) {
      const statusLabel = vaccine.status === 'done' ? '已完成' : vaccine.status === 'pending' ? '待处理' : '已逾期'
      const row = [
        vaccine.name,
        vaccine.dateGiven || '',
        vaccine.dateDue,
        statusLabel,
      ]
      lines.push(row.map(escapeCsvField).join(CSV_DELIMITER))
      lines.push(CSV_LINE_BREAK)
    }
    lines.push(CSV_LINE_BREAK)
  }

  if (data.aiAnalysis) {
    lines.push(escapeCsvField('AI趋势分析'))
    lines.push(CSV_LINE_BREAK)
    lines.push(escapeCsvField(data.aiAnalysis))
    lines.push(CSV_LINE_BREAK)
    lines.push(CSV_LINE_BREAK)
  }

  lines.push(escapeCsvField('报告生成时间'))
  lines.push(CSV_DELIMITER)
  lines.push(escapeCsvField(data.generatedAt))
  lines.push(CSV_LINE_BREAK)
  lines.push(escapeCsvField('报告周期'))
  lines.push(CSV_DELIMITER)
  lines.push(escapeCsvField(data.period))
  lines.push(CSV_LINE_BREAK)
  lines.push(escapeCsvField('免责声明：本报告仅供参考，不替代兽医诊断。如发现异常请及时就医。'))
  lines.push(CSV_LINE_BREAK)

  return CSV_BOM + lines.join('')
}

export async function exportHealthReportCsv(
  data: HealthReportData,
  petName: string,
): Promise<string> {
  const csvContent = generateCsvContent(data)
  const fileName = `${petName}健康报告.csv`
  const fs = Taro.getFileSystemManager()
  const tempPath = `${Taro.env.USER_DATA_PATH}/${fileName}`

  fs.writeFileSync(tempPath, csvContent, 'utf8')

  return tempPath
}

export async function shareHealthReportCsv(
  data: HealthReportData,
  petName: string,
): Promise<void> {
  try {
    const filePath = await exportHealthReportCsv(data, petName)
    Taro.shareFileMessage({
      filePath,
      fileName: `${petName}健康报告.csv`,
      fail: () => {
        Taro.showToast({ title: '分享失败', icon: 'none' })
      },
    })
  } catch {
    Taro.showToast({ title: '导出CSV失败', icon: 'none' })
  }
}
