export type UrgencyLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface SymptomUrgencyRule {
  symptomId: string;
  baseUrgency: UrgencyLevel;
  combinationRules: Array<{
    withSymptom: string;
    upgradedUrgency: UrgencyLevel;
  }>;
  durationRules: Array<{
    minDuration: string;
    upgradedUrgency: UrgencyLevel;
  }>;
  speciesModifiers: Partial<Record<'dog' | 'cat', UrgencyLevel>>;
  breedModifiers: Array<{
    breed: string;
    upgradedUrgency: UrgencyLevel;
    reason: string;
  }>;
}

export interface CheckinUrgencyRule {
  metric: 'poop' | 'appetite' | 'spirit' | 'exercise';
  level: number;
  urgency: UrgencyLevel;
  combinationRules: Array<{
    withMetric: string;
    withLevel: number;
    upgradedUrgency: UrgencyLevel;
  }>;
  consecutiveDaysRules: Array<{
    days: number;
    upgradedUrgency: UrgencyLevel;
  }>;
}

export interface FoodUrgencyRule {
  safetyLevel: 'safe' | 'caution' | 'dangerous' | 'toxic';
  urgency: UrgencyLevel;
  speciesModifiers: Partial<Record<'dog' | 'cat', UrgencyLevel>>;
  amountRules: Array<{
    description: string;
    upgradedUrgency: UrgencyLevel;
  }>;
}

export const SYMPTOM_URGENCY_RULES: SymptomUrgencyRule[] = [
  {
    symptomId: 'bloody_stool',
    baseUrgency: 'red',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'seizure',
    baseUrgency: 'red',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'difficulty_breathing',
    baseUrgency: 'red',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'unconsciousness',
    baseUrgency: 'red',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'urinary_blockage',
    baseUrgency: 'red',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: { cat: 'red' },
    breedModifiers: []
  },
  {
    symptomId: 'anorexia_lethargy',
    baseUrgency: 'yellow',
    combinationRules: [
      { withSymptom: 'vomiting_frequent', upgradedUrgency: 'red' },
      { withSymptom: 'diarrhea_bloody', upgradedUrgency: 'red' },
      { withSymptom: 'difficulty_breathing', upgradedUrgency: 'red' }
    ],
    durationRules: [
      { minDuration: '24h', upgradedUrgency: 'orange' },
      { minDuration: '48h', upgradedUrgency: 'red' }
    ],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'vomiting_frequent',
    baseUrgency: 'orange',
    combinationRules: [
      { withSymptom: 'diarrhea_mucus', upgradedUrgency: 'red' },
      { withSymptom: 'diarrhea_bloody', upgradedUrgency: 'red' },
      { withSymptom: 'anorexia_lethargy', upgradedUrgency: 'red' }
    ],
    durationRules: [
      { minDuration: '24h', upgradedUrgency: 'red' }
    ],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'diarrhea_bloody',
    baseUrgency: 'orange',
    combinationRules: [
      { withSymptom: 'vomiting_frequent', upgradedUrgency: 'red' },
      { withSymptom: 'anorexia_lethargy', upgradedUrgency: 'red' }
    ],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'diarrhea_mucus',
    baseUrgency: 'orange',
    combinationRules: [
      { withSymptom: 'vomiting_frequent', upgradedUrgency: 'red' }
    ],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'lameness',
    baseUrgency: 'yellow',
    combinationRules: [
      { withSymptom: 'fever', upgradedUrgency: 'orange' },
      { withSymptom: 'anorexia_lethargy', upgradedUrgency: 'orange' }
    ],
    durationRules: [
      { minDuration: '48h', upgradedUrgency: 'orange' }
    ],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'excessive_scratching',
    baseUrgency: 'yellow',
    combinationRules: [],
    durationRules: [
      { minDuration: '3d', upgradedUrgency: 'orange' }
    ],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'decreased_appetite',
    baseUrgency: 'yellow',
    combinationRules: [
      { withSymptom: 'anorexia_lethargy', upgradedUrgency: 'orange' }
    ],
    durationRules: [
      { minDuration: '2d', upgradedUrgency: 'orange' },
      { minDuration: '3d', upgradedUrgency: 'red' }
    ],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'polydipsia_polyuria',
    baseUrgency: 'yellow',
    combinationRules: [
      { withSymptom: 'decreased_appetite', upgradedUrgency: 'orange' },
      { withSymptom: 'anorexia_lethargy', upgradedUrgency: 'orange' }
    ],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'coughing',
    baseUrgency: 'yellow',
    combinationRules: [
      { withSymptom: 'difficulty_breathing', upgradedUrgency: 'red' },
      { withSymptom: 'fever', upgradedUrgency: 'orange' }
    ],
    durationRules: [
      { minDuration: '3d', upgradedUrgency: 'orange' }
    ],
    speciesModifiers: {},
    breedModifiers: [
      { breed: 'pug', upgradedUrgency: 'orange', reason: 'brachycephalic_breed_respiratory_risk' },
      { breed: 'bulldog', upgradedUrgency: 'orange', reason: 'brachycephalic_breed_respiratory_risk' },
      { breed: 'shih_tzu', upgradedUrgency: 'orange', reason: 'brachycephalic_breed_respiratory_risk' }
    ]
  },
  {
    symptomId: 'vomiting_occasional',
    baseUrgency: 'green',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'soft_stool',
    baseUrgency: 'green',
    combinationRules: [],
    durationRules: [
      { minDuration: '3d', upgradedUrgency: 'yellow' }
    ],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'skin_red_spots',
    baseUrgency: 'green',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'sneezing',
    baseUrgency: 'green',
    combinationRules: [
      { withSymptom: 'eye_discharge', upgradedUrgency: 'yellow' },
      { withSymptom: 'coughing', upgradedUrgency: 'yellow' }
    ],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'bad_breath',
    baseUrgency: 'green',
    combinationRules: [],
    durationRules: [],
    speciesModifiers: {},
    breedModifiers: []
  },
  {
    symptomId: 'eye_discharge',
    baseUrgency: 'green',
    combinationRules: [
      { withSymptom: 'sneezing', upgradedUrgency: 'yellow' }
    ],
    durationRules: [
      { minDuration: '3d', upgradedUrgency: 'yellow' }
    ],
    speciesModifiers: {},
    breedModifiers: []
  }
];

