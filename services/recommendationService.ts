import { DrAlfonsoInputs, Rule, LensStatus } from '../types';

export const AGE_RANGES: { [key: number]: string } = { 1: '< 50', 2: '50-65', 3: '66-75', 4: '76-85', 5: '> 85' };
export const LA_RANGES: { [key: number]: string } = { 1: '< 22.5', 2: '22.5-24.5', 3: '24.6-26', 4: '> 26' };
export const LENS_STATUS_OPTIONS: LensStatus[] = ['transparente', 'presbicia', 'disfuncional', 'catarata'];

/**
 * REGLAS CLÍNICAS BASE
 * Nota: Al ser un sistema estricto, si el usuario selecciona LVC, 
 * solo se dispararán las reglas que tengan ese LVC definido.
 */
export const ALL_RULES: Rule[] = [
  // Edad 1 (35-44)
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['1'], laGroup: ['1'], lensStatus: ['transparente', 'presbicia'] } },
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['1'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia'] } },
  
  // Edad 2 (45-54)
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['1'], lensStatus: ['transparente', 'presbicia', 'disfuncional'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'] } },
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], lvc: ['lvc_hiper_mayor_4'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], lvc: ['lvc_hiper_menor_4'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], anteriorChamber: ['camara_estrecha'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia'] } },

  // Edad 3 (55-64)
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['3'], laGroup: ['1'], lensStatus: ['disfuncional'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['2'], lensStatus: ['catarata'], udva: ['udva_menor_07'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['3'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], udva: ['udva_menor_07'] } },
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_8_10'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_5_7'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_2_4'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], retina: ['con_estafiloma'] } },

  // Edad 4 (65-74)
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['4'], laGroup: ['2'], retina: ['vitrectomia'] } },
  { result: "Full Range of Field-Continuous", conditions: { ageGroup: ['4'], laGroup: ['3'], lensStatus: ['disfuncional', 'catarata'] } },
  { result: "Full Range of Field-Continuous", conditions: { ageGroup: ['4'], laGroup: ['4'], lensStatus: ['catarata'] } },

  // Edad 5 (75-85)
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['5'], laGroup: ['1'], contactLenses: ['no_usa_lc'] } },
  { result: "Partial Range of Field-Extend", conditions: { ageGroup: ['5'], laGroup: ['3'], lensStatus: ['disfuncional', 'catarata'] } },
  { result: "Partial Range of Field-Extend", conditions: { ageGroup: ['5'], laGroup: ['4'], lensStatus: ['catarata'] } }
];



export const getLensRecommendations = (inputs: DrAlfonsoInputs): string[] => {
  const age = inputs.age ? parseInt(inputs.age, 10) : 0;
  const la = inputs.axialLength ? parseFloat(inputs.axialLength.replace(',', '.')) : 0;

  const ageG = age === 0 ? null : age < 50 ? '1' : age <= 65 ? '2' : age <= 75 ? '3' : age <= 85 ? '4' : '5';
  const laG = la === 0 ? null : la < 22.5 ? '1' : la <= 24.5 ? '2' : la <= 26 ? '3' : '4';

  const matches = ALL_RULES.filter(rule => {
    const rc = rule.conditions;

    // 1. Edad y Longitud Axial: ESTRICTOS
    if (!ageG || !rc.ageGroup || !rc.ageGroup.includes(ageG)) return false;
    if (!laG || !rc.laGroup || !rc.laGroup.includes(laG)) return false;

    // 2. Cristalino (Lens Status): ESTRICTO si la regla no incluye las 4 opciones
    const allLensOptions = ['transparente', 'presbicia', 'disfuncional', 'catarata'];
    const isLensGeneric = rc.lensStatus && allLensOptions.every(opt => rc.lensStatus!.includes(opt as any));
    
    if (!isLensGeneric) {
      if (!rc.lensStatus || !rc.lensStatus.includes(inputs.lensStatus as any)) return false;
    }

    // 3. Resto de opciones (LVC, UDVA, etc.): COINCIDENCIA DE ESCENARIO EXACTO
    // Definimos los campos adicionales
    const extraFields = ['lvc', 'udva', 'contactLenses', 'anteriorChamber', 'retina'] as const;
    
    for (const field of extraFields) {
      const userValue = inputs[field];
      const ruleValues = rc[field];

      if (userValue !== 'any') {
        // Si el usuario ha seleccionado algo, la regla DEBE tener ese campo y debe coincidir
        if (!ruleValues || !ruleValues.includes(userValue as any)) return false;
      } else {
        // Si el usuario tiene N/A, la regla NO DEBE tener ese campo definido
        if (ruleValues && ruleValues.length > 0) return false;
      }
    }

    return true;
  });

  return Array.from(new Set(matches.map(m => m.result)));
};