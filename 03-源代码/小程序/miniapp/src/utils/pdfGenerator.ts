import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { HealthReportData } from '../types/reportTypes'

export async function generateHealthReportPDF(
  data: HealthReportData,
  elementId: string
): Promise<string> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Report preview element not found')
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')

  const imgWidth = 210
  const pageHeight = 297
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  return pdf.output('datauristring')
}

export function downloadPDF(pdfData: string, filename: string): void {
  const link = document.createElement('a')
  link.href = pdfData
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
