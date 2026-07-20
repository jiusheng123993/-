import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryIngestor } from './ingestion/memoryIngestor';
import { MemoryRetriever } from './retrieval/memoryRetrieval';
import { MemoryEvolution } from './evolution/memoryEvolution';
import { HealthIndexAdapter } from './adapters/healthIndexAdapter';
import { VaccineTrackerAdapter } from './adapters/vaccineTrackerAdapter';
import type { PetHealthEntry, PetVaccination } from './types/memoryBodyTypes';

const mockStorage: Record<string, string> = {};

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: (key: string) => mockStorage[key] || '',
    setStorageSync: (key: string, value: string) => { mockStorage[key] = value; },
    removeStorageSync: (key: string) => { delete mockStorage[key]; },
    getStorageInfoSync: () => ({ keys: Object.keys(mockStorage) }),
  },
}));

const originalParse = JSON.parse;
JSON.parse = function revivableParse(text: string, reviver?: (key: string, value: unknown) => unknown) {
  return originalParse(text, (key, value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    if (reviver) return reviver(key, value);
    return value;
  });
};

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
});

function createMockHealthEntry(overrides: Partial<PetHealthEntry> = {}): PetHealthEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    petId: 'pet-001',
    userId: 'user-001',
    poopLevel: 3,
    appetiteLevel: 3,
    spiritLevel: 3,
    exerciseLevel: 2,
    hasAnomaly: false,
    anomalyItems: [],
    riskLevel: 'low',
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockVaccination(overrides: Partial<PetVaccination> = {}): PetVaccination {
  return {
    id: `vax-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    petId: 'pet-001',
    userId: 'user-001',
    vaccineName: '狂犬疫苗',
    vaccineType: 'core',
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isOverdue: false,
    reminderEnabled: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('MemoryBody Health Extension', () => {
  describe('MemoryIngestor - ingestHealthEntry', () => {
    let ingestor: MemoryIngestor;

    beforeEach(() => {
      ingestor = new MemoryIngestor();
    });

    it('should ingest a normal health entry', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.poopLevel).toBe(3);
      expect(result.data!.appetiteLevel).toBe(3);
      expect(result.data!.spiritLevel).toBe(3);
      expect(result.data!.exerciseLevel).toBe(2);
      expect(result.data!.hasAnomaly).toBe(false);
      expect(result.data!.riskLevel).toBe('low');
    });

    it('should reject entry without petId', () => {
      const result = ingestor.ingestHealthEntry({
        petId: '',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('宠物ID');
    });

    it('should reject poopLevel out of range', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 6 as 1,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('便便等级');
    });

    it('should reject appetiteLevel out of range', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 0 as 1,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('食欲等级');
    });

    it('should reject spiritLevel out of range', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 6 as 1,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('精神等级');
    });

    it('should reject exerciseLevel out of range', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 4 as 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('运动等级');
    });

    it('should detect single anomaly', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 4,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data!.hasAnomaly).toBe(true);
      expect(result.data!.anomalyItems).toContain('poop');
      expect(result.data!.riskLevel).toBe('low');
    });

    it('should detect multiple anomalies with medium risk', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 4,
        appetiteLevel: 4,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data!.hasAnomaly).toBe(true);
      expect(result.data!.anomalyItems).toContain('poop');
      expect(result.data!.anomalyItems).toContain('appetite');
      expect(result.data!.riskLevel).toBe('medium');
    });

    it('should detect 3+ anomalies with high risk', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 4,
        appetiteLevel: 4,
        spiritLevel: 3,
        exerciseLevel: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data!.hasAnomaly).toBe(true);
      expect(result.data!.anomalyItems.length).toBeGreaterThanOrEqual(3);
      expect(result.data!.riskLevel).toBe('high');
    });

    it('should detect emergency for poopLevel 5', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 5,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data!.riskLevel).toBe('emergency');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect emergency for no appetite + lethargy combo', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 4,
        spiritLevel: 4,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data!.riskLevel).toBe('emergency');
    });

    it('should detect exercise anomaly', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data!.hasAnomaly).toBe(true);
      expect(result.data!.anomalyItems).toContain('exercise');
    });

    it('should include userId in result', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        userId: 'user-123',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data!.userId).toBe('user-123');
    });

    it('should include note in result', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
        note: '今天精神不错',
      });

      expect(result.success).toBe(true);
      expect(result.data!.note).toBe('今天精神不错');
    });

    it('should include weight in result', () => {
      const result = ingestor.ingestHealthEntry({
        petId: 'pet-001',
        poopLevel: 3,
        appetiteLevel: 3,
        spiritLevel: 3,
        exerciseLevel: 2,
        weight: 12.5,
      });

      expect(result.success).toBe(true);
      expect(result.data!.weight).toBe(12.5);
    });
  });

  describe('MemoryRetriever - health methods', () => {
    let retriever: MemoryRetriever;
    let entries: PetHealthEntry[];

    beforeEach(() => {
      retriever = new MemoryRetriever();
      const now = Date.now();
      entries = [
        createMockHealthEntry({ id: 'e1', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e2', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e3', petId: 'pet-001', poopLevel: 4, appetiteLevel: 4, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop', 'appetite'], riskLevel: 'medium', createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e4', petId: 'pet-002', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e5', petId: 'pet-001', poopLevel: 5, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'emergency', createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000) }),
      ];
    });

    it('should retrieve all health entries', () => {
      const result = retriever.retrieveHealthEntries(entries, {});
      expect(result.length).toBe(5);
    });

    it('should filter by petId', () => {
      const result = retriever.retrieveHealthEntries(entries, { petId: 'pet-001' });
      expect(result.length).toBe(4);
      result.forEach(r => expect(r.data.petId).toBe('pet-001'));
    });

    it('should filter by time range', () => {
      const result = retriever.retrieveHealthEntries(entries, { timeRange: 2 * 24 * 60 * 60 * 1000 });
      expect(result.length).toBe(2);
    });

    it('should limit results', () => {
      const result = retriever.retrieveHealthEntries(entries, { limit: 2 });
      expect(result.length).toBe(2);
    });

    it('should sort by relevance score descending', () => {
      const result = retriever.retrieveHealthEntries(entries, {});
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].decayedScore).toBeGreaterThanOrEqual(result[i].decayedScore);
      }
    });

    it('should get health trend by pet', () => {
      const trend = retriever.getHealthTrend(entries, 'pet-001', 7);
      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('poopAvg');
      expect(trend[0]).toHaveProperty('appetiteAvg');
      expect(trend[0]).toHaveProperty('spiritAvg');
      expect(trend[0]).toHaveProperty('exerciseAvg');
      expect(trend[0]).toHaveProperty('anomalyCount');
      expect(trend[0]).toHaveProperty('riskLevel');
    });

    it('should find anomalous entries', () => {
      const anomalous = retriever.findAnomalousEntries(entries);
      expect(anomalous.length).toBe(3);
      anomalous.forEach(e => expect(e.hasAnomaly).toBe(true));
    });

    it('should find anomalous entries by pet', () => {
      const anomalous = retriever.findAnomalousEntries(entries, 'pet-001');
      expect(anomalous.length).toBe(3);
    });

    it('should return empty for pet with no anomalies', () => {
      const anomalous = retriever.findAnomalousEntries(entries, 'pet-002');
      expect(anomalous.length).toBe(0);
    });
  });

  describe('MemoryEvolution - health patterns', () => {
    let evolution: MemoryEvolution;

    beforeEach(() => {
      evolution = new MemoryEvolution();
    });

    it('should detect recurring anomalies', () => {
      const now = Date.now();
      const entries = [
        createMockHealthEntry({ id: 'e1', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e2', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e3', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000) }),
      ];

      evolution.addHealthEntries(entries);
      const report = evolution.detectHealthPatterns('pet-001');

      expect(report.petId).toBe('pet-001');
      expect(report.patterns.length).toBeGreaterThan(0);
      const anomalyPattern = report.patterns.find(p => p.type === 'recurring_anomaly');
      expect(anomalyPattern).toBeDefined();
      expect(anomalyPattern!.relatedMetrics).toContain('poop');
    });

    it('should detect health decline trend', () => {
      const now = Date.now();
      const entries = [
        createMockHealthEntry({ id: 'e1', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e2', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 13 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e3', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 12 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e4', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 11 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e5', petId: 'pet-001', poopLevel: 4, appetiteLevel: 4, spiritLevel: 4, exerciseLevel: 1, createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e6', petId: 'pet-001', poopLevel: 4, appetiteLevel: 4, spiritLevel: 4, exerciseLevel: 1, createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e7', petId: 'pet-001', poopLevel: 4, appetiteLevel: 4, spiritLevel: 4, exerciseLevel: 1, createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e8', petId: 'pet-001', poopLevel: 4, appetiteLevel: 4, spiritLevel: 4, exerciseLevel: 1, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
      ];

      evolution.addHealthEntries(entries);
      const report = evolution.detectHealthPatterns('pet-001');

      expect(report.patterns.length).toBeGreaterThan(0);
      const declinePattern = report.patterns.find(p => p.type === 'decline');
      expect(declinePattern).toBeDefined();
    });

    it('should detect weight trend', () => {
      const now = Date.now();
      const entries = [
        createMockHealthEntry({ id: 'e1', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, weight: 10, createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e2', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, weight: 9.5, createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e3', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, weight: 9, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
      ];

      evolution.addHealthEntries(entries);
      const report = evolution.detectHealthPatterns('pet-001');

      const weightPattern = report.patterns.find(p => p.type === 'weight_trend');
      expect(weightPattern).toBeDefined();
      expect(weightPattern!.description).toContain('下降');
    });

    it('should generate insights for patterns', () => {
      const now = Date.now();
      const entries = [
        createMockHealthEntry({ id: 'e1', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e2', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e3', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000) }),
      ];

      evolution.addHealthEntries(entries);
      const report = evolution.detectHealthPatterns('pet-001');

      expect(report.insights.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should return empty patterns for insufficient data', () => {
      const entry = createMockHealthEntry({ id: 'e1', petId: 'pet-001' });
      evolution.addHealthEntry(entry);
      const report = evolution.detectHealthPatterns('pet-001');

      expect(report.patterns.length).toBe(0);
      expect(report.summary.totalPatterns).toBe(0);
    });

    it('should filter by petId', () => {
      const now = Date.now();
      const entries1 = [
        createMockHealthEntry({ id: 'e1', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e2', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e3', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000) }),
      ];
      const entries2 = [
        createMockHealthEntry({ id: 'e4', petId: 'pet-002', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
      ];

      evolution.addHealthEntries(entries1);
      evolution.addHealthEntries(entries2);

      const report1 = evolution.detectHealthPatterns('pet-001');
      const report2 = evolution.detectHealthPatterns('pet-002');

      expect(report1.patterns.length).toBeGreaterThan(0);
      expect(report2.patterns.length).toBe(0);
    });
  });

  describe('HealthIndexAdapter', () => {
    let adapter: HealthIndexAdapter;

    beforeEach(() => {
      adapter = new HealthIndexAdapter('user-001');
    });

    it('should index a health entry', () => {
      const entry = createMockHealthEntry();
      expect(() => adapter.indexHealthEntry(entry)).not.toThrow();
    });

    it('should retrieve indexed entries', () => {
      const entry = createMockHealthEntry();
      adapter.indexHealthEntry(entry);
      const entries = adapter.getHealthEntries();
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should filter entries by pet', () => {
      const entry1 = createMockHealthEntry({ id: 'e1', petId: 'pet-001' });
      const entry2 = createMockHealthEntry({ id: 'e2', petId: 'pet-002' });
      adapter.indexHealthEntry(entry1);
      adapter.indexHealthEntry(entry2);

      const pet1Entries = adapter.getHealthEntriesByPet('pet-001');
      expect(pet1Entries.length).toBe(1);
      expect(pet1Entries[0].petId).toBe('pet-001');
    });

    it('should build health profile', () => {
      const now = Date.now();
      const entries = [
        createMockHealthEntry({ id: 'e1', petId: 'pet-001', poopLevel: 3, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) }),
        createMockHealthEntry({ id: 'e2', petId: 'pet-001', poopLevel: 4, appetiteLevel: 3, spiritLevel: 3, exerciseLevel: 2, hasAnomaly: true, anomalyItems: ['poop'], riskLevel: 'low', createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) }),
      ];

      entries.forEach(e => adapter.indexHealthEntry(e));
      const profile = adapter.buildHealthProfile('pet-001', 7);

      expect(profile.petId).toBe('pet-001');
      expect(profile.totalEntries).toBeGreaterThan(0);
      expect(profile.trends.length).toBeGreaterThan(0);
      expect(profile.summary).toBeDefined();
      expect(profile.summary.avgPoop).toBeGreaterThan(0);
    });

    it('should get health trend', () => {
      const now = Date.now();
      const entry = createMockHealthEntry({ id: 'e1', petId: 'pet-001', createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) });
      adapter.indexHealthEntry(entry);

      const trend = adapter.getHealthTrend('pet-001', 7);
      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('poopAvg');
    });

    it('should return empty profile for pet with no data', () => {
      const profile = adapter.buildHealthProfile('nonexistent', 7);
      expect(profile.petId).toBe('nonexistent');
      expect(profile.totalEntries).toBe(0);
    });

    it('should clear all data', () => {
      const entry = createMockHealthEntry();
      adapter.indexHealthEntry(entry);
      adapter.clear();

      const entries = adapter.getHealthEntries();
      expect(entries.length).toBe(0);
    });
  });

  describe('VaccineTrackerAdapter', () => {
    let adapter: VaccineTrackerAdapter;

    beforeEach(() => {
      adapter = new VaccineTrackerAdapter('user-001');
    });

    it('should add a vaccination', () => {
      const vax = createMockVaccination();
      expect(() => adapter.addVaccination(vax)).not.toThrow();
    });

    it('should retrieve vaccinations', () => {
      const vax = createMockVaccination();
      adapter.addVaccination(vax);
      const vaccinations = adapter.getVaccinations();
      expect(vaccinations.length).toBe(1);
      expect(vaccinations[0].vaccineName).toBe('狂犬疫苗');
    });

    it('should filter vaccinations by pet', () => {
      const vax1 = createMockVaccination({ id: 'v1', petId: 'pet-001' });
      const vax2 = createMockVaccination({ id: 'v2', petId: 'pet-002' });
      adapter.addVaccination(vax1);
      adapter.addVaccination(vax2);

      const pet1Vax = adapter.getVaccinationsByPet('pet-001');
      expect(pet1Vax.length).toBe(1);
      expect(pet1Vax[0].petId).toBe('pet-001');
    });

    it('should mark vaccination as completed', () => {
      const vax = createMockVaccination();
      adapter.addVaccination(vax);
      adapter.markCompleted(vax.id);

      const vaccinations = adapter.getVaccinations();
      expect(vaccinations[0].completedDate).toBeDefined();
      expect(vaccinations[0].isOverdue).toBe(false);
    });

    it('should generate reminders for upcoming vaccinations', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const vax = createMockVaccination({ scheduledDate: futureDate });
      adapter.addVaccination(vax);

      const reminders = adapter.getReminders('pet-001');
      expect(reminders.length).toBeGreaterThan(0);
      expect(reminders[0].status).toBe('upcoming');
    });

    it('should detect overdue vaccinations', () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const vax = createMockVaccination({ scheduledDate: pastDate });
      adapter.addVaccination(vax);

      const reminders = adapter.getReminders('pet-001');
      expect(reminders.length).toBeGreaterThan(0);
      expect(reminders[0].status).toBe('overdue');
      expect(reminders[0].isOverdue).toBe(true);
    });

    it('should get overdue reminders', () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const vax = createMockVaccination({ scheduledDate: pastDate });
      adapter.addVaccination(vax);

      const overdue = adapter.getOverdueReminders('pet-001');
      expect(overdue.length).toBeGreaterThan(0);
      expect(overdue[0].isOverdue).toBe(true);
    });

    it('should get upcoming reminders within days', () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const vax = createMockVaccination({ scheduledDate: futureDate });
      adapter.addVaccination(vax);

      const upcoming = adapter.getUpcomingReminders('pet-001', 7);
      expect(upcoming.length).toBeGreaterThan(0);
      expect(upcoming[0].status).toBe('upcoming');
    });

    it('should skip a reminder', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const vax = createMockVaccination({ scheduledDate: futureDate });
      adapter.addVaccination(vax);

      const reminders = adapter.getReminders('pet-001');
      const reminderId = reminders[0].id;
      adapter.skipReminder(reminderId);

      const updated = adapter.getReminders('pet-001');
      expect(updated[0].status).toBe('skipped');
    });

    it('should clear all data', () => {
      const vax = createMockVaccination();
      adapter.addVaccination(vax);
      adapter.clear();

      const vaccinations = adapter.getVaccinations();
      expect(vaccinations.length).toBe(0);
    });
  });
});
