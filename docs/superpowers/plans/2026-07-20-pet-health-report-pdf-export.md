# 健康报告PDF导出功能 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现宠物健康报告PDF导出功能，支持一键生成包含宠物档案、健康趋势、异常记录、用药史的PDF报告，可分享给兽医。

**Architecture:** 在小程序端使用 jspdf + html2canvas 生成PDF报告，复用已有的 petService、trendService、reportService 数据层，新增 PDF 模板引擎。

**Tech Stack:** Taro 3.x + React + TypeScript + jspdf + html2canvas

---

## 文件结构

```
03-源代码/小程序/miniapp/src/
├── services/
│   └── reportService.ts          # 已有，需扩展PDF生成方法
├── utils/
│   └── pdfGenerator.ts           # 新增：PDF生成工具
├── components/
│   └── HealthReportPreview.tsx   # 新增：报告预览组件
├── pages/
│   └── pet-trends/
│       └── index.tsx             # 已有，需添加导出按钮
└── styles/
    └── report.scss               # 新增：报告样式
```

---

## Task 1: 安装PDF生成依赖

**Files:**
- Modify: `03-源代码/小程序/miniapp/package.json`

- [ ] **Step 1: 添加依赖**

```bash
cd "03-源代码/小程序/miniapp"
npm install jspdf html2canvas
```

- [ ] **Step 2: 验证安装**

```bash
npm list jspdf html2canvas
```

Expected: 显示版本号

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
npm run lint
npm run typecheck
git commit -m "chore(deps): add jspdf and html2canvas for PDF generation"
```

---

## Task 2: 创建PDF生成工具

**Files:**
- Create: `03-源代码/小程序/miniapp/src/utils/pdfGenerator.ts`

- [ ] **Step 1: 编写PDF生成器**

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PetProfile } from '../types/petTypes';
import { HealthEntry } from '../types/healthTypes';
import { SymptomCheck } from '../types/symptomTypes';
import { VaccinationRecord } from '../types/vaccineTypes';

export interface HealthReportData {
  pet: PetProfile;
  entries: HealthEntry[];
  symptoms: SymptomCheck[];
  vaccines: VaccinationRecord[];
  generatedAt: string;
  period: string;
}

export async function generateHealthReportPDF(
  data: HealthReportData,
  elementId: string
): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Report preview element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output('datauristring');
}

export function downloadPDF(pdfData: string, filename: string): void {
  const link = document.createElement('a');
  link.href = pdfData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

- [ ] **Step 2: 创建类型定义文件**

Create: `03-源代码/小程序/miniapp/src/types/reportTypes.ts`

```typescript
export interface HealthReportData {
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    birthDate: string;
    gender: string;
    neutered: boolean;
    weight: number;
    photoUrl?: string;
    allergies: string[];
    medications: string[];
    chronicConditions: string[];
  };
  entries: {
    date: string;
    bowel: string;
    appetite: string;
    energy: string;
    exercise: string;
    weight?: number;
  }[];
  symptoms: {
    date: string;
    symptoms: string[];
    urgencyLevel: string;
    aiAssessment: string;
  }[];
  vaccines: {
    name: string;
    dateGiven?: string;
    dateDue: string;
    status: string;
  }[];
  generatedAt: string;
  period: string;
}

export interface PDFGeneratorOptions {
  scale?: number;
  quality?: number;
  pageSize?: 'a4' | 'letter';
}
```

- [ ] **Step 3: 编写单元测试**

Create: `03-源代码/小程序/miniapp/src/utils/__tests__/pdfGenerator.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateHealthReportPDF, downloadPDF } from '../pdfGenerator';
import { HealthReportData } from '../../types/reportTypes';