export const CHECKIN_URGENCY_RULES: CheckinUrgencyRule[] = [
  {
    metric: 'poop',
    level: 1,
    urgency: 'red',
    combinationRules: [
      { withMetric: 'appetite', withLevel: 1, upgradedUrgency: 'red' },
      { withMetric: 'spirit', withLevel: 1, upgradedUrgency: 'red' }
    ],
    consecutiveDaysRules: []
  },
  {
    metric: 'poop',
    level: 2,
    urgency: 'orange',
    combinationRules: [
      { withMetric: 'appetite', withLevel: 1, upgradedUrgency: 'red' },
      { withMetric: 'spirit', withLevel: 1, upgradedUrgency: 'red' }
    ],
    consecutiveDaysRules: []
  },
  {
    metric: 'poop',
    level: 3,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'poop',
    level: 4,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'poop',
    level: 5,
    urgency: 'yellow',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'appetite',
    level: 1,
    urgency: 'orange',
    combinationRules: [
      { withMetric: 'spirit', withLevel: 1, upgradedUrgency: 'red' }
    ],
    consecutiveDaysRules: [
      { days: 3, upgradedUrgency: 'orange' }
    ]
  },
  {
    metric: 'appetite',
    level: 2,
    urgency: 'yellow',
    combinationRules: [
      { withMetric: 'spirit', withLevel: 1, upgradedUrgency: 'orange' }
    ],
    consecutiveDaysRules: [
      { days: 3, upgradedUrgency: 'orange' }
    ]
  },
  {
    metric: 'appetite',
    level: 3,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'appetite',
    level: 4,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'appetite',
    level: 5,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'spirit',
    level: 1,
    urgency: 'orange',
    combinationRules: [
      { withMetric: 'appetite', withLevel: 1, upgradedUrgency: 'red' }
    ],
    consecutiveDaysRules: [
      { days: 3, upgradedUrgency: 'orange' }
    ]
  },
  {
    metric: 'spirit',
    level: 2,
    urgency: 'yellow',
    combinationRules: [
      { withMetric: 'appetite', withLevel: 1, upgradedUrgency: 'orange' }
    ],
    consecutiveDaysRules: [
      { days: 3, upgradedUrgency: 'orange' }
    ]
  },
  {
    metric: 'spirit',
    level: 3,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'spirit',
    level: 4,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'spirit',
    level: 5,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'exercise',
    level: 1,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'exercise',
    level: 2,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  },
  {
    metric: 'exercise',
    level: 3,
    urgency: 'green',
    combinationRules: [],
    consecutiveDaysRules: []
  }
];

export const FOOD_URGENCY_RULES: FoodUrgencyRule[] = [
  {
    safetyLevel: 'toxic',
    urgency: 'red',
    speciesModifiers: {},
    amountRules: []
  },
  {
    safetyLevel: 'dangerous',
    urgency: 'orange',
    speciesModifiers: {},
    amountRules: [
      { description: 'large_amount', upgradedUrgency: 'red' }
    ]
  },
  {
    safetyLevel: 'caution',
    urgency: 'yellow',
    speciesModifiers: {},
    amountRules: []
  },
  {
    safetyLevel: 'safe',
    urgency: 'green',
    speciesModifiers: {},
    amountRules: []
  },
  {
    safetyLevel: 'toxic',
    urgency: 'red',
    speciesModifiers: { cat: 'red', dog: 'yellow' },
    amountRules: []
  },
  {
    safetyLevel: 'dangerous',
    urgency: 'orange',
    speciesModifiers: {},
    amountRules: [
      { description: 'small_dog_large_dose', upgradedUrgency: 'red' },
      { description: 'large_dog_small_dose', upgradedUrgency: 'yellow' }
    ]
  }
];
