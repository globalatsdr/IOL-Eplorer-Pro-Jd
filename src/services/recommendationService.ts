import { DrAlfonsoInputs } from '../types';

// --- Type Definitions for Rules ---
type LensStatus = 'transparente' | 'presbicia' | 'disfuncional' | 'catarata';

export interface Rule {
  result: string;
  conditions: {
    ageGroup?: number[];
    laGroup?: number[];
    lensStatus?: LensStatus[];
    specialConditions?: string[]; // Must match all specified conditions
    negatedConditions?: string[]; // Must NOT match any specified conditions
  };
}

// --- Mappings for UI generation ---
export const AGE_RANGES: { [key: number]: string } = {
  1: '35-44',
  2: '45-54',
  3: '55-64',
  4: '65-74',
  5: '75-85',
};

export const LA_RANGES: { [key: number]: string } = {
  1: '14-18.5',
  2: '>18.5-22',
  3: '>22-24.5',
  4: '>24.5-29',
  5: '>29-35',
};

export const LENS_STATUS_OPTIONS: LensStatus[] = ['transparente', 'presbicia', 'disfuncional', 'catarata'];


// --- List of all recommendation rules ---
export const ALL_RULES: Rule[] = [
  // Rule 3 (was)
  {
    result: "Partial Range of Field - Narrow",
    conditions: {
      ageGroup: [2],
      laGroup: [2],
      lensStatus: ['transparente', 'presbicia', 'disfuncional'],
      specialConditions: ['lvc_hiper_mayor_4']
    }
  },
  // Rule 5 (was)
  {
    result: "Full Range of Field - Smooth",
    conditions: {
      ageGroup: [2],
      laGroup: [2],
      lensStatus: ['transparente', 'presbicia', 'disfuncional'],
      specialConditions: ['lvc_hiper_menor_4']
    }
  },
  // Rule 4 (was)
  {
    result: "Partial Range of Field - Enhance",
    conditions: {
      ageGroup: [2],
      laGroup: [2],
      lensStatus: ['transparente', 'presbicia', 'disfuncional'],
      specialConditions: ['camara_estrecha']
    }
  },
  // Rule 2 (was) - More general
  {
    result: "Partial Range of Field - Enhance",
    conditions: {
      ageGroup: [2],
      laGroup: [2],
      lensStatus: ['transparente', 'presbicia', 'disfuncional'],
    }
  },
  // Rule 1 (was)
  {
    result: "Partial Range of Field - Narrow",
    conditions: {
      ageGroup: [1],
      laGroup: [1],
      lensStatus: ['transparente', 'presbicia']
    }
  },
  // Rule 6 (was)
  {
    result: "Full Range of Field - Smooth",
    conditions: {
      ageGroup: [3],
      laGroup: [3],
      lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
      specialConditions: ['udva_menor_07']
    }
  },
  // Rule 7 (was)
  {
    result: "Full Range of Field - Continuous",
    conditions: {
      ageGroup: [4],
      laGroup: [3],
      lensStatus: ['disfuncional', 'catarata'],
      specialConditions: ['udva_menor_07']
    }
  },
  // Rule 8 (was)
  {
    result: "Partial Range of Field - Extend",
    conditions: {
      ageGroup: [5],
      laGroup: [3],
      lensStatus: ['disfuncional', 'catarata'],
      specialConditions: ['udva_menor_07']
    }
  },
  // Rule 9 (was)
  {
    result: "Partial Range of Field - Enhance",
    conditions: {
      ageGroup: [2],
      laGroup: [4],
      lensStatus: ['transparente', 'presbicia'],
      specialConditions: ['udva_menor_07']
    }
  },
  // Rule 14 (was)
  {
    result: "Partial Range of Field - Narrow",
    conditions: {
      ageGroup: [3],
      laGroup: [4],
      lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
      specialConditions: ['lvc_miopico_8_10']
    }
  },
  // Rule 13 (was)
  {
    result: "Full Range of Field - Steep",
    conditions: {
      ageGroup: [3],
      laGroup: [4],
      lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
      specialConditions: ['lvc_miopico_5_7']
    }
  },
  // Rule 12 (was)
  {
    result: "Full Range of Field - Smooth",
    conditions: {
      ageGroup: [3],
      laGroup: [4],
      lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
      specialConditions: ['lvc_miopico_2_4']
    }
  },
  // Rule 11 (was)
  {
    result: "Full Range of Field - Steep",
    conditions: {
      ageGroup: [3],
      laGroup: [4],
      lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
      specialConditions: ['estafiloma']
    }
  },
  // Rule 10 (was) - More general
  {
    result: "Full Range of Field - Smooth",
    conditions: {
      ageGroup: [3],
      laGroup: [4],
      lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
      negatedConditions: ['estafiloma']
    }
  },
  // New Rules from Image
  {
    result: "Narrow",
    conditions: {
        ageGroup: [1], // 35-45
        laGroup: [5], // 30-35
        lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
        specialConditions: ['apenas_tolera_lc']
    }
  },
  {
    result: "Narrow",
    conditions: {
        ageGroup: [2], // 45-55
        laGroup: [5], // 30-35
        lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
        specialConditions: ['apenas_tolera_lc']
    }
  },
   {
    result: "Narrow",
    conditions: {
        ageGroup: [3], // 55-65
        laGroup: [5], // 30-35
        lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
        specialConditions: ['apenas_tolera_lc']
    }
  },
   {
    result: "Narrow",
    conditions: {
        ageGroup: [4], // 65-75
        laGroup: [5], // 30-35
        lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
        specialConditions: ['apenas_tolera_lc']
    }
  },
   {
    result: "Narrow",
    conditions: {
        ageGroup: [5], // 75-85
        laGroup: [5], // 30-35
        lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'],
        specialConditions: ['apenas_tolera_lc']
    }
  },
   {
    result: "Narrow",
    conditions: {
        ageGroup: [3], // 55-65
        laGroup: [4], // 25-29
        lensStatus: ['transparente', 'presbicia', 'disfuncional'],
        specialConditions: ['kr']
    }
  },
  {
    result: "Narrow",
    conditions: {
        ageGroup: [4], // 65-75
        laGroup: [4], // 25-29
        lensStatus: ['disfuncional', 'catarata'],
        specialConditions: ['lvc_miopico_asociado_estafiloma']
    }
  },
];