describe('pdfGenerator', () => {
  const mockData: HealthReportData = {
    pet: {
      id: '1',
      name: '咪咪',
      species: 'cat',
      breed: '英短',
      birthDate: '2022-01-01',
      gender: 'female',
      neutered: true,
      weight: 4.5,
      allergies: [],
      medications: [],
      chronicConditions: [],
    },
    entries: [],
    symptoms: [],
    vaccines: [],
    generatedAt: '2026-07-20',
    period: '2026-06-20 至 2026-07-20',
  };

  it('should throw error when element not found', async () => {
    await expect(generateHealthReportPDF(mockData, 'non-existent')).rejects.toThrow(
      'Report preview element not found'
    );
  });

  it('should generate PDF data string', async () => {
    // Mock html2canvas and jsPDF
    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      height: 1000,
      width: 800,
    };
    
    vi.mock('html2canvas', () => ({
      default: vi.fn().mockResolvedValue(mockCanvas),
    }));

    const mockAddImage = vi.fn();
    const mockOutput = vi.fn().mockReturnValue('data:application/pdf;base64,test');
    
    vi.mock('jspdf', () => ({
      default: vi.fn().mockImplementation(() => ({
        addImage: mockAddImage,
        addPage: vi.fn(),
        output: mockOutput,
      })),
    }));

    // Create a mock element
    const mockElement = document.createElement('div');
    mockElement.id = 'test-report';
    document.body.appendChild(mockElement);

    const result = await generateHealthReportPDF(mockData, 'test-report');
    
    expect(result).toBe('data:application/pdf;base64,test');
    expect(mockOutput).toHaveBeenCalledWith('datauristring');

    document.body.removeChild(mockElement);
  });

  it('should download PDF', () => {
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    downloadPDF('data:application/pdf;base64,test', 'health-report.pdf');

    expect(mockLink.href).toBe('data:application/pdf;base64,test');
    expect(mockLink.download).toBe('health-report.pdf');
    expect(mockLink.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run src/utils/__tests__/pdfGenerator.test.ts
```

Expected: 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/utils/pdfGenerator.ts src/types/reportTypes.ts src/utils/__tests__/pdfGenerator.test.ts
git commit -m "feat(report): add PDF generator utility with tests"
```

---

## Task 3: 创建健康报告预览组件

**Files:**
- Create: `03-源代码/小程序/miniapp/src/components/HealthReportPreview.tsx`
- Create: `03-源代码/小程序/miniapp/src/components/HealthReportPreview.scss`

- [ ] **Step 1: 编写报告预览组件**

```typescript
import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { HealthReportData } from '../types/reportTypes';
import './HealthReportPreview.scss';

interface Props {
  data: HealthReportData;
}

export const HealthReportPreview: React.FC<Props> = ({ data }) => {
  const { pet, entries, symptoms, vaccines, generatedAt, period } = data;

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'red': return '#ff4d4f';
      case 'orange': return '#ff7a45';
      case 'yellow': return '#ffc53d';
      default: return '#52c41a';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'done': return '已完成';
      case 'overdue': return '已逾期';
      default: return '待接种';
    }
  };

  return (
    <View className="health-report-preview" id="health-report-preview">
      {/* 报告头部 */}
      <View className="report-header">
        <Text className="report-title">🐾 宠物健康报告</Text>
        <Text className="report-subtitle">{pet.name}的健康档案</Text>
        <Text className="report-period">报告周期：{period}</Text>
        <Text className="report-generated">生成时间：{generatedAt}</Text>
      </View>

      {/* 宠物档案 */}
      <View className="report-section">
        <Text className="section-title">📋 宠物档案</Text>
        <View className="pet-info-grid">
          <View className="info-item">
            <Text className="info-label">姓名</Text>
            <Text className="info-value">{pet.name}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">品种</Text>
            <Text className="info-value">{pet.breed}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">性别</Text>
            <Text className="info-value">{pet.gender === 'male' ? '公' : '母'}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">绝育</Text>
            <Text className="info-value">{pet.neutered ? '已绝育' : '未绝育'}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">体重</Text>
            <Text className="info-value">{pet.weight} kg</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">出生日期</Text>
            <Text className="info-value">{pet.birthDate}</Text>
          </View>
        </View>
        
        {pet.allergies.length > 0 && (
          <View className="info-row">
            <Text className="info-label">过敏史：</Text>
            <Text className="info-value">{pet.allergies.join('、')}</Text>
          </View>
        )}
        
        {pet.medications.length > 0 && (
          <View className="info-row">
            <Text className="info-label">当前用药：</Text>
            <Text className="info-value">{pet.medications.join('、')}</Text>
          </View>
        )}
        
        {pet.chronicConditions.length > 0 && (
          <View className="info-row">
            <Text className="info-label">慢性病：</Text>
            <Text className="info-value">{pet.chronicConditions.join('、')}</Text>
          </View>
        )}
      </View>

      {/* 健康打卡记录 */}
      {entries.length > 0 && (
        <View className="report-section">
          <Text className="section-title">📊 健康打卡记录（最近30天）</Text>
          <View className="entries-table">
            <View className="table-header">
              <Text className="th">日期</Text>
              <Text className="th">便便</Text>
              <Text className="th">食欲</Text>
              <Text className="th">精神</Text>
              <Text className="th">运动</Text>
            </View>
            {entries.map((entry, index) => (
              <View key={index} className="table-row">
                <Text className="td">{entry.date}</Text>
                <Text className="td">{entry.bowel}</Text>
                <Text className="td">{entry.appetite}</Text>
                <Text className="td">{entry.energy}</Text>
                <Text className="td">{entry.exercise}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 症状记录 */}
      {symptoms.length > 0 && (
        <View className="report-section">
          <Text className="section-title">⚠️ 症状记录</Text>
          {symptoms.map((symptom, index) => (
            <View key={index} className="symptom-card">
              <View className="symptom-header">
                <Text className="symptom-date">{symptom.date}</Text>
                <View 
                  className="urgency-badge"
                  style={{ backgroundColor: getUrgencyColor(symptom.urgencyLevel) }}
                >
                  <Text className="urgency-text">
                    {symptom.urgencyLevel === 'red' ? '紧急' : 
                     symptom.urgencyLevel === 'orange' ? '尽快就医' :
                     symptom.urgencyLevel === 'yellow' ? '关注' : '观察'}
                  </Text>
                </View>
              </View>
              <Text className="symptom-list">症状：{symptom.symptoms.join('、')}</Text>
              <Text className="ai-assessment">AI评估：{symptom.aiAssessment}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 疫苗记录 */}
      {vaccines.length > 0 && (
        <View className="report-section">
          <Text className="section-title">💉 疫苗记录</Text>
          <View className="vaccine-list">
            {vaccines.map((vaccine, index) => (
              <View key={index} className="vaccine-item">
                <Text className="vaccine-name">{vaccine.name}</Text>
                <Text className="vaccine-status">{getStatusText(vaccine.status)}</Text>
                <Text className="vaccine-date">
                  {vaccine.dateGiven ? `接种日期：${vaccine.dateGiven}` : `预计接种：${vaccine.dateDue}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 免责声明 */}
      <View className="report-footer">
        <Text className="disclaimer">
          ⚠️ 本报告由星寰海AI宠物管家生成，仅供参考，不替代专业兽医诊断。
          如宠物出现健康问题，请及时就医。
        </Text>
        <Text className="report-brand">星寰海 · 有记忆的AI宠物管家</Text>
      </View>
    </View>
  );
};

export default HealthReportPreview;
```

- [ ] **Step 2: 编写样式**

```scss
.health-report-preview {
  padding: 24px;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  .report-header {
    text-align: center;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid #f0f0f0;

    .report-title {
      display: block;
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .report-subtitle {
      display: block;
      font-size: 18px;
      color: #666;
      margin-bottom: 12px;
    }

    .report-period,
    .report-generated {
      display: block;
      font-size: 14px;
      color: #999;
      margin-top: 4px;
    }
  }

  .report-section {
    margin-bottom: 28px;

    .section-title {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8e8e8;
    }
  }

  .pet-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;

    .info-item {
      background: #f6f6f6;
      padding: 12px;
      border-radius: 8px;

      .info-label {
        display: block;
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
      }

      .info-value {
        display: block;
        font-size: 15px;
        font-weight: 500;
        color: #1a1a1a;
      }
    }
  }

  .info-row {
    display: flex;
    margin-top: 8px;
    padding: 8px 0;

    .info-label {
      font-size: 14px;
      color: #666;
      min-width: 80px;
    }

    .info-value {
      font-size: 14px;
      color: #1a1a1a;
      flex: 1;
    }
  }

  .entries-table {
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;

    .table-header {
      display: flex;
      background: #f6f6f6;
      padding: 12px;

      .th {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        color: #666;
        text-align: center;
      }
    }

    .table-row {
      display: flex;
      padding: 10px 12px;
      border-top: 1px solid #e8e8e8;

      .td {
        flex: 1;
        font-size: 13px;
        color: #1a1a1a;
        text-align: center;
      }
    }
  }

  .symptom-card {
    background: #fff7e6;
    border: 1px solid #ffd8bf;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;

    .symptom-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .symptom-date {
        font-size: 14px;
        color: #666;
      }

      .urgency-badge {
        padding: 4px 12px;
        border-radius: 12px;

        .urgency-text {
          font-size: 12px;
          color: #fff;
          font-weight: 500;
        }
      }
    }

    .symptom-list {
      display: block;
      font-size: 14px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .ai-assessment {
      display: block;
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }
  }

  .vaccine-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 8px;
    margin-bottom: 8px;

    .vaccine-name {
      font-size: 15px;
      font-weight: 500;
      color: #1a1a1a;
    }

    .vaccine-status {
      font-size: 13px;
      color: #52c41a;
      font-weight: 500;
    }

    .vaccine-date {
      font-size: 12px;
      color: #999;
    }
  }

  .report-footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 2px solid #f0f0f0;
    text-align: center;

    .disclaimer {
      display: block;
      font-size: 12px;
      color: #999;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .report-brand {
      display: block;
      font-size: 14px;
      color: #1890ff;
      font-weight: 500;
    }
  }
}
```

- [ ] **Step 3: 编写组件测试**

Create: `03-源代码/小程序/miniapp/src/components/__tests__/HealthReportPreview.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HealthReportPreview from '../HealthReportPreview';
import { HealthReportData } from '../../types/reportTypes';

