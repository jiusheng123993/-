export type PetSpecies = 'dog' | 'cat';

export type PetGender = 'male' | 'female' | 'unknown';

export type PoopLevel = 1 | 2 | 3 | 4 | 5;

export type AppetiteLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SpiritLevel = 1 | 2 | 3 | 4 | 5;

export type ExerciseLevel = 1 | 2 | 3;

export type HealthRiskLevel = 'low' | 'medium' | 'high' | 'emergency';

export type AnomalyItem = 'poop' | 'appetite' | 'spirit' | 'exercise' | 'weight' | 'other';

export interface PetProfile {
  id: string;
  userId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  breedId: string;
  gender: PetGender;
  birthDate: string;
  weight: number;
  coatColor: string;
  avatarPhotoUrl?: string;
  avatarCartoonUrl?: string;
  avatarStyle?: string;
  avatarGeneratedAt?: Date;
  photos: string[];
  isNeutered: boolean;
  microchipId: string;
  notes: string;
  isDeceased: boolean;
  deceasedDate?: string;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PetHealthEntry {
  id: string;
  petId: string;
  userId: string;
  poopLevel: PoopLevel;
  appetiteLevel: AppetiteLevel;
  spiritLevel: SpiritLevel;
  exerciseLevel: ExerciseLevel;
  weight?: number;
  hasAnomaly: boolean;
  anomalyItems: AnomalyItem[];
  aiFeedback?: string;
  riskLevel: HealthRiskLevel;
  note?: string;
  createdAt: Date;
}

export interface PetVaccination {
  id: string;
  petId: string;
  userId: string;
  vaccineName: string;
  vaccineType: string;
  scheduledDate: string;
  completedDate?: string;
  isOverdue: boolean;
  reminderEnabled: boolean;
  createdAt: Date;
}

export interface PetSymptomCheck {
  id: string;
  petId: string;
  userId: string;
  symptoms: string[];
  duration: string;
  severity: string;
  additionalInfo?: string;
  aiUrgencyLevel: 'green' | 'yellow' | 'orange' | 'red';
  aiSuggestion?: string;
  knowledgeMatch?: Record<string, unknown>;
  createdAt: Date;
}

export interface PetFoodQuery {
  id: string;
  userId: string;
  foodName: string;
  safetyLevel: 'safe' | 'caution' | 'dangerous' | 'toxic';
  detail?: string;
  dangerousCompounds?: string[];
  toxicDoses?: string;
  symptoms?: string[];
  breedWarnings?: string[];
  firstAid?: string;
  isMemberQuery: boolean;
  createdAt: Date;
}

export interface HealthTrendPoint {
  date: string;
  petId: string;
  poopAvg: number;
  appetiteAvg: number;
  spiritAvg: number;
  exerciseAvg: number;
  weight?: number;
  anomalyCount: number;
  riskLevel: HealthRiskLevel;
}

export interface HealthProfile {
  petId: string;
  totalEntries: number;
  dateRange: {
    start: string;
    end: string;
  };
  trends: HealthTrendPoint[];
  summary: {
    avgPoop: number;
    avgAppetite: number;
    avgSpirit: number;
    avgExercise: number;
    totalAnomalies: number;
    dominantRiskLevel: HealthRiskLevel;
    weightChange?: number;
  };
  recentAnomalies: Array<{
    date: string;
    items: AnomalyItem[];
    riskLevel: HealthRiskLevel;
  }>;
}

export type HealthPatternType = 'recurring_anomaly' | 'improvement' | 'decline' | 'seasonal' | 'weight_trend';

export interface HealthEvolutionPattern {
  id: string;
  petId: string;
  type: HealthPatternType;
  description: string;
  frequency: number;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  relatedMetrics: string[];
  evidence: Array<{
    entryId: string;
    timestamp: Date;
    metrics: Record<string, number>;
  }>;
}

export interface HealthEvolutionReport {
  petId: string;
  patterns: HealthEvolutionPattern[];
  insights: string[];
  recommendations: string[];
  summary: {
    totalPatterns: number;
    byType: Record<HealthPatternType, number>;
    averageConfidence: number;
  };
}

export interface VaccineScheduleTemplate {
  vaccineName: string;
  vaccineType: string;
  species: PetSpecies;
  firstDoseAge: number;
  boosterInterval: number;
  annualBooster: boolean;
  description: string;
}

export type VaccineReminderStatus = 'upcoming' | 'due' | 'overdue' | 'completed' | 'skipped';

export interface VaccineReminder {
  id: string;
  petId: string;
  vaccinationId: string;
  vaccineName: string;
  scheduledDate: string;
  status: VaccineReminderStatus;
  daysUntilDue: number;
  isOverdue: boolean;
}