// --- Helper functions to categorize inputs ---
const getAgeGroup = (age: number): number | null => {
  if (age >= 35 && age <= 44) return 1;
  if (age >= 45 && age <= 54) return 2;
  if (age >= 55 && age <= 64) return 3;
  if (age >= 65 && age <= 74) return 4;
  if (age >= 75 && age <= 85) return 5;
  return null;
};

const getAxialLengthGroup = (la: number): number | null => {
  if (la >= 14 && la <= 18.5) return 1;
  if (la > 18.5 && la <= 22) return 2;
  if (la > 22 && la <= 24.5) return 3;
  if (la > 24.5 && la <= 29) return 4;
  if (la > 29 && la <= 35) return 5;
  return null;
};

// --- Options for the UI ---
export const specialConditionsOptions: { [key: string]: string } = {
  'lvc_hiper_mayor_4': 'LVC Hipermetrópico >= 4D',
  'lvc_hiper_menor_4': 'LVC Hipermetrópico < 4D',
  'lvc_miopico_2_4': 'LVC Miópico (-2 a -4D)',
  'lvc_miopico_5_7': 'LVC Miópico (-5 a -7D)',
  'lvc_miopico_8_10': 'LVC Miópico (-8 a -10D)',
  'lvc_miopico_asociado_estafiloma': 'LVC Miópico asociado estafiloma',
  'camara_estrecha': 'Cámara Ant. Estrecha',
  'estafiloma': 'Estafiloma',
  'udva_menor_07': 'UDVA < 0.7',
  'ucva_menor_07': 'UCVA < 0.7',
  'ucda_menor_07': 'UCDA < 0.7',
  'kr': 'KR',
  'apenas_tolera_lc': 'Apenas tolera lentes de contacto',
  'no_usa_lc': 'No usa lentes de contacto',
  'tolera_lc': 'Tolera lentes de contacto'
};

/**
 * Genera una lista de conceptos clínicos recomendados basados en filtros progresivos.
 * @param inputs - Objeto con los datos del paciente.
 * @returns Un array de strings con los conceptos clínicos únicos que coinciden.
 */
export const getLensRecommendations = (inputs: DrAlfonsoInputs): string[] => {
  const age = inputs.age ? parseInt(inputs.age, 10) : 0;
  const axialLength = inputs.axialLength ? parseFloat(inputs.axialLength) : 0;

  const ageGroup = age > 0 ? getAgeGroup(age) : null;
  const laGroup = axialLength > 0 ? getAxialLengthGroup(axialLength) : null;

  const matchingRules = ALL_RULES.filter(rule => {
    const cond = rule.conditions;

    if (cond.ageGroup && (!ageGroup || !cond.ageGroup.includes(ageGroup))) {
      return false;
    }
    if (cond.laGroup && (!laGroup || !cond.laGroup.includes(laGroup))) {
      return false;
    }
    if (cond.lensStatus && inputs.lensStatus !== 'any') {
      const currentStatus = inputs.lensStatus as LensStatus;
      if (!cond.lensStatus.includes(currentStatus)) {
        return false;
      }
    }
    if (cond.specialConditions) {
        if (!cond.specialConditions.every(sc => inputs.specialConditions.includes(sc))) {
            return false;
        }
    }
    if(cond.negatedConditions) {
        if (cond.negatedConditions.some(sc => inputs.specialConditions.includes(sc))) {
            return false;
        }
    }
    return true;
  });

  const uniqueConcepts = new Set(matchingRules.map(rule => rule.result));
  
  return Array.from(uniqueConcepts);
};