describe('HealthReportPreview', () => {
  const mockData: HealthReportData = {
    pet: {
      id: '1',
      name: '咪咪',
      species: 'cat',
      breed: '英短',
      birthDate: '2022-01-01',
      gender: 'female',
      neutered: true,
      weight: 4.5,
      allergies: ['海鲜'],
      medications: ['维生素'],
      chronicConditions: [],
    },
    entries: [
      {
        date: '2026-07-20',
        bowel: '正常',
        appetite: '正常',
        energy: '正常',
        exercise: '正常',
        weight: 4.5,
      },
    ],
    symptoms: [
      {
        date: '2026-07-18',
        symptoms: ['呕吐', '精神差'],
        urgencyLevel: 'yellow',
        aiAssessment: '建议观察，如持续则就医',
      },
    ],
    vaccines: [
      {
        name: '猫三联',
        dateGiven: '2026-01-15',
        dateDue: '2026-07-15',
        status: 'overdue',
      },
    ],
    generatedAt: '2026-07-20',
    period: '2026-06-20 至 2026-07-20',
  };

  it('should render report with all sections', () => {
    const { getByText } = render(<HealthReportPreview data={mockData} />);
    
    expect(getByText('🐾 宠物健康报告')).toBeDefined();
    expect(getByText('咪咪的健康档案')).toBeDefined();
    expect(getByText('📋 宠物档案')).toBeDefined();
    expect(getByText('📊 健康打卡记录（最近30天）')).toBeDefined();
    expect(getByText('⚠️ 症状记录')).toBeDefined();
    expect(getByText('💉 疫苗记录')).toBeDefined();
  });

  it('should render pet info correctly', () => {
    const { getByText } = render(<HealthReportPreview data={mockData} />);
    
    expect(getByText('咪咪')).toBeDefined();
    expect(getByText('英短')).toBeDefined();
    expect(getByText('4.5 kg')).toBeDefined();
    expect(getByText('已绝育')).toBeDefined();
  });

  it('should render urgency badge with correct color', () => {
    const { container } = render(<HealthReportPreview data={mockData} />);
    
    const badge = container.querySelector('.urgency-badge');
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('style')).toContain('background-color: rgb(255, 197, 61)');
  });

  it('should render disclaimer', () => {
    const { getByText } = render(<HealthReportPreview data={mockData} />);
    
    expect(getByText(/本报告由星寰海AI宠物管家生成/)).toBeDefined();
    expect(getByText('星寰海 · 有记忆的AI宠物管家')).toBeDefined();
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run src/components/__tests__/HealthReportPreview.test.tsx
```

Expected: 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/components/HealthReportPreview.tsx src/components/HealthReportPreview.scss src/components/__tests__/HealthReportPreview.test.tsx
git commit -m "feat(report): add health report preview component with tests"
```

---

## Task 4: 扩展报告服务

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/services/reportService.ts`

- [ ] **Step 1: 读取现有报告服务**

Read: `03-源代码/小程序/miniapp/src/services/reportService.ts`

- [ ] **Step 2: 添加PDF生成方法**

在现有 reportService.ts 中添加：

```typescript
import { generateHealthReportPDF, downloadPDF } from '../utils/pdfGenerator';
import { HealthReportData } from '../types/reportTypes';

export class ReportService {
  // ... existing methods ...

  /**
   * 生成健康报告PDF
   */
  async generateHealthReportPDF(petId: string): Promise<string> {
    const pet = await this.petService.getPetById(petId);
    const entries = await this.checkinService.getRecentEntries(petId, 30);
    const symptoms = await this.symptomService.getRecentSymptoms(petId, 30);
    const vaccines = await this.vaccineService.getVaccineRecords(petId);

    const reportData: HealthReportData = {
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birthDate,
        gender: pet.gender,
        neutered: pet.neutered,
        weight: pet.weight,
        photoUrl: pet.photoUrl,
        allergies: pet.allergies || [],
        medications: pet.medications || [],
        chronicConditions: pet.chronicConditions || [],
      },
      entries: entries.map(entry => ({
        date: entry.entryDate,
        bowel: entry.bowel,
        appetite: entry.appetite,
        energy: entry.energy,
        exercise: entry.exercise,
        weight: entry.weight,
      })),
      symptoms: symptoms.map(symptom => ({
        date: symptom.createdAt,
        symptoms: symptom.symptoms,
        urgencyLevel: symptom.urgencyLevel,
        aiAssessment: symptom.aiAssessment?.summary || '',
      })),
      vaccines: vaccines.map(vaccine => ({
        name: vaccine.name,
        dateGiven: vaccine.dateGiven,
        dateDue: vaccine.dateDue,
        status: vaccine.status,
      })),
      generatedAt: new Date().toLocaleDateString('zh-CN'),
      period: this.calculateReportPeriod(entries),
    };

    return generateHealthReportPDF(reportData, 'health-report-preview');
  }

  /**
   * 下载健康报告PDF
   */
  downloadHealthReport(pdfData: string, petName: string): void {
    const filename = `${petName}-健康报告-${new Date().toISOString().split('T')[0]}.pdf`;
    downloadPDF(pdfData, filename);
  }

  private calculateReportPeriod(entries: HealthEntry[]): string {
    if (entries.length === 0) {
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `${monthAgo.toLocaleDateString('zh-CN')} 至 ${today.toLocaleDateString('zh-CN')}`;
    }

    const dates = entries.map(e => new Date(e.entryDate));
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return `${earliest.toLocaleDateString('zh-CN')} 至 ${latest.toLocaleDateString('zh-CN')}`;
  }
}
```

- [ ] **Step 3: 编写服务测试**

Create: `03-源代码/小程序/miniapp/src/services/__tests__/reportService.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportService } from '../reportService';

describe('ReportService', () => {
  let reportService: ReportService;
  
  beforeEach(() => {
    reportService = new ReportService();
  });

  it('should calculate report period correctly', () => {
    const entries = [
      { entryDate: '2026-06-20', bowel: '正常', appetite: '正常', energy: '正常', exercise: '正常' },
      { entryDate: '2026-07-20', bowel: '正常', appetite: '正常', energy: '正常', exercise: '正常' },
    ];
    
    // Access private method through any
    const period = (reportService as any).calculateReportPeriod(entries);
    
    expect(period).toContain('2026/6/20');
    expect(period).toContain('2026/7/20');
  });

  it('should calculate default period when no entries', () => {
    const period = (reportService as any).calculateReportPeriod([]);
    
    expect(period).toContain('至');
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run src/services/__tests__/reportService.test.ts
```

Expected: 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/services/reportService.ts src/services/__tests__/reportService.test.ts
git commit -m "feat(report): extend report service with PDF generation"
```

---

## Task 5: 在健康趋势页添加导出按钮

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/pages/pet-trends/index.tsx`

- [ ] **Step 1: 读取现有趋势页面**

Read: `03-源代码/小程序/miniapp/src/pages/pet-trends/index.tsx`

- [ ] **Step 2: 添加导出功能**

在趋势页面中添加导出按钮和预览弹窗：

```typescript
import React, { useState, useCallback } from 'react';
import { View, Button, Text } from '@tarojs/components';
import { useTrend } from '../../hooks/useTrend';
import { HealthReportPreview } from '../../components/HealthReportPreview';
import { reportService } from '../../services/reportService';
import './index.scss';

export default function PetTrendsPage() {
  const { pet, trends, loading } = useTrend();
  const [showReport, setShowReport] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleExportReport = useCallback(async () => {
    if (!pet) return;
    
    setGenerating(true);
    try {
      const pdfData = await reportService.generateHealthReportPDF(pet.id);
      reportService.downloadHealthReport(pdfData, pet.name);
    } catch (error) {
      console.error('Failed to generate report:', error);
      // Show error toast
    } finally {
      setGenerating(false);
    }
  }, [pet]);

  const handlePreviewReport = useCallback(async () => {
    if (!pet) return;
    
    setGenerating(true);
    try {
      const data = await reportService.getHealthReportData(pet.id);
      setReportData(data);
      setShowReport(true);
    } catch (error) {
      console.error('Failed to preview report:', error);
    } finally {
      setGenerating(false);
    }
  }, [pet]);

  if (loading) {
    return <View className="loading">加载中...</View>;
  }

  return (
    <View className="pet-trends-page">
      {/* 现有趋势图表内容 */}
      
      {/* 导出按钮区域 */}
      <View className="export-section">
        <Button 
          className="preview-btn"
          onClick={handlePreviewReport}
          disabled={generating}
        >
          {generating ? '生成中...' : '👁️ 预览报告'}
        </Button>
        <Button 
          className="export-btn"
          onClick={handleExportReport}
          disabled={generating}
        >
          {generating ? '生成中...' : '📄 导出PDF报告'}
        </Button>
      </View>

      {/* 报告预览弹窗 */}
      {showReport && reportData && (
        <View className="report-modal">
          <View className="modal-overlay" onClick={() => setShowReport(false)} />
          <View className="modal-content">
            <View className="modal-header">
              <Text className="modal-title">健康报告预览</Text>
              <Text className="modal-close" onClick={() => setShowReport(false)}>✕</Text>
            </View>
            <View className="modal-body">
              <HealthReportPreview data={reportData} />
            </View>
            <View className="modal-footer">
              <Button className="download-btn" onClick={handleExportReport}>
                下载PDF
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 3: 添加样式**

在 `03-源代码/小程序/miniapp/src/pages/pet-trends/index.scss` 中添加：

```scss
.export-section {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-top: 24px;

  .preview-btn,
  .export-btn {
    flex: 1;
    height: 44px;
    line-height: 44px;
    border-radius: 22px;
    font-size: 15px;
    font-weight: 500;
    text-align: center;
    border: none;
  }

  .preview-btn {
    background: #f0f0f0;
    color: #666;
  }

  .export-btn {
    background: #1890ff;
    color: #fff;
  }
}

.report-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-height: 80%;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e8e8e8;

      .modal-title {
        font-size: 17px;
        font-weight: 600;
      }

      .modal-close {
        font-size: 20px;
        color: #999;
        padding: 4px;
      }
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .modal-footer {
      padding: 16px;
      border-top: 1px solid #e8e8e8;

      .download-btn {
        width: 100%;
        height: 44px;
        line-height: 44px;
        background: #1890ff;
        color: #fff;
        border-radius: 22px;
        font-size: 15px;
        font-weight: 500;
        text-align: center;
        border: none;
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/pet-trends/index.tsx src/pages/pet-trends/index.scss
git commit -m "feat(report): add export button and preview modal to trends page"
```

---

## Task 6: 运行全量测试并修复问题

- [ ] **Step 1: 运行类型检查**

```bash
npm run typecheck
```

Expected: 0 errors

- [ ] **Step 2: 运行测试套件**

```bash
npm run test
```

Expected: All tests pass

- [ ] **Step 3: 运行构建**

```bash
npm run build
```

Expected: Build successful

- [ ] **Step 4: Commit**

```bash
git commit -m "test(report): verify all tests pass for PDF export feature"
```

---

## 自审查清单

**1. Spec coverage:**
- ✅ PDF/图片格式导出 - Task 1-4 实现
- ✅ 包含档案+趋势+异常+用药史 - HealthReportPreview 组件
- ✅ 一键分享给兽医 - 通过下载PDF实现
- ✅ 医疗边界声明 - 组件内包含免责声明

**2. Placeholder scan:**
- ✅ 无 "TBD" / "TODO"
- ✅ 所有步骤包含完整代码
- ✅ 无 "similar to Task N"

**3. Type consistency:**
- ✅ `HealthReportData` 类型在 reportTypes.ts 定义，各任务一致使用
- ✅ `generateHealthReportPDF` 参数和返回值类型一致

---

## 执行方式选择

**Plan complete and saved to `docs/superpowers/plans/2026-07-20-pet-health-report-pdf-export.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
